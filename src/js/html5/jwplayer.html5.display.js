(function(jwplayer) {
    var html5 = jwplayer.html5,
        utils = jwplayer.utils,
        events = jwplayer.events,
        states = events.state,
        _css = utils.css,
        _isMobile = utils.isMobile(),

        D_CLASS = '.jwdisplay',
        D_PREVIEW_CLASS = '.jwpreview';

    var DEFAULT_SETTINGS = {
        showicons: true,
        bufferrotation: 45,
        bufferinterval: 100,
        fontcolor: '#ccc',
        overcolor: '#fff',
        fontsize: 15,
        fontweight: ''
    };

    html5.display = function(_api, config) {
        var _skin = _api.skin,
            _display, _preview,
            _displayTouch,
            _item,
            _image, _imageWidth, _imageHeight,
            _imageHidden = false,
            _icons = {},
            _errorState = false,
            _completedState = false,
            _hiding,
            _hideTimeout,
            _button,
            _forced,
            _previousState,
            _config = utils.extend({}, DEFAULT_SETTINGS,
                _skin.getComponentSettings('display'), config
            ),
            _eventDispatcher = new events.eventdispatcher(),
            _alternateClickHandler,
            _lastClick;

        utils.extend(this, _eventDispatcher);

        function _init() {
            _display = document.createElement('div');
            _display.id = _api.id + '_display';
            _display.className = 'jwdisplay';

            _preview = document.createElement('div');
            _preview.className = 'jwpreview jw' + _api.jwGetStretching();
            _display.appendChild(_preview);

            _api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
            _api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
            _api.jwAddEventListener(events.JWPLAYER_PLAYLIST_COMPLETE, _playlistCompleteHandler);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_ERROR, _errorHandler);
            _api.jwAddEventListener(events.JWPLAYER_ERROR, _errorHandler);
            _api.jwAddEventListener(events.JWPLAYER_PROVIDER_CLICK, _clickHandler);

            if (!_isMobile) {
                _display.addEventListener('click', _clickHandler, false);
            } else {
                _displayTouch = new utils.touch(_display);
                _displayTouch.addEventListener(utils.touchEvents.TAP, _clickHandler);
            }

            _createIcons();

            _stateHandler({
                newstate: states.IDLE
            });
        }

        function _clickHandler(evt) {

            if (_alternateClickHandler && (_api.jwGetControls() || _api.jwGetState() === states.PLAYING)) {
                _alternateClickHandler(evt);
                return;
            }

            if (!_isMobile || !_api.jwGetControls()) {
                _eventDispatcher.sendEvent(events.JWPLAYER_DISPLAY_CLICK);
            }

            if (!_api.jwGetControls()) {
                return;
            }


            // Handle double-clicks for fullscreen toggle
            var currentClick = _getCurrentTime();
            if (_lastClick && currentClick - _lastClick < 500) {
                _api.jwSetFullscreen();
                _lastClick = undefined;
            } else {
                _lastClick = _getCurrentTime();
            }

            var cbBounds = utils.bounds(_display.parentNode.querySelector('.jwcontrolbar')),
                displayBounds = utils.bounds(_display),
                playSquare = {
                    left: cbBounds.left - 10 - displayBounds.left,
                    right: cbBounds.left + 30 - displayBounds.left,
                    top: displayBounds.bottom - 40,
                    bottom: displayBounds.bottom
                },
                fsSquare = {
                    left: cbBounds.right - 30 - displayBounds.left,
                    right: cbBounds.right + 10 - displayBounds.left,
                    top: playSquare.top,
                    bottom: playSquare.bottom
                };

            if (_isMobile) {
                if (_inside(playSquare, evt.x, evt.y)) {
                    // Perform play/pause toggle below
                } else if (_inside(fsSquare, evt.x, evt.y)) {
                    _api.jwSetFullscreen();
                    return;
                } else {
                    _eventDispatcher.sendEvent(events.JWPLAYER_DISPLAY_CLICK);
                    if (_hiding) {
                        return;
                    }
                }
            }

            switch (_api.jwGetState()) {
                case states.PLAYING:
                case states.BUFFERING:
                    _api.jwPause();
                    break;
                default:
                    _api.jwPlay();
                    break;
            }

        }

        function _inside(rect, x, y) {
            return (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
        }

        /** Returns the current timestamp in milliseconds **/
        function _getCurrentTime() {
            return new Date().getTime();
        }

        this.clickHandler = _clickHandler;

        function _createIcons() {
            var outStyle = {
                    font: _config.fontweight + ' ' + _config.fontsize + 'px/' +
                        (parseInt(_config.fontsize, 10) + 3) + 'px Arial, Helvetica, sans-serif',
                    color: _config.fontcolor
                },
                overStyle = {
                    color: _config.overcolor
                };
            _button = new html5.displayicon(_display.id + '_button', _api, outStyle, overStyle);
            _display.appendChild(_button.element());
        }


        function _setIcon(name, text) {
            if (!_config.showicons) {
                return;
            }

            if (name || text) {
                _button.setRotation(name === 'buffer' ? parseInt(_config.bufferrotation, 10) : 0,
                    parseInt(_config.bufferinterval, 10));
                _button.setIcon(name);
                _button.setText(text);
            } else {
                _button.hide();
            }

        }

        function _itemHandler() {
            _clearError();
            _item = _api.jwGetPlaylist()[_api.jwGetPlaylistIndex()];
            var newImage = _item ? _item.image : '';
            _previousState = undefined;
            _loadImage(newImage);
        }

        function _loadImage(newImage) {
            if (_image !== newImage) {
                if (_image) {
                    _setVisibility(D_PREVIEW_CLASS, false);
                }
                _image = newImage;
                _getImage();
            } else if (_image && !_hiding) {
                _setVisibility(D_PREVIEW_CLASS, true);
            }
            _updateDisplay(_api.jwGetState());
        }

        function _playlistCompleteHandler() {
            _completedState = true;
            _setIcon('replay');
            var item = _api.jwGetPlaylist()[0];
            _loadImage(item.image);
        }

        var _stateTimeout;

        function _getState() {
            return _forced ? _forced : (_api ? _api.jwGetState() : states.IDLE);
        }

        function _stateHandler(evt) {
            clearTimeout(_stateTimeout);
            _stateTimeout = setTimeout(function() {
                _updateDisplay(evt.newstate);
            }, 100);
        }

        function _updateDisplay(state) {
            state = _getState();
            if (state !== _previousState) {
                _previousState = state;
                if (_button) {
                    _button.setRotation(0);
                }
                switch (state) {
                    case states.IDLE:
                        if (!_errorState && !_completedState) {
                            if (_image && !_imageHidden) {
                                _setVisibility(D_PREVIEW_CLASS, true);
                            }
                            var disp = true;
                            if (_api._model && _api._model.config.displaytitle === false) {
                                disp = false;
                            }
                            _setIcon('play', (_item && disp) ? _item.title : '');
                        }
                        break;
                    case states.BUFFERING:
                        _clearError();
                        _completedState = false;
                        _setIcon('buffer');
                        break;
                    case states.PLAYING:
                        _setIcon();
                        break;
                    case states.PAUSED:
                        _setIcon('play');
                        break;
                }
            }
        }


        this.forceState = function(state) {
            _forced = state;
            _updateDisplay(state);
            this.show();
        };

        this.releaseState = function(state) {
            _forced = null;
            _updateDisplay(state);
            this.show();
        };

        this.hidePreview = function(state) {
            _imageHidden = state;
            _setVisibility(D_PREVIEW_CLASS, !state);
            if (state) {
                _hiding = true;
                //_hideDisplay();
            }
        };

        this.setHiding = function() {
            _hiding = true;
        };

        this.element = function() {
            return _display;
        };

        function _internalSelector(selector) {
            return '#' + _display.id + ' ' + selector;
        }

        function _getImage() {
            if (_image) {
                // Find image size and stretch exactfit if close enough
                var img = new Image();
                img.addEventListener('load', _imageLoaded, false);
                img.src = _image;
            } else {
                _css(_internalSelector(D_PREVIEW_CLASS), {
                    'background-image': ''
                });
                _setVisibility(D_PREVIEW_CLASS, false);
                _imageWidth = _imageHeight = 0;
            }
        }

        function _imageLoaded() {
            _imageWidth = this.width;
            _imageHeight = this.height;
            _updateDisplay(_api.jwGetState());
            _redraw();
            if (_image) {
                _css(_internalSelector(D_PREVIEW_CLASS), {
                    'background-image': 'url(' + _image + ')'
                });
            }
        }

        function _errorHandler(evt) {
            _errorState = true;
            _setIcon('error', evt.message);
        }

        function _clearError() {
            _errorState = false;
            if (_icons.error) {
                _icons.error.setText();
            }
        }


        function _redraw() {
            if (_display.clientWidth * _display.clientHeight > 0) {
                utils.stretch(_api.jwGetStretching(),
                    _preview, _display.clientWidth, _display.clientHeight, _imageWidth, _imageHeight);
            }
        }

        this.redraw = _redraw;

        function _setVisibility(selector, state) {
            _css(_internalSelector(selector), {
                opacity: state ? 1 : 0,
                visibility: state ? 'visible' : 'hidden'
            });
        }

        this.show = function(force) {
            if (_button && (force || _getState() !== states.PLAYING)) {
                _clearHideTimeout();
                _display.style.display = 'block';
                _button.show();
                _hiding = false;
            }
        };

        this.hide = function() {
            if (_button) {
                _button.hide();
                _hiding = true;
            }
        };

        function _clearHideTimeout() {
            clearTimeout(_hideTimeout);
            _hideTimeout = undefined;
        }

        /** NOT SUPPORTED : Using this for now to hack around instream API **/
        this.setAlternateClickHandler = function(handler) {
            _alternateClickHandler = handler;
        };

        this.revertAlternateClickHandler = function() {
            _alternateClickHandler = null;
        };

        _init();
    };

    _css(D_CLASS, {
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
    });

    _css(D_CLASS + ' ' + D_PREVIEW_CLASS, {
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: '#000 no-repeat center',
        overflow:'hidden',
        opacity: 0
    });

    utils.transitionStyle(D_CLASS + ', ' + D_CLASS + ' *', 'opacity .25s, color .25s');

})(jwplayer);
