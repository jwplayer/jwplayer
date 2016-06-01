define([
    'utils/helpers',
    'events/events',
    'utils/backbone.events',
    'utils/constants',
    'events/states',
    'view/captionsrenderer',
    'view/clickhandler',
    'view/displayicon',
    'view/dock',
    'view/logo',
    'view/controlbar',
    'view/preview',
    'view/rightclick',
    'view/title',
    'utils/underscore',
    'templates/player.html'
], function(utils, events, Events, Constants, states,
            CaptionsRenderer, ClickHandler, DisplayIcon, Dock, Logo,
            Controlbar, Preview, RightClick, Title, _, playerTemplate) {

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
            _controlBarOnlyHeight = 40,
            _videoLayer,
            _lastWidth,
            _lastHeight,
            _instreamModel,
            _instreamMode = false,
            _controlbar,
            _preview,
            _displayClickHandler,
            _castDisplay,
            _dock,
            _logo,
            _title,
            _captionsRenderer,
            _audioMode,
            _showing = false,
            _rightClickMenu,
            _resizeMediaTimeout = -1,
            _previewDisplayStateTimeout = -1,
            _currentState,
            _originalContainer,

            // view fullscreen methods and ability
            _requestFullscreen,
            _exitFullscreen,
            _elementSupportsFullscreen = false,

            // Used to differentiate tab focus events from click events
            _focusFromClick = false,

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

        function adjustSeek(amount) {
            var min = 0;
            var max = _model.get('duration');
            var position = _model.get('position');
            if (utils.adaptiveType(max) === 'DVR') {
                min = max;
                max = Math.max(position, Constants.dvrSeekLimit);
            }
            var newSeek = utils.between(position + amount, min, max);
            _api.seek(newSeek);
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
            if (!_instreamMode) {
                _userActivity();
            }

            switch (evt.keyCode) {
                case 27: // Esc
                    _api.setFullscreen(false);
                    break;
                case 13: // enter
                case 32: // space
                    _api.play({reason: 'interaction'});
                    break;
                case 37: // left-arrow, if not adMode
                    if (!_instreamMode) {
                        adjustSeek(-5);
                    }
                    break;
                case 39: // right-arrow, if not adMode
                    if (!_instreamMode) {
                        adjustSeek(5);
                    }
                    break;
                case 38: // up-arrow
                    adjustVolume(10);
                    break;
                case 40: // down-arrow
                    adjustVolume(-10);
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
                        _api.seek(newSeek);
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

        function handleMouseDown() {
            _focusFromClick = true;
            utils.addClass(_playerElement, 'jw-no-focus');
        }

        function handleFocus() {
            if (!_focusFromClick) {
                handleBlur();
            }

            // On tab-focus, show the control bar for a few seconds
            if (!_instreamMode) {
                _userActivity();
            }
        }

        function _responsiveListener() {
            var bounds = _bounds(_playerElement),
                containerWidth = Math.round(bounds.width),
                containerHeight = Math.round(bounds.height);

            if (!document.body.contains(_playerElement)) {
                window.removeEventListener('resize', _responsiveListener);
                if (_isMobile) {
                    window.removeEventListener('orientationchange', _responsiveListener);
                }
            } else if (containerWidth && containerHeight) {
                if (containerWidth !== _lastWidth || containerHeight !== _lastHeight) {
                    _lastWidth = containerWidth;
                    _lastHeight = containerHeight;
                    clearTimeout(_resizeMediaTimeout);
                    _resizeMediaTimeout = setTimeout(_resizeMedia, 50);

                    _model.set('containerWidth', containerWidth);
                    _model.set('containerHeight', containerHeight);
                    _this.trigger(events.JWPLAYER_RESIZE, {
                        width: containerWidth,
                        height: containerHeight
                    });
                }
            }
            return bounds;
        }


        this.onChangeSkin = function(model, newSkin) {
            utils.replaceClass(_playerElement, /jw-skin-\S+/, newSkin ? ('jw-skin-'+newSkin) : '');
        };


        this.handleColorOverrides = function() {
            var id = _model.get('id');

            function addStyle(elements, attr, value) {
                if (!value) {
                    return;
                }

                elements = utils.prefix(elements, '#' + id + ' ');

                var o = {};
                o[attr] = value;
                utils.css(elements.join(', '), o, id);
            }

            // We can assume that the user will define both an active and inactive color because otherwise it doesn't
            // look good.
            var activeColor = _model.get('skinColorActive'),
                inactiveColor = _model.get('skinColorInactive'),
                backgroundColor = _model.get('skinColorBackground');

            // These will use standard style names for CSS since they are added directly to a style sheet
            // Using background instead of background-color so we don't have to clear gradients with background-image

            // Apply active color
            addStyle([
                // Toggle and menu button active colors
                '.jw-toggle',
                '.jw-button-color:hover'
            ], 'color', activeColor);
            addStyle([
                // menu active option
                '.jw-active-option',
                // slider fill color
                '.jw-progress',
                '.jw-playlist-container .jw-option.jw-active-option',
                '.jw-playlist-container .jw-option:hover'
            ], 'background', activeColor);

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
                '.jw-tooltip-title',
                '.jw-skip .jw-skip-icon',
                '.jw-playlist-container .jw-icon'
            ], 'color', inactiveColor);
            addStyle([
                // slider children
                '.jw-cue',
                '.jw-knob'
            ], 'background', inactiveColor);
            addStyle([
                '.jw-playlist-container .jw-option'
            ], 'border-bottom-color', inactiveColor);

            // Apply background color
            addStyle([
                // general background color
                '.jw-background-color',
                '.jw-tooltip-title',
                '.jw-playlist',
                '.jw-playlist-container .jw-option'
            ], 'background', backgroundColor);
            addStyle([
                // area around scrollbar on the playlist.  skin fix required to remove
                '.jw-playlist-container ::-webkit-scrollbar'
            ], 'border-color', backgroundColor);
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
            _model.on('change:duration', _setLiveMode, this);

            _model.on('change:flashBlocked', _onChangeFlashBlocked);
            _onChangeFlashBlocked(_model, _model.get('flashBlocked'));

            _api.onPlaylistComplete(_playlistCompleteHandler);
            _api.onPlaylistItem(_playlistItemHandler);

            _model.on('change:castAvailable', _onCastAvailable);
            _onCastAvailable(_model, _model.get('castAvailable'));
            _model.on('change:castActive', _onCastActive);
            _onCastActive(_model, _model.get('castActive'));

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
                // Initialize values for containerWidth and containerHeight
                _responsiveListener();

                _resize(_model.get('width'), _model.get('height'));
            });
        };

        function _onCastActive(model, val) {
            // if undefined it will simply alternate
            val = val || false;

            utils.toggleClass(_playerElement, 'jw-flag-casting', val);
        }
        function _onCastAvailable(model, val) {
            utils.toggleClass(_playerElement, 'jw-flag-cast-available', val);
            utils.toggleClass(_controlsLayer, 'jw-flag-cast-available', val);
        }

        function _onStretchChange(model, newVal) {
            utils.replaceClass(_playerElement, /jw-stretch-\S+/, 'jw-stretch-' + newVal);
        }

        function _onCompactUIChange(model, newVal) {
            utils.toggleClass(_playerElement, 'jw-flag-compact-player', newVal);
        }

        function _componentFadeListeners(comp) {
            if (comp && !_isMobile) {
                comp.element().addEventListener('mousemove', _overControlElement, false);
                comp.element().addEventListener('mouseout', _offControlElement, false);
            }
        }

        function _touchHandler() {
            if( (_model.get('state') === states.IDLE ||
                _model.get('state') === states.COMPLETE ||
                _model.get('state') === states.PAUSED) &&
                _model.get('controls')) {
                _api.play({reason: 'interaction'});
            }

            // Toggle visibility of the controls when clicking the media or play icon
            if(!_showing) {
                _userActivity();
            } else {
                _userInactive();
            }
        }

        function _logoClickHandler(evt){
            if (!evt.link) {
                //_togglePlay();
                if (_model.get('controls')) {
                    _api.play({reason: 'interaction'});
                }
            } else {
                _api.pause(true);
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
                var state = (_instreamMode) ? _instreamModel.get('state') : _model.get('state');
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
            overlaysElement.addEventListener('mousemove', _userActivity);

            _displayClickHandler = new ClickHandler(_model, _videoLayer, {useHover: true});
            _displayClickHandler.on('click', function() {
                forward({type : events.JWPLAYER_DISPLAY_CLICK});
                if(_model.get('controls')) {
                    _api.play({reason: 'interaction'});
                }
            });
            _displayClickHandler.on('tap', function() {
                forward({type : events.JWPLAYER_DISPLAY_CLICK});
                _touchHandler();
            });
            _displayClickHandler.on('doubleClick', _doubleClickFullscreen);
            _displayClickHandler.on('move', _userActivity);
            _displayClickHandler.on('over', _userActivity);
            
            var displayIcon = new DisplayIcon(_model);
            //toggle playback
            displayIcon.on('click', function() {
                forward({type : events.JWPLAYER_DISPLAY_CLICK});
                _api.play({reason: 'interaction'});
            });
            displayIcon.on('tap', function() {
                forward({type : events.JWPLAYER_DISPLAY_CLICK});
                _touchHandler();
            });

            // make displayIcon clickthrough on chrome for flash to avoid power safe throttle
            if (utils.isChrome()) {
                displayIcon.el.addEventListener('mousedown', function() {
                    var provider = _model.getVideo();
                    var isFlash = (provider && provider.getName().name.indexOf('flash') === 0);

                    if (!isFlash) {
                        return;
                    }

                    var resetPointerEvents = function() {
                        document.removeEventListener('mouseup', resetPointerEvents);
                        displayIcon.el.style.pointerEvents = 'auto';
                    };

                    this.style.pointerEvents = 'none';
                    document.addEventListener('mouseup', resetPointerEvents);
                });
            }
            _controlsLayer.appendChild(displayIcon.element());

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
            if (_isMobile && (typeof height === 'string' || height >= _controlBarOnlyHeight * 1.5)){
                utils.addClass(_playerElement, 'jw-flag-touch');
            } else {
                _rightClickMenu = new RightClick();
                _rightClickMenu.setup(_model, _playerElement, _playerElement);
            }

            _controlbar = new Controlbar(_api, _model);
            _controlbar.on(events.JWPLAYER_USER_ACTION, _userActivity);
            _model.on('change:scrubbing', _dragging);
            _model.on('change:compactUI', _onCompactUIChange);

            _controlsLayer.appendChild(_controlbar.element());

            _playerElement.addEventListener('focus', handleFocus);
            _playerElement.addEventListener('blur', handleBlur);
            _playerElement.addEventListener('keydown', handleKeydown);
            _playerElement.onmousedown = handleMouseDown;
        }

        function stopDragging(model) {
            if (model.get('state') === states.PAUSED) {
                model.once('change:state', stopDragging);
                return;
            }

            // Handle the case where they begin seeking again before the last seek completes
            if (model.get('scrubbing') === false) {
                utils.removeClass(_playerElement, 'jw-flag-dragging');
            }
        }

        function _dragging(model, val) {
            model.off('change:state', stopDragging);

            if (val) {
                utils.addClass(_playerElement, 'jw-flag-dragging');
            } else {
                stopDragging(model);
            }
        }


        // Perform the switch to fullscreen
        var _fullscreen = function(model, state) {

            // If it supports DOM fullscreen
            var provider = _model.getVideo();
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
            _styles(_playerElement, playerStyle, true);

            _checkAudioMode(height);

            // pass width, height from jwResize if present
            _resizeMedia(width, height);
        }

        function _checkAudioMode(height) {
            _audioMode = _isAudioMode(height);
            if (_controlbar) {
                if (!_audioMode) {
                    var model = _instreamMode ? _instreamModel : _model;
                    _stateHandler(model, model.get('state'));
                }
            }

            utils.toggleClass(_playerElement, 'jw-flag-audio-player', _audioMode);
        }

        function _isAudioMode(height) {
            if (_model.get('aspectratio')) {
                return false;
            }
            if (_.isString(height) && height.indexOf('%') > -1) {
                return false;
            }

            var checkHeight = (_.isNumber(height) ? height : _model.get('containerHeight'));

            return _isControlBarOnly(checkHeight);
        }

        function _isControlBarOnly(verticalPixels) {
            // 1.75 so there's a little wiggle room on mobile for the large UI to fit in
            return verticalPixels && verticalPixels <= (_controlBarOnlyHeight * ((_isMobile)?1.75:1));
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

            //IE9 Fake Full Screen Fix
            if (utils.isMSIE(9) && document.all && !window.atob) {
                width = height = '100%';
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
            _captionsRenderer.resize();

            _controlbar.checkCompactMode(width);
        }

        this.resize = function(width, height) {
            var resetAspectMode = true;
            _resize(width, height, resetAspectMode);
            _responsiveListener();
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
            return  _instreamMode ? _instreamModel.getVideo().getFullScreen() :
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
        }

        function _userInactive() {
            _showing = false;

            clearTimeout(_controlsTimeout);
            _controlbar.hideComponents();
            utils.addClass(_playerElement, 'jw-flag-user-inactive');
        }

        function _userActivity() {
            if(!_showing){
                utils.removeClass(_playerElement, 'jw-flag-user-inactive');
                _controlbar.checkCompactMode(_videoLayer.clientWidth);
            }

            _showing = true;

            clearTimeout(_controlsTimeout);
            _controlsTimeout = setTimeout(_userInactive, _timeoutDuration);
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

        function _setLiveMode(model, duration){
            var live = utils.adaptiveType(duration) === 'LIVE';
            utils.toggleClass(_playerElement, 'jw-flag-live', live);
            _this.setAltText((live) ? 'Live Broadcast' : '');
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

        function _isCasting() {
            var provider = _model.getVideo();
            if (provider) {
                return provider.isCaster;
            }
            return false;
        }

        function _updateStateClass() {
            utils.replaceClass(_playerElement, /jw-state-\S+/, 'jw-state-' + _currentState);
        }

        function _stateHandler(model, state) {
            _currentState = state;

            clearTimeout(_previewDisplayStateTimeout);
            if (state === states.COMPLETE || state === states.IDLE) {
                _previewDisplayStateTimeout = setTimeout(_updateStateClass, 100);
            } else {
                _updateStateClass();
            }

            // cast.display
            if (_isCasting()) {
                // TODO: needs to be done in the provider.setVisibility
                utils.addClass(_videoLayer, 'jw-media-show');

                return;
            }
            // player display
            switch (state) {
                case states.PLAYING:
                    _resizeMedia();
                    break;
                case states.PAUSED:
                    _userActivity();
                    break;
            }
        }

        this.setupInstream = function(instreamModel) {
            this.instreamModel = _instreamModel = instreamModel;
            _instreamModel.on('change:controls', _onChangeControls, this);
            _instreamModel.on('change:state', _stateHandler, this);

            _instreamMode = true;
            utils.addClass(_playerElement, 'jw-flag-ads');

            // trigger _userActivity to display the UI temporarily for the start of the ad
            _userActivity();
        };

        this.setAltText = function(text) {
            _controlbar.setAltText(text);
        };

        this.useExternalControls = function() {
            utils.addClass(_playerElement, 'jw-flag-ads-hide-controls');
        };

        this.destroyInstream = function() {
            _instreamMode = false;
            if (_instreamModel) {
                _instreamModel.off(null, null, this);
                _instreamModel = null;
            }
            this.setAltText('');
            utils.removeClass(_playerElement, 'jw-flag-ads');
            utils.removeClass(_playerElement, 'jw-flag-ads-hide-controls');
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
            // This will need to be changed when the captionsRenderer is refactored
            _captionsRenderer.clear();
            _captionsRenderer.setup(_model.get('id'), captionsStyle);
            _captionsRenderer.resize();
        };

        this.destroy = function() {
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
            if (_instreamMode) {
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
