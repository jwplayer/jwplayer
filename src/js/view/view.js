define([
    'utils/helpers',
    'events/events',
    'utils/backbone.events',
    'events/states',
    'cast/display',
    'view/captions',
    'view/display',
    'view/dock',
    'view/errorscreen',
    'view/logo',
    'view/controlbar',
    'view/rightclick',
    'utils/css',
    'underscore'
], function(utils, events, Events, states, CastDisplay,
            Captions, Display, Dock, errorScreen, Logo, Controlbar, RightClick, cssUtils, _) {

    var _css = cssUtils.css,
        _bounds = utils.bounds,
        _isMobile = utils.isMobile(),
        _isIPad = utils.isIPad(),
        _isIPod = utils.isIPod(),
        PLAYER_CLASS = 'jwplayer',
        ASPECT_MODE = 'aspectMode',
        FULLSCREEN_SELECTOR = '.' + PLAYER_CLASS + '.jwfullscreen',
        VIEW_MAIN_CONTAINER_CLASS = 'jwmain',
        VIEW_VIDEO_CONTAINER_CLASS = 'jwvideo',
        VIEW_CONTROLS_CONTAINER_CLASS = 'jwcontrols',
        VIEW_ASPECT_CONTAINER_CLASS = 'jwaspect',
        DOCUMENT_FULLSCREEN_EVENTS = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange'
        ],

        /*************************************************************
         * Player stylesheets - done once on script initialization;  *
         * These CSS rules are used for all JW Player instances      *
         *************************************************************/
        JW_CSS_SMOOTH_EASE = 'opacity .25s ease',
        JW_CSS_100PCT = '100%',
        JW_CSS_ABSOLUTE = 'absolute',
        JW_CSS_IMPORTANT = ' !important',
        JW_CSS_HIDDEN = 'hidden',
        JW_CSS_BLOCK = 'block';

    var View = function(_api, _model) {
        var _playerElement,
            _container,
            _skin,
            _controlsLayer,
            _aspectLayer,
            _controlsTimeout = -1,
            _timeoutDuration = _isMobile ? 4000 : 2000,
            _videoLayer,
            _lastWidth,
            _lastHeight,
            _instreamModel,
            _instreamMode = false,
            _controlbar,
            _display,
            _castDisplay,
            _dock,
            _logo,
            _logoConfig = _.extend({}, _model.componentConfig('logo')),
            _captions,
            _audioMode,
            _errorState = false,
            _showing = false,
            _forcedControlsState = null,
            _replayState,
            _rightClickMenu,
            _resizeMediaTimeout = -1,
            _inCB = false, // in control bar
            _currentState,

            // view fullscreen methods and ability
            _requestFullscreen,
            _exitFullscreen,
            _elementSupportsFullscreen = false,

            // Used to differentiate tab focus events from click events, because when
            //  it is a click, the mouseDown event will occur immediately prior
            _focusFromClick = false,

            _this = _.extend(this, Events);

        _playerElement = _api.getContainer();
        _playerElement.className = PLAYER_CLASS;
        _playerElement.id = _model.id;
        _playerElement.tabIndex = 0;

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

        if (_model.get('aspectratio')) {
            cssUtils.style(_playerElement, {
                display: 'inline-block'
            });
            _playerElement.className = _playerElement.className.replace(PLAYER_CLASS,
                PLAYER_CLASS + ' ' + ASPECT_MODE);
        }

        var replace = document.getElementById(_model.id);
        replace.parentNode.replaceChild(_playerElement, replace);

        function adjustSeek(amount) {
            var newSeek = utils.between(_model.position + amount, 0, this.getDuration());
            this.seek(newSeek);
        }

        function adjustVolume(amount) {
            var newVol = utils.between(this.getVolume() + amount, 0, 100);
            this.setVolume(newVol);
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
            if (!_controlbar.adMode()) {
                _showControlbar();
                _resetTapTimer();
            }

            var jw = window.jwplayer(_model.id);
            switch (evt.keyCode) {
                case 27: // Esc
                    jw.setFullscreen(false);
                    break;
                case 13: // enter
                case 32: // space
                    jw.play();
                    break;
                case 37: // left-arrow, if not adMode
                    if (!_controlbar.adMode()) {
                        adjustSeek.call(jw, -5);
                    }
                    break;
                case 39: // right-arrow, if not adMode
                    if (!_controlbar.adMode()) {
                        adjustSeek.call(jw, 5);
                    }
                    break;
                case 38: // up-arrow
                    adjustVolume.call(jw, 10);
                    break;
                case 40: // down-arrow
                    adjustVolume.call(jw, -10);
                    break;
                case 77: // m-key
                    jw.setMute();
                    break;
                case 70: // f-key
                    jw.setFullscreen();
                    break;
                default:
                    if (evt.keyCode >= 48 && evt.keyCode <= 59) {
                        // if 0-9 number key, move to n/10 of the percentage of the video
                        var number = evt.keyCode - 48;
                        var newSeek = (number / 10) * jw.getDuration();
                        jw.seek(newSeek);
                    }
                    break;
            }

            if (/13|32|37|38|39|40/.test(evt.keyCode)) {
                // Prevent keypresses from scrolling the screen
                evt.preventDefault();
                return false;
            }
        }

        function handleMouseDown() {
            _focusFromClick = true;

            // After a click it no longer has 'tab-focus'
            _this.trigger(events.JWPLAYER_VIEW_TAB_FOCUS, {
                hasFocus: false
            });
        }

        function handleFocus() {
            var wasTabEvent = !_focusFromClick;
            _focusFromClick = false;

            if (wasTabEvent) {
                _this.trigger(events.JWPLAYER_VIEW_TAB_FOCUS, {
                    hasFocus: true
                });
            }

            // On tab-focus, show the control bar for a few seconds
            if (!_controlbar.adMode()) {
                _showControlbar();
                _resetTapTimer();
            }
        }

        function handleBlur() {
            _focusFromClick = false;
            _this.trigger(events.JWPLAYER_VIEW_TAB_FOCUS, {
                hasFocus: false
            });
        }

        this.getCurrentCaptions = function() {
            return _captions.getCurrentCaptions();
        };

        this.setCurrentCaptions = function(caption) {
            _captions.setCurrentCaptions(caption);
        };

        this.getCaptionsList = function() {
            return _captions.getCaptionsList();
        };

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
                    if (_display) {
                        _display.redraw();
                    }
                    clearTimeout(_resizeMediaTimeout);
                    _resizeMediaTimeout = setTimeout(_resizeMedia, 50);
                    _this.trigger(events.JWPLAYER_RESIZE, {
                        width: containerWidth,
                        height: containerHeight
                    });
                }
            }
            return bounds;
        }


        this.setup = function(skin) {
            if (_errorState) {
                return;
            }

            // TODO: remove when adding in templates. exposed for controller/instream
            this._skin = _skin = skin;

            _container = _createElement('span', VIEW_MAIN_CONTAINER_CLASS);
            _container.id = _model.id + '_view';
            _videoLayer = _createElement('span', VIEW_VIDEO_CONTAINER_CLASS);
            _videoLayer.id = _model.id + '_media';

            _controlsLayer = _createElement('span', VIEW_CONTROLS_CONTAINER_CLASS);
            _aspectLayer = _createElement('span', VIEW_ASPECT_CONTAINER_CLASS);

            _setupControls();

            _container.appendChild(_videoLayer);
            _container.appendChild(_controlsLayer);

            _playerElement.appendChild(_container);
            _playerElement.appendChild(_aspectLayer);

            // adds video tag to video layer
            _model.getVideo().setContainer(_videoLayer);

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
            //this for googima, after casting, to get the state right.
            window.jwplayer(_model.id).onAdPlay(function() {
                _controlbar.adMode(true);
                _updateState(states.PLAYING);

                // For Vast to hide controlbar if no mouse movement
                _resetTapTimer();
            });
            window.jwplayer(_model.id).onAdSkipped(function() {
                _controlbar.adMode(false);
            });
            window.jwplayer(_model.id).onAdComplete(function() {
                _controlbar.adMode(false);
            });
            // So VAST will be in correct state when ad errors out from unknown filetype
            window.jwplayer(_model.id).onAdError(function() {
                _controlbar.adMode(false);
            });

            _model.on('change:controls', _onChangeControls);

            _model.on('change:state', _stateHandler);
            _model.mediaController.on(events.JWPLAYER_MEDIA_ERROR, _errorHandler);
            _api.onPlaylistComplete(_playlistCompleteHandler);
            _api.onPlaylistItem(_playlistItemHandler);

            _model.on('change:castAvailable', function(model, val) {    // TODO: CURRENTLY UNTESTED
                if (val) {
                    _this.forceControls(true);
                } else {
                    _this.releaseControls();
                }
            });

            _model.on('change:castState', function(evt) {   // TODO: CURRENTLY UNTESTED
                if (!_castDisplay) {
                    _castDisplay = new CastDisplay(_model.id);
                    _castDisplay.statusDelegate = function(model, state) {
                        _castDisplay.setState(state);
                    };
                }
                if (evt.active) {
                    cssUtils.style(_captions.element(), {
                        display: 'none'
                    });
                    _this.forceControls(true);
                    _castDisplay.setState('connecting').setName(evt.deviceName).show();

                    // TODO: CURRENTLY UNTESTED
                    _model.on('change:state', _castDisplay.statusDelegate);
                    _model.mediaController.on(events.JWPLAYER_CAST_AD_CHANGED, _castAdChanged);

                } else {

                    // TODO: CURRENTLY UNTESTED
                    _model.off('change:state', _castDisplay.statusDelegate);
                    _model.mediaController.off(events.JWPLAYER_CAST_AD_CHANGED, _castAdChanged);

                    _castDisplay.hide();
                    if (_controlbar.adMode()) {
                        _castAdsEnded();
                    }
                    cssUtils.style(_captions.element(), {
                        display: null
                    });
                    // redraw displayicon
                    _stateHandler(null, _model.get('state'));
                    _responsiveListener();
                }

            });

            _stateHandler(null, states.IDLE);

            if (!_isMobile) {
                _controlsLayer.addEventListener('mouseout', _mouseoutHandler, false);

                _controlsLayer.addEventListener('mousemove', _startFade, false);
                if (utils.isMSIE()) {
                    // Not sure why this is needed
                    _videoLayer.addEventListener('mousemove', _startFade, false);
                    _videoLayer.addEventListener('click', _display.clickHandler);
                }
            }
            _componentFadeListeners(_controlbar);
            _componentFadeListeners(_dock);
            _componentFadeListeners(_logo);

            _css('#' + _playerElement.id + '.' + ASPECT_MODE + ' .' + VIEW_ASPECT_CONTAINER_CLASS, {
                'margin-top': _model.aspectratio,
                display: JW_CSS_BLOCK
            });

            setTimeout(function() {
                _resize(_model.width, _model.height);
            }, 0);
        };
                
        function _componentFadeListeners(comp) {
            if (comp) {
                comp.element().addEventListener('mousemove', _cancelFade, false);
                comp.element().addEventListener('mouseout', _resumeFade, false);
            }
        }

        function _captionsLoadedHandler() { //evt) {
            //ios7captions
            //_model.getVideo().addCaptions(evt.captionData);
            // set current captions evt.captionData[_player.jwGetCurrentCaptions()]
        }



        function _mouseoutHandler() {
            clearTimeout(_controlsTimeout);
            _controlsTimeout = setTimeout(_hideControls, _timeoutDuration);
        }

        function _createElement(elem, className) {
            var newElement = document.createElement(elem);
            if (className) {
                newElement.className = className;
            }
            return newElement;
        }

        function _touchHandler() {
            if (_isMobile) {
                if (_showing) {
                    _hideControls();
                } else {
                    _showControls();
                }
            }
            if (_showing) {
                _resetTapTimer();
            }
        }

        function _resetTapTimer() {
            clearTimeout(_controlsTimeout);
            _controlsTimeout = setTimeout(_hideControls, _timeoutDuration);
        }

        function _startFade() {
            clearTimeout(_controlsTimeout);
            var model = _instreamMode ? _instreamModel : _model;
            var state = model.state;

            // We need _instreamMode because the state is IDLE during pre-rolls
            if (state === states.PLAYING || state === states.PAUSED || state === states.BUFFERING || _instreamMode) {
                _showControls();
                if (!_inCB) {
                    _controlsTimeout = setTimeout(_hideControls, _timeoutDuration);
                }
            }
        }

        function _logoClickHandler(evt){
            if (!evt.showing || !evt.link) {
                //_togglePlay();
                _api.play();
            }

            if (evt.showing && evt.link) {
                _api.pause(true);
                _api.setFullscreen(false);
                window.open(evt.link, evt.linktarget);
            }
        }

        // Over controlbar don't fade
        function _cancelFade() {
            clearTimeout(_controlsTimeout);
            _inCB = true;
        }

        function _resumeFade() {
            _inCB = false;
        }

        function forward(evt) {
            _this.trigger(evt.type, evt);
        }

        function _setupControls() {
            _captions = new Captions(_api, _model);
            _captions.on(events.JWPLAYER_CAPTIONS_LIST, forward);
            _captions.on(events.JWPLAYER_CAPTIONS_CHANGED, forward);
            _captions.on(events.JWPLAYER_CAPTIONS_LOADED, _captionsLoadedHandler);
            _controlsLayer.appendChild(_captions.element());

            _display = new Display(_skin, _api, _model);
            _display.on(events.JWPLAYER_DISPLAY_CLICK, function (evt) {
                forward(evt);
                _touchHandler();
            });
            _controlsLayer.appendChild(_display.element());

            _logo = new Logo(_model);
            _logo.on(events.JWPLAYER_LOGO_CLICK, _logoClickHandler);
            _controlsLayer.appendChild(_logo.element());

            _dock = new Dock(_model.id + '_dock', _model.componentConfig('dock'), _api, _skin);
            _controlsLayer.appendChild(_dock.element());

            if (!_isMobile) {
                _rightClickMenu = new RightClick();
                _rightClickMenu.setup(_model, _playerElement, _controlsLayer);
                //_controlsLayer.appendChild(_rightClickMenu.el);
            }

            _controlbar = new Controlbar(_skin, _api, _model);
            _controlbar.on(events.JWPLAYER_USER_ACTION, _resetTapTimer);
            _controlbar.on(events.JWPLAYER_CONTROLBAR_DRAGGING, _dragging);

            _controlsLayer.appendChild(_controlbar.element());

            if (_isIPod) {
                _hideControlbar();
            }
            if (utils.canCast()) {
                _this.forceControls(true);
            }
            
            _playerElement.onmousedown = handleMouseDown;
            _playerElement.onfocusin = handleFocus;
            _playerElement.addEventListener('focus', handleFocus);
            _playerElement.onfocusout = handleBlur;
            _playerElement.addEventListener('blur', handleBlur);
            _playerElement.addEventListener('keydown', handleKeydown);
        }

        function _onChangeControls(model, bool) {
            if (!bool) {
                _hideControls();
                _hideDisplay();
            }
            else {
                // model may be instream or normal depending on who triggers this
                _stateHandler({
                    newstate: model.state
                });
            }
        }

        function _dragging(evt) {
            if (evt.dragging) {
                utils.addClass(_playerElement, 'jw-flag-dragging');
            } else {
                utils.removeClass(_playerElement, 'jw-flag-dragging');
            }
        }

        function _castAdChanged(evt) {
            // end ad mode (ad provider removed)
            if (evt.done) {
                _castAdsEnded();
                return;
            }

            if (!evt.complete) {
                // start ad mode
                if (!_controlbar.adMode()) {
                    _castAdsStarted();
                }

                _controlbar.setText(evt.message);

                // clickthrough callback
                var clickAd = evt.onClick;
                if (clickAd !== undefined) {
                    _display.setAlternateClickHandler(function() {
                        clickAd(evt);
                    });
                }
                //skipAd callback
                var skipAd = evt.onSkipAd;
                if (skipAd !== undefined && _castDisplay) {
                    _castDisplay.setSkipoffset(evt, evt.onSkipAd);
                }
            }

            // update skip button and companions
            if (_castDisplay) {
                _castDisplay.adChanged(evt);
            }

        }

        function _castAdsStarted() {
            _controlbar.instreamMode(true);
            _controlbar.adMode(true);
            _controlbar.show(true);
        }

        function _castAdsEnded() {
            // controlbar reset
            _controlbar.setText('');
            _controlbar.adMode(false);
            _controlbar.instreamMode(false);
            _controlbar.show(true);
            // cast display reset
            if (_castDisplay) {
                _castDisplay.adsEnded();
                _castDisplay.setState(_model.state);
            }
            // display click reset
            _display.revertAlternateClickHandler();
        }

        /** 
         * Switch fullscreen mode.
         **/
        var _fullscreen = this.fullscreen = function(state) {

            if (!utils.exists(state)) {
                state = !_model.fullscreen;
            }

            state = !!state;

            // if state is already correct, return
            if (state === _model.fullscreen) {
                return;
            }

            // If it supports DOM fullscreen
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
                    if (_instreamModel) {
                       _instreamModel.getVideo().setFullScreen(state);
                    }
                       _model.getVideo().setFullScreen(state);
                }
            }
        };


        function _redrawComponent(comp) {
            if (comp) {
                comp.redraw();
            }
        }

        /**
         * Resize the player
         */
        function _resize(width, height, resetAspectMode) {
            var className = _playerElement.className,
                playerStyle,
                id = _model.id + '_view';
            cssUtils.block(id);

            // when jwResize is called remove aspectMode and force layout
            resetAspectMode = !!resetAspectMode;
            if (resetAspectMode) {
                className = className.replace(/\s*aspectMode/, '');
                if (_playerElement.className !== className) {
                    _playerElement.className = className;
                }
                cssUtils.style(_playerElement, {
                    display: JW_CSS_BLOCK
                }, resetAspectMode);
            }

            if (utils.exists(width) && utils.exists(height)) {
                _model.width = width;
                _model.height = height;
            }

            playerStyle = {
                width: width
            };
            if (className.indexOf(ASPECT_MODE) === -1) {
                playerStyle.height = height;
            }
            cssUtils.style(_playerElement, playerStyle, true);

            if (_display) {
                _display.redraw();
            }
            if (_controlbar) {
                _controlbar.redraw(true);
            }
            if (_logo) {
                _logo.offset(_controlbar && _logo.position().indexOf('bottom') >= 0 ?
                    _controlbar.height() + _controlbar.margin() : 0);
                setTimeout(function() {
                    if (_dock) {
                        _dock.offset(_logo.position() === 'top-left' ?
                            _logo.element().clientWidth + _logo.margin() : 0);
                    }
                }, 500);
            }

            _checkAudioMode(height);

            // pass width, height from jwResize if present 
            _resizeMedia(width, height);

            cssUtils.unblock(id);
        }

        function _checkAudioMode(height) {
            _audioMode = _isAudioMode(height);
            if (_controlbar) {
                if (_audioMode) {
                    _controlbar.audioMode(true);
                    _showControls();
                    _display.hidePreview(true);
                    _hideDisplay();
                    _showVideo(false);
                } else {
                    _controlbar.audioMode(false);
                    var model = _instreamMode ? _instreamModel : _model;
                    _updateState(model.state);
                }
            }
            if (_logo && _audioMode) {
                _hideLogo();
            }
            _playerElement.style.backgroundColor = _audioMode ? 'transparent' : '#000';
        }

        function _isAudioMode(height) {
            if (_model.aspectratio) {
                return false;
            }
            if (_.isNumber(height)) {
                return _isControlBarOnly(height);
            }
            if (_.isString(height) && height.indexOf('%') > -1) {
                return false;
            }
            return _isControlBarOnly(_bounds(_container).height);
        }

        function _isControlBarOnly(verticalPixels) {
            return verticalPixels && verticalPixels <= 40;
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
            var transformScale = provider.resize(width, height, _model.stretching);
            // poll resizing if video is transformed
            if (transformScale) {
                clearTimeout(_resizeMediaTimeout);
                _resizeMediaTimeout = setTimeout(_resizeMedia, 250);
            }
        }

        this.resize = function(width, height) {
            var resetAspectMode = true;
            _resize(width, height, resetAspectMode);
            _responsiveListener();
        };
        this.resizeMedia = _resizeMedia;

        var _completeSetup = this.completeSetup = function() {
            cssUtils.style(_playerElement, {
                opacity: 1
            });
            window.addEventListener('beforeunload', function() {
                if (!_isCasting()) { // don't call stop while casting
                    // prevent video error in display on window close
                    _api.stop();
                }
            });
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
                return !!(fsElement && fsElement.id === _model.id);
            }
            // if player element view fullscreen not available, return video fullscreen state
            return  _instreamMode ? _instreamModel.getVideo().getFullScreen() :
                        _model.getVideo().getFullScreen();
        }


        function _fullscreenChangeHandler(event) {
            var fullscreenState = (event.jwstate !== undefined) ? event.jwstate : _isNativeFullscreen();
            if (_elementSupportsFullscreen) {
                _toggleDOMFullscreen(_playerElement, fullscreenState);
            } else {
                _toggleFullscreen(fullscreenState);
            }
        }

        function _toggleDOMFullscreen(playerElement, fullscreenState) {
            utils.removeClass(playerElement, 'jwfullscreen');
            if (fullscreenState) {
                utils.addClass(playerElement, 'jwfullscreen');
                cssUtils.style(document.body, {
                    'overflow-y': JW_CSS_HIDDEN
                });

                // On going fullscreen we want the control bar to fade after a few seconds
                _resetTapTimer();
            } else {
                cssUtils.style(document.body, {
                    'overflow-y': ''
                });
            }

            _redrawComponent(_controlbar);
            _redrawComponent(_display);
            _redrawComponent(_dock);
            _resizeMedia();

            _toggleFullscreen(fullscreenState);
        }

        function _toggleFullscreen(fullscreenState) {
            // update model
            _model.setFullscreen(fullscreenState);
            if (_instreamModel) {
                _instreamModel.setFullscreen(fullscreenState);
            }

            var model = _instreamMode ? _instreamModel : _model;
            if (fullscreenState) {
                // Browsers seem to need an extra second to figure out how large they are in fullscreen...
                clearTimeout(_resizeMediaTimeout);
                _resizeMediaTimeout = setTimeout(_resizeMedia, 200);

            } else if (_isIPad && model.state === states.PAUSED) {
                // delay refresh on iPad when exiting fullscreen
                // TODO: cancel this if fullscreen or player state changes
                setTimeout(_showDisplay, 500);
            }
        }

        function _showControlbar() {
            if (_controlbar && _model.get('controls')) {
                _controlbar.show();
            }
        }

        function _hideControlbar() {
            if (_forcedControlsState === true) {
                return;
            }

            // TODO: use _forcedControlsState for audio mode so that we don't need these
            if (_controlbar && !_audioMode && !_model.getVideo().isAudioFile()) {
                _controlbar.hide();
            }
        }

        function _showDock() {
            if (_dock && !_audioMode && _model.get('controls')) {
                _dock.show();
            }
        }

        function _hideDock() {
            if (_dock && !_replayState && !_model.getVideo().isAudioFile()) {
                _dock.hide();
            }
        }

        function _showLogo() {
            if (_logo && !_audioMode) {
                _logo.show();
            }
        }

        function _hideLogo() {
            if (_logo && (!_model.getVideo().isAudioFile() || _audioMode)) {
                _logo.hide(_audioMode);
            }
        }

        function _showDisplay() {
            var model = _instreamMode ? _instreamModel : _model;
            if (_display && _model.get('controls') && !_audioMode) {
                if (!_isIPod || model.state === states.IDLE) {
                    _display.show();
                }
            }

            // debug this, find out why
            if (!(_isMobile && _model.fullscreen)) {
                _model.getVideo().setControls(false);
            }
        }

        function _hideDisplay() {
            if (_display) {
                _display.hide();
            }
        }

        function _hideControls() {
            clearTimeout(_controlsTimeout);
            if (_forcedControlsState === true) {
                return;
            }
            _showing = false;

            var model = _instreamMode ? _instreamModel : _model;
            var state = model.state;

            if (!_model.get('controls') || state !== states.PAUSED) {
                _hideControlbar();
            }

            if (!_model.get('controls')) {
                _hideDock();
            }

            if (state !== states.IDLE && state !== states.PAUSED) {
                _hideDock();
                _hideLogo();
            }

            utils.addClass(_playerElement, 'jw-user-inactive');
        }

        function _showControls() {
            if (_forcedControlsState === false) {
                return;
            }

            _showing = true;
            if (_model.get('controls') || _audioMode) {
                _showControlbar();
                _showDock();
            }
            if (_logoConfig.hide) {
                _showLogo();
            }

            utils.removeClass(_playerElement, 'jw-user-inactive');
        }

        function _showVideo(state) {
            state = state && !_audioMode;
            _model.getVideo().setVisibility(state);
        }

        function _playlistCompleteHandler() {
            _replayState = true;
            _fullscreen(false);
            if (_model.get('controls')) {
                _showDock();
            }
        }

        function _playlistItemHandler() {
            // update display title
            if (_castDisplay) {
                _castDisplay.setState(_model.state);
            }
        }

        /**
         * Player state handler
         */
        var _stateTimeout;

        function _stateHandler(model, state) {
            _replayState = false;
            clearTimeout(_stateTimeout);
            _stateTimeout = setTimeout(function() {
                _updateState(state);
            }, 100);
        }

        function _errorHandler() {
            _hideControlbar();
        }

        function _isAudioFile() {
            var model = _instreamMode ? _instreamModel : _model;
            var provider = model.getVideo();
            if (provider) {
                return provider.isAudioFile();
            }
            return false;
        }

        function _isCasting() {
            var provider = _model.getVideo();
            if (provider) {
                return provider.isCaster;
            }
            return false;
        }

        function _updateState(state) {
            _currentState = state;
            // cast.display
            if (_isCasting()) {
                if (_display) {
                    _display.show();
                    _display.hidePreview(false);
                }
                // hide video without audio and android checks
                cssUtils.style(_videoLayer, {
                    visibility: 'visible',
                    opacity: 1
                });

                // force control bar without audio check
                if (_controlbar) {
                    _controlbar.show();
                    _controlbar.hideFullscreen(true);
                }
                return;
            }
            // player display
            switch (state) {
                case states.PLAYING:
                    if (_model.getVideo().isCaster !== true) {
                        _forcedControlsState = null;
                    } else {
                        _forcedControlsState = true;
                    }
                    if (_isAudioFile()) {
                        _showVideo(false);
                        _display.hidePreview(_audioMode);
                        _display.setHiding(true);
                        if (_controlbar) {
                            _showControls();
                            _controlbar.hideFullscreen(true);
                        }
                        _showDock();
                    } else {
                        _showVideo(true);

                        _resizeMedia();
                        _display.hidePreview(true);
                        if (_controlbar) {
                            _controlbar.hideFullscreen(!_model.getVideo().supportsFullscreen());
                        }
                    }
                    break;
                case states.IDLE:
                    _showVideo(false);
                    if (!_audioMode) {
                        _display.hidePreview(false);
                        _showDisplay();
                        _showDock();
                        if (_controlbar) {
                            _controlbar.hideFullscreen(false);
                        }
                    }
                    break;
                case states.BUFFERING:
                    _showDisplay();
                    _hideControls();
                    if (_isMobile) {
                        _showVideo(true);
                    }
                    break;
                case states.PAUSED:
                    _showDisplay();
                    _showControls();
                    break;
            }

            _showLogo();
        }

        this.setupInstream = function(instreamModel) {
            _instreamModel = instreamModel;
            _instreamModel.on('change:controls', _onChangeControls);
            _instreamMode = true;
            _controlbar.instreamMode(true);
            _controlbar.adMode(true);
            _controlbar.show(true);
            _dock.hide();
        };

        this.setInstreamText = function(text) {
            _controlbar.setText(text);
        };

        this.showInstream = function() {
            // adds video tag to video layer
            var provider = _instreamModel.getVideo();
            provider.setContainer(_videoLayer);
            provider.setVisibility(true);
            _controlbar.show(true);
        };

        this.destroyInstream = function() {
            _instreamMode = false;
            _controlbar.setText('');
            _controlbar.adMode(false);
            _controlbar.instreamMode(false);
            _controlbar.show(true);
            _dock.show();
            _this.releaseState();
            _forcedControlsState = null;
            var provider = _model.getVideo();
            provider.setContainer(_videoLayer);
            provider.setVisibility(true);
        };

        this.setupError = function(message) {
            _errorState = true;
            message = message.split(':');
            errorScreen(_playerElement, message[0], message[1]);
            _completeSetup();
        };

        this.addButton = function(icon, label, handler, id) {
            if (_dock) {
                _dock.addButton(icon, label, handler, id);
                if (_model.state === states.IDLE) {
                    _showDock();
                }
            }
        };

        this.removeButton = function(id) {
            if (_dock) {
                _dock.removeButton(id);
            }
        };

        this.forceControls = function(state) {
            _forcedControlsState = !!state;
            if (state) {
                _showControls();
            } else {
                _hideControls();
            }
        };

        this.releaseControls = function() {
            _forcedControlsState = null;
            var model = _instreamMode ? _instreamModel : _model;
            _updateState(model.state);
        };

        this.addCues = function(cues) {
            if (_controlbar) {
                _controlbar.addCues(cues);
            }
        };

        this.forceState = function(state) {
            _display.forceState(state);
        };

        this.releaseState = function() {
            var model = _instreamMode ? _instreamModel : _model;
            _display.releaseState(model.state);
        };

        this.displayComp = function() {
            return _display;
        };

        this.controlsContainer = function() {
            return _controlsLayer;
        };

        this.getSafeRegion = function(includeCB) {
            var bounds = {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
            
            includeCB = includeCB || !utils.exists(includeCB);


            _controlbar.showTemp();
            if (!_instreamMode) {
                _dock.showTemp();
            }
            //_responsiveListener();
            var dispBounds = _bounds(_container),
                dispOffset = dispBounds.top,
                cbBounds = _bounds(_controlbar.element()),
                dockButtons = _instreamMode ? false : (_dock.numButtons() > 0),
                logoTop = (_logo.position().indexOf('top') === 0),
                dockBounds,
                logoBounds = _bounds(_logo.element());
            if (dockButtons && _model.get('controls')) {
                dockBounds = _bounds(_dock.element());
                bounds.y = Math.max(0, dockBounds.bottom - dispOffset);
            }
            if (logoTop) {
                bounds.y = Math.max(bounds.y, logoBounds.bottom - dispOffset);
            }
            bounds.width = dispBounds.width;
            if (cbBounds.height && includeCB && _model.get('controls')) {
                bounds.height = (logoTop ? cbBounds.top : logoBounds.top) - dispOffset - bounds.y;
            } else {
                bounds.height = dispBounds.height - bounds.y;
            }
            _controlbar.hideTemp();
            _dock.hideTemp();
            return bounds;
        };

        this.destroy = function() {
            window.removeEventListener('resize', _responsiveListener);
            window.removeEventListener('orientationchange', _responsiveListener);
            for (var i = DOCUMENT_FULLSCREEN_EVENTS.length; i--;) {
                document.removeEventListener(DOCUMENT_FULLSCREEN_EVENTS[i], _fullscreenChangeHandler, false);
            }
            _model.mediacontroller.off('fullscreenchange', _fullscreenChangeHandler);
            _playerElement.removeEventListener('keydown', handleKeydown, false);
            if (_rightClickMenu) {
                _rightClickMenu.destroy();
            }
            if (_castDisplay) {
                _model.off('change:state', _castDisplay.statusDelegate);
                _castDisplay.destroy();
                _castDisplay = null;
            }
            if (_controlsLayer) {
                _controlsLayer.removeEventListener('mousemove', _startFade);
                _controlsLayer.removeEventListener('mouseout', _mouseoutHandler);
            }
            if (_videoLayer) {
                _videoLayer.removeEventListener('mousemove', _startFade);
                _videoLayer.removeEventListener('click', _display.clickHandler);
            }
            if (_instreamMode) {
                this.destroyInstream();
            }
        };
    };

    // Container styles
    _css('.' + VIEW_MAIN_CONTAINER_CLASS, {
        position: JW_CSS_ABSOLUTE,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        '-webkit-transition': JW_CSS_SMOOTH_EASE,
        '-moz-transition': JW_CSS_SMOOTH_EASE,
        '-o-transition': JW_CSS_SMOOTH_EASE
    });

    _css('.' + VIEW_VIDEO_CONTAINER_CLASS + ', .' + VIEW_CONTROLS_CONTAINER_CLASS, {
        position: JW_CSS_ABSOLUTE,
        height: JW_CSS_100PCT,
        width: JW_CSS_100PCT,
        '-webkit-transition': JW_CSS_SMOOTH_EASE,
        '-moz-transition': JW_CSS_SMOOTH_EASE,
        '-o-transition': JW_CSS_SMOOTH_EASE
    });

    _css('.' + VIEW_VIDEO_CONTAINER_CLASS, {
        overflow: JW_CSS_HIDDEN,
        visibility: JW_CSS_HIDDEN,
        opacity: 0
    });

    _css('.' + VIEW_VIDEO_CONTAINER_CLASS + ' video', {
        background: 'transparent',
        height: JW_CSS_100PCT,
        width: JW_CSS_100PCT,
        position: 'absolute',
        margin: 'auto',
        right: 0,
        left: 0,
        top: 0,
        bottom: 0
    });

    _css('.' + VIEW_ASPECT_CONTAINER_CLASS, {
        display: 'none'
    });

    _css('.' + PLAYER_CLASS + '.' + ASPECT_MODE, {
        height: 'auto'
    });

    // Fullscreen styles

    _css(FULLSCREEN_SELECTOR, {
        width: JW_CSS_100PCT,
        height: JW_CSS_100PCT,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        'z-index': 1000,
        margin: 0,
        position: 'fixed'
    }, true);

    // hide cursor in fullscreen
    _css(FULLSCREEN_SELECTOR + '.jw-user-inactive', {
        'cursor': 'none',
        '-webkit-cursor-visibility': 'auto-hide'
    });

    _css(FULLSCREEN_SELECTOR + ' .' + VIEW_MAIN_CONTAINER_CLASS, {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    }, true);

    _css('.' + PLAYER_CLASS + ' .jwuniform', {
        'background-size': 'contain' + JW_CSS_IMPORTANT
    });

    _css('.' + PLAYER_CLASS + ' .jwfill', {
        'background-size': 'cover' + JW_CSS_IMPORTANT,
        'background-position': 'center'
    });

    _css('.' + PLAYER_CLASS + ' .jwexactfit', {
        'background-size': JW_CSS_100PCT + ' ' + JW_CSS_100PCT + JW_CSS_IMPORTANT
    });

    _css('object.jwswf, .jwplayer:focus', {
        outline: 'none'
    });
    _css('.jw-tab-focus:focus', {
        outline: 'solid 2px #0B7EF4'
    });

    return View;
});
