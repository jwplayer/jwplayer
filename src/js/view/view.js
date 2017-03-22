define([
    'events/events',
    'events/states',
    'utils/backbone.events',
    'utils/helpers',
    'utils/underscore',
    'utils/active-tab',
    'utils/request-animation-frame',
    'view/breakpoint',
    'view/captionsrenderer',
    'view/logo',
    'view/preview',
    'view/title',
    'templates/player.html',
], function(events, states, Events, utils, _, activeTab, raf, setBreakpoint,
            CaptionsRenderer, Logo, Preview, Title, playerTemplate) {

    var _styles = utils.style;
    var _bounds = utils.bounds;
    var _isMobile = utils.isMobile();
    var _isIE = utils.isIE();
    var DOCUMENT_FULLSCREEN_EVENTS = [
        'fullscreenchange',
        'webkitfullscreenchange',
        'mozfullscreenchange',
        'MSFullscreenChange'
    ];

    // These must be assigned to variables to avoid illegal invocation
    var requestAnimationFrame = raf.requestAnimationFrame;
    var cancelAnimationFrame = raf.cancelAnimationFrame;

    return function View(_api, _model) {
        var _this = _.extend(this, Events, {
            isSetup: false,
            api: _api,
            model: _model
        });

        var _playerElement = utils.createElement(playerTemplate({ id: _model.get('id') }));
        var _videoLayer;
        var _preview;
        var _title;
        var _captionsRenderer;
        var _controls;
        var _logo;

        var _playerState;

        var _lastWidth;
        var _lastHeight;

        var _instreamModel;

        var _resizeMediaTimeout = -1;
        var _resizeContainerRequestId = -1;
        var _previewDisplayStateTimeout = -1;

        var _requestFullscreen =
            _playerElement.requestFullscreen ||
            _playerElement.webkitRequestFullscreen ||
            _playerElement.webkitRequestFullScreen ||
            _playerElement.mozRequestFullScreen ||
            _playerElement.msRequestFullscreen;
        var _exitFullscreen =
            document.exitFullscreen ||
            document.webkitExitFullscreen ||
            document.webkitCancelFullScreen ||
            document.mozCancelFullScreen ||
            document.msExitFullscreen;
        var _elementSupportsFullscreen = !!(_requestFullscreen && _exitFullscreen);

        var _focusFromClick = false;

        // Include the separate chunk that contains the @font-face definition.  Check webpackJsonjwplayer so we don't
        // run this in phantomjs because it breaks despite it working in browser and including files like we want it to.
        if (window.webpackJsonpjwplayer) {
            require('css/jwplayer.less');
        }

        function reasonInteraction() {
            return { reason: 'interaction' };
        }

        function handleBlur() {
            _focusFromClick = false;
            utils.removeClass(_playerElement, 'jw-no-focus');
        }

        function handleMouseUp(e) {
            if (e.target && e.target.blur) {
                e.target.blur();
            }
        }

        function handleMouseDown() {
            _focusFromClick = true;
            utils.addClass(_playerElement, 'jw-no-focus');
        }

        function handleFocus() {
            if (!_focusFromClick) {
                handleBlur();
            }

            // On tab-focus, show the control bar for a few seconds
            if (_controls && !_instreamModel && !_isMobile) {
                _controls.userActive();
            }
        }

        function _setContainerDimensions() {
            var inDOM = document.body.contains(_playerElement);
            var bounds = _bounds(_playerElement);
            var containerWidth = Math.round(bounds.width);
            var containerHeight = Math.round(bounds.height);

            cancelAnimationFrame(_resizeContainerRequestId);

            // If the container is the same size as before, return early
            if (containerWidth === _lastWidth && containerHeight === _lastHeight) {
                // Listen for player to be added to DOM
                if (!_lastWidth || !_lastHeight) {
                    _responsiveListener();
                }
                return;
            }
            // If we have bad values for either dimension, return early
            if (!containerWidth || !containerHeight) {
                // If we haven't established player size, try again
                if (!_lastWidth || !_lastHeight) {
                    _responsiveListener();
                }
                _model.set('inDom', inDOM);
                // Fire resize 0,0 if the player element is not in the DOM
                // This allows setup to complete even if element was removed from DOM
                if (!inDOM) {
                    _resized(containerWidth, containerHeight);
                }
                return;
            }

            _model.set('containerWidth', containerWidth);
            _model.set('containerHeight', containerHeight);
            _model.set('inDom', inDOM);

            var breakPoint = setBreakpoint(_playerElement, containerWidth, containerHeight);

            if (_controls) {
                _controls.resize(_model, breakPoint);
            }

            _resizeMedia(containerWidth, containerHeight);

            _captionsRenderer.resize();

            _resized(containerWidth, containerHeight);
        }

        function _resized(containerWidth, containerHeight) {
            _lastWidth = containerWidth;
            _lastHeight = containerHeight;
            _this.trigger(events.JWPLAYER_RESIZE, {
                width: containerWidth,
                height: containerHeight
            });
        }
        
        function _responsiveListener() {
            cancelAnimationFrame(_resizeContainerRequestId);
            _resizeContainerRequestId = requestAnimationFrame(_setContainerDimensions);
        }

        // Set global colors, used by related plugin
        // If a color is undefined simple-style-loader won't add their styles to the dom
        function insertGlobalColorClasses(activeColor, inactiveColor, playerId) {
            if (activeColor) {
                var activeColorSet = {
                    color: activeColor,
                    borderColor: activeColor,
                    stroke: activeColor
                };
                utils.css('#' + playerId + ' .jw-color-active', activeColorSet, playerId);
                utils.css('#' + playerId + ' .jw-color-active-hover:hover', activeColorSet, playerId);
            }
            if (inactiveColor) {
                var inactiveColorSet = {
                    color: inactiveColor,
                    borderColor: inactiveColor,
                    stroke: inactiveColor
                };
                utils.css('#' + playerId + ' .jw-color-inactive', inactiveColorSet, playerId);
                utils.css('#' + playerId + ' .jw-color-inactive-hover:hover', inactiveColorSet, playerId);
            }
        }


        this.onChangeSkin = function (model, newSkin) {
            utils.replaceClass(_playerElement, /jw-skin-\S+/, newSkin ? ('jw-skin-' + newSkin) : '');
        };


        this.handleColorOverrides = function () {
            var id = _model.get('id');

            function addStyle(elements, attr, value, extendParent) {
                /* if extendParent is true, bundle the first selector of
                 element string to the player element instead of defining it as a
                 child of the player element (default). i.e. #player.sel-1 .sel-2 vs. #player .sel-1 .sel-2 */
                elements = utils.prefix(elements, '#' + id + (extendParent ? '' : ' '));

                var o = {};
                o[attr] = value;
                utils.css(elements.join(', '), o, id);
            }

            // We can assume that the user will define both an active and inactive color because otherwise it doesn't look good
            var activeColor = _model.get('skinColorActive');
            var inactiveColor = _model.get('skinColorInactive');
            var backgroundColor = _model.get('skinColorBackground');

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
                    var backgroundColorGradient = 'transparent linear-gradient(180deg, ' +
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
            if (_isIE) {
                utils.addClass(_playerElement, 'jw-ie');
            }

            var width = _model.get('width');
            var height = _model.get('height');
            _styles(_playerElement, {
                width: width.toString().indexOf('%') > 0 ? width : (width + 'px'),
                height: height.toString().indexOf('%') > 0 ? height : (height + 'px')
            });

            this.handleColorOverrides();

            // Hide control elements until skin is loaded
            if (_model.get('skin-loading') === true) {
                utils.addClass(_playerElement, 'jw-flag-skin-loading');
                _model.once('change:skin-loading', function () {
                    utils.removeClass(_playerElement, 'jw-flag-skin-loading');
                });
            }

            _model.change('skin', this.onChangeSkin, this);

            _videoLayer = _playerElement.querySelector('.jw-media');

            var previewElem = _playerElement.querySelector('.jw-preview');
            _preview = new Preview(_model);
            _preview.setup(previewElem);

            var _titleElement = _playerElement.querySelector('.jw-title');
            _title = new Title(_model);
            _title.setup(_titleElement);

            _logo = new Logo(_model);
            _logo.setup(_playerElement);
            _logo.on(events.JWPLAYER_LOGO_CLICK, _logoClickHandler);
            _componentFadeListeners(_logo);

            // captions rendering
            _captionsRenderer = new CaptionsRenderer(_model);
            _captionsRenderer.setup(_playerElement.id, _model.get('captions'));

            // captions should be place behind controls, and not hidden when controls are hidden
            _playerElement.insertBefore(_captionsRenderer.element(), _title.element());

            // adds video tag to video layer
            _model.set('mediaContainer', _videoLayer);

            // Native fullscreen (coming through from the provider)
            _model.mediaController.on('fullscreenchange', _fullscreenChangeHandler);
            // DOM fullscreen
            for (var i = DOCUMENT_FULLSCREEN_EVENTS.length; i--;) {
                document.addEventListener(DOCUMENT_FULLSCREEN_EVENTS[i], _fullscreenChangeHandler, false);
            }

            window.removeEventListener('resize', _responsiveListener);
            window.addEventListener('resize', _responsiveListener, false);
            if (_isMobile) {
                window.removeEventListener('orientationchange', _responsiveListener);
                window.addEventListener('orientationchange', _responsiveListener, false);
            }

            _model.change('controls', _onChangeControls);

            _model.change('flashBlocked', _onChangeFlashBlocked);

            _api.onPlaylistComplete(_playlistCompleteHandler);
            _api.onPlaylistItem(_playlistItemHandler);

            // set initial state
            if (_model.get('stretching')) {
                _onStretchChange(_model, _model.get('stretching'));
            }
            // watch for changes
            _model.on('change:state', _stateHandler);
            _model.on('change:stretching', _onStretchChange);
            _model.on('change:fullscreen', _fullscreen);
            _model.on('change:errorEvent', _errorHandler);
            _model.on('change:hideAdsControls', function (model, val) {
                utils.toggleClass(_playerElement, 'jw-flag-ads-hide-controls', val);
            });

            var aspectratio = _model.get('aspectratio');
            if (aspectratio) {
                _setAspectMode(aspectratio);
            }

            _model.set('iFrame', utils.isIframe());
            _model.set('activeTab', activeTab());
            document.addEventListener('visibilitychange', _visibilityChangeListener, false);
            document.addEventListener('webkitvisibilitychange', _visibilityChangeListener, false);

            _playerElement.addEventListener('focus', handleFocus);
            _playerElement.addEventListener('blur', handleBlur);
            _playerElement.onmousedown = handleMouseDown;
            _playerElement.onmouseup = handleMouseUp;

            this.isSetup = true;
            _model.set('viewSetup', true);
            _model.set('inDom', document.body.contains(_playerElement));
        };

        this.init = function() {
            _resize(_model.get('width'), _model.get('height'));
            _stateHandler(_instreamModel || _model);
            _lastWidth = _lastHeight = null;
            _setContainerDimensions();
        };

        function _onStretchChange(model, newVal) {
            utils.replaceClass(_playerElement, /jw-stretch-\S+/, 'jw-stretch-' + newVal);
        }

        function _componentFadeListeners(comp) {
            if (!_isMobile && comp && comp.element()) {
                comp.element().addEventListener('mousemove', _overControlElement, false);
                comp.element().addEventListener('mouseout', _offControlElement, false);
            }
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

        function _overControlElement() {
            // Over controlbar, timeout resumed when off controlbar
            clearTimeout(_controls.activeTimeout);
        }

        function _offControlElement() {
            _controls.userActive();
        }

        function _onChangeFlashBlocked(model, isBlocked) {
            if (isBlocked) {
                if (_controls && _controls.rightClickMenu) {
                    _controls.rightClickMenu.destroy();
                }
                utils.addClass(_playerElement, 'jw-flag-flash-blocked');
            } else {
                if (_controls && _controls.rightClickMenu) {
                    _controls.rightClickMenu.setup(_model, _playerElement, _playerElement);
                }
                utils.removeClass(_playerElement, 'jw-flag-flash-blocked');
            }
        }

        var _onChangeControls = function (model, bool) {
            if (bool) {
                // ignore model that triggered this event and use current state model
                _stateHandler(_instreamModel || _model);

                if (_controls) {
                    var breakPoint = setBreakpoint(_playerElement, _lastWidth, _lastHeight);
                    _controls.resize(_model, breakPoint);
                }
            }

            utils.toggleClass(_playerElement, 'jw-flag-controls-disabled', !bool);
        };

        this.addControls = function (controls) {
            _controls = controls;

            var overlaysElement = _playerElement.querySelector('.jw-overlays');
            overlaysElement.addEventListener('mousemove', _userActivityCallback);

            controls.on('uiActivity', function(/* showing */) {
                _captionsRenderer.renderCues(true);
            });

            _logo.setup(controls.right);

            controls.enable(_api, _model, _videoLayer);
            
            _componentFadeListeners(controls.controlbar);

            _model.change('scrubbing', _dragging);
            _model.change('duration', _setLiveMode, this);
        };

        this.removeControls = function () {
            _logo.setup(_playerElement);

            if (_controls) {
                _controls.disable();
            }

            var overlay = document.querySelector('.jw-overlays');
            if (overlay) {
                overlay.removeEventListener('mousemove', _userActivityCallback);
            }

            utils.removeClass(_playerElement, 'jw-flag-touch');
            utils.clearCss(_model.get('id'));

            clearTimeout(_previewDisplayStateTimeout);
            clearTimeout(_resizeMediaTimeout);
        };

        // Perform the switch to fullscreen
        var _fullscreen = function (model, state) {

            // If it supports DOM fullscreen
            var provider = _model.getVideo();

            // Unmute the video so volume can be adjusted with native controls in fullscreen
            if (state && _controls && _model.get('autostartMuted')) {
                _controls.unmuteAutoplay(_api, _model);
            }

            if (_elementSupportsFullscreen) {
                if (state) {
                    _requestFullscreen.apply(_playerElement);
                } else {
                    _exitFullscreen.apply(document);
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

        function _resize(playerWidth, playerHeight, resetAspectMode) {
            var playerStyle = {
                width: playerWidth
            };

            // when jwResize is called remove aspectMode and force layout
            resetAspectMode = !!resetAspectMode;
            if (resetAspectMode) {
                _model.set('aspectratio', null);
                _setAspectMode(null);
                playerStyle.display = 'block';
            }

            if (utils.exists(playerWidth) && utils.exists(playerHeight)) {
                _model.set('width', playerWidth);
                _model.set('height', playerHeight);
            }

            if (!_model.get('aspectratio')) {
                playerStyle.height = playerHeight;
            }

            _styles(_playerElement, playerStyle);

            // pass width, height from jwResize if present
            _resizeMedia(playerWidth, playerHeight);
        }

        function _setAspectMode(aspectratio) {
            utils.toggleClass(_playerElement, 'jw-flag-aspect-mode', !!aspectratio);
            var aspectRatioContainer = _playerElement.querySelector('.jw-aspect');
            _styles(aspectRatioContainer, {
                paddingTop: aspectratio || null
            });
        }

        function _resizeMedia(mediaWidth, mediaHeight) {
            if (!mediaWidth || isNaN(1 * mediaWidth)) {
                if (!_videoLayer) {
                    return;
                }
                mediaWidth = _lastWidth || _videoLayer.clientWidth;
            }
            if (!mediaHeight || isNaN(1 * mediaHeight)) {
                if (!_videoLayer) {
                    return;
                }
                mediaHeight = _lastHeight || _videoLayer.clientHeight;
            }

            if (_preview) {
                _preview.resize(mediaWidth, mediaHeight, _model.get('stretching'));
            }

            var provider = _model.getVideo();
            if (!provider) {
                return;
            }
            var transformScale = provider.resize(mediaWidth, mediaHeight, _model.get('stretching'));

            // poll resizing if video is transformed
            if (transformScale) {
                clearTimeout(_resizeMediaTimeout);
                _resizeMediaTimeout = setTimeout(_resizeMedia, 250);
            }
        }

        this.resize = function (playerWidth, playerHeight) {
            var resetAspectMode = true;
            _resize(playerWidth, playerHeight, resetAspectMode);
            _setContainerDimensions();
        };
        this.resizeMedia = _resizeMedia;

        /**
         * Return whether or not we're in native fullscreen
         */
        function _isNativeFullscreen() {
            if (_elementSupportsFullscreen) {
                var fsElement = document.fullscreenElement ||
                    document.webkitCurrentFullScreenElement ||
                    document.mozFullScreenElement ||
                    document.msFullscreenElement;
                return !!(fsElement && fsElement.id === _model.get('id'));
            }
            // if player element view fullscreen not available, return video fullscreen state
            return _instreamModel ? _instreamModel.getVideo().getFullScreen() :
                _model.getVideo().getFullScreen();
        }


        function _fullscreenChangeHandler(event) {
            var modelState = _model.get('fullscreen');
            var newState = (event.jwstate !== undefined) ? event.jwstate : _isNativeFullscreen();

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
            if (fullscreenState) {
                utils.addClass(playerElement, 'jw-flag-fullscreen');
                _styles(document.body, {
                    'overflow-y': 'hidden'
                });

                // On going fullscreen we want the control bar to fade after a few seconds
                _controls.userActive();
            } else {
                utils.removeClass(playerElement, 'jw-flag-fullscreen');
                _styles(document.body, {
                    'overflow-y': ''
                });
            }

            _resizeMedia();
            _responsiveListener();
        }

        function _userActivityCallback(/* event */) {
            _controls.userActive();
        }

        function _playlistCompleteHandler() {
            _api.setFullscreen(false);
        }

        function _playlistItemHandler() {
            // update display title
            _onMediaTypeChange(_model, _model.mediaModel.get('mediaType'));
            _model.mediaModel.on('change:mediaType', _onMediaTypeChange, this);
        }

        function _onMediaTypeChange(model, val) {
            var isAudioFile = (val === 'audio');
            var provider = _model.getVideo();
            var isFlash = (provider && provider.getName().name.indexOf('flash') === 0);

            utils.toggleClass(_playerElement, 'jw-flag-media-audio', isAudioFile);

            if (isAudioFile && !isFlash) {
                // Put the preview element before the media element in order to display browser captions
                _playerElement.insertBefore(_preview.el, _videoLayer);
            } else {
                // Put the preview element before the captions element to display captions with the captions renderer
                _playerElement.insertBefore(_preview.el, _captionsRenderer.element());
            }
        }

        function _setLiveMode(model, duration) {
            var minDvrWindow = model.get('minDvrWindow');
            var streamType = utils.streamType(duration, minDvrWindow);
            var live = (streamType === 'LIVE');

            model.set('streamType', streamType);
            utils.toggleClass(_playerElement, 'jw-flag-live', live);
            _this.setAltText((live) ? model.get('localization').liveBroadcast : '');
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

        function _updateStateClass() {
            utils.replaceClass(_playerElement, /jw-state-\S+/, 'jw-state-' + _playerState);
        }

        function _stateHandler(model) {
            if (!_model.get('viewSetup')) {
                return;
            }

            _playerState = model.get('state');

            var instreamState = null;
            if (_instreamModel) {
                instreamState = _playerState;
            }
            if (_controls) {
                _controls.instreamState = instreamState;
            }

            // Throttle all state change UI updates except for play to prevent iOS 10 animation bug
            _cancelDelayResize(_previewDisplayStateTimeout);

            if (_playerState === states.PLAYING) {
                _stateUpdate(model, _playerState);
            } else {
                _previewDisplayStateTimeout = requestAnimationFrame(function () {
                    _stateUpdate(model, _playerState);
                });
            }
            if (_playerState !== states.PAUSED && utils.hasClass(_playerElement, 'jw-flag-controls-hidden')) {
                utils.removeClass(_playerElement, 'jw-flag-controls-hidden');
            }
        }

        function _stateUpdate(model, state) {
            utils.toggleClass(_playerElement, 'jw-flag-dragging', model.get('scrubbing'));
            _updateStateClass();

            // player display
            switch (state) {
                case states.PLAYING:
                    _resizeMedia();
                    break;
                default:
                    break;
            }
        }

        function _dragging(model) {
            _stateHandler(model);
        }

        function _visibilityChangeListener() {
            _model.set('activeTab', activeTab());
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
            if (_controls) {
                _controls.controlbar.setAltText(text);
            }
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
                var provider = _model.getVideo();
                provider.setContainer(_videoLayer);
            }
            _setLiveMode(_model, _model.get('duration'));
            // reset display click handler
            _controls.displayClick.revertAlternateClickHandlers();
        };

        this.addCues = function (cues) {
            if (_controls) {
                _controls.controlbar.addCues(cues);
            }
        };

        this.clickHandler = function () {
            return _controls.displayClick;
        };

        this.getContainer = this.element = function () {
            return _playerElement;
        };

        this.controlsContainer = function() {
            if (_controls) {
                return _controls.element;
            }
            // return controls stand-in element not in DOM
            return document.createElement('div');
        };

        this.getSafeRegion = function (includeCB) {
            var bounds = {
                x: 0,
                y: 0,
                width: _lastWidth || 0,
                height: _lastHeight || 0
            };

            if (_controls) {
                // If we are using a dock, subtract that from the top
                var dockButtons = _model.get('dock');
                if (dockButtons && dockButtons.length) {
                    bounds.y = _controls.dock.element().clientHeight;
                    bounds.height -= bounds.y;
                }

                // Subtract controlbar from the bottom when using one
                includeCB = includeCB || !utils.exists(includeCB);
                if (includeCB) {
                    bounds.height -= _controls.controlbar.element().clientHeight;
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
            this.isSetup = false;
            this.off();
            _cancelDelayResize(_previewDisplayStateTimeout);
            clearTimeout(_resizeMediaTimeout);
            window.removeEventListener('resize', _responsiveListener);
            window.removeEventListener('orientationchange', _responsiveListener);
            document.removeEventListener('visibilitychange', _visibilityChangeListener);
            for (var i = DOCUMENT_FULLSCREEN_EVENTS.length; i--;) {
                document.removeEventListener(DOCUMENT_FULLSCREEN_EVENTS[i], _fullscreenChangeHandler, false);
            }
            if (_model.mediaController) {
                _model.mediaController.off('fullscreenchange', _fullscreenChangeHandler);
            }
            if (_controls) {
                _controls.disable();
            }
            _playerElement.removeEventListener('focus', handleFocus);
            _playerElement.removeEventListener('blur', handleBlur);
            _playerElement.onmousedown = null;
            _playerElement.onmouseup = null;

            if (_instreamModel) {
                this.destroyInstream();
            }
            if (_logo) {
                _logo.destroy();
                _logo = null;
            }
            utils.clearCss(_model.get('id'));
        };
    };
});
