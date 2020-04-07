import playerTemplate from 'templates/player';
import ErrorContainer from 'view/error-container';
import { isAudioMode, CONTROLBAR_ONLY_HEIGHT } from 'view/utils/audio-mode';
import viewsManager from 'view/utils/views-manager';
import getVisibility from 'view/utils/visibility';
import activeTab from 'utils/active-tab';
import { requestAnimationFrame, cancelAnimationFrame } from 'utils/request-animation-frame';
import { getBreakpoint, setBreakpoint } from 'view/utils/breakpoint';
import { normalizeSkin, handleColorOverrides } from 'view/utils/skin';
import { Browser, OS, Features } from 'environment/environment';
import { ControlsLoader, loadControls } from 'controller/controls-loader';
import {
    STATE_BUFFERING, STATE_IDLE, STATE_COMPLETE, STATE_PAUSED, STATE_PLAYING, STATE_ERROR, FLOAT,
    RESIZE, BREAKPOINT, DISPLAY_CLICK, LOGO_CLICK, NATIVE_FULLSCREEN, MEDIA_VISUAL_QUALITY, CONTROLS, WARNING } from 'events/events';
import Events from 'utils/backbone.events';
import {
    addClass,
    deviceIsLandscape,
    hasClass,
    removeClass,
    replaceClass,
    toggleClass,
    createElement,
    htmlToParentElement,
    bounds,
    openLink,
} from 'utils/dom';
import { isIframe } from 'utils/browser';
import {
    clearCss,
    style,
} from 'utils/css';
import { isNumber } from 'utils/underscore';
import requestFullscreenHelper from 'view/utils/request-fullscreen-helper';
import UI from 'utils/ui';
import ClickHandler from 'view/utils/clickhandler';
import CaptionsRenderer from 'view/captionsrenderer';
import Logo from 'view/logo';
import Preview from 'view/preview';
import Title from 'view/title';
import FloatingDragUI from 'view/floating-drag-ui';
import ResizeListener from 'view/utils/resize-listener';


require('css/jwplayer.less');

let ControlsModule;

const _isMobile = OS.mobile;
const _isIE = Browser.ie;

let floatingPlayer = null;

function View(_api, _model) {
    const _this = Object.assign(this, Events, {
        isSetup: false,
        api: _api,
        model: _model
    });

    const _localization = _model.get('localization');
    this._playerElement = createElement(playerTemplate(_model.get('id'), _localization.player));
    const _wrapperElement = this._playerElement.querySelector('.jw-wrapper');
    const _videoLayer = this._playerElement.querySelector('.jw-media');
    const _floatingUI = new FloatingDragUI(_wrapperElement);

    const _preview = new Preview(_model, _api);
    const _title = new Title(_model);

    const _captionsRenderer = new CaptionsRenderer(_model);
    _captionsRenderer.on('all', _this.trigger, _this);

    let _logo;

    let _lastWidth;
    let _lastHeight;
    let _currentlyFloating;

    let _resizeMediaTimeout = -1;
    let _resizeContainerRequestId = -1;
    let _stateClassRequestId = -1;

    let _floatingConfig = _model.get('floating');

    this.dismissible = _floatingConfig && _floatingConfig.dismissible;
    let _canFloat = false;
    let playerBounds = {};

    let displayClickHandler;
    this.fullscreenHelpers = null;
    let focusHelper;

    let _breakpoint = null;
    this.controls = null;

    function reasonInteraction() {
        return { reason: 'interaction' };
    }

    function fosMobileBehavior() {
        return _isMobile && !deviceIsLandscape() && !_model.get('fullscreen');
    }

    // Compute player size, handle DOM removal/insertion, add to views-manager
    this.updateBounds = function () {
        cancelAnimationFrame(_resizeContainerRequestId);
        const currentElement = _getCurrentElement();
        const inDOM = document.body.contains(currentElement);

        const rect = bounds(currentElement);
        const containerWidth = Math.round(rect.width);
        const containerHeight = Math.round(rect.height);
        playerBounds = bounds(this._playerElement);

        // If the container is the same size as before, return early
        if (containerWidth === _lastWidth && containerHeight === _lastHeight) {
            // Listen for player to be added to DOM
            if (!_lastWidth || !_lastHeight) {
                _responsiveListener();
            }
            _model.set('inDom', inDOM);
            return;
        }
        // If we have bad values for either dimension, return early
        if (!containerWidth || !containerHeight) {
            // If we haven't established player size, try again
            if (!_lastWidth || !_lastHeight) {
                _responsiveListener();
            }
        }

        // Don't update container dimensions to 0, 0 when not in DOM
        if (containerWidth || containerHeight || inDOM) {
            _model.set('containerWidth', containerWidth);
            _model.set('containerHeight', containerHeight);
        }
        _model.set('inDom', inDOM);

        if (inDOM) {
            viewsManager.observe(this._playerElement);
        }
    };

    // Apply styles and classes based on player size
    this.updateStyles = function() {
        const containerWidth = _model.get('containerWidth');
        const containerHeight = _model.get('containerHeight');

        updateContainerStyles(containerWidth, containerHeight);

        if (this.controls) {
            this.controls.resize(containerWidth, containerHeight);
        }

        _resizeMedia(containerWidth, containerHeight);
        _captionsRenderer.resize();


        if (_floatingConfig) {
            throttledMobileFloatScrollHandler();
        }
    };

    // Dispatch UI events for changes in player size
    this.checkResized = function() {
        const containerWidth = _model.get('containerWidth');
        const containerHeight = _model.get('containerHeight');
        const floating = _model.get('isFloating');
        if (containerWidth !== _lastWidth || containerHeight !== _lastHeight) {
            if (!this.resizeListener) {
                this.resizeListener = new ResizeListener(_wrapperElement, this, _model);
            }
            _lastWidth = containerWidth;
            _lastHeight = containerHeight;
            _this.trigger(RESIZE, {
                width: containerWidth,
                height: containerHeight
            });
            const breakpoint = getBreakpoint(containerWidth);
            if (_breakpoint !== breakpoint) {
                _breakpoint = breakpoint;
                _this.trigger(BREAKPOINT, {
                    breakpoint: _breakpoint
                });
            }
        }
        if (floating !== _currentlyFloating) {
            _currentlyFloating = floating;
            _this.trigger(FLOAT, { floating });
            updateVisibility();
        }
    };

    function _responsiveListener() {
        cancelAnimationFrame(_resizeContainerRequestId);
        _resizeContainerRequestId = requestAnimationFrame(_responsiveUpdate);
    }
    this.responsiveListener = _responsiveListener;

    function _responsiveUpdate() {
        if (!_this.isSetup) {
            return;
        }
        _this.updateBounds();
        _this.updateStyles();
        _this.checkResized();
    }

    function updateContainerStyles(width, height) {
        // Set responsive player classes
        if (isNumber(width) && isNumber(height)) {
            const breakpoint = getBreakpoint(width);
            setBreakpoint(this._playerElement, breakpoint);

            const smallPlayer = breakpoint < 2;
            toggleClass(this._playerElement, 'jw-flag-small-player', smallPlayer);
            toggleClass(this._playerElement, 'jw-orientation-portrait', (height > width));
        }
        // Only change audio player mode when controls are enabled
        if (_model.get('controls')) {
            const audioMode = isAudioMode(_model);
            toggleClass(this._playerElement, 'jw-flag-audio-player', audioMode);
            _model.set('audioMode', audioMode);
        }
    }

    this.setup = function () {
        _preview.setup(this._playerElement.querySelector('.jw-preview'));
        _title.setup(this._playerElement.querySelector('.jw-title'));

        _logo = new Logo(_model);
        _logo.setup();
        _logo.setContainer(_wrapperElement);
        _logo.on(LOGO_CLICK, _logoClickHandler);

        // captions rendering
        _captionsRenderer.setup(this._playerElement.id, _model.get('captions'));

        // captions should be placed behind controls, and not hidden when controls are hidden
        _title.element().parentNode.insertBefore(_captionsRenderer.element(), _title.element());

        // Display Click and Double Click Handling
        displayClickHandler = clickHandlerHelper(_api, _model, _videoLayer);

        focusHelper = new UI(this._playerElement).on('click', function() {});
        this.fullscreenHelpers = requestFullscreenHelper(this._playerElement, document, _fullscreenChangeHandler);

        _model.on('change:hideAdsControls', function (model, val) {
            toggleClass(this._playerElement, 'jw-flag-ads-hide-controls', val);
        });
        _model.on('change:scrubbing', function (model, val) {
            toggleClass(this._playerElement, 'jw-flag-dragging', val);
        });
        _model.on('change:playRejected', function (model, val) {
            toggleClass(this._playerElement, 'jw-flag-play-rejected', val);
        });

        // Native fullscreen (coming through from the provider)
        _model.on(NATIVE_FULLSCREEN, _nativeFullscreenChangeHandler);

        _model.on(`change:${MEDIA_VISUAL_QUALITY}`, () => {
            _resizeMedia();
            _captionsRenderer.resize();
        });

        const playerViewModel = _model.player;
        playerViewModel.on('change:errorEvent', _errorHandler);

        _model.change('stretching', onStretchChange);

        const width = _model.get('width');
        const height = _model.get('height');
        const styles = getPlayerSizeStyles(width, height);
        style(this._playerElement, styles);
        _model.change('aspectratio', onAspectRatioChange);
        updateContainerStyles(width, height);
        if (!_model.get('controls')) {
            addClass(this._playerElement, 'jw-flag-controls-hidden');
            removeClass(this._playerElement, 'jw-floating-dismissible');
        }

        if (_isIE) {
            addClass(this._playerElement, 'jw-ie');
        }

        const skin = _model.get('skin') || {};

        if (skin.name) {
            replaceClass(this._playerElement, /jw-skin-\S+/, 'jw-skin-' + skin.name);
        }

        const skinColors = normalizeSkin(skin);
        handleColorOverrides(_model.get('id'), skinColors);

        // adds video tag to video layer
        _model.set('mediaContainer', _videoLayer);
        _model.set('iFrame', Features.iframe);
        _model.set('activeTab', activeTab());
        _model.set('touchMode', _isMobile && (typeof height === 'string' || height >= CONTROLBAR_ONLY_HEIGHT));

        viewsManager.add(this);

        if (_model.get('enableGradient') && !_isIE) {
            addClass(this._playerElement, 'jw-ab-drop-shadow');
        }

        this.isSetup = true;
        _model.trigger('viewSetup', this._playerElement);

        const inDOM = document.body.contains(this._playerElement);
        if (inDOM) {
            viewsManager.observe(this._playerElement);
        }
        _model.set('inDom', inDOM);
    };

    function updateVisibility() {
        _model.set('visibility', getVisibility(_model, this._playerElement));
    }

    this.init = function() {
        this.updateBounds();

        _model.on('change:fullscreen', this.toggleFullscreen);
        _model.on('change:activeTab', updateVisibility);
        _model.on('change:fullscreen', updateVisibility);
        _model.on('change:intersectionRatio', updateVisibility);
        _model.on('change:visibility', redraw);
        _model.on('instreamMode', (instreamMode) => {
            if (instreamMode) {
                setupInstream();
            } else {
                destroyInstream();
            }
        });

        updateVisibility();

        // Always draw first player for icons to load
        if (viewsManager.size() === 1 && !_model.get('visibility')) {
            redraw(_model, 1, 0);
        }

        const playerViewModel = _model.player;

        _model.change('state', _stateHandler);
        playerViewModel.change('controls', changeControls);
        _model.change('streamType', _setLiveMode);
        _model.change('mediaType', _onMediaTypeChange);
        playerViewModel.change('playlistItem', (model, item) => {
            onPlaylistItem(model, item);
        });
        // Triggering 'resize' resulting in player 'ready'
        _lastWidth = _lastHeight = null;

        // Setup floating scroll handler
        if (_floatingConfig && _isMobile) {
            viewsManager.addScrollHandler(throttledMobileFloatScrollHandler);
        }

        this.checkResized();
    };

    // Functions for handler float on scroll (mobile)
    const FLOATING_TOP_OFFSET = 62;
    let canFire = true;
    let debounceTO;
    function checkFloatOnScroll() {
        const floating = _model.get('isFloating');
        const enoughRoomForFloat = playerBounds.top < FLOATING_TOP_OFFSET;
        const hasCrossedThreshold = enoughRoomForFloat ?
            playerBounds.top <= window.scrollY :
            playerBounds.top <= window.scrollY + FLOATING_TOP_OFFSET;

        if (!floating && hasCrossedThreshold) {
            _updateFloating(0, enoughRoomForFloat);
        } else if (floating && !hasCrossedThreshold) {
            _updateFloating(1, enoughRoomForFloat);
        }
    }

    function throttledMobileFloatScrollHandler() {
        if (!fosMobileBehavior() || !_model.get('inDom')) {
            return;
        }
        clearTimeout(debounceTO);
        debounceTO = setTimeout(checkFloatOnScroll, 150);

        if (!canFire) {
            return;
        }

        canFire = false;
        checkFloatOnScroll();

        setTimeout(() => {
            canFire = true;
        }, 50);
    }
    // End functions for float on scroll (mobile)

    function changeControls(model, enable) {
        const controlsEvent = {
            controls: enable
        };
        if (enable) {
            ControlsModule = ControlsLoader.controls;
            if (!ControlsModule) {
                controlsEvent.loadPromise = loadControls().then(function (Controls) {
                    ControlsModule = Controls;
                    // Check that controls is still true after the loader promise resolves
                    const enabledState = model.get('controls');
                    if (enabledState) {
                        addControls();
                    }
                    return enabledState;
                });
                controlsEvent.loadPromise.catch(function (error) {
                    _this.trigger(WARNING, error);
                });
            } else {
                addControls();
            }
        } else {
            _this.removeControls();
        }
        // Only trigger controls events after the player and view are set up (and has width/height)
        if (_lastWidth && _lastHeight) {
            _this.trigger(CONTROLS, controlsEvent);
        }
    }

    function addControls() {
        _this.controls = new ControlsModule(document, _this.element());
        _this.addControls(_this.controls);
    }

    function redraw(model, visibility, lastVisibility) {
        if (visibility && !lastVisibility) {
            _stateHandler(model, model.get('state'));
            _this.updateStyles();
        }
    }

    function clickHandlerHelper(api, model, videoLayer) {
        const clickHandler = new ClickHandler(model, videoLayer);
        const controls = model.get('controls');
        clickHandler.on({
            click: () => {
                _this.trigger(DISPLAY_CLICK);
                // Ensures that Firefox focuses the container not the video tag for aria compatibility
                _getCurrentElement().focus();

                if (_this.controls) {
                    if (settingsMenuVisible()) {
                        _this.controls.settingsMenu.close();
                    } else if (infoOverlayVisible()) {
                        _this.controls.infoOverlay.close();
                    } else {
                        api.playToggle(reasonInteraction());
                    }
                }
            },
            tap: () => {
                _this.trigger(DISPLAY_CLICK);
                if (settingsMenuVisible()) {
                    _this.controls.settingsMenu.close();
                }
                if (infoOverlayVisible()) {
                    _this.controls.infoOverlay.close();
                }
                const state = model.get('state');

                if (controls &&
                    ((state === STATE_IDLE || state === STATE_COMPLETE) ||
                    (model.get('instream') && state === STATE_PAUSED))) {
                    api.playToggle(reasonInteraction());
                }

                if (controls && state === STATE_PAUSED) {
                    // Toggle visibility of the controls when tapping the media
                    // Do not add mobile toggle "jw-flag-controls-hidden" in these cases
                    if (model.get('instream') || model.get('castActive') || (model.get('mediaType') === 'audio')) {
                        return;
                    }
                    toggleClass(this._playerElement, 'jw-flag-controls-hidden');
                    if (_this.dismissible) {
                        toggleClass(this._playerElement, 'jw-floating-dismissible', hasClass(this._playerElement, 'jw-flag-controls-hidden'));
                    }
                    _captionsRenderer.renderCues(true);
                } else if (_this.controls) {
                    if (!_this.controls.showing) {
                        _this.controls.userActive();
                    } else {
                        _this.controls.userInactive();
                    }
                }
            },
            doubleClick: () => _this.controls && api.setFullscreen()
        });

        if (!_isMobile) {
            this._playerElement.addEventListener('mousemove', moveHandler);
            this._playerElement.addEventListener('mouseover', overHandler);
            this._playerElement.addEventListener('mouseout', outHandler);
        }

        return clickHandler;
    }

    function moveHandler(event) {
        if (_this.controls) {
            _this.controls.mouseMove(event);
        }
    }

    function overHandler(event) {
        if (_this.controls && !_this.controls.showing && event.target.nodeName === 'IFRAME') {
            _this.controls.userActive();
        }
    }

    function outHandler(event) {
        // If controls are showing and mouse moves out to relatedTarget not within playerElement, call userActive().
        // Also call userActive() if event does not contain relatedTarget if player is in iFrame. (relatedTarget = null)
        if (_this.controls && _this.controls.showing && ((event.relatedTarget && !this._playerElement.contains(event.relatedTarget)) || (!event.relatedTarget && Features.iframe))) {
            _this.controls.userActive();
        }
    }

    function onStretchChange(model, newVal) {
        replaceClass(this._playerElement, /jw-stretch-\S+/, 'jw-stretch-' + newVal);
    }

    function onAspectRatioChange(model, aspectratio) {
        toggleClass(this._playerElement, 'jw-flag-aspect-mode', !!aspectratio);
        const aspectRatioContainer = this._playerElement.querySelectorAll('.jw-aspect');
        style(aspectRatioContainer, {
            paddingTop: aspectratio || null
        });
        if (_this.isSetup && aspectratio && !_model.get('isFloating')) {
            style(this._playerElement, getPlayerSizeStyles(model.get('width')));
            _responsiveUpdate();
        }
    }

    function _logoClickHandler(evt) {
        if (!evt.link) {
            if (_model.get('controls')) {
                _api.playToggle(reasonInteraction());
            }
        } else {
            _api.pause(reasonInteraction());
            _api.setFullscreen(false);
            openLink(evt.link, evt.linktarget, { rel: 'noreferrer' });
        }
    }

    this.addControls = function (controls) {
        this.controls = controls;

        removeClass(this._playerElement, 'jw-flag-controls-hidden');
        toggleClass(this._playerElement, 'jw-floating-dismissible', this.dismissible);

        controls.enable(_api, _model);

        // refresh breakpoint and timeslider classes
        if (_lastHeight) {
            updateContainerStyles(_lastWidth, _lastHeight);
            controls.resize(_lastWidth, _lastHeight);
            _captionsRenderer.renderCues(true);
        }

        controls.on('userActive userInactive', function() {
            const state = _model.get('state');
            if (state === STATE_PLAYING || state === STATE_BUFFERING) {
                _captionsRenderer.renderCues(true);
            }
        });

        controls.on('dismissFloating', () => {
            this.stopFloating(true);
            _api.pause({ reason: 'interaction' });
        });

        controls.on('all', _this.trigger, _this);

        if (_model.get('instream')) {
            this.controls.setupInstream();
        }
    };

    this.removeControls = function () {
        if (this.controls) {
            this.controls.disable(_model);
            this.controls = null;
        }

        addClass(this._playerElement, 'jw-flag-controls-hidden');
        removeClass(this._playerElement, 'jw-floating-dismissible');
    };

    // Perform the switch to fullscreen
    this.toggleFullscreen = function (model, state) {
        // Unmute the video so volume can be adjusted with native controls in fullscreen
        if (state && this.controls && model.get('autostartMuted')) {
            this.controls.unmuteAutoplay(_api, model);
        }
        if (this.fullscreenHelpers.supportsDomFullscreen()) {
            if (state) {
                this.fullscreenHelpers.requestFullscreen();
            } else {
                this.fullscreenHelpers.exitFullscreen();
            }
            this._toggleDOMFullscreen(this._playerElement, state);
        } else if (_isIE) {
            this._toggleDOMFullscreen(this._playerElement, state);
        } else {
            // Request media element fullscreen (iOS)
            const instream = model.get('instream');
            const instreamProvider = instream ? instream.provider : null;
            const provider = model.getVideo() || instreamProvider;
            if (provider && provider.setFullscreen) {
                provider.setFullscreen(state);
            }
        }
    };

    function getPlayerSizeStyles(playerWidth, playerHeight, resetAspectMode) {
        const styles = {
            width: playerWidth
        };

        // when jwResize is called remove aspectMode and force layout
        if (resetAspectMode && playerHeight !== undefined) {
            _model.set('aspectratio', null);
        }
        if (!_model.get('aspectratio')) {
            // If the height is a pixel value (number) greater than 0, snap it to the minimum supported height
            // Allow zero to mean "hide the player"
            let height = playerHeight;
            if (isNumber(height) && height !== 0) {
                height = Math.max(height, CONTROLBAR_ONLY_HEIGHT);
            }
            styles.height = height;
        }

        return styles;
    }

    function _resizeMedia(containerWidth, containerHeight) {
        if (!containerWidth || isNaN(1 * containerWidth)) {
            containerWidth = _model.get('containerWidth');
            if (!containerWidth) {
                return;
            }
        }
        if (!containerHeight || isNaN(1 * containerHeight)) {
            containerHeight = _model.get('containerHeight');
            if (!containerHeight) {
                return;
            }
        }

        if (_preview) {
            _preview.resize(containerWidth, containerHeight, _model.get('stretching'));
        }

        const provider = _model.getVideo();
        if (!provider) {
            return;
        }
        provider.resize(containerWidth, containerHeight, _model.get('stretching'));
    }

    this.resize = function (playerWidth, playerHeight) {
        const styles = getPlayerSizeStyles(playerWidth, playerHeight, true);
        const widthSet = playerWidth !== undefined;
        const heightSet = playerHeight !== undefined;

        if (widthSet && heightSet) {
            _model.set('width', playerWidth);
            _model.set('height', playerHeight);
        }
        style(this._playerElement, styles);
        if (_model.get('isFloating')) {
            updateFloatingSize();
        }
        _responsiveUpdate();
    };
    this.resizeMedia = _resizeMedia;

    function _isNativeFullscreen() {
        // Return whether or not we're in native fullscreen
        if (this.fullscreenHelpers.supportsDomFullscreen()) {
            const fsElement = this.fullscreenHelpers.fullscreenElement();
            return !!(fsElement && fsElement === this._playerElement);
        }
        // If native fullscreen is not available, return video fullscreen state
        const provider = _model.getVideo();
        return provider.getFullScreen();
    }

    function _nativeFullscreenChangeHandler(event) {
        toggleClass(this._playerElement, 'jw-flag-ios-fullscreen', event.jwstate);
        _fullscreenChangeHandler(event);
    }

    function _fullscreenChangeHandler(event) {
        const modelState = _model.get('fullscreen');
        const newState = (event.jwstate !== undefined) ? event.jwstate : _isNativeFullscreen();

        // If fullscreen was triggered by something other than the player
        //  then we want to sync up our internal state
        if (modelState !== newState) {
            _model.set('fullscreen', newState);
        }

        _responsiveListener();
        clearTimeout(_resizeMediaTimeout);
        _resizeMediaTimeout = setTimeout(_resizeMedia, 200);
    }

    this.toggleDomFullscreen = function (playerElement, fullscreenState) {
        toggleClass(playerElement, 'jw-flag-fullscreen', fullscreenState);
        style(document.body, { overflowY: (fullscreenState) ? 'hidden' : '' });

        if (fullscreenState && this.controls) {
            // When going into fullscreen, we want the control bar to fade after a few seconds
            this.controls.userActive();
        }

        _resizeMedia();
        _responsiveListener();
    };

    function _setLiveMode(model, streamType) {
        const live = (streamType === 'LIVE');
        toggleClass(this._playerElement, 'jw-flag-live', live);
    }

    function _onMediaTypeChange(model, val) {
        const isAudioFile = (val === 'audio');
        const provider = model.get('provider');

        toggleClass(this._playerElement, 'jw-flag-media-audio', isAudioFile);

        const isFlash = (provider && provider.name.indexOf('flash') === 0);
        const element = (isAudioFile && !isFlash) ? _videoLayer : _videoLayer.nextSibling;
        // Put the preview element before the media element in order to display browser captions
        // otherwise keep it on top of the media element to display captions with the captions renderer
        _preview.el.parentNode.insertBefore(_preview.el, element);
    }

    function _errorHandler(model, errorEvent) {
        if (!errorEvent) {
            _title.playlistItem(model, model.get('playlistItem'));
            return;
        }
        const errorContainer = ErrorContainer(model, errorEvent);
        if (ErrorContainer.cloneIcon) {
            errorContainer.querySelector('.jw-icon').appendChild(ErrorContainer.cloneIcon('error'));
        }
        _title.hide();
        this._playerElement.appendChild(errorContainer.firstChild);
        toggleClass(this._playerElement, 'jw-flag-audio-player', !!model.get('audioMode'));
    }

    function _stateHandler(model, newState, oldState) {
        if (!_this.isSetup) {
            return;
        }

        if (oldState === STATE_ERROR) {
            const errorContainer = this._playerElement.querySelector('.jw-error-msg');
            if (errorContainer) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }

        cancelAnimationFrame(_stateClassRequestId);
        if (newState === STATE_PLAYING) {
            _stateUpdate(newState);
        } else {
            _stateClassRequestId = requestAnimationFrame(() => _stateUpdate(newState));
        }
    }

    function _stateUpdate(state) {
        if (_model.get('controls') && state !== STATE_PAUSED && hasClass(this._playerElement, 'jw-flag-controls-hidden')) {
            removeClass(this._playerElement, 'jw-flag-controls-hidden');
            toggleClass(this._playerElement, 'jw-floating-dismissible', _this.dismissible);
        }
        replaceClass(this._playerElement, /jw-state-\S+/, 'jw-state-' + state);

        switch (state) {
            case STATE_ERROR:
                _this.stopFloating();
            /* falls through to update captions renderer */
            case STATE_IDLE:
            case STATE_COMPLETE:
                if (_captionsRenderer) {
                    _captionsRenderer.hide();
                }
                if (_preview) {
                    _preview.enableZoomThumbnail();
                }
                break;
            default:
                if (_captionsRenderer) {
                    _captionsRenderer.show();
                    if (state === STATE_PAUSED && this.controls && !this.controls.showing) {
                        _captionsRenderer.renderCues(true);
                    }
                }
                if (_preview) {
                    _preview.removeZoomThumbnail();
                }
                break;
        }
    }

    function setMediaTitleAttribute(model, playlistItem) {
        const videotag = model.get('mediaElement');
        // chromecast and flash providers do no support video tags
        if (!videotag) {
            return;
        }

        // Writing a string to innerHTML completely decodes multiple-encoded strings
        const body = htmlToParentElement(playlistItem.title || '');
        videotag.setAttribute('title', body.textContent);
    }

    this.setPosterImage = function(item, preview) {
        preview.setImage(item && item.image);
    };

    const onPlaylistItem = (model, item) => {
        this.setPosterImage(item, _preview);
        // Set the title attribute of the video tag to display background media information on mobile devices
        if (_isMobile) {
            setMediaTitleAttribute(model, item);
        }
    };

    const settingsMenuVisible = () => {
        const settingsMenu = _this.controls && _this.controls.settingsMenu;
        return !!(settingsMenu && settingsMenu.visible);
    };

    const infoOverlayVisible = () => {
        const info = _this.controls && _this.controls.infoOverlay;
        return !!(info && info.visible);
    };

    const setupInstream = function() {
        addClass(this._playerElement, 'jw-flag-ads');

        if (_this.controls) {
            _this.controls.setupInstream();
        }

        _floatingUI.disable();
    };

    const destroyInstream = function() {
        if (!displayClickHandler) {
            // view was destroyed
            return;
        }
        if (_this.controls) {
            _this.controls.destroyInstream(_model);
        }

        if (floatingPlayer === this._playerElement && !isIframe()) {
            _floatingUI.enable();
        }

        _this.setAltText('');
        removeClass(this._playerElement, ['jw-flag-ads', 'jw-flag-ads-hide-controls']);
        _model.set('hideAdsControls', false);

        // Make sure that the provider's media element is returned to the DOM after instream mode
        const provider = _model.getVideo();
        if (provider) {
            provider.setContainer(_videoLayer);
        }

        // reset display click handler
        displayClickHandler.revertAlternateClickHandlers();
    };

    this.setAltText = function (text) {
        _model.set('altText', text);
    };

    this.clickHandler = function () {
        return displayClickHandler;
    };

    this.getContainer = this.element = function () {
        return this._playerElement;
    };

    this.getWrapper = function () {
        return _wrapperElement;
    };

    this.controlsContainer = function() {
        if (this.controls) {
            return this.controls.element();
        }
        return null;
    };

    this.getSafeRegion = function (excludeControlbar = true) {
        const safeRegion = {
            x: 0,
            y: 0,
            width: _lastWidth || 0,
            height: _lastHeight || 0
        };
        if (this.controls) {
            // Subtract controlbar from the bottom when using one
            if (excludeControlbar) {
                safeRegion.height -= this.controls.controlbarHeight();
            }
        }
        return safeRegion;
    };

    this.setCaptions = function (captionsStyle) {
        _captionsRenderer.clear();
        _captionsRenderer.setup(_model.get('id'), captionsStyle);
        _captionsRenderer.resize();
    };

    this.setIntersection = function (entry) {
        // Round as the IntersectionObserver polyfill sometimes returns ±0.00XXX.
        const intersectionRatio = Math.round(entry.intersectionRatio * 100) / 100;
        _model.set('intersectionRatio', intersectionRatio);

        if (_floatingConfig && !fosMobileBehavior()) {
            // Only start floating if player has been mostly visible at least once.
            _canFloat = _canFloat || intersectionRatio >= 0.5;
            if (_canFloat) {
                _updateFloating(intersectionRatio);
            }
        }
    };

    function _getCurrentElement() {
        return _model.get('isFloating') ? _wrapperElement : this._playerElement;
    }

    function _updateFloating(intersectionRatio, mobileFloatIntoPlace) {
        // Player is 50% visible or less and no floating player already in the DOM. Player is not in iframe
        const shouldFloat = intersectionRatio < 0.5 && !isIframe();
        if (shouldFloat) {
            const state = _model.get('state');
            if (state !== STATE_IDLE && state !== STATE_ERROR && state !== STATE_COMPLETE && floatingPlayer === null) {
                floatingPlayer = this._playerElement;

                _model.set('isFloating', true);

                addClass(this._playerElement, 'jw-flag-floating');

                if (mobileFloatIntoPlace) {
                    // Creates a dynamic animation where the top of the current player
                    // Smoothly transitions into the expected floating space in the event
                    // we can't start floating at 62px
                    style(_wrapperElement, {
                        transform: `translateY(-${FLOATING_TOP_OFFSET - playerBounds.top}px)`
                    });

                    setTimeout(() => {
                        style(_wrapperElement, {
                            transform: 'translateY(0)',
                            transition: 'transform 150ms cubic-bezier(0, 0.25, 0.25, 1)'
                        });
                    });
                }

                // Copy background from preview element, fallback to image config.
                style(this._playerElement, {
                    backgroundImage: _preview.el.style.backgroundImage || _model.get('image')
                });

                updateFloatingSize();

                if (!_model.get('instreamMode')) {
                    _floatingUI.enable();
                }

                // Perform resize and trigger "float" event responsively to prevent layout thrashing
                _responsiveListener();
            }
        } else {
            _this.stopFloating(false, mobileFloatIntoPlace);
        }
    }

    function updateFloatingSize() {
        // Always use aspect ratio to determine floating player size
        // This allows us to support fixed pixel width/height or 100%*100% by matching the player container
        const width = _model.get('width');
        const height = _model.get('height');
        const styles = getPlayerSizeStyles(width);
        styles.maxWidth = Math.min(400, playerBounds.width);

        if (!_model.get('aspectratio')) {
            const containerWidth = playerBounds.width;
            const containerHeight = playerBounds.height;
            let aspectRatio = (containerHeight / containerWidth) || 0.5625; // (fallback to 16 by 9)
            if (isNumber(width) && isNumber(height)) {
                aspectRatio = height / width;
            }
            onAspectRatioChange(_model, (aspectRatio * 100) + '%');
        }

        style(_wrapperElement, styles);
    }

    this.stopFloating = function(forever, mobileFloatIntoPlace) {
        if (forever) {
            _floatingConfig = null;
            viewsManager.removeScrollHandler(throttledMobileFloatScrollHandler);
        }
        if (floatingPlayer === this._playerElement) {
            floatingPlayer = null;
            _model.set('isFloating', false);

            const resetFloatingStyles = () => {
                removeClass(this._playerElement, 'jw-flag-floating');
                onAspectRatioChange(_model, _model.get('aspectratio'));

                // Wrapper should inherit from parent unless floating.
                style(this._playerElement, { backgroundImage: null }); // Reset to avoid flicker.

                style(_wrapperElement, {
                    maxWidth: null,
                    width: null,
                    height: null,
                    left: null,
                    right: null,
                    top: null,
                    bottom: null,
                    margin: null,
                    transform: null,
                    transition: null,
                    'transition-timing-function': null
                });
            };

            if (mobileFloatIntoPlace) {
                // Reverses a dynamic animation where the top of the current player
                // Smoothly transitions into the expected static space in the event
                // we didn't start floating at 62px
                style(_wrapperElement, {
                    transform: `translateY(-${FLOATING_TOP_OFFSET - playerBounds.top}px)`,
                    'transition-timing-function': 'ease-out'
                });

                setTimeout(resetFloatingStyles, 150);
            } else {
                resetFloatingStyles();
            }

            _floatingUI.disable();

            // Perform resize and trigger "float" event responsively to prevent layout thrashing
            _responsiveListener();
        }
    };

    this.destroy = function () {
        _model.destroy();
        _preview.destroy();
        viewsManager.unobserve(this._playerElement);
        viewsManager.remove(this);
        this.isSetup = false;
        this.off();
        cancelAnimationFrame(_resizeContainerRequestId);
        clearTimeout(_resizeMediaTimeout);
        if (floatingPlayer === this._playerElement) {
            floatingPlayer = null;
        }
        if (focusHelper) {
            focusHelper.destroy();
            focusHelper = null;
        }
        if (this.fullscreenHelpers) {
            this.fullscreenHelpers.destroy();
            this.fullscreenHelpers = null;
        }
        if (this.controls) {
            this.controls.disable(_model);
        }
        if (displayClickHandler) {
            displayClickHandler.destroy();
            this._playerElement.removeEventListener('mousemove', moveHandler);
            this._playerElement.removeEventListener('mouseout', outHandler);
            this._playerElement.removeEventListener('mouseover', overHandler);
            displayClickHandler = null;
        }
        _captionsRenderer.destroy();
        if (_logo) {
            _logo.destroy();
            _logo = null;
        }
        clearCss(_model.get('id'));
        if (this.resizeListener) {
            this.resizeListener.destroy();
            delete this.resizeListener;
        }
        if (_floatingConfig && _isMobile) {
            viewsManager.removeScrollHandler(throttledMobileFloatScrollHandler);
        }
    };
}

export default View;
