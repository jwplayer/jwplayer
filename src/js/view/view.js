import playerTemplate from 'templates/player';
import { isAudioMode, CONTROLBAR_ONLY_HEIGHT } from 'view/utils/audio-mode';
import viewsManager from 'view/utils/views-manager';
import getVisibility from 'view/utils/visibility';
import activeTab from 'utils/active-tab';
import { requestAnimationFrame, cancelAnimationFrame } from 'utils/request-animation-frame';
import { getBreakpoint, setBreakpoint } from 'view/utils/breakpoint';

let ControlsModule;

define([
    'events/events',
    'events/states',
    'utils/backbone.events',
    'utils/helpers',
    'utils/underscore',
    'view/utils/request-fullscreen-helper',
    'view/utils/flag-no-focus',
    'view/utils/clickhandler',
    'view/captionsrenderer',
    'view/logo',
    'view/preview',
    'view/title',
    'controller/controls-loader',
], function(events, states, Events, utils, _, requestFullscreenHelper, flagNoFocus,
            ClickHandler, CaptionsRenderer, Logo, Preview, Title, ControlsLoader) {

    const _styles = utils.style;
    const _bounds = utils.bounds;
    const _isMobile = utils.isMobile();
    const _isIE = utils.isIE();

    let stylesInjected = false;

    function View(_api, _model) {
        const _this = _.extend(this, Events, {
            isSetup: false,
            api: _api,
            model: _model
        });

        // init/reset view model properties
        _.extend(_model.attributes, {
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

        const _playerElement = utils.createElement(playerTemplate(_model.get('id'), _model.get('localization').player));
        const _videoLayer = _playerElement.querySelector('.jw-media');

        const _preview = new Preview(_model);
        const _title = new Title(_model);
        const _captionsRenderer = new CaptionsRenderer(_model);

        let _logo;

        let _playerState;

        let _lastWidth;
        let _lastHeight;

        let _instreamModel;

        let _resizeMediaTimeout = -1;
        let _resizeContainerRequestId = -1;

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
            const bounds = _bounds(_playerElement);
            const containerWidth = Math.round(bounds.width);
            const containerHeight = Math.round(bounds.height);

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
                _this.trigger(events.JWPLAYER_RESIZE, {
                    width: containerWidth,
                    height: containerHeight
                });
                const breakpoint = getBreakpoint(containerWidth);
                if (_breakpoint !== breakpoint) {
                    _breakpoint = breakpoint;
                    _this.trigger(events.JWPLAYER_BREAKPOINT, {
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
                const timeSliderAboveConfig = _model.get('timeSliderAbove');
                const timeSliderAbove = !audioMode &&
                    (timeSliderAboveConfig !== false) && (timeSliderAboveConfig || smallPlayer);
                utils.toggleClass(_playerElement, 'jw-flag-small-player', smallPlayer);
                utils.toggleClass(_playerElement, 'jw-flag-time-slider-above', timeSliderAbove);
                utils.toggleClass(_playerElement, 'jw-orientation-portrait', (height > width));
            }
            utils.toggleClass(_playerElement, 'jw-flag-audio-player', audioMode);
            _model.set('audioMode', audioMode);
        }

        // Set global colors, used by related plugin
        // If a color is undefined simple-style-loader won't add their styles to the dom
        function insertGlobalColorClasses(activeColor, inactiveColor, playerId) {
            if (activeColor) {
                const activeColorSet = {
                    color: activeColor,
                    borderColor: activeColor,
                    stroke: activeColor
                };
                utils.css('#' + playerId + ' .jw-color-active', activeColorSet, playerId);
                utils.css('#' + playerId + ' .jw-color-active-hover:hover', activeColorSet, playerId);
            }
            if (inactiveColor) {
                const inactiveColorSet = {
                    color: inactiveColor,
                    borderColor: inactiveColor,
                    stroke: inactiveColor
                };
                utils.css('#' + playerId + ' .jw-color-inactive', inactiveColorSet, playerId);
                utils.css('#' + playerId + ' .jw-color-inactive-hover:hover', inactiveColorSet, playerId);
            }
        }

        this.handleColorOverrides = function () {
            const id = _model.get('id');

            function addStyle(elements, attr, value, extendParent) {
                /* if extendParent is true, bundle the first selector of
                 element string to the player element instead of defining it as a
                 child of the player element (default). i.e. #player.sel-1 .sel-2 vs. #player .sel-1 .sel-2 */
                elements = utils.prefix(elements, '#' + id + (extendParent ? '' : ' '));

                const o = {};
                o[attr] = value;
                utils.css(elements.join(', '), o, id);
            }

            // We can assume that the user will define both an active and inactive color because otherwise it doesn't look good
            const activeColor = _model.get('skinColorActive');
            const inactiveColor = _model.get('skinColorInactive');
            const backgroundColor = _model.get('skinColorBackground');

            // These will use standard style names for CSS since they are added directly to a style sheet
            // Using background instead of background-color so we don't have to clear gradients with background-image
            if (activeColor) {
                // Apply active color
                addStyle([
                    // Toggle and menu button active colors
                    '.jw-button-color.jw-toggle',
                    '.jw-button-color:hover',
                    '.jw-button-color.jw-toggle.jw-off:hover',
                    '.jw-option:not(.jw-active-option):hover',
                    '.jw-nextup-header'
                ], 'color', activeColor);
                addStyle([
                    // menu active option
                    '.jw-option.jw-active-option',
                    // slider fill color
                    '.jw-progress'
                ], 'background', 'none ' + activeColor);
            }

            if (inactiveColor) {
                // Apply inactive color
                addStyle([
                    // text color of many ui elements
                    '.jw-text',
                    // menu option text
                    '.jw-option',
                    // controlbar button colors
                    '.jw-button-color',
                    // toggle button
                    '.jw-toggle.jw-off',
                    '.jw-skip .jw-skip-icon',
                    '.jw-nextup-body'
                ], 'color', inactiveColor);
                addStyle([
                    // slider children
                    '.jw-cue',
                    '.jw-knob',
                    '.jw-active-option',
                    '.jw-nextup-header'
                ], 'background', 'none ' + inactiveColor);
            }

            if (backgroundColor) {
                // Apply background color
                addStyle([
                    // general background color
                    '.jw-background-color'
                ], 'background', 'none ' + backgroundColor);

                if (_model.get('timeSliderAbove') !== false) {
                    const backgroundColorGradient = 'transparent linear-gradient(180deg, ' +
                        utils.getRgba(backgroundColor, 0) + ' 0%, ' +
                        utils.getRgba(backgroundColor, 0.25) + ' 30%, ' +
                        utils.getRgba(backgroundColor, 0.4) + ' 70%, ' +
                        utils.getRgba(backgroundColor, 0.5) + ') 100%';

                    addStyle([
                        // for small player, set the control bar gradient to the config background color
                        '.jw-flag-time-slider-above .jw-background-color.jw-controlbar'
                    ], 'background', backgroundColorGradient, true);
                }

                // remove the config background on time slider
                addStyle([
                    '.jw-flag-time-slider-above .jw-background-color.jw-slider-time'
                ], 'background', 'transparent', true);
            }

            insertGlobalColorClasses(activeColor, inactiveColor, id);
        };

        this.setup = function () {
            _preview.setup(_playerElement.querySelector('.jw-preview'));
            _title.setup(_playerElement.querySelector('.jw-title'));

            _logo = new Logo(_model);
            _logo.setup();
            _logo.setContainer(_playerElement);
            _logo.on(events.JWPLAYER_LOGO_CLICK, _logoClickHandler);

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
                utils.toggleClass(_playerElement, 'jw-flag-ads-hide-controls', val);
            });
            _model.on('change:scrubbing', function (model, val) {
                utils.toggleClass(_playerElement, 'jw-flag-dragging', val);
            });
            // Native fullscreen (coming through from the provider)
            _model.mediaController.on('fullscreenchange', _fullscreenChangeHandler);
            
            _model.change('mediaModel', (model, mediaModel) => {
                mediaModel.change('mediaType', _onMediaTypeChange, this);
                mediaModel.on('change:visualQuality', () => {
                    _resizeMedia();
                }, this);
            });
            _model.change('skin', onSkinChange, this);
            _model.change('stretching', onStretchChange);
            _model.change('flashBlocked', onFlashBlockedChange);

            const width = _model.get('width');
            const height = _model.get('height');
            _resizePlayer(width, height);
            _model.change('aspectratio', onAspectRatioChange);
            if (_model.get('controls')) {
                updateContainerStyles(width, height);
            } else {
                utils.addClass(_playerElement, 'jw-flag-controls-hidden');
            }

            if (!stylesInjected) {
                stylesInjected = true;
                require('css/jwplayer.less');
            }
            if (_isIE) {
                utils.addClass(_playerElement, 'jw-ie');
            }
            // Hide control elements until skin is loaded
            if (_model.get('skin-loading') === true) {
                utils.addClass(_playerElement, 'jw-flag-skin-loading');
                _model.once('change:skin-loading', function () {
                    utils.removeClass(_playerElement, 'jw-flag-skin-loading');
                });
            }
            this.handleColorOverrides();

            // adds video tag to video layer
            _model.set('mediaContainer', _videoLayer);
            _model.set('iFrame', utils.isIframe());
            _model.set('activeTab', activeTab());
            _model.set('touchMode', _isMobile && (typeof height === 'string' || height >= CONTROLBAR_ONLY_HEIGHT));

            viewsManager.add(this);

            this.isSetup = true;
            _model.set('viewSetup', true);
            _model.set('inDom', document.body.contains(_playerElement));
        };

        function updateVisibility() {
            _model.set('visibility', getVisibility(_model, _playerElement, _bounds));
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
                if (!ControlsModule) {
                    ControlsLoader.load()
                        .then(function (Controls) {
                            ControlsModule = Controls;
                            addControls();
                        })
                        .catch(function (reason) {
                            _this.trigger('error', {
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
            // Youtube, chromecast and flash providers do no support video tags
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
            clickHandler.on({
                click: () => {
                    _this.trigger(events.JWPLAYER_DISPLAY_CLICK);
                    if (_model.get('controls')) {
                        api.play(reasonInteraction());
                    }
                },
                tap: () => {
                    _this.trigger(events.JWPLAYER_DISPLAY_CLICK);
                    const state = model.get('state');
                    const controls = _model.get('controls');

                    if (controls &&
                        ((state === states.IDLE || state === states.COMPLETE) ||
                        (_instreamModel && _instreamModel.get('state') === states.PAUSED))) {
                        api.play(reasonInteraction());
                    }
                    if (controls && state === states.PAUSED) {
                        // Toggle visibility of the controls when tapping the media
                        // Do not add mobile toggle "jw-flag-controls-hidden" in these cases
                        if (_instreamModel ||
                            model.get('castActive') ||
                            (model.mediaModel && model.mediaModel.get('mediaType') === 'audio')) {
                            return;
                        }
                        utils.toggleClass(_playerElement, 'jw-flag-controls-hidden');
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

        function onSkinChange(model, newSkin) {
            utils.replaceClass(_playerElement, /jw-skin-\S+/, newSkin ? ('jw-skin-' + newSkin) : '');
        }

        function onStretchChange(model, newVal) {
            utils.replaceClass(_playerElement, /jw-stretch-\S+/, 'jw-stretch-' + newVal);
        }

        function onAspectRatioChange(model, aspectratio) {
            utils.toggleClass(_playerElement, 'jw-flag-aspect-mode', !!aspectratio);
            const aspectRatioContainer = _playerElement.querySelector('.jw-aspect');
            _styles(aspectRatioContainer, {
                paddingTop: aspectratio || null
            });
        }

        function onFlashBlockedChange(model, isBlocked) {
            utils.toggleClass(_playerElement, 'jw-flag-flash-blocked', isBlocked);
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

            utils.removeClass(_playerElement, 'jw-flag-controls-hidden');

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
                if (_playerState === states.PLAYING || _playerState === states.BUFFERING) {
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
                _controls.disable();
                _controls = null;
            }

            const overlay = document.querySelector('.jw-overlays');
            if (overlay) {
                overlay.removeEventListener('mousemove', _userActivityCallback);
            }

            utils.addClass(_playerElement, 'jw-flag-controls-hidden');
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
            const widthSet = utils.exists(playerWidth);
            const heightSet = utils.exists(playerHeight);
            const playerStyle = {
                width: playerWidth
            };

            // when jwResize is called remove aspectMode and force layout
            if (heightSet && resetAspectMode) {
                _model.set('aspectratio', null);
            }
            if (!_model.get('aspectratio')) {
                playerStyle.height = playerHeight;
            }

            if (widthSet && heightSet) {
                _model.set('width', playerWidth);
                _model.set('height', playerHeight);
            }

            _styles(_playerElement, playerStyle);
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
            utils.toggleClass(playerElement, 'jw-flag-fullscreen', fullscreenState);
            _styles(document.body, { overflowY: (fullscreenState) ? 'hidden' : '' });

            if (fullscreenState && _controls) {
                // When going into fullscreen, we want the control bar to fade after a few seconds
                _controls.userActive();
            }

            _resizeMedia();
            _responsiveListener();
        }

        function _userActivityCallback(/* event */) {
            _controls.userActive();
        }

        function _onMediaTypeChange(model, val) {
            const isAudioFile = (val === 'audio');
            const provider = _model.getVideo();
            const isFlash = (provider && provider.getName().name.indexOf('flash') === 0);

            utils.toggleClass(_playerElement, 'jw-flag-media-audio', isAudioFile);

            if (isAudioFile && !isFlash) {
                // Put the preview element before the media element in order to display browser captions
                _playerElement.insertBefore(_preview.el, _videoLayer);
            } else {
                // Put the preview element before the captions element to display captions with the captions renderer
                _playerElement.insertBefore(_preview.el, _captionsRenderer.element());
            }
        }

        function _setLiveMode(model, streamType) {
            if (!_instreamModel) {
                const live = (streamType === 'LIVE');
                utils.toggleClass(_playerElement, 'jw-flag-live', live);
                _this.setAltText((live) ? model.get('localization').liveBroadcast : '');
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

            _stateUpdate(_playerState);
        }

        function _stateUpdate(state) {
            if (_model.get('controls') && state !== states.PAUSED && utils.hasClass(_playerElement, 'jw-flag-controls-hidden')) {
                utils.removeClass(_playerElement, 'jw-flag-controls-hidden');
            }
            utils.replaceClass(_playerElement, /jw-state-\S+/, 'jw-state-' + state);

            // Update captions renderer
            switch (state) {
                case states.IDLE:
                case states.ERROR:
                case states.COMPLETE:
                    _captionsRenderer.hide();
                    break;
                default:
                    _captionsRenderer.show();
                    if (state === states.PAUSED && _controls && !_controls.showing) {
                        _captionsRenderer.renderCues(true);
                    }
                    break;
            }
        }

        function onFocus() {
            // On tab-focus, show the control bar for a few seconds
            if (_controls && !_instreamModel && !_isMobile) {
                _controls.userActive();
            }
        }

        this.setupInstream = function (instreamModel) {
            this.instreamModel = _instreamModel = instreamModel;
            _instreamModel.on('change:controls', _onChangeControls, this);
            _instreamModel.on('change:state', _stateHandler, this);

            utils.addClass(_playerElement, 'jw-flag-ads');

            // Call Controls.userActivity to display the UI temporarily for the start of the ad
            if (_controls) {
                _controls.userActive();
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
            this.setAltText('');
            utils.removeClass(_playerElement, ['jw-flag-ads', 'jw-flag-ads-hide-controls']);
            _model.set('hideAdsControls', false);
            if (_model.getVideo) {
                const provider = _model.getVideo();
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

        this.getSafeRegion = function (includeCB) {
            const bounds = {
                x: 0,
                y: 0,
                width: _lastWidth || 0,
                height: _lastHeight || 0
            };

            if (_controls) {
                // Subtract controlbar from the bottom when using one
                includeCB = includeCB || !utils.exists(includeCB);
                if (includeCB) {
                    bounds.height -= _controls.controlbarHeight();
                }
            }

            return bounds;
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
                _controls.disable();
            }

            if (_instreamModel) {
                this.destroyInstream();
            }
            if (displayClickHandler) {
                displayClickHandler.destroy();
                displayClickHandler = null;
            }
            if (_logo) {
                _logo.destroy();
                _logo = null;
            }
            utils.clearCss(_model.get('id'));
        };
    }

    View.prototype.setControlsModule = function(Controls) {
        ControlsModule = Controls;
    };

    return View;
});
