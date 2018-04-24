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
    STATE_BUFFERING, STATE_IDLE, STATE_COMPLETE, STATE_PAUSED, STATE_PLAYING, STATE_ERROR,
    RESIZE, BREAKPOINT, DISPLAY_CLICK, LOGO_CLICK, ERROR, NATIVE_FULLSCREEN, MEDIA_VISUAL_QUALITY, CONTROLS } from 'events/events';
import Events from 'utils/backbone.events';
import {
    addClass,
    hasClass,
    removeClass,
    replaceClass,
    toggleClass,
    createElement,
    bounds,
} from 'utils/dom';
import {
    clearCss,
    style,
} from 'utils/css';
import { isNumber } from 'utils/underscore';
import requestFullscreenHelper from 'view/utils/request-fullscreen-helper';
import flagNoFocus from 'view/utils/flag-no-focus';
import ClickHandler from 'view/utils/clickhandler';
import CaptionsRenderer from 'view/captionsrenderer';
import Logo from 'view/logo';
import Preview from 'view/preview';
import Title from 'view/title';

require('css/jwplayer.less');

let ControlsModule;

const _isMobile = OS.mobile;
const _isIE = Browser.ie;

function View(_api, _model) {
    const _this = Object.assign(this, Events, {
        isSetup: false,
        api: _api,
        model: _model
    });

    const _playerElement = createElement(playerTemplate(_model.get('id'), _model.get('localization').player));
    const _videoLayer = _playerElement.querySelector('.jw-media');

    const _preview = new Preview(_model);
    const _title = new Title(_model);

    const _captionsRenderer = new CaptionsRenderer(_model);
    _captionsRenderer.on('all', _this.trigger, _this);

    let _logo;

    let _lastWidth;
    let _lastHeight;

    let _resizeMediaTimeout = -1;
    let _resizeContainerRequestId = -1;
    let _stateClassRequestId = -1;

    let displayClickHandler;
    let fullscreenHelpers;
    let focusHelper;

    let _breakpoint = null;
    let _controls;

    function reasonInteraction() {
        return { reason: 'interaction' };
    }

    this.updateBounds = function () {
        cancelAnimationFrame(_resizeContainerRequestId);
        const inDOM = document.body.contains(_playerElement);
        const rect = bounds(_playerElement);
        const containerWidth = Math.round(rect.width);
        const containerHeight = Math.round(rect.height);

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
            viewsManager.observe(_playerElement);
        }
    };

    this.updateStyles = function() {
        const containerWidth = _model.get('containerWidth');
        const containerHeight = _model.get('containerHeight');

        if (_model.get('controls')) {
            updateContainerStyles(containerWidth, containerHeight);
        }

        if (_controls) {
            _controls.resize(containerWidth, containerHeight);
        }

        _resizeMedia(containerWidth, containerHeight);
        _captionsRenderer.resize();
    };

    this.checkResized = function() {
        const containerWidth = _model.get('containerWidth');
        const containerHeight = _model.get('containerHeight');
        if (containerWidth !== _lastWidth || containerHeight !== _lastHeight) {
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
    };

    function _responsiveListener() {
        cancelAnimationFrame(_resizeContainerRequestId);
        _resizeContainerRequestId = requestAnimationFrame(_responsiveUpdate);
    }

    function _responsiveUpdate() {
        if (!_this.isSetup) {
            return;
        }
        _this.updateBounds();
        _this.updateStyles();
        _this.checkResized();
    }

    function updateContainerStyles(width, height) {
        const audioMode = isAudioMode(_model);
        // Set timeslider flags
        if (isNumber(width) && isNumber(height)) {
            const breakpoint = getBreakpoint(width);
            setBreakpoint(_playerElement, breakpoint);

            const smallPlayer = breakpoint < 2;
            toggleClass(_playerElement, 'jw-flag-small-player', smallPlayer);
            toggleClass(_playerElement, 'jw-orientation-portrait', (height > width));
        }
        toggleClass(_playerElement, 'jw-flag-audio-player', audioMode);
        _model.set('audioMode', audioMode);
    }

    this.setup = function () {
        _preview.setup(_playerElement.querySelector('.jw-preview'));
        _title.setup(_playerElement.querySelector('.jw-title'));

        _logo = new Logo(_model);
        _logo.setup();
        _logo.setContainer(_playerElement);
        _logo.on(LOGO_CLICK, _logoClickHandler);

        // captions rendering
        _captionsRenderer.setup(_playerElement.id, _model.get('captions'));

        // captions should be placed behind controls, and not hidden when controls are hidden
        _playerElement.insertBefore(_captionsRenderer.element(), _title.element());

        // Display Click and Double Click Handling
        displayClickHandler = clickHandlerHelper(_api, _model, _videoLayer);

        focusHelper = flagNoFocus(_playerElement);
        fullscreenHelpers = requestFullscreenHelper(_playerElement, document, _fullscreenChangeHandler);

        _model.on('change:hideAdsControls', function (model, val) {
            toggleClass(_playerElement, 'jw-flag-ads-hide-controls', val);
        });
        _model.on('change:scrubbing', function (model, val) {
            toggleClass(_playerElement, 'jw-flag-dragging', val);
        });
        _model.on('change:playRejected', function (model, val) {
            toggleClass(_playerElement, 'jw-flag-play-rejected', val);
        });

        // Native fullscreen (coming through from the provider)
        _model.on(NATIVE_FULLSCREEN, _fullscreenChangeHandler);

        _model.on(`change:${MEDIA_VISUAL_QUALITY}`, () => {
            _resizeMedia();
        });

        const playerViewModel = _model.player;
        playerViewModel.on('change:errorEvent', _errorHandler);

        _model.change('stretching', onStretchChange);
        _model.change('flashBlocked', onFlashBlockedChange);

        const width = _model.get('width');
        const height = _model.get('height');
        _resizePlayer(width, height);
        _model.change('aspectratio', onAspectRatioChange);
        if (_model.get('controls')) {
            updateContainerStyles(width, height);
        } else {
            addClass(_playerElement, 'jw-flag-controls-hidden');
        }

        if (_isIE) {
            addClass(_playerElement, 'jw-ie');
        }

        const skin = _model.get('skin') || {};

        if (skin.name) {
            replaceClass(_playerElement, /jw-skin-\S+/, 'jw-skin-' + skin.name);
        }

        const skinColors = normalizeSkin(skin);
        handleColorOverrides(_model.get('id'), skinColors);

        // adds video tag to video layer
        _model.set('mediaContainer', _videoLayer);
        _model.set('iFrame', Features.iframe);
        _model.set('activeTab', activeTab());
        _model.set('touchMode', _isMobile && (typeof height === 'string' || height >= CONTROLBAR_ONLY_HEIGHT));

        viewsManager.add(this);

        this.isSetup = true;
        _model.trigger('viewSetup', _playerElement);

        const inDOM = document.body.contains(_playerElement);
        if (inDOM) {
            viewsManager.observe(_playerElement);
        }
        _model.set('inDom', inDOM);
    };

    function updateVisibility() {
        _model.set('visibility', getVisibility(_model, _playerElement));
    }

    this.init = function() {
        this.updateBounds();

        _model.on('change:fullscreen', _fullscreen);
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
        playerViewModel.change('playlistItem', onPlaylistItem);
        // Triggering 'resize' resulting in player 'ready'
        _lastWidth = _lastHeight = null;
        this.checkResized();
    };

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
                controlsEvent.loadPromise.catch(function (reason) {
                    _this.trigger(ERROR, {
                        message: 'Controls failed to load',
                        reason: reason
                    });
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
        const controls = new ControlsModule(document, _this.element());
        _this.addControls(controls);
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

                if (_controls) {
                    if (settingsMenuVisible()) {
                        _controls.settingsMenu.close();
                    } else if (infoOverlayVisible()) {
                        _controls.infoOverlay.close();
                    } else {
                        api.playToggle(reasonInteraction());
                    }
                }
            },
            tap: () => {
                _playerElement.removeEventListener('mousemove', moveHandler);
                _playerElement.removeEventListener('mouseout', outHandler);
                _playerElement.removeEventListener('mouseover', overHandler);
                _this.trigger(DISPLAY_CLICK);
                if (settingsMenuVisible()) {
                    _controls.settingsMenu.close();
                }
                if (infoOverlayVisible()) {
                    _controls.infoOverlay.close();
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
                    toggleClass(_playerElement, 'jw-flag-controls-hidden');
                    _captionsRenderer.renderCues(true);
                } else if (_controls) {
                    if (!_controls.showing) {
                        _controls.userActive();
                    } else {
                        _controls.userInactive();
                    }
                }
            },
            doubleClick: () => _controls && api.setFullscreen()
        });

        _playerElement.addEventListener('mousemove', moveHandler);
        _playerElement.addEventListener('mouseover', overHandler);
        _playerElement.addEventListener('mouseout', outHandler);

        return clickHandler;
    }

    function moveHandler(event) {
        if (_controls) {
            _controls.mouseMove(event);
        }
    }

    function overHandler(event) {
        if (_controls && !_controls.showing && event.target.nodeName === 'IFRAME') {
            _controls.userActive();
        }
    }

    function outHandler(event) {
        if (_controls && _controls.showing && event.relatedTarget && !_playerElement.contains(event.relatedTarget)) {
            _controls.userActive();
        }
    }

    function onStretchChange(model, newVal) {
        replaceClass(_playerElement, /jw-stretch-\S+/, 'jw-stretch-' + newVal);
    }

    function onAspectRatioChange(model, aspectratio) {
        toggleClass(_playerElement, 'jw-flag-aspect-mode', !!aspectratio);
        const aspectRatioContainer = _playerElement.querySelector('.jw-aspect');
        style(aspectRatioContainer, {
            paddingTop: aspectratio || null
        });
    }

    function onFlashBlockedChange(model, isBlocked) {
        toggleClass(_playerElement, 'jw-flag-flash-blocked', isBlocked);
    }

    function _logoClickHandler(evt) {
        if (!evt.link) {
            if (_model.get('controls')) {
                _api.playToggle(reasonInteraction());
            }
        } else {
            _api.pause(reasonInteraction());
            _api.setFullscreen(false);
            window.open(evt.link, evt.linktarget);
        }
    }

    this.addControls = function (controls) {
        _controls = controls;

        removeClass(_playerElement, 'jw-flag-controls-hidden');

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

        controls.on('all', _this.trigger, _this);

        if (_model.get('instream')) {
            _controls.setupInstream();
        }
    };

    this.removeControls = function () {
        if (_controls) {
            _controls.disable(_model);
            _controls = null;
        }

        addClass(_playerElement, 'jw-flag-controls-hidden');
    };

    // Perform the switch to fullscreen
    const _fullscreen = function (model, state) {

        // Unmute the video so volume can be adjusted with native controls in fullscreen
        if (state && _controls && model.get('autostartMuted')) {
            _controls.unmuteAutoplay(_api, model);
        }

        if (fullscreenHelpers.supportsDomFullscreen()) {
            if (state) {
                fullscreenHelpers.requestFullscreen();
            } else {
                fullscreenHelpers.exitFullscreen();
            }
            _toggleDOMFullscreen(_playerElement, state);
        } else if (_isIE) {
            _toggleDOMFullscreen(_playerElement, state);
        } else {
            // Request media element fullscreen (iOS)
            const provider = model.getVideo();
            provider.setFullscreen(state);
        }
    };

    function _resizePlayer(playerWidth, playerHeight, resetAspectMode) {
        const widthSet = playerWidth !== undefined;
        const heightSet = playerHeight !== undefined;
        const playerStyle = {
            width: playerWidth
        };

        // when jwResize is called remove aspectMode and force layout
        if (heightSet && resetAspectMode) {
            _model.set('aspectratio', null);
        }
        if (!_model.get('aspectratio')) {
            // If the height is a pixel value (number) greater than 0, snap it to the minimum supported height
            // Allow zero to mean "hide the player"
            let height = playerHeight;
            if (isNumber(height) && height !== 0) {
                height = Math.max(height, CONTROLBAR_ONLY_HEIGHT);
            }
            playerStyle.height = height;
        }

        if (widthSet && heightSet) {
            _model.set('width', playerWidth);
            _model.set('height', playerHeight);
        }

        style(_playerElement, playerStyle);
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
        const resetAspectMode = true;
        _resizePlayer(playerWidth, playerHeight, resetAspectMode);
        _responsiveUpdate();
    };
    this.resizeMedia = _resizeMedia;

    function _isNativeFullscreen() {
        // Return whether or not we're in native fullscreen
        if (fullscreenHelpers.supportsDomFullscreen()) {
            const fsElement = fullscreenHelpers.fullscreenElement();
            return !!(fsElement && fsElement === _playerElement);
        }
        // If native fullscreen is not available, return video fullscreen state
        const provider = _model.getVideo();
        return provider.getFullScreen();
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

    function _toggleDOMFullscreen(playerElement, fullscreenState) {
        toggleClass(playerElement, 'jw-flag-fullscreen', fullscreenState);
        style(document.body, { overflowY: (fullscreenState) ? 'hidden' : '' });

        if (fullscreenState && _controls) {
            // When going into fullscreen, we want the control bar to fade after a few seconds
            _controls.userActive();
        }

        _resizeMedia();
        _responsiveListener();
    }

    function _setLiveMode(model, streamType) {
        const live = (streamType === 'LIVE');
        toggleClass(_playerElement, 'jw-flag-live', live);
    }

    function _onMediaTypeChange(model, val) {
        const isAudioFile = (val === 'audio');
        const provider = model.get('provider');

        toggleClass(_playerElement, 'jw-flag-media-audio', isAudioFile);

        const isFlash = (provider && provider.name.indexOf('flash') === 0);
        const element = (isAudioFile && !isFlash) ? _videoLayer : _videoLayer.nextSibling;
        // Put the preview element before the media element in order to display browser captions
        // otherwise keep it on top of the media element to display captions with the captions renderer
        _playerElement.insertBefore(_preview.el, element);
    }

    function _errorHandler(model, evt) {
        if (!evt) {
            _title.playlistItem(model, model.get('playlistItem'));
            return;
        }
        const errorContainer = ErrorContainer(model, evt.message);
        if (ErrorContainer.cloneIcon) {
            errorContainer.querySelector('.jw-icon').appendChild(ErrorContainer.cloneIcon('error'));
        }
        _title.hide();
        _playerElement.appendChild(errorContainer.firstChild);
        toggleClass(_playerElement, 'jw-flag-audio-player', !!model.get('audioMode'));
    }

    function _stateHandler(model, newState, oldState) {
        if (!_this.isSetup) {
            return;
        }

        if (oldState === STATE_ERROR) {
            const errorContainer = _playerElement.querySelector('.jw-error-msg');
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
        if (_model.get('controls') && state !== STATE_PAUSED && hasClass(_playerElement, 'jw-flag-controls-hidden')) {
            removeClass(_playerElement, 'jw-flag-controls-hidden');
        }
        replaceClass(_playerElement, /jw-state-\S+/, 'jw-state-' + state);

        switch (state) {
            case STATE_IDLE:
            case STATE_ERROR:
            case STATE_COMPLETE:
                if (_captionsRenderer) {
                    _captionsRenderer.hide();
                }
                break;
            default:
                if (_captionsRenderer) {
                    _captionsRenderer.show();
                    if (state === STATE_PAUSED && _controls && !_controls.showing) {
                        _captionsRenderer.renderCues(true);
                    }
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
        const dummyDiv = document.createElement('div');
        dummyDiv.innerHTML = playlistItem.title || '';
        videotag.setAttribute('title', dummyDiv.textContent);
    }

    function setPosterImage(item) {
        _preview.setImage(item && item.image);
    }

    function onPlaylistItem(model, item) {
        setPosterImage(item);
        // Set the title attribute of the video tag to display background media information on mobile devices
        if (_isMobile) {
            setMediaTitleAttribute(model, item);
        }
    }

    const settingsMenuVisible = () => {
        const settingsMenu = _controls && _controls.settingsMenu;
        return !!(settingsMenu && settingsMenu.visible);
    };

    const infoOverlayVisible = () => {
        const info = _controls && _controls.infoOverlay;
        return !!(info && info.visible);
    };

    const setupInstream = function() {
        addClass(_playerElement, 'jw-flag-ads');

        if (_controls) {
            _controls.setupInstream();
        }
    };

    const destroyInstream = function() {
        if (!displayClickHandler) {
            // view was destroyed
            return;
        }
        if (_controls) {
            _controls.destroyInstream(_model);
        }

        _this.setAltText('');
        removeClass(_playerElement, ['jw-flag-ads', 'jw-flag-ads-hide-controls']);
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
        return _playerElement;
    };

    this.controlsContainer = function() {
        if (_controls) {
            return _controls.element();
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
        if (_controls) {
            // Subtract controlbar from the bottom when using one
            if (excludeControlbar) {
                safeRegion.height -= _controls.controlbarHeight();
            }
        }
        return safeRegion;
    };

    this.setCaptions = function (captionsStyle) {
        _captionsRenderer.clear();
        _captionsRenderer.setup(_model.get('id'), captionsStyle);
        _captionsRenderer.resize();
    };

    this.destroy = function () {
        _model.destroy();
        viewsManager.unobserve(_playerElement);
        viewsManager.remove(this);
        this.isSetup = false;
        this.off();
        cancelAnimationFrame(_resizeContainerRequestId);
        clearTimeout(_resizeMediaTimeout);
        if (focusHelper) {
            focusHelper.destroy();
            focusHelper = null;
        }
        if (fullscreenHelpers) {
            fullscreenHelpers.destroy();
            fullscreenHelpers = null;
        }
        if (_controls) {
            _controls.disable(_model);
        }
        if (displayClickHandler) {
            displayClickHandler.destroy();
            _playerElement.removeEventListener('mousemove', moveHandler);
            _playerElement.removeEventListener('mouseout', outHandler);
            _playerElement.removeEventListener('mouseover', overHandler);
            displayClickHandler = null;
        }
        _captionsRenderer.destroy();
        if (_logo) {
            _logo.destroy();
            _logo = null;
        }
        clearCss(_model.get('id'));
    };
}

export default View;
