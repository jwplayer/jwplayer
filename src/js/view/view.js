define([
    'utils/helpers',
    'events/events',
    'utils/backbone.events',
    'utils/constants',
    'events/states',
    'view/captionsrenderer',
    'view/clickhandler',
    'view/rewind-display-icon',
    'view/play-display-icon',
    'view/next-display-icon',
    'view/dock',
    'view/logo',
    'view/controlbar',
    'view/preview',
    'view/rightclick',
    'view/title',
    'view/components/nextuptooltip',
    'utils/underscore',
    'templates/player.html',
    'view/breakpoint',
    'view/components/button',
    'view/display-container',
], function(utils, events, Events, Constants, states,
            CaptionsRenderer, ClickHandler, RewindDisplayIcon, PlayDisplayIcon, NextDisplayIcon, Dock, Logo,
            Controlbar, Preview, RightClick, Title, NextUpToolTip, _, playerTemplate, setBreakpoint, button, DisplayContainer) {

    var _styles = utils.style,
        _bounds = utils.bounds,
        _isMobile = utils.isMobile(),
        DOCUMENT_FULLSCREEN_EVENTS = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange'
        ];

    var View = function(_api, _model) {
        var _playerElement,
            _controlsLayer,
            _controlsTimeout = -1,
            _timeoutDuration = _isMobile ? 4000 : 2000,
            CONTOLBAR_ONLY_HEIGHT = 44,
            _videoLayer,
            _lastWidth,
            _lastHeight,
            _instreamModel,
            _controlbar,
            _preview,
            _displayClickHandler,
            _castDisplay,
            _dock,
            _logo,
            _title,
            _nextuptooltip,
            _mute,
            _captionsRenderer,
            _showing = false,
            _rightClickMenu,
            _resizeMediaTimeout = -1,
            _resizeContainerRequestId = -1,
            // Function that delays the call of _setContainerDimensions so that the page has finished repainting.
            _delayResize = window.requestAnimationFrame ||
                function(rafFunc) {
                    return window.setTimeout(rafFunc, 17);
                },
            // Function that prevents multiple calls of _setContainerDimensions when not necessary.
            _cancelDelayResize = window.cancelAnimationFrame || window.clearTimeout,
            _previewDisplayStateTimeout = -1,
            _currentState,
            _originalContainer,

            // view fullscreen methods and ability
            _requestFullscreen,
            _exitFullscreen,
            _elementSupportsFullscreen = false,

            // Used to differentiate tab focus events from click events
            _focusFromClick = false,

            // Colors written into this canvas to set maui color overrides
            _canvasColorContext,

            _this = _.extend(this, Events);

        // Include the separate chunk that contains the @font-face definition.  Check webpackJsonjwplayer so we don't
        // run this in phantomjs because it breaks despite it working in browser and including files like we want it to.
        if (window.webpackJsonpjwplayer) {
            require('css/jwplayer.less');
        }

        this.model = _model;
        this.api = _api;

        _playerElement = utils.createElement(playerTemplate({id: _model.get('id')}));
        if (utils.isIE()) {
            utils.addClass(_playerElement, 'jw-ie');
        }

        var width = _model.get('width'),
            height = _model.get('height');

        _styles(_playerElement, {
            width: width.toString().indexOf('%') > 0 ? width : (width+ 'px'),
            height: height.toString().indexOf('%') > 0 ? height : (height + 'px')
        });

        _requestFullscreen =
            _playerElement.requestFullscreen ||
            _playerElement.webkitRequestFullscreen ||
            _playerElement.webkitRequestFullScreen ||
            _playerElement.mozRequestFullScreen ||
            _playerElement.msRequestFullscreen;
        _exitFullscreen =
            document.exitFullscreen ||
            document.webkitExitFullscreen ||
            document.webkitCancelFullScreen ||
            document.mozCancelFullScreen ||
            document.msExitFullscreen;
        _elementSupportsFullscreen = _requestFullscreen && _exitFullscreen;

        function reasonInteraction() {
            return {reason: 'interaction'};
        }

        function adjustSeek(amount) {
            var min = 0;
            var max = _model.get('duration');
            var position = _model.get('position');
            if (_model.get('streamType') === 'DVR') {
                min = max;
                max = Math.max(position, Constants.dvrSeekLimit);
            }
            var newSeek = utils.between(position + amount, min, max);
            _api.seek(newSeek, reasonInteraction());
        }

        function adjustVolume(amount) {
            var newVol = utils.between(_model.get('volume') + amount, 0, 100);
            _api.setVolume(newVol);
        }

        function allowKeyHandling(evt) {
            // If Meta keys return
            if (evt.ctrlKey || evt.metaKey) {
                return false;
            }

            // Controls may be disabled during share screens, or via API
            if (!_model.get('controls')) {
                return false;
            }
            return true;
        }

        function handleKeydown(evt) {
            if (!allowKeyHandling(evt)) {
                // Let event bubble upwards
                return true;
            }

            // On keypress show the controlbar for a few seconds
            if (!_instreamModel) {
                _userActivity();
            }

            switch (evt.keyCode) {
                case 27: // Esc
                    _api.setFullscreen(false);
                    break;
                case 13: // enter
                case 32: // space
                    _api.play(reasonInteraction());
                    break;
                case 37: // left-arrow, if not adMode
                    if (!_instreamModel) {
                        adjustSeek(-5);
                    }
                    break;
                case 39: // right-arrow, if not adMode
                    if (!_instreamModel) {
                        adjustSeek(5);
                    }
                    break;
                case 38: // up-arrow
                    adjustVolume(10);
                    break;
                case 40: // down-arrow
                    adjustVolume(-10);
                    break;
                case 67: // c-key
                    var captionsList = _api.getCaptionsList();
                    var listLength = captionsList.length;
                    if (listLength) {
                        var nextIndex = (_api.getCurrentCaptions() + 1) % listLength;
                        _api.setCurrentCaptions(nextIndex);
                    }
                    break;
                case 77: // m-key
                    _api.setMute();
                    break;
                case 70: // f-key
                    _api.setFullscreen();
                    break;
                default:
                    if (evt.keyCode >= 48 && evt.keyCode <= 59) {
                        // if 0-9 number key, move to n/10 of the percentage of the video
                        var number = evt.keyCode - 48;
                        var newSeek = (number / 10) * _model.get('duration');
                        _api.seek(newSeek, reasonInteraction());
                    }
                    break;
            }

            if (/13|32|37|38|39|40/.test(evt.keyCode)) {
                // Prevent keypresses from scrolling the screen
                evt.preventDefault();
                return false;
            }
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
            if (!_instreamModel && !_isMobile) {
                _userActivity();
            }
        }

        function _setContainerDimensions() {
            var bounds = _bounds(_playerElement),
                containerWidth = Math.round(bounds.width),
                containerHeight = Math.round(bounds.height);

            _cancelDelayResize(_resizeContainerRequestId);

            // If the container is the same size as before, return early
            if (containerWidth === _lastWidth && containerHeight === _lastHeight) {
                return;
            }
            // If we have bad values for either dimension, return early
            if (!containerWidth || !containerHeight) {
                // If we haven't established player size, try again
                if (!_lastWidth || !_lastHeight) {
                    _responsiveListener();
                }
                return;
            }

            _lastWidth = containerWidth;
            _lastHeight = containerHeight;
            clearTimeout(_resizeMediaTimeout);
            _resizeMediaTimeout = setTimeout(_resizeMedia, 50);

            _model.set('containerWidth', containerWidth);
            _model.set('containerHeight', containerHeight);
            var breakPoint = setBreakpoint(_playerElement, containerWidth, containerHeight);
            _checkAudioMode(_model.get('height'));
            _setTimesliderFlags(breakPoint, _model.get('audioMode'));

            _this.trigger(events.JWPLAYER_RESIZE, {
                width: containerWidth,
                height: containerHeight
            });
        }


        function _setTimesliderFlags(breakPoint, audioMode) {
            var smallPlayer = breakPoint < 2;
            var timeSliderAboveConfig = _model.get('timeSliderAbove');
            var timeSliderAbove = !audioMode &&
                (timeSliderAboveConfig !== false) && (timeSliderAboveConfig || smallPlayer);
            utils.toggleClass(_playerElement, 'jw-flag-small-player', smallPlayer);
            utils.toggleClass(_playerElement, 'jw-flag-audio-player', audioMode);
            utils.toggleClass(_playerElement, 'jw-flag-time-slider-above', timeSliderAbove);
        }

        function _responsiveListener() {
            _cancelDelayResize(_resizeContainerRequestId);
            _resizeContainerRequestId = _delayResize(_setContainerDimensions);
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


        this.onChangeSkin = function(model, newSkin) {
            utils.replaceClass(_playerElement, /jw-skin-\S+/, newSkin ? ('jw-skin-'+newSkin) : '');
        };


        this.handleColorOverrides = function() {
            var id = _model.get('id');

            function getRgba(color, opacity) {
                var data;

                if (!_canvasColorContext) {
                    var canvas = document.createElement('canvas');

                    canvas.height = 1;
                    canvas.width = 1;

                    _canvasColorContext = canvas.getContext('2d');
                }

                _canvasColorContext.clearRect(0, 0, 1, 1);
                _canvasColorContext.fillStyle = color;
                _canvasColorContext.fillRect(0, 0, 1, 1);

                data = _canvasColorContext.getImageData(0, 0, 1, 1).data;

                return 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' + opacity + ')';
            }

            function addStyle(elements, attr, value, extendParent) {
                if (!value) {
                    return;
                }

                /* if extendParent is true, bundle the first selector of
                element string to the player element instead of defining it as a
                child of the player element (default). i.e. #player.sel-1 .sel-2 vs. #player .sel-1 .sel-2 */
                elements = utils.prefix(elements, '#' + id + (extendParent ? '' : ' '));

                var o = {};
                o[attr] = value;
                utils.css(elements.join(', '), o, id);
            }

            // We can assume that the user will define both an active and inactive color because otherwise it doesn't
            // look good.
            var activeColor = _model.get('skinColorActive'),
                inactiveColor = _model.get('skinColorInactive'),
                backgroundColor = _model.get('skinColorBackground'),
                backgroundColorGradient = backgroundColor ? 'transparent linear-gradient(180deg, ' +
                    getRgba(backgroundColor, 0) + ' 0%, ' +
                    getRgba(backgroundColor, 0.25) + ' 30%, ' +
                    getRgba(backgroundColor, 0.4) + ' 70%, ' +
                    getRgba(backgroundColor, 0.5) + ') 100%' : '';

            // These will use standard style names for CSS since they are added directly to a style sheet
            // Using background instead of background-color so we don't have to clear gradients with background-image

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

            // Apply background color
            addStyle([
                // general background color
                '.jw-background-color'
            ], 'background', 'none ' + backgroundColor);

            addStyle([
                // for small player, set the control bar gradient to the config background color
                '.jw-flag-time-slider-above .jw-background-color.jw-controlbar'
            ], 'background', 'none ' + backgroundColorGradient, true);

            // remove the config background on time slider
            addStyle([
                '.jw-flag-time-slider-above .jw-background-color.jw-slider-time'
            ], 'background', 'transparent', true);

            insertGlobalColorClasses(activeColor, inactiveColor, id);
        };

        this.setup = function() {

            this.handleColorOverrides();

            // Hide control elements until skin is loaded
            if (_model.get('skin-loading') === true) {
                utils.addClass(_playerElement, 'jw-flag-skin-loading');
                _model.once('change:skin-loading', function() {
                    utils.removeClass(_playerElement, 'jw-flag-skin-loading');
                });
            }

            this.onChangeSkin(_model, _model.get('skin'), '');
            _model.on('change:skin', this.onChangeSkin, this);

            _videoLayer = _playerElement.getElementsByClassName('jw-media')[0];

            _controlsLayer = _playerElement.getElementsByClassName('jw-controls')[0];

            var previewElem = _playerElement.getElementsByClassName('jw-preview')[0];
            _preview = new Preview(_model);
            _preview.setup(previewElem);

            var _titleElement = _playerElement.getElementsByClassName('jw-title')[0];
            _title = new Title(_model);
            _title.setup(_titleElement);

            _setupControls();

            // call user activity to set timeout for control to fade
            _userActivity();

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

            _model.on('change:errorEvent', _errorHandler);

            _model.on('change:controls', _onChangeControls);
            _onChangeControls(_model, _model.get('controls'));
            _model.on('change:state', _stateHandler);
            _model.on('change:streamType', _setLiveMode, this);

            _model.on('change:flashBlocked', _onChangeFlashBlocked);
            _onChangeFlashBlocked(_model, _model.get('flashBlocked'));

            _api.onPlaylistComplete(_playlistCompleteHandler);
            _api.onPlaylistItem(_playlistItemHandler);

            _model.on('change:hideAdsControls', function(model, val) {
                utils.toggleClass(_playerElement, 'jw-flag-ads-hide-controls', val);
            });

            // set initial state
            if(_model.get('stretching')){
                _onStretchChange(_model, _model.get('stretching'));
            }
            // watch for changes
            _model.on('change:stretching', _onStretchChange);

            _stateHandler(_model, states.IDLE);
            _model.on('change:fullscreen', _fullscreen);

            _componentFadeListeners(_controlbar);
            _componentFadeListeners(_logo);

            var aspectratio = _model.get('aspectratio');
            if (aspectratio) {
                utils.addClass(_playerElement, 'jw-flag-aspect-mode');
                var aspectRatioContainer = _playerElement.getElementsByClassName('jw-aspect')[0];
                _styles(aspectRatioContainer, {
                    paddingTop: aspectratio
                });
            }

            // This setTimeout allows the player to actually get embedded into the player
            _api.on(events.JWPLAYER_READY, function() {
                _resize(_model.get('width'), _model.get('height'));
                _setContainerDimensions();
            });
        };

        function _onStretchChange(model, newVal) {
            utils.replaceClass(_playerElement, /jw-stretch-\S+/, 'jw-stretch-' + newVal);
        }

        function _componentFadeListeners(comp) {
            if (comp && !_isMobile) {
                comp.element().addEventListener('mousemove', _overControlElement, false);
                comp.element().addEventListener('mouseout', _offControlElement, false);
            }
        }

        function _touchHandler() {
            var state = _model.get('state');

            if (_model.get('controls') &&
                ((state === states.IDLE ||state === states.COMPLETE) ||
                (_instreamModel && _instreamModel.get('state') === states.PAUSED))) {
                _api.play(reasonInteraction());
            }
            if (state === states.PAUSED) {
                // Toggle visibility of the controls when tapping the media
                _toggleControls();
            } else {
                // Toggle visibility of the controls when tapping the media or play icon
                if(!_showing) {
                    _userActivity();
                } else {
                    _userInactive();
                }
            }
        }

        function _logoClickHandler(evt){
            if (!evt.link) {
                //_togglePlay();
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
            clearTimeout(_controlsTimeout);
        }

        function _offControlElement() {
            _userActivity();
        }

        function forward(evt) {
            _this.trigger(evt.type, evt);
        }

        function _onChangeFlashBlocked(model, isBlocked) {
            if (isBlocked) {
                if (_rightClickMenu) {
                    _rightClickMenu.destroy();
                }
                utils.addClass(_playerElement, 'jw-flag-flash-blocked');
            } else {
                if (_rightClickMenu) {
                    _rightClickMenu.setup(_model, _playerElement, _playerElement);
                }
                utils.removeClass(_playerElement,'jw-flag-flash-blocked');
            }
        }

        var _onChangeControls = function(model, bool) {
            if (bool) {
                var state = (_instreamModel) ? _instreamModel.get('state') : _model.get('state');
                // model may be instream or normal depending on who triggers this
                _stateHandler(model, state);
            }

            utils.toggleClass(_playerElement, 'jw-flag-controls-disabled', !bool);
        };

        function _doubleClickFullscreen() {
            if(_model.get('controls')) {
                _api.setFullscreen();
            }
        }

        function _setupControls() {
            var overlaysElement = _playerElement.getElementsByClassName('jw-overlays')[0];
            overlaysElement.addEventListener('mousemove', _userActivityCallback);

            _displayClickHandler = new ClickHandler(_model, _videoLayer, {useHover: true});
            _displayClickHandler.on('click', function() {
                forward({type : events.JWPLAYER_DISPLAY_CLICK});
                if(_model.get('controls')) {
                    _api.play(reasonInteraction());
                }
            });
            _displayClickHandler.on('tap', function() {
                forward({type : events.JWPLAYER_DISPLAY_CLICK});
                _touchHandler();
            });
            _displayClickHandler.on('doubleClick', _doubleClickFullscreen);
            _displayClickHandler.on('move', _userActivityCallback);
            _displayClickHandler.on('over', _userActivityCallback);

            _controlsLayer.appendChild(createDisplayContainer());

            _dock = new Dock(_model);

            _logo = new Logo(_model);
            _logo.on(events.JWPLAYER_LOGO_CLICK, _logoClickHandler);

            var rightside = document.createElement('div');
            rightside.className = 'jw-controls-right jw-reset';
            _logo.setup(rightside);
            rightside.appendChild(_dock.element());
            _controlsLayer.appendChild(rightside);

            // captions rendering
            _captionsRenderer = new CaptionsRenderer(_model);
            _captionsRenderer.setup(_playerElement.id, _model.get('captions'));

            // captions should be place behind controls, and not hidden when controls are hidden
            _controlsLayer.parentNode.insertBefore(_captionsRenderer.element(), _title.element());

            // Touch UI mode when we're on mobile and we have a percentage height or we can fit the large UI in
            var height = _model.get('height');
            if (_isMobile && (typeof height === 'string' || height >= CONTOLBAR_ONLY_HEIGHT)){
                utils.addClass(_playerElement, 'jw-flag-touch');
            } else {
                _rightClickMenu = new RightClick();
                _rightClickMenu.setup(_model, _playerElement, _playerElement);
            }

            _controlbar = new Controlbar(_api, _model);
            _controlbar.on(events.JWPLAYER_USER_ACTION, _userActivityCallback);
            _model.on('change:scrubbing', _dragging);

            // Ignore iOS9. Muted autoplay is supported in iOS 10+
            if (_model.autoStartOnMobile()) {
                _mute = button('jw-autostart-mute jw-off', _autoplayUnmute, _model.get('localization').volume);
                _mute.show();
                _controlsLayer.appendChild(_mute.element());
                // Set mute state in the controlbar
                _controlbar.renderVolume(true, _model.get('volume'));
                // Hide the controlbar until the autostart flag is removed
                utils.addClass(_playerElement, 'jw-flag-autostart');
                _model.set('autostartMuted', true);
                _model.on('change:autostartFailed', _autoplayUnmute);
                _model.on('change:autostartMuted', _autoplayUnmute);
                _model.on('change:mute', _autoplayUnmute);
            }

            _nextuptooltip = new NextUpToolTip(_model, _api, _controlbar.elements.next, _playerElement);
            _nextuptooltip.setup();

            // NextUp needs to be behind the controlbar to not block other tooltips
            _controlsLayer.appendChild(_nextuptooltip.element());
            _controlsLayer.appendChild(_controlbar.element());

            _playerElement.addEventListener('focus', handleFocus);
            _playerElement.addEventListener('blur', handleBlur);
            _playerElement.addEventListener('keydown', handleKeydown);
            _playerElement.onmousedown = handleMouseDown;
            _playerElement.onmouseup = handleMouseUp;
        }

        // Perform the switch to fullscreen
        var _fullscreen = function(model, state) {

            // If it supports DOM fullscreen
            var provider = _model.getVideo();

            // Unmute the video so volume can be adjusted with native controls in fullscreen
            if (state && _model.get('autostartMuted')) {
                _autoplayUnmute();
            }

            if (_elementSupportsFullscreen) {
                if (state) {
                    _requestFullscreen.apply(_playerElement);
                } else {
                    _exitFullscreen.apply(document);
                }
                _toggleDOMFullscreen(_playerElement, state);
            } else {
                if (utils.isIE()) {
                    _toggleDOMFullscreen(_playerElement, state);
                } else {
                    // else use native fullscreen
                    if (_instreamModel && _instreamModel.getVideo()) {
                       _instreamModel.getVideo().setFullscreen(state);
                    }
                    provider.setFullscreen(state);
                }
            }
            // pass fullscreen state to Flash provider
            // provider.getName() is the same as _api.getProvider() or _model.get('provider')
            if (provider && provider.getName().name.indexOf('flash') === 0) {
                provider.setFullscreen(state);
            }
        };

        /**
         * Resize the player
         */
        function _resize(width, height, resetAspectMode) {
            var className = _playerElement.className,
                playerStyle;

            // when jwResize is called remove aspectMode and force layout
            resetAspectMode = !!resetAspectMode;
            if (resetAspectMode) {
                className = className.replace(/\s*aspectMode/, '');
                if (_playerElement.className !== className) {
                    _playerElement.className = className;
                }
                _styles(_playerElement, {
                    display: 'block'
                }, resetAspectMode);
            }

            if (utils.exists(width) && utils.exists(height)) {
                _model.set('width', width);
                _model.set('height', height);
            }

            playerStyle = {
                width: width
            };
            if (!utils.hasClass(_playerElement, 'jw-flag-aspect-mode')) {
                playerStyle.height = height;
            }

            if (_model.get('aspectratio')) {
                _resizeAspectModeCaptions();
            }

            _styles(_playerElement, playerStyle, true);

            _checkAudioMode(height);

            // pass width, height from jwResize if present
            _resizeMedia(width, height);
        }

        function _checkAudioMode(height) {
            var audioMode = _isAudioMode(height);
            if (_controlbar) {
                if (!audioMode) {
                    var model = _instreamModel ? _instreamModel : _model;
                    _stateHandler(model, model.get('state'));
                }
            }
            _model.set('audioMode', audioMode);
        }

        function _isAudioMode(height) {
            if (_model.get('aspectratio')) {
                return false;
            }
            if (_.isString(height) && height.indexOf('%') > -1) {
                return false;
            }

            // Coerce into Number (don't parse out CSS units)
            var checkHeight = (height * 1) || null;
            checkHeight = (_.isNumber(checkHeight) ? checkHeight : _model.get('containerHeight'));
            if (!checkHeight) {
                return false;
            }

            return _isControlBarOnly(checkHeight);
        }

        function _isControlBarOnly(verticalPixels) {
            // 1.75 so there's a little wiggle room on mobile for the large UI to fit in
            return verticalPixels && verticalPixels <= CONTOLBAR_ONLY_HEIGHT;
        }

        function _resizeMedia(width, height) {
            if (!width || isNaN(Number(width))) {
                if (!_videoLayer) {
                    return;
                }
                width = _videoLayer.clientWidth;
            }
            if (!height || isNaN(Number(height))) {
                if (!_videoLayer) {
                    return;
                }
                height = _videoLayer.clientHeight;
            }

            if (_preview) {
                _preview.resize(width, height, _model.get('stretching'));
            }

            var provider = _model.getVideo();
            if (!provider) {
                return;
            }
            var transformScale = provider.resize(width, height, _model.get('stretching'));

            // poll resizing if video is transformed
            if (transformScale) {
                clearTimeout(_resizeMediaTimeout);
                _resizeMediaTimeout = setTimeout(_resizeMedia, 250);
            }

            if (_model.get('aspectratio')) {
                _resizeAspectModeCaptions();
            }

            _captionsRenderer.resize();
        }

        function _autoplayUnmute () {
            var autostartSucceeded = !_model.get('autostartFailed');
            var mute = _model.get('mute');

            // If autostart succeeded, it means the user has chosen to unmute the video,
            // so we should update the model, setting mute to false
            if (autostartSucceeded) {
                mute = false;
            }
            _model.off('change:autostartFailed', _autoplayUnmute);
            _model.off('change:mute', _autoplayUnmute);
            _model.off('change:autostartMuted', _autoplayUnmute);
            _model.set('autostartFailed', undefined);
            _model.set('autostartMuted', undefined);
            _api.setMute(mute);
            // the model's mute value may not have changed. ensure the controlbar's mute button is in the right state
            _controlbar.renderVolume(mute, _model.get('volume'));
            _mute.hide();
            utils.removeClass(_playerElement, 'jw-flag-autostart');
        }

        this.resize = function(width, height) {
            var resetAspectMode = true;
            _resize(width, height, resetAspectMode);
            _setContainerDimensions();
        };
        this.resizeMedia = _resizeMedia;

        this.reset = function(){
            if (document.contains(_playerElement)) {
                _playerElement.parentNode.replaceChild(_originalContainer, _playerElement);
            }
            utils.emptyElement(_playerElement);
        };

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
            return  _instreamModel ? _instreamModel.getVideo().getFullScreen() :
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
                _userActivity();
            } else {
                utils.removeClass(playerElement, 'jw-flag-fullscreen');
                _styles(document.body, {
                    'overflow-y': ''
                });
            }

            _resizeMedia();
            _responsiveListener();
        }

        function _userInactive() {
            _showing = false;

            clearTimeout(_controlsTimeout);
            _controlbar.hideComponents();
            utils.addClass(_playerElement, 'jw-flag-user-inactive');
            _captionsRenderer.renderCues(true);
        }

        function _userActivityCallback(/* event */) {
            _userActivity();
        }

        function _userActivity(timeout) {
            if (!_showing){
                utils.removeClass(_playerElement, 'jw-flag-user-inactive');
                _captionsRenderer.renderCues(true);
            }

            _showing = true;

            clearTimeout(_controlsTimeout);
            _controlsTimeout = setTimeout(_userInactive, timeout || _timeoutDuration);
        }

        function _toggleControls() {
            // Do not add mobile toggle "jw-flag-controls-hidden" in these cases
            if  (_instreamModel ||
                _model.get('castActive') ||
                (_model.mediaModel && _model.mediaModel.get('mediaType') === 'audio')) {
                return;
            }
            utils.toggleClass(_playerElement, 'jw-flag-controls-hidden');
            _captionsRenderer.renderCues(true);
        }

        function _playlistCompleteHandler() {
            _api.setFullscreen(false);
        }

        function _playlistItemHandler() {
            // update display title
            if (_castDisplay) {
                _castDisplay.setState(_model.get('state'));
            }
            _onMediaTypeChange(_model, _model.mediaModel.get('mediaType'));
            _model.mediaModel.on('change:mediaType', _onMediaTypeChange, this);
        }

        function _onMediaTypeChange(model, val) {
            var isAudioFile = (val ==='audio');
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

        function _setLiveMode(model, streamType){
            var live = (streamType === 'LIVE');
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
            utils.replaceClass(_playerElement, /jw-state-\S+/, 'jw-state-' + _currentState);
        }

        function _stateHandler(model, state) {
            _currentState = state;
            // Throttle all state change UI updates except for play to prevent iOS 10 animation bug
            clearTimeout(_previewDisplayStateTimeout);

            if (state === states.PLAYING) {
                _stateUpdate(model, state);
            } else {
                _previewDisplayStateTimeout = setTimeout(function() {
                    _stateUpdate(model, state);
                }, 33);
            }
            if (state !== states.PAUSED && utils.hasClass(_playerElement, 'jw-flag-controls-hidden')) {
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
            }
        }

        function _dragging(model) {
            _stateHandler(model, model.get('state'));
        }

        function _resizeAspectModeCaptions() {
            var aspectRatioContainer = _playerElement.getElementsByClassName('jw-aspect')[0];
            _captionsRenderer.setContainerHeight(aspectRatioContainer.offsetHeight);
        }

        function createDisplayContainer() {
          var displayContainer = new DisplayContainer();
          var rewindDisplayIcon = new RewindDisplayIcon(_model, _api);
          var playDisplayIcon = createPlayDisplayIcon();
          var nextDisplayIcon = new NextDisplayIcon(_model, _api);

          displayContainer.addButton(rewindDisplayIcon);
          displayContainer.addButton(playDisplayIcon);
          displayContainer.addButton(nextDisplayIcon);

          return displayContainer.element();
        }

        function createPlayDisplayIcon() {
          var playDisplayIcon = new PlayDisplayIcon(_model);
          //toggle playback
          playDisplayIcon.on('click tap', function() {
              forward({type : events.JWPLAYER_DISPLAY_CLICK});
              _userActivity(1000);
              _api.play(reasonInteraction());
          });

          // make playDisplayIcon clickthrough on chrome for flash to avoid power safe throttle
          if (utils.isChrome() && !utils.isMobile()) {
              playDisplayIcon.el.addEventListener('mousedown', function() {
                  var provider = _model.getVideo();
                  var isFlash = (provider && provider.getName().name.indexOf('flash') === 0);

                  if (!isFlash) {
                      return;
                  }

                  var resetPointerEvents = function() {
                      document.removeEventListener('mouseup', resetPointerEvents);
                      playDisplayIcon.el.style.pointerEvents = 'auto';
                  };

                  this.style.pointerEvents = 'none';
                  document.addEventListener('mouseup', resetPointerEvents);
              });
          }

          return playDisplayIcon;

        }

        this.setupInstream = function(instreamModel) {
            this.instreamModel = _instreamModel = instreamModel;
            _instreamModel.on('change:controls', _onChangeControls, this);
            _instreamModel.on('change:state', _stateHandler, this);

            utils.addClass(_playerElement, 'jw-flag-ads');

            // trigger _userActivity to display the UI temporarily for the start of the ad
            _userActivity();
        };

        this.setAltText = function(text) {
            _controlbar.setAltText(text);
        };

        this.destroyInstream = function() {
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
            _displayClickHandler.revertAlternateClickHandlers();
        };

        this.addCues = function(cues) {
            if (_controlbar) {
                _controlbar.addCues(cues);
            }
        };

        this.clickHandler = function() {
            return _displayClickHandler;
        };

        this.controlsContainer = function() {
            return _controlsLayer;
        };

        this.getContainer = this.element = function() {
            return _playerElement;
        };

        this.getSafeRegion = function(includeCB) {
            var bounds = {
                x: 0,
                y: 0,
                width : _model.get('containerWidth') || 0,
                height : _model.get('containerHeight') || 0
            };

            // If we are using a dock, subtract that from the top
            var dockButtons = _model.get('dock');
            if (dockButtons && dockButtons.length && _model.get('controls')) {
                bounds.y = _dock.element().clientHeight;
                bounds.height -= bounds.y;
            }

            // Subtract controlbar from the bottom when using one
            includeCB = includeCB || !utils.exists(includeCB);
            if (includeCB && _model.get('controls')) {
                bounds.height -= _controlbar.element().clientHeight;
            }

            return bounds;
        };

        this.setCaptions = function(captionsStyle) {
            _captionsRenderer.clear();
            _captionsRenderer.setup(_model.get('id'), captionsStyle);
            _captionsRenderer.resize();
        };

        this.destroy = function() {
            clearTimeout(_previewDisplayStateTimeout);
            clearTimeout(_resizeMediaTimeout);
            clearTimeout(_controlsTimeout);
            window.removeEventListener('resize', _responsiveListener);
            window.removeEventListener('orientationchange', _responsiveListener);
            for (var i = DOCUMENT_FULLSCREEN_EVENTS.length; i--;) {
                document.removeEventListener(DOCUMENT_FULLSCREEN_EVENTS[i], _fullscreenChangeHandler, false);
            }
            if (_model.mediaController) {
                _model.mediaController.off('fullscreenchange', _fullscreenChangeHandler);
            }
            _playerElement.removeEventListener('keydown', handleKeydown, false);
            if (_rightClickMenu) {
                _rightClickMenu.destroy();
            }
            if (_castDisplay) {
                _model.off('change:state', _castDisplay.statusDelegate);
                _castDisplay.destroy();
                _castDisplay = null;
            }
            if (_instreamModel) {
                this.destroyInstream();
            }
            if (_logo) {
                _logo.destroy();
            }
            utils.clearCss(_model.get('id'));
        };
    };

    return View;
});
