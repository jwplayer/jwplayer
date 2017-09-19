import playerTemplate from 'templates/player';
import { isAudioMode, CONTROLBAR_ONLY_HEIGHT } from 'view/utils/audio-mode';
import viewsManager from 'view/utils/views-manager';
import getVisibility from 'view/utils/visibility';
import activeTab from 'utils/active-tab';
import { requestAnimationFrame, cancelAnimationFrame } from 'utils/request-animation-frame';
import { getBreakpoint, setBreakpoint } from 'view/utils/breakpoint';
import { normalizeSkin, handleColorOverrides } from 'view/utils/skin';
import { Browser, OS, Features } from 'environment/environment';
import * as ControlsLoader from 'controller/controls-loader';
import { STATE_BUFFERING, STATE_IDLE, STATE_COMPLETE, STATE_PAUSED, STATE_PLAYING, STATE_ERROR, RESIZE, BREAKPOINT,
    DISPLAY_CLICK, LOGO_CLICK, ERROR } from 'events/events';
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
import _ from 'utils/underscore';
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

    // init/reset view model properties
    Object.assign(_model.attributes, {
        containerWidth: undefined,
        containerHeight: undefined,
        mediaContainer: undefined,
        fullscreen: false,
        inDom: undefined,
        iFrame: undefined,
        activeTab: undefined,
        intersectionRatio: undefined,
        visibility: undefined,
        viewable: undefined,
        viewSetup: false,
        audioMode: undefined,
        touchMode: undefined,
        altText: '',
        cues: undefined,
        castClicked: false,
        scrubbing: false,
        logoWidth: 0,
    });

    const _playerElement = createElement(playerTemplate(_model.get('id'), _model.get('localization').player));
    const _videoLayer = _playerElement.querySelector('.jw-media');

    const _preview = new Preview(_model);
    const _title = new Title(_model);

    let _captionsRenderer = new CaptionsRenderer(_model);
    _captionsRenderer.on('all', _this.trigger, _this);

    let _logo;

    let _playerState;

    let _lastWidth;
    let _lastHeight;

    let _instreamModel;

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
        if (_.isNumber(width) && _.isNumber(height)) {
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

        // captions should be place behind controls, and not hidden when controls are hidden
        _playerElement.insertBefore(_captionsRenderer.element(), _title.element());

        // Display Click and Double Click Handling
        displayClickHandler = clickHandlerHelper(_api, _model, _videoLayer);

        focusHelper = flagNoFocus(_playerElement);
        fullscreenHelpers = requestFullscreenHelper(_playerElement, document, _fullscreenChangeHandler);

        _playerElement.addEventListener('focus', onFocus);

        _model.on('change:errorEvent', _errorHandler);
        _model.on('change:hideAdsControls', function (model, val) {
            toggleClass(_playerElement, 'jw-flag-ads-hide-controls', val);
        });
        _model.on('change:scrubbing', function (model, val) {
            toggleClass(_playerElement, 'jw-flag-dragging', val);
        });
        // Native fullscreen (coming through from the provider)
        _model.mediaController.on('fullscreenchange', _fullscreenChangeHandler);

        _model.change('mediaModel', (model, mediaModel) => {
            mediaModel.change('mediaType', _onMediaTypeChange, this);
            mediaModel.on('change:visualQuality', () => {
                _resizeMedia();
            }, this);
        });
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
        _model.set('viewSetup', true);

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

        updateVisibility();

        // Always draw first player for icons to load
        if (viewsManager.size() === 1 && !_model.get('visibility')) {
            redraw(_model, 1, 0);
        }

        _model.change('state', _stateHandler);
        _model.change('controls', changeControls);
        // Set the title attribute of the video tag to display background media information on mobile devices
        if (_isMobile) {
            setMediaTitleAttribute(_model.get('playlistItem'));
            _model.on('itemReady', setMediaTitleAttribute);
        }

        // Triggering 'resize' resulting in player 'ready'
        _lastWidth = _lastHeight = null;
        this.checkResized();
    };

    function changeControls(model, enable) {
        if (enable) {
            ControlsModule = ControlsLoader.module.controls;
            if (!ControlsModule) {
                ControlsLoader.load()
                    .then(function (Controls) {
                        ControlsModule = Controls;
                        addControls();
                    })
                    .catch(function (reason) {
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
    }

    function addControls() {
        const controls = new ControlsModule(document, _this.element());
        _this.addControls(controls);
    }

    function setMediaTitleAttribute(item) {
        var videotag = _videoLayer.querySelector('video, audio');
        // chromecast and flash providers do no support video tags
        if (!videotag) {
            return;
        }

        // Writing a string to innerHTML completely decodes multiple-encoded strings
        const dummyDiv = document.createElement('div');
        dummyDiv.innerHTML = item.title || '';
        videotag.setAttribute('title', dummyDiv.textContent);
    }

    function redraw(model, visibility, lastVisibility) {
        if (visibility && !lastVisibility) {
            _stateHandler(_instreamModel || model);
            _this.updateStyles();
        }
    }

    function clickHandlerHelper(api, model, videoLayer) {
        const clickHandler = new ClickHandler(model, videoLayer, { useHover: true });
        const controls = _model.get('controls');
        clickHandler.on({
            click: () => {
                _this.trigger(DISPLAY_CLICK);

                if (_controls) {
                    if (settingsMenuVisible()) {
                        _controls.settingsMenu.close();
                    } else {
                        api.play(reasonInteraction());
                    }
                }
            },
            tap: () => {
                _this.trigger(DISPLAY_CLICK);
                if (settingsMenuVisible()) {
                    _controls.settingsMenu.close();
                }
                const state = model.get('state');

                if (controls &&
                    ((state === STATE_IDLE || state === STATE_COMPLETE) ||
                    (_instreamModel && _instreamModel.get('state') === STATE_PAUSED))) {
                    api.play(reasonInteraction());
                }

                if (controls && state === STATE_PAUSED) {
                    // Toggle visibility of the controls when tapping the media
                    // Do not add mobile toggle "jw-flag-controls-hidden" in these cases
                    if (_instreamModel ||
                        model.get('castActive') ||
                        (model.mediaModel && model.mediaModel.get('mediaType') === 'audio')) {
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
            doubleClick: () => _controls && api.setFullscreen(),
            move: () => _controls && _controls.userActive(),
            over: () => _controls && _controls.userActive()
        });

        return clickHandler;
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
            // _togglePlay();
            if (_model.get('controls')) {
                _api.play(reasonInteraction());
            }
        } else {
            _api.pause(true, reasonInteraction());
            _api.setFullscreen(false);
            window.open(evt.link, evt.linktarget);
        }
    }

    const _onChangeControls = function (model, bool) {
        if (bool) {
            // ignore model that triggered this event and use current state model
            _stateHandler(_instreamModel || _model);
        }
    };

    this.addControls = function (controls) {
        _controls = controls;

        removeClass(_playerElement, 'jw-flag-controls-hidden');

        _model.change('streamType', _setLiveMode, this);

        controls.enable(_api, _model);
        controls.addActiveListeners(_logo.element());

        const logoContainer = controls.logoContainer();
        if (logoContainer) {
            _logo.setContainer(logoContainer);
        }

        // refresh breakpoint and timeslider classes
        if (_lastHeight) {
            updateContainerStyles(_lastWidth, _lastHeight);
            controls.resize(_lastWidth, _lastHeight);
            _captionsRenderer.renderCues(true);
        }

        controls.on('userActive userInactive', function() {
            if (_playerState === STATE_PLAYING || _playerState === STATE_BUFFERING) {
                _captionsRenderer.renderCues(true);
            }
        });

        controls.on('all', _this.trigger, _this);

        const overlaysElement = _playerElement.querySelector('.jw-overlays');
        overlaysElement.addEventListener('mousemove', _userActivityCallback);
    };

    this.removeControls = function () {
        _logo.setContainer(_playerElement);

        if (_controls) {
            _controls.removeActiveListeners(_logo.element());
            _controls.disable(_model);
            _controls = null;
        }

        const overlay = document.querySelector('.jw-overlays');
        if (overlay) {
            overlay.removeEventListener('mousemove', _userActivityCallback);
        }

        addClass(_playerElement, 'jw-flag-controls-hidden');
    };

    // Perform the switch to fullscreen
    const _fullscreen = function (model, state) {

        // If it supports DOM fullscreen
        const provider = _model.getVideo();

        // Unmute the video so volume can be adjusted with native controls in fullscreen
        if (state && _controls && _model.get('autostartMuted')) {
            _controls.unmuteAutoplay(_api, _model);
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
            // else use native fullscreen
            if (_instreamModel && _instreamModel.getVideo()) {
                _instreamModel.getVideo().setFullscreen(state);
            }
            provider.setFullscreen(state);
        }
        // pass fullscreen state to Flash provider
        // provider.getName() is the same as _api.getProvider() or _model.get('provider')
        if (provider && provider.getName().name.indexOf('flash') === 0) {
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
            if (_.isNumber(height) && height !== 0) {
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
        const transformScale = provider.resize(containerWidth, containerHeight, _model.get('stretching'));

        // poll resizing if video is transformed
        if (transformScale) {
            clearTimeout(_resizeMediaTimeout);
            _resizeMediaTimeout = setTimeout(_resizeMedia, 250);
        }
    }

    this.resize = function (playerWidth, playerHeight) {
        const resetAspectMode = true;
        _resizePlayer(playerWidth, playerHeight, resetAspectMode);
        _responsiveUpdate();
    };
    this.resizeMedia = _resizeMedia;

    /**
     * Return whether or not we're in native fullscreen
     */
    function _isNativeFullscreen() {
        if (fullscreenHelpers.supportsDomFullscreen()) {
            const fsElement = fullscreenHelpers.fullscreenElement();
            return !!(fsElement && fsElement.id === _model.get('id'));
        }
        // if player element view fullscreen not available, return video fullscreen state
        return _instreamModel ? _instreamModel.getVideo().getFullScreen() :
            _model.getVideo().getFullScreen();
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
        if (!_instreamModel) {
            const live = (streamType === 'LIVE');
            toggleClass(_playerElement, 'jw-flag-live', live);
        }
    }

    function _userActivityCallback(/* event */) {
        _controls.userActive();
    }

    function _onMediaTypeChange(model, val) {
        const isAudioFile = (val === 'audio');
        const provider = _model.getVideo();
        const isFlash = (provider && provider.getName().name.indexOf('flash') === 0);

        toggleClass(_playerElement, 'jw-flag-media-audio', isAudioFile);

        if (isAudioFile && !isFlash) {
            // Put the preview element before the media element in order to display browser captions
            _playerElement.insertBefore(_preview.el, _videoLayer);
        } else {
            // Put the preview element before the captions element to display captions with the captions renderer
            _playerElement.insertBefore(_preview.el, _captionsRenderer.element());
        }
    }

    function _errorHandler(model, evt) {
        if (!evt) {
            _title.playlistItem(model, model.get('playlistItem'));
            return;
        }
        if (evt.name) {
            _title.updateText(evt.name, evt.message);
        } else {
            _title.updateText(evt.message, '');
        }
    }

    function _stateHandler(model) {
        if (!_model.get('viewSetup')) {
            return;
        }

        _playerState = model.get('state');

        let instreamState = null;
        if (_instreamModel) {
            instreamState = _playerState;
        }
        if (_controls) {
            _controls.instreamState = instreamState;
        }

        cancelAnimationFrame(_stateClassRequestId);
        _stateClassRequestId = requestAnimationFrame(() => _stateUpdate(_playerState));
    }

    function _stateUpdate(state) {
        if (_model.get('controls') && state !== STATE_PAUSED && hasClass(_playerElement, 'jw-flag-controls-hidden')) {
            removeClass(_playerElement, 'jw-flag-controls-hidden');
        }
        replaceClass(_playerElement, /jw-state-\S+/, 'jw-state-' + state);

        // Update captions renderer
        if (_captionsRenderer) {
            switch (state) {
                case STATE_IDLE:
                case STATE_ERROR:
                case STATE_COMPLETE:
                    _captionsRenderer.hide();
                    break;
                default:
                    _captionsRenderer.show();
                    if (state === STATE_PAUSED && _controls && !_controls.showing) {
                        _captionsRenderer.renderCues(true);
                    }
                    break;
            }
        }
    }

    function onFocus() {
        // On tab-focus, show the control bar for a few seconds
        if (_controls && !_instreamModel && !_isMobile) {
            _controls.userActive();
        }
    }

    const settingsMenuVisible = () => {
        const settingsMenu = _controls && _controls.settingsMenu;
        return !!(settingsMenu && settingsMenu.visible);
    };

    this.setupInstream = function (instreamModel) {
        this.instreamModel = _instreamModel = instreamModel;
        _instreamModel.on('change:controls', _onChangeControls, this);
        _instreamModel.on('change:state', _stateHandler, this);

        addClass(_playerElement, 'jw-flag-ads');
        removeClass(_playerElement, 'jw-flag-live');

        // Call Controls.userActivity to display the UI temporarily for the start of the ad
        if (_controls) {
            _controls.userActive();
            _controls.controlbar.useInstreamTime(instreamModel);
            if (_controls.settingsMenu) {
                _controls.settingsMenu.close();
            }
        }
    };

    this.setAltText = function (text) {
        _model.set('altText', text);
    };

    this.destroyInstream = function () {
        if (_instreamModel) {
            _instreamModel.off(null, null, this);
            _instreamModel = null;
        }
        if (!displayClickHandler) {
            // view was destroyed
            return;
        }
        if (_controls) {
            _controls.controlbar.syncPlaybackTime(_model);
        }

        this.setAltText('');
        removeClass(_playerElement, ['jw-flag-ads', 'jw-flag-ads-hide-controls']);
        _model.set('hideAdsControls', false);
        const provider = _model.getVideo();
        if (provider) {
            provider.setContainer(_videoLayer);
        }
        _setLiveMode(_model, _model.get('streamType'));
        // reset display click handler
        displayClickHandler.revertAlternateClickHandlers();
    };

    this.addCues = function (cues) {
        _model.set('cues', cues);
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
        viewsManager.unobserve(_playerElement);
        viewsManager.remove(this);
        this.isSetup = false;
        this.off();
        cancelAnimationFrame(_resizeContainerRequestId);
        clearTimeout(_resizeMediaTimeout);
        _playerElement.removeEventListener('focus', onFocus);
        if (focusHelper) {
            focusHelper.destroy();
            focusHelper = null;
        }
        if (fullscreenHelpers) {
            fullscreenHelpers.destroy();
            fullscreenHelpers = null;
        }
        if (_model.mediaController) {
            _model.mediaController.off('fullscreenchange', _fullscreenChangeHandler);
        }
        if (_controls) {
            _controls.disable(_model);
        }

        if (_instreamModel) {
            this.destroyInstream();
        }
        if (displayClickHandler) {
            displayClickHandler.destroy();
            displayClickHandler = null;
        }
        if (_captionsRenderer) {
            _captionsRenderer.destroy();
            _captionsRenderer = null;
        }
        if (_logo) {
            _logo.destroy();
            _logo = null;
        }
        clearCss(_model.get('id'));
    };
}

export default View;
