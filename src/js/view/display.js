define([
    'view/displayicon',
    'view/touch',
    'utils/helpers',
    'events/events',
    'utils/eventdispatcher',
    'events/states',
    'utils/stretching',
    'utils/css',
    'underscore'
], function(DisplayIcon, Touch, utils, events, eventdispatcher, states, stretchUtils, cssUtils, _) {


    var _isMobile = utils.isMobile(),
        _css = cssUtils.css,

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

    // TODO: Make this only _api and _model as config and _skin are stripped out
    var Display = function(_skin, _api, _model) {
        var _display, _preview,
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
            _config = _.extend({}, DEFAULT_SETTINGS,
                _skin.getComponentSettings('display'), _model.componentConfig('display')
            ),
            _eventDispatcher = new eventdispatcher(),
            _alternateClickHandler,
            _lastClick;

        _.extend(this, _eventDispatcher);

        _display = document.createElement('div');
        _display.id = _model.id + '_display';
        _display.className = 'jwdisplay';

        _preview = document.createElement('div');
        _preview.className = 'jwpreview jw' + _model.stretching;
        _display.appendChild(_preview);

        _api.onPlaylistItem(_itemHandler);
        _api.onPlaylistComplete(_playlistCompleteHandler);
        _api.onError(_errorHandler);

        _model.addEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
        // ???: is there a more up-to-date event to listen to?  Do we listen to the provider via the model?
        _model.addEventListener(events.JWPLAYER_MEDIA_ERROR, _errorHandler);
        // Kyle: Who sends this event?  Do we listen to the provider via the model?
        // Rob: Yes the provider.
        _model.addEventListener(events.JWPLAYER_PROVIDER_CLICK, _clickHandler);

        if (!_isMobile) {
            _display.addEventListener('click', _clickHandler, false);
        } else {
            _displayTouch = new Touch(_display);
            _displayTouch.addEventListener(events.touchEvents.TAP, _clickHandler);
        }

        _button = new DisplayIcon(_model.id, _display.id + '_button', _skin, _api, {
            font: _config.fontweight + ' ' + _config.fontsize + 'px/' +
                (parseInt(_config.fontsize, 10) + 3) + 'px Arial, Helvetica, sans-serif',
            color: _config.fontcolor
        }, {
            color: _config.overcolor
        });
        _display.appendChild(_button.element());

        _stateHandler({
            newstate: states.IDLE
        });

        function _clickHandler(evt) {

            if (_alternateClickHandler &&
                    (_model.controls || _model.state === states.PLAYING)) {
                _alternateClickHandler(evt);
                return;
            }

            if (!_isMobile || !_model.controls) {
                _eventDispatcher.sendEvent(events.JWPLAYER_DISPLAY_CLICK);
            }

            if (!_model.controls) {
                return;
            }


            // Handle double-clicks for fullscreen toggle
            var currentClick = _getCurrentTime();
            if (_lastClick && currentClick - _lastClick < 500) {
                _api.setFullscreen();
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
                    _api.setFullscreen();
                    return;
                } else {
                    _eventDispatcher.sendEvent(events.JWPLAYER_DISPLAY_CLICK);
                    if (_hiding) {
                        return;
                    }
                }
            }

            switch (_model.state) {
                case states.PLAYING:
                case states.BUFFERING:
                    _api.pause(true);
                    break;
                default:
                    _api.play(true);
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
            _item = _model.playlist[_model.item];
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
            _updateDisplay(_model.state);
        }

        function _playlistCompleteHandler() {
            _completedState = true;
            _setIcon('replay');
            var item = _model.playlist[0];
            _loadImage(item.image);
        }

        var _stateTimeout;

        function _getState() {
            return _forced ? _forced : (_model ? _model.state : states.IDLE);
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
                            if (_model && _model.config.displaytitle === false) {
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
            _updateDisplay(_model.state);
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
                stretchUtils.stretch(_model.stretching,
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

    var JW_CLASS = '.jwplayer ';

    var helperString = [JW_CLASS, 'div', 'span', 'a', 'img', 'ul', 'li', 'video'].join(', ' + JW_CLASS);
    _css(helperString + ', .jwclick', {
        margin: 0,
        padding: 0,
        border: 0,
        color: '#000000',
        'font-size': '100%',
        font: 'inherit',
        'vertical-align': 'baseline',
        'background-color': 'transparent',
        'text-align': 'left',
        'direction': 'ltr',
        'line-height': 20,
        '-webkit-tap-highlight-color': 'rgba(255, 255, 255, 0)'
    });

    // Reset box-sizing to default for player and all sub-elements
    //  Note: If we use pseudo elements we will need to add *:before and *:after
    _css(JW_CLASS + ',' + JW_CLASS + '*', { 'box-sizing': 'content-box'});
    // Browsers use border-box as a the default box-sizing for many form elements
    _css(JW_CLASS + '* button,' + JW_CLASS + '* input,' + JW_CLASS + '* select,' + JW_CLASS + '* textarea',
        { 'box-sizing': 'border-box'});


    _css(JW_CLASS + 'ul', {
        'list-style': 'none'
    });


    // These rules allow click and hover events to reach the provider, instead
    //  of being blocked by the controller element
    //  ** Note : pointer-events will not work on IE < 11
    _css('.jwplayer .jwcontrols', {
        'pointer-events': 'none'
    });
    _css('.jwplayer.jw-user-inactive .jwcontrols', {
        'pointer-events': 'all'
    });
    var acceptClicks = [
        '.jwplayer .jwcontrols .jwdockbuttons',
        '.jwplayer .jwcontrols .jwcontrolbar',
        '.jwplayer .jwcontrols .jwskip',
        '.jwplayer .jwcontrols .jwdisplayIcon', // play and replay button
        '.jwplayer .jwcontrols .jwpreview', // poster image
        '.jwplayer .jwcontrols .jwlogo'
    ];
    _css(acceptClicks.join(', '), {
        'pointer-events' : 'all'
    });
    cssUtils.transitionStyle(D_CLASS + ', ' + D_CLASS + ' *', 'opacity .25s, color .25s');

    return Display;
});
