/*jshint maxparams:5*/
(function(jwplayer) {
    var html5 = jwplayer.html5,
        utils = jwplayer.utils,
        _     = jwplayer._,
        events = jwplayer.events,
        states = events.state,
        _css = utils.css,
        _setTransition = utils.transitionStyle,
        _isMobile = utils.isMobile(),
        _nonChromeAndroid = utils.isAndroid(4, true),

        /** Controlbar element types * */
        CB_BUTTON = 'button',
        CB_TEXT = 'text',
        CB_DIVIDER = 'divider',
        CB_SLIDER = 'slider',

        /** Some CSS constants we should use for minimization * */
        JW_CSS_RELATIVE = 'relative',
        JW_CSS_ABSOLUTE = 'absolute',
        JW_CSS_NONE = 'none',
        JW_CSS_BLOCK = 'block',
        JW_CSS_INLINE = 'inline',
        JW_CSS_INLINE_BLOCK = 'inline-block',
        JW_CSS_HIDDEN = 'hidden',
        JW_CSS_LEFT = 'left',
        JW_CSS_RIGHT = 'right',
        JW_CSS_100PCT = '100%',
        JW_CSS_SMOOTH_EASE = 'opacity .25s, background .25s, visibility .25s',
        JW_VISIBILITY_TIMEOUT = 250,

        FALSE = false,
        TRUE = true,
        NULL = null,
        EMPTY = '',
        UNDEFINED,

        HIDDEN = {
            display: JW_CSS_NONE
        },
        SHOWING = {
            display: JW_CSS_BLOCK
        },
        NOT_HIDDEN = {
            display: EMPTY
        },

        CB_CLASS = 'span.jwcontrolbar',
        TYPEOF_ARRAY = 'array',
        _canCast = FALSE,
        WINDOW = window,
        DOCUMENT = document;


    function _removeFromArray(array, item) {
        var index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
        }
    }

    function _addOnceToArray(array, item) {
        var index = array.indexOf(item);
        if (index === -1) {
            array.push(item);
        }
    }

    function _createElementId(_id, name) {
        return _id + '_' + name;
    }

    function _elementSize(skinElem) {
        return skinElem ? parseInt(skinElem.width, 10) + 'px ' + parseInt(skinElem.height, 10) + 'px' : '0 0';
    }


    /** HTML5 Controlbar class * */
    html5.controlbar = function(_api, _config) {
        var _skin,
            _dividerElement = _layoutElement('divider', CB_DIVIDER),
            _defaults = {
                margin: 8,
                maxwidth: 800,
                font: 'Arial,sans-serif',
                fontsize: 11,
                fontcolor: parseInt('eeeeee', 16),
                fontweight: 'bold',
                layout: {
                    left: {
                        position: 'left',
                        elements: [ 
                            _layoutElement('play', CB_BUTTON), 
                            _layoutElement('custom10', CB_BUTTON), 
                            _layoutElement('custom11', CB_BUTTON), 
                            _layoutElement('custom12', CB_BUTTON), 
                            _layoutElement('custom13', CB_BUTTON), 
                            _layoutElement('prev', CB_BUTTON), 
                            _layoutElement('next', CB_BUTTON), 
                            _layoutElement('custom20', CB_BUTTON), 
                            _layoutElement('custom21', CB_BUTTON), 
                            _layoutElement('custom22', CB_BUTTON), 
                            _layoutElement('custom23', CB_BUTTON), 
                            _layoutElement('elapsed', CB_TEXT)
                        ]
                    },
                    center: {
                        position: 'center',
                        elements: [ 
                            _layoutElement('time', CB_SLIDER),
                            _layoutElement('alt', CB_TEXT)
                        ]
                    },
                    right: {
                        position: 'right',
                        elements: [ 
                            _layoutElement('duration', CB_TEXT), 
                            _layoutElement('custom30', CB_BUTTON), 
                            _layoutElement('custom31', CB_BUTTON), 
                            _layoutElement('custom32', CB_BUTTON), 
                            _layoutElement('custom33', CB_BUTTON), 
                            _layoutElement('hd', CB_BUTTON), 
                            _layoutElement('cc', CB_BUTTON), 
                            _layoutElement('custom40', CB_BUTTON), 
                            _layoutElement('custom41', CB_BUTTON), 
                            _layoutElement('custom42', CB_BUTTON), 
                            _layoutElement('custom43', CB_BUTTON), 
                            _layoutElement('mute', CB_BUTTON), 
                            _layoutElement('volume', CB_SLIDER), 
                            _layoutElement('volumeH', CB_SLIDER), 
                            _layoutElement('fullscreen', CB_BUTTON)
                        ]
                    }
                }
            },

            _settings,
            _layout,
            _elements,
            _bgHeight,
            _controlbar,
            _id,
            _duration,
            _position,
            _levels,
            _currentQuality,
            _captions,
            _currentCaptions,
            _currentVolume,
            _castState = {},
            _volumeOverlay,
            _cbBounds,
            _timeRail,
            _railBounds,
            _timeOverlay,
            _timeOverlayContainer,
            _timeOverlayThumb,
            _timeOverlayText,
            _hdTimer,
            _hdTapTimer,
            _hdOverlay,
            _ccTimer,
            _ccTapTimer,
            _ccOverlay,
            _redrawTimeout,
            _hideTimeout = -1,
            _audioMode = FALSE,
            _instreamMode = FALSE,
            _adMode = FALSE,
            _hideFullscreen = FALSE,
            _dragging = NULL,
            _lastSeekTime = 0,
            _cues = [],
            _activeCue,
            _toggles = {
                play: 'pause',
                mute: 'unmute',
                fullscreen: 'normalscreen'
            },

            _toggleStates = {
                play: FALSE,
                mute: FALSE,
                fullscreen: FALSE
            },

            _buttonMapping = {
                play: _play,
                mute: _mute,
                fullscreen: _fullscreen,
                next: _next,
                prev: _prev,
                hd: _hd,
                cc: _cc,
                custom10: _custom10,
                custom11: _custom11,
                custom12: _custom12,
                custom13: _custom13,
                custom20: _custom20,
                custom21: _custom21,
                custom22: _custom22,
                custom23: _custom23,
                custom30: _custom30,
                custom31: _custom31,
                custom32: _custom32,
                custom33: _custom33,
                custom40: _custom40,
                custom41: _custom41,
                custom42: _custom42,
                custom43: _custom43,
                cast: _cast
            },

            _sliderMapping = {
                time: _seek,
                volume: _volume
            },

            _overlays = {},
            _jwhidden = [],
            _this = utils.extend(this, new events.eventdispatcher());

        function _layoutElement(name, type, className) {
            return {
                name: name,
                type: type,
                className: className
            };
        }

        function _init() {
            _elements = {};

            _id = _api.id + '_controlbar';
            _duration = _position = 0;

            _controlbar = _createSpan();
            _controlbar.id = _id;
            _controlbar.className = 'jwcontrolbar';

            _skin = _api.skin;
            _layout = _skin.getComponentLayout('controlbar');
            if (!_layout) {
                _layout = _defaults.layout;
            }
            utils.clearCss(_internalSelector());
            _css.block(_id + 'build');
            _createStyles();
            _buildControlbar();
            _css.unblock(_id + 'build');
            _addEventListeners();
            setTimeout(_volumeHandler, 0);
            _playlistHandler();
            _this.visible = false;
            _castAvailable({
                available: _canCast
            });
        }

        function _custom10(){
            if(_api._model.events.onCustom10){
                _api._model.events.onCustom10();
            }
        }
        function _custom11(){
            if(_api._model.events.onCustom11){
                _api._model.events.onCustom11();
            }
        }
        function _custom12(){
            if(_api._model.events.onCustom12){
                _api._model.events.onCustom12();
            }
        }
        function _custom13(){
            if(_api._model.events.onCustom13){
                _api._model.events.onCustom13();
            }
        }
        function _custom20(){
            if(_api._model.events.onCustom20){
                _api._model.events.onCustom20();
            }
        }
        function _custom21(){
            if(_api._model.events.onCustom21){
                _api._model.events.onCustom21();
            }
        }
        function _custom22(){
            if(_api._model.events.onCustom22){
                _api._model.events.onCustom22();
            }
        }
        function _custom23(){
            if(_api._model.events.onCustom23){
                _api._model.events.onCustom23();
            }
        }
        function _custom30(){
            if(_api._model.events.onCustom30){
                _api._model.events.onCustom30();
            }
        }
        function _custom31(){
            if(_api._model.events.onCustom31){
                _api._model.events.onCustom31();
            }
        }
        function _custom32(){
            if(_api._model.events.onCustom32){
                _api._model.events.onCustom32();
            }
        }
        function _custom33(){
            if(_api._model.events.onCustom33){
                _api._model.events.onCustom33();
            }
        }
        function _custom40(){
            if(_api._model.events.onCustom40){
                _api._model.events.onCustom40();
            }
        }
        function _custom41(){
            if(_api._model.events.onCustom41){
                _api._model.events.onCustom41();
            }
        }
        function _custom42(){
            if(_api._model.events.onCustom42){
                _api._model.events.onCustom42();
            }
        }
        function _custom43(){
            if(_api._model.events.onCustom43){
                _api._model.events.onCustom43();
            }
        }

        function _addEventListeners() {
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_TIME, _timeUpdated);
            _api.jwAddEventListener(events.JWPLAYER_PLAYER_STATE, _stateHandler);
            _api.jwAddEventListener(events.JWPLAYER_PLAYLIST_ITEM, _itemHandler);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_MUTE, _volumeHandler);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_VOLUME, _volumeHandler);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_BUFFER, _bufferHandler);
            _api.jwAddEventListener(events.JWPLAYER_FULLSCREEN, _fullscreenHandler);
            _api.jwAddEventListener(events.JWPLAYER_PLAYLIST_LOADED, _playlistHandler);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_LEVELS, _qualityHandler);
            _api.jwAddEventListener(events.JWPLAYER_MEDIA_LEVEL_CHANGED, _qualityLevelChanged);
            _api.jwAddEventListener(events.JWPLAYER_CAPTIONS_LIST, _captionsHandler);
            _api.jwAddEventListener(events.JWPLAYER_CAPTIONS_CHANGED, _captionChanged);
            _api.jwAddEventListener(events.JWPLAYER_RESIZE, _resizeHandler);
            _api.jwAddEventListener(events.JWPLAYER_CAST_AVAILABLE, _castAvailable);
            _api.jwAddEventListener(events.JWPLAYER_CAST_SESSION, _castSession);

            if (!_isMobile) {
                _controlbar.addEventListener('mouseover', function() {
                    // Slider listeners
                    WINDOW.addEventListener('mousedown', _killSelect, FALSE);
                }, false);
                _controlbar.addEventListener('mouseout', function() {
                    // Slider listeners
                    WINDOW.removeEventListener('mousedown', _killSelect);
                    DOCUMENT.onselectstart = null;
                }, false);
            }
        }

        function _resizeHandler() {
            _cbBounds = utils.bounds(_controlbar);
            if (_cbBounds.width > 0) {
                _this.show(TRUE);
            }
        }

        function isLiveStream(evt) {
            var isIpadStream = (evt.duration === Number.POSITIVE_INFINITY);
            var isSafariStream = (evt.duration === 0 && evt.position !== 0 && utils.isSafari() && !_isMobile);

            return isIpadStream || isSafariStream;
        }

        function _timeUpdated(evt) {
            _css.block(_id); //unblock on redraw

            // Positive infinity for live streams on iPad, 0 for live streams on Safari (HTML5)
            if (isLiveStream(evt)) {
                _this.setText(_api.jwGetPlaylist()[_api.jwGetPlaylistIndex()].title || 'Live broadcast');

                // so that elapsed time doesn't display for live streams
                _toggleTimesDisplay(false);
            } else {
                var timeString;
                if (_elements.elapsed) {
                    timeString = utils.timeFormat(evt.position);
                    _elements.elapsed.innerHTML = timeString;
                }
                if (_elements.duration) {
                    timeString = utils.timeFormat(evt.duration);
                    _elements.duration.innerHTML = timeString;
                }
                if (evt.duration > 0) {
                    _setProgress(evt.position / evt.duration);
                } else {
                    _setProgress(0);
                }
                _duration = evt.duration;
                _position = evt.position;
                if (!_instreamMode) {
                    _this.setText();
                }
            }
        }

        function _stateHandler(evt) {
            switch (evt.newstate) {
                case states.BUFFERING:
                case states.PLAYING:
                    if (_elements.timeSliderThumb) {
                        _css.style(_elements.timeSliderThumb, {
                            opacity: 1
                        });
                    }
                    _toggleButton('play', TRUE);
                    break;
                case states.PAUSED:
                    if (!_dragging) {
                        _toggleButton('play', FALSE);
                    }
                    break;
                case states.IDLE:
                    _toggleButton('play', FALSE);
                    if (_elements.timeSliderThumb) {
                        _css.style(_elements.timeSliderThumb, {
                            opacity: 0
                        });
                    }
                    if (_elements.timeRail) {
                        _elements.timeRail.className = 'jwrail';
                    }
                    _setBuffer(0);
                    _timeUpdated({
                        position: 0,
                        duration: 0
                    });
                    break;
            }
        }

        function _itemHandler(evt) {
            if (!_instreamMode) {
                var tracks = _api.jwGetPlaylist()[evt.index].tracks,
                    tracksloaded = FALSE,
                    cuesloaded = FALSE;
                _removeCues();
                if (utils.typeOf(tracks) === TYPEOF_ARRAY && !_isMobile) {
                    for (var i = 0; i < tracks.length; i++) {
                        if (!tracksloaded && tracks[i].file && tracks[i].kind &&
                            tracks[i].kind.toLowerCase() === 'thumbnails') {
                            _timeOverlayThumb.load(tracks[i].file);
                            tracksloaded = TRUE;
                        }
                        if (tracks[i].file && tracks[i].kind &&
                            tracks[i].kind.toLowerCase() === 'chapters') {
                            _loadCues(tracks[i].file);
                            cuesloaded = TRUE;
                        }
                    }
                }
                // If we're here, there are no thumbnails to load -
                // we should clear out the thumbs from the previous item
                if (!tracksloaded) {
                    _timeOverlayThumb.load();
                }
            }
        }

        function _volumeHandler() {
            var muted = _api.jwGetMute();
            _currentVolume = _api.jwGetVolume() / 100;
            _toggleButton('mute', muted || _currentVolume === 0);
            _setVolume(muted ? 0 : _currentVolume);
        }

        function _bufferHandler(evt) {
            _setBuffer(evt.bufferPercent / 100);
        }

        function _fullscreenHandler(evt) {
            _toggleButton('fullscreen', evt.fullscreen);
            _updateNextPrev();
            if (_this.visible) {
                _this.show(TRUE);
            }
        }

        function _playlistHandler() {
            _css.style([
                _elements.hd,
                _elements.cc
            ], HIDDEN);

            _css.style(_elements.cast, _canCast ? NOT_HIDDEN : HIDDEN);

            _updateNextPrev();
            _redraw();
        }

        function _hasHD() {
            return (!_instreamMode && _levels && _levels.length > 1 && _hdOverlay);
        }

        function _qualityHandler(evt) {
            _levels = evt.levels;
            if (_hasHD()) {
                _css.style(_elements.hd, NOT_HIDDEN);
                _hdOverlay.clearOptions();
                for (var i = 0; i < _levels.length; i++) {
                    _hdOverlay.addOption(_levels[i].label, i);
                }
                _qualityLevelChanged(evt);
            } else {
                _css.style(_elements.hd, HIDDEN);
            }
            _redraw();
        }

        function _qualityLevelChanged(evt) {
            _currentQuality = Math.floor(evt.currentQuality);
            if (_elements.hd) {
                _elements.hd.querySelector('button').className =
                    (_levels.length === 2 && _currentQuality === 0) ? 'off' : EMPTY;
            }
            if (_hdOverlay && _currentQuality >= 0) {
                _hdOverlay.setActive(evt.currentQuality);
            }
        }

        function _hasCaptions() {
            return (!_instreamMode && _captions && _captions.length > 1 && _ccOverlay);
        }

        function _captionsHandler(evt) {
            _captions = evt.tracks;
            if (_hasCaptions()) {
                _css.style(_elements.cc, NOT_HIDDEN);
                _ccOverlay.clearOptions();
                for (var i = 0; i < _captions.length; i++) {
                    _ccOverlay.addOption(_captions[i].label, i);
                }
                _captionChanged(evt);
            } else {
                _css.style(_elements.cc, HIDDEN);
            }
            _redraw();
        }

        function _captionChanged(evt) {
            if (!_captions) {
                return;
            }
            _currentCaptions = Math.floor(evt.track);
            if (_elements.cc) {
                _elements.cc.querySelector('button').className =
                    (_captions.length === 2 && _currentCaptions === 0) ? 'off' : EMPTY;
            }
            if (_ccOverlay && _currentCaptions >= 0) {
                _ccOverlay.setActive(evt.track);
            }
        }

        function _castAvailable(evt) {
            // chromecast button is displayed after receiving this event
            if (_elements.cast) {
                _canCast = evt.available;
                _css.style(_elements.cast, evt.available ? NOT_HIDDEN : HIDDEN);
                var className = _elements.cast.className.replace(/\s*jwcancast/, '');
                if (evt.available) {
                    className += ' jwcancast';
                }
                _elements.cast.className = className;
            }
            _castSession(evt);
        }

        function _castSession(evt) {
            _castState = evt;
            if (_elements.cast) {
                _elements.cast.querySelector('button').className = evt.active ? EMPTY : 'off';
            }
            _redraw();
        }

        // Bit of a hacky way to determine if the playlist is available
        function _sidebarShowing() {
            return (!!DOCUMENT.querySelector('#' + _api.id + ' .jwplaylist') && !_api.jwGetFullscreen());
        }

        /**
         * Styles specific to this controlbar/skin
         */
        function _createStyles() {
            _settings = utils.extend({}, _defaults, _skin.getComponentSettings('controlbar'), _config);

            _bgHeight = _getSkinElement('background').height;

            var margin = _audioMode ? 0 : _settings.margin;
            var styles = {
                height: _bgHeight,
                bottom: margin,
                left: margin,
                right: margin,
                'max-width': _audioMode ? EMPTY : _settings.maxwidth
            };
            _css.style(_controlbar, styles);

            _css(_internalSelector('.jwtext'), {
                font: _settings.fontsize + 'px/' + _getSkinElement('background').height + 'px ' + _settings.font,
                color: _settings.fontcolor,
                'font-weight': _settings.fontweight
            });

            _css(_internalSelector('.jwoverlay'), {
                bottom: _bgHeight
            });
        }


        function _internalSelector(name) {
            return '#' + _id + (name ? ' ' + name : EMPTY);
        }

        function _createSpan() {
            return _createElement('span');
        }

        function _createElement(tagname) {
            return DOCUMENT.createElement(tagname);
        }

        function _buildControlbar() {
            var capLeft = _buildImage('capLeft');
            var capRight = _buildImage('capRight');
            var bg = _buildImage('background', {
                position: JW_CSS_ABSOLUTE,
                left: _getSkinElement('capLeft').width,
                right: _getSkinElement('capRight').width,
                'background-repeat': 'repeat-x'
            }, TRUE);

            if (bg) {
                _appendChild(_controlbar, bg);
            }
            if (capLeft) {
                _appendChild(_controlbar, capLeft);
            }
            _buildLayout();
            if (capRight) {
                _appendChild(_controlbar, capRight);
            }
        }

        function _buildElement(element, pos) {
            switch (element.type) {
                case CB_TEXT:
                    return _buildText(element.name);
                case CB_BUTTON:
                    if (element.name !== 'blank') {
                        return _buildButton(element.name, pos);
                    }
                    break;
                case CB_SLIDER:
                    return _buildSlider(element.name);
            }
        }

        /*jshint maxparams:5*/
        function _buildImage(name, style, stretch, nocenter, vertical) {
            var element = _createSpan(),
                skinElem = _getSkinElement(name),
                center = nocenter ? ' left center' : ' center',
                size = _elementSize(skinElem),
                newStyle;

            element.className = 'jw' + name;
            element.innerHTML = '&nbsp;';

            if (!skinElem || !skinElem.src) {
                return;
            }

            if (stretch) {
                newStyle = {
                    background: 'url("' + skinElem.src + '") repeat-x ' + center,
                    'background-size': size,
                    height: vertical ? skinElem.height : EMPTY
                };
            } else {
                newStyle = {
                    background: 'url("' + skinElem.src + '") no-repeat' + center,
                    'background-size': size,
                    width: skinElem.width,
                    height: vertical ? skinElem.height : EMPTY
                };
            }
            element.skin = skinElem;
            _css(_internalSelector((vertical ? '.jwvertical ' : EMPTY) + '.jw' + name), utils.extend(newStyle, style));
            _elements[name] = element;
            return element;
        }

        function _buildButton(name, pos) {
            if (!_getSkinElement(name + 'Button').src) {
                return NULL;
            }

            // Don't show volume or mute controls on mobile, since it's not possible to modify audio levels in JS
            if (_isMobile && (name === 'mute' || name.indexOf('volume') === 0)) {
                return NULL;
            }
            // Having issues with stock (non-chrome) Android browser and showing overlays.
            //  Just remove HD/CC buttons in that case
            if (_nonChromeAndroid && /hd|cc/.test(name)) {
                return NULL;
            }


            var element = _createSpan();
            var span = _createSpan();
            var divider = _buildDivider(_dividerElement);
            var button = _createElement('button');
            element.style += ' display:inline-block';
            element.className = 'jw' + name + ' jwbuttoncontainer';
            if (pos === 'left') {
                _appendChild(element, span);
                _appendChild(element, divider);
            } else {
                _appendChild(element, divider);
                _appendChild(element, span);
            }

            if (!_isMobile) {
                button.addEventListener('click', _buttonClickHandler(name), FALSE);
            } else if (name !== 'hd' && name !== 'cc') {
                var buttonTouch = new utils.touch(button);
                buttonTouch.addEventListener(utils.touchEvents.TAP, _buttonClickHandler(name));
            }
            button.innerHTML = '&nbsp;';
            button.tabIndex = -1;
            _appendChild(span, button);

            var outSkin = _getSkinElement(name + 'Button'),
                overSkin = _getSkinElement(name + 'ButtonOver'),
                offSkin = _getSkinElement(name + 'ButtonOff');


            _buttonStyle(_internalSelector('.jw' + name + ' button'), outSkin, overSkin, offSkin);
            var toggle = _toggles[name];
            if (toggle) {
                _buttonStyle(_internalSelector('.jw' + name + '.jwtoggle button'), _getSkinElement(toggle + 'Button'),
                    _getSkinElement(toggle + 'ButtonOver'));
            }

            _elements[name] = element;

            return element;
        }

        function _buttonStyle(selector, out, over, off) {
            if (!out || !out.src) {
                return;
            }

            _css(selector, {
                width: out.width,
                background: 'url(' + out.src + ') no-repeat center',
                'background-size': _elementSize(out)
            });

            if (over.src && !_isMobile) {
                _css(selector + ':hover,' + selector + '.off:hover', {
                    background: 'url(' + over.src + ') no-repeat center',
                    'background-size': _elementSize(over)
                });
            }

            if (off && off.src) {
                _css(selector + '.off', {
                    background: 'url(' + off.src + ') no-repeat center',
                    'background-size': _elementSize(off)
                });
            }
        }

        function _buttonClickHandler(name) {
            return function(evt) {
                if (_buttonMapping[name]) {
                    _buttonMapping[name]();
                    if (_isMobile) {
                        _this.sendEvent(events.JWPLAYER_USER_ACTION);
                    }
                }
                if (evt.preventDefault) {
                    evt.preventDefault();
                }
            };
        }


        function _play() {
            if (_toggleStates.play) {
                _api.jwPause();
            } else {
                _api.jwPlay();
            }
        }

        function _mute() {
            var muted = !_toggleStates.mute;
            _api.jwSetMute(muted);
            if (!muted && _currentVolume === 0) {
                _api.jwSetVolume(20);
            }
            _volumeHandler();
        }

        function _hideOverlays(exception) {
            utils.foreach(_overlays, function(i, overlay) {
                if (i !== exception) {
                    if (i === 'cc') {
                        _clearCcTapTimeout();
                    }
                    if (i === 'hd') {
                        _clearHdTapTimeout();
                    }
                    overlay.hide();
                }
            });
        }

        function _toggleTimesDisplay(state) {
            if (!_controlbar || !_elements.alt) {
                return;
            }

            if (state === undefined) {
                state = (_controlbar.parentNode && _controlbar.parentNode.clientWidth >= 320);
            }

            if (state && !_instreamMode) {
                _css.style(_jwhidden, NOT_HIDDEN);
            } else {
                _css.style(_jwhidden, HIDDEN);
            }
        }

        function _showVolume() {
            if (_audioMode || _instreamMode) {
                return;
            }
            _css.block(_id); // unblock on position overlay
            _volumeOverlay.show();
            _positionOverlay('volume', _volumeOverlay);
            _hideOverlays('volume');
        }

        function _volume(pct) {
            _setVolume(pct);
            if (pct < 0.1) {
                pct = 0;
            }
            if (pct > 0.9) {
                pct = 1;
            }
            _api.jwSetVolume(pct * 100);
        }

        function _seek(pct) {
            var position;
            if (_activeCue) {
                pct = _activeCue.position;
                if (pct.toString().slice(-1) === '%') {
                    // percent string
                    position = _duration * parseFloat(pct.slice(0, -1)) / 100;
                } else {
                    // time value
                    position = parseFloat(pct);
                }
            } else {
                // pct is normalized 0-1.0
                position = pct * _duration;
            }
            _api.jwSeek(position);
        }

        function _fullscreen() {
            _api.jwSetFullscreen();
        }

        function _next() {
            _api.jwPlaylistNext();
        }

        function _prev() {
            _api.jwPlaylistPrev();
        }

        function _toggleButton(name, state) {
            if (!utils.exists(state)) {
                state = !_toggleStates[name];
            }
            if (_elements[name]) {
                _elements[name].className = 'jw' + name + (state ? ' jwtoggle jwtoggling' : ' jwtoggling');
                // Use the jwtoggling class to temporarily disable the animation
                setTimeout(function() {
                    _elements[name].className = _elements[name].className.replace(' jwtoggling', EMPTY);
                }, 100);
            }
            _toggleStates[name] = state;
        }

        function _buildText(name) {
            var style = {},
                skinName = (name === 'alt') ? 'elapsed' : name,
                skinElement = _getSkinElement(skinName + 'Background');
            if (skinElement.src) {
                var element = _createSpan();
                element.id = _createElementId(_id, name);
                if (name === 'elapsed' || name === 'duration') {
                    element.className = 'jwtext jw' + name + ' jwhidden';
                    _jwhidden.push(element);
                } else {
                    element.className = 'jwtext jw' + name;
                }
                style.background = 'url(' + skinElement.src + ') repeat-x center';
                style['background-size'] = _elementSize(_getSkinElement('background'));
                _css.style(element, style);
                element.innerHTML = (name !== 'alt') ? '00:00' : EMPTY;

                _elements[name] = element;
                return element;
            }
            return null;
        }

        function _buildDivider(divider) {
            var element = _buildImage(divider.name);
            if (!element) {
                element = _createSpan();
                element.className = 'jwblankDivider';
            }
            if (divider.className) {
                element.className += ' ' + divider.className;
            }
            return element;
        }

        function _showHd() {
            if (_levels && _levels.length > 2) {
                if (_hdTimer) {
                    clearTimeout(_hdTimer);
                    _hdTimer = UNDEFINED;
                }
                _css.block(_id); // unblock on position overlay
                _hdOverlay.show();
                _positionOverlay('hd', _hdOverlay);
                _hideOverlays('hd');
            }
        }

        function _showCc() {
            if (_captions && _captions.length > 2) {
                if (_ccTimer) {
                    clearTimeout(_ccTimer);
                    _ccTimer = UNDEFINED;
                }
                _css.block(_id); // unblock on position overlay
                _ccOverlay.show();
                _positionOverlay('cc', _ccOverlay);
                _hideOverlays('cc');
            }
        }

        function _switchLevel(newlevel) {
            if (newlevel >= 0 && newlevel < _levels.length) {
                _api.jwSetCurrentQuality(newlevel);
                _clearHdTapTimeout();
                _hdOverlay.hide();
            }
        }

        function _switchCaption(newcaption) {
            if (newcaption >= 0 && newcaption < _captions.length) {
                _api.jwSetCurrentCaptions(newcaption);
                _clearCcTapTimeout();
                _ccOverlay.hide();
            }
        }

        function _cc() {
            if (_captions.length !== 2) {
                return;
            }
            _switchCaption((_currentCaptions + 1) % 2);
        }

        function _hd() {
            if (_levels.length !== 2) {
                return;
            }
            _switchLevel((_currentQuality + 1) % 2);
        }

        function _cast() {
            if (_castState.active) {
                _api.jwStopCasting();
            } else {
                _api.jwStartCasting();
            }
        }

        function _buildSlider(name) {
            if (_isMobile && name.indexOf('volume') === 0) {
                return;
            }

            var slider = _createSpan(),
                vertical = name === 'volume',
                skinPrefix = name + (name === 'time' ? 'Slider' : EMPTY),
                capPrefix = skinPrefix + 'Cap',
                left = vertical ? 'Top' : 'Left',
                right = vertical ? 'Bottom' : 'Right',
                capLeft = _buildImage(capPrefix + left, NULL, FALSE, FALSE, vertical),
                capRight = _buildImage(capPrefix + right, NULL, FALSE, FALSE, vertical),
                rail = _buildSliderRail(name, vertical, left, right),
                capLeftSkin = _getSkinElement(capPrefix + left),
                capRightSkin = _getSkinElement(capPrefix + left);
            //railSkin = _getSkinElement(name+'SliderRail');

            slider.className = 'jwslider jw' + name;

            if (capLeft) {
                _appendChild(slider, capLeft);
            }
            _appendChild(slider, rail);
            if (capRight) {
                if (vertical) {
                    capRight.className += ' jwcapBottom';
                }
                _appendChild(slider, capRight);
            }

            _css(_internalSelector('.jw' + name + ' .jwrail'), {
                left: vertical ? EMPTY : capLeftSkin.width,
                right: vertical ? EMPTY : capRightSkin.width,
                top: vertical ? capLeftSkin.height : EMPTY,
                bottom: vertical ? capRightSkin.height : EMPTY,
                width: vertical ? JW_CSS_100PCT : EMPTY,
                height: vertical ? 'auto' : EMPTY
            });

            _elements[name] = slider;
            slider.vertical = vertical;

            if (name === 'time') {
                _timeOverlay = new html5.overlay(_id + '_timetooltip', _skin);
                _timeOverlayThumb = new html5.thumbs(_id + '_thumb');
                _timeOverlayText = _createElement('div');
                _timeOverlayText.className = 'jwoverlaytext';
                _timeOverlayContainer = _createElement('div');
                _appendChild(_timeOverlayContainer, _timeOverlayThumb.element());
                _appendChild(_timeOverlayContainer, _timeOverlayText);
                _timeOverlay.setContents(_timeOverlayContainer);
                _timeRail = rail;
                _setTimeOverlay(0);
                _appendChild(rail, _timeOverlay.element());
                _styleTimeSlider(slider);
                _setProgress(0);
                _setBuffer(0);
            } else if (name.indexOf('volume') === 0) {
                _styleVolumeSlider(slider, vertical, left, right);
            }

            return slider;
        }

        function _buildSliderRail(name, vertical, left, right) {
            var rail = _createSpan(),
                railElements = ['Rail', 'Buffer', 'Progress'],
                progressRail,
                sliderPrefix;

            rail.className = 'jwrail';

            for (var i = 0; i < railElements.length; i++) {
                sliderPrefix = (name === 'time' ? 'Slider' : EMPTY);
                var prefix = name + sliderPrefix + railElements[i],
                    element = _buildImage(prefix, NULL, !vertical, (name.indexOf('volume') === 0), vertical),
                    capLeft = _buildImage(prefix + 'Cap' + left, NULL, FALSE, FALSE, vertical),
                    capRight = _buildImage(prefix + 'Cap' + right, NULL, FALSE, FALSE, vertical),
                    capLeftSkin = _getSkinElement(prefix + 'Cap' + left),
                    capRightSkin = _getSkinElement(prefix + 'Cap' + right);

                if (element) {
                    var railElement = _createSpan();
                    railElement.className = 'jwrailgroup ' + railElements[i];
                    if (capLeft) {
                        _appendChild(railElement, capLeft);
                    }
                    _appendChild(railElement, element);
                    if (capRight) {
                        _appendChild(railElement, capRight);
                        capRight.className += ' jwcap' + (vertical ? 'Bottom' : 'Right');
                    }

                    _css(_internalSelector('.jwrailgroup.' + railElements[i]), {
                        'min-width': (vertical ? EMPTY : capLeftSkin.width + capRightSkin.width)
                    });
                    railElement.capSize = vertical ? capLeftSkin.height + capRightSkin.height :
                        capLeftSkin.width + capRightSkin.width;

                    _css(_internalSelector('.' + element.className), {
                        left: vertical ? EMPTY : capLeftSkin.width,
                        right: vertical ? EMPTY : capRightSkin.width,
                        top: vertical ? capLeftSkin.height : EMPTY,
                        bottom: vertical ? capRightSkin.height : EMPTY,
                        height: vertical ? 'auto' : EMPTY
                    });

                    if (i === 2) {
                        progressRail = railElement;
                    }

                    if (i === 2 && !vertical) {
                        var progressContainer = _createSpan();
                        progressContainer.className = 'jwprogressOverflow';
                        _appendChild(progressContainer, railElement);
                        _elements[prefix] = progressContainer;
                        _appendChild(rail, progressContainer);
                    } else {
                        _elements[prefix] = railElement;
                        _appendChild(rail, railElement);
                    }
                }
            }

            var thumb = _buildImage(name + sliderPrefix + 'Thumb', NULL, FALSE, FALSE, vertical);
            if (thumb) {
                _css(_internalSelector('.' + thumb.className), {
                    opacity: name === 'time' ? 0 : 1,
                    'margin-top': vertical ? thumb.skin.height / -2 : EMPTY
                });

                thumb.className += ' jwthumb';
                _appendChild(vertical && progressRail ? progressRail : rail, thumb);
            }

            if (!_isMobile) {
                var sliderName = name;
                if (sliderName === 'volume' && !vertical) {
                    sliderName += 'H';
                }
                rail.addEventListener('mousedown', _sliderMouseDown(sliderName), FALSE);
            } else {
                var railTouch = new utils.touch(rail);
                railTouch.addEventListener(utils.touchEvents.DRAG_START, _sliderDragStart);
                railTouch.addEventListener(utils.touchEvents.DRAG, _sliderDragEvent);
                railTouch.addEventListener(utils.touchEvents.DRAG_END, _sliderDragEvent);
                railTouch.addEventListener(utils.touchEvents.TAP, _sliderTapEvent);
            }

            if (name === 'time' && !_isMobile) {
                rail.addEventListener('mousemove', _showTimeTooltip, FALSE);
                rail.addEventListener('mouseout', _hideTimeTooltip, FALSE);
            }

            _elements[name + 'Rail'] = rail;

            return rail;
        }

        function _idle() {
            var currentState = _api.jwGetState();
            return (currentState === states.IDLE);
        }

        function _killSelect(evt) {
            evt.preventDefault();
            DOCUMENT.onselectstart = function() {
                return FALSE;
            };
        }

        function _draggingStart(name) {
            _draggingEnd();
            _dragging = name;
            WINDOW.addEventListener('mouseup', _sliderMouseEvent, FALSE);
        }

        function _draggingEnd() {
            WINDOW.removeEventListener('mouseup', _sliderMouseEvent);
            _dragging = NULL;
        }

        function _sliderDragStart() {
            _elements.timeRail.className = 'jwrail';
            if (!_idle()) {
                _api.jwSeekDrag(TRUE);
                _draggingStart('time');
                _showTimeTooltip();
                _this.sendEvent(events.JWPLAYER_USER_ACTION);
            }
        }

        function _sliderDragEvent(evt) {
            if (!_dragging) {
                return;
            }

            var rail = _elements[_dragging].querySelector('.jwrail'),
                railRect = utils.bounds(rail),
                pct = evt.x / railRect.width;
            if (pct > 100) {
                pct = 100;
            }
            if (evt.type === utils.touchEvents.DRAG_END) {
                _api.jwSeekDrag(FALSE);
                _elements.timeRail.className = 'jwrail';
                _draggingEnd();
                _sliderMapping.time(pct);
                _hideTimeTooltip();
                _this.sendEvent(events.JWPLAYER_USER_ACTION);
            } else {
                _setProgress(pct);
                if (_position - _lastSeekTime > 500) {
                    _lastSeekTime = _position;
                    _sliderMapping.time(pct);
                }
                _this.sendEvent(events.JWPLAYER_USER_ACTION);
            }
        }

        function _sliderTapEvent(evt) {
            var rail = _elements.time.querySelector('.jwrail'),
                railRect = utils.bounds(rail),
                pct = evt.x / railRect.width;
            if (pct > 100) {
                pct = 100;
            }
            if (!_idle()) {
                _sliderMapping.time(pct);
                _this.sendEvent(events.JWPLAYER_USER_ACTION);
            }
        }

        function _sliderMouseDown(name) {
            return function(evt) {
                if (evt.button) {
                    return;
                }

                _elements[name + 'Rail'].className = 'jwrail';

                if (name === 'time') {
                    if (!_idle()) {
                        _api.jwSeekDrag(TRUE);
                        _draggingStart(name);
                    }
                } else {
                    _draggingStart(name);
                }
            };
        }

        function _sliderMouseEvent(evt) {

            if (!_dragging || evt.button) {
                return;
            }

            var rail = _elements[_dragging].querySelector('.jwrail'),
                railRect = utils.bounds(rail),
                name = _dragging,
                pct = _elements[name].vertical ? (railRect.bottom - evt.pageY) / railRect.height :
                    (evt.pageX - railRect.left) / railRect.width;

            if (evt.type === 'mouseup') {
                if (name === 'time') {
                    _api.jwSeekDrag(FALSE);
                }

                _elements[name + 'Rail'].className = 'jwrail';
                _draggingEnd();
                _sliderMapping[name.replace('H', EMPTY)](pct);
            } else {
                if (_dragging === 'time') {
                    _setProgress(pct);
                } else {
                    _setVolume(pct);
                }
                if (_position - _lastSeekTime > 500) {
                    _lastSeekTime = _position;
                    _sliderMapping[_dragging.replace('H', EMPTY)](pct);
                }
            }
            return false;
        }

        function _showTimeTooltip(evt) {
            if (evt) {
                _positionTimeTooltip.apply(this, arguments);
            }

            if (_timeOverlay && _duration && !_audioMode && !_isMobile) {
                _css.block(_id); // unblock on position overlay
                _timeOverlay.show();
                _positionOverlay('time', _timeOverlay);
            }
        }

        function _hideTimeTooltip() {
            WINDOW.removeEventListener('mousemove', _sliderMouseEvent);

            if (_timeOverlay) {
                _timeOverlay.hide();
            }
        }

        function _positionTimeTooltip(evt) {
            _cbBounds = utils.bounds(_controlbar);
            _railBounds = utils.bounds(_timeRail);

            if (!_railBounds || _railBounds.width === 0) {
                return;
            }

            var position = (evt.pageX ? (evt.pageX - _railBounds.left) : evt.x);

            _timeOverlay.positionX(Math.round(position));
            _setTimeOverlay(_duration * position / _railBounds.width);
        }

        var _setTimeOverlay = (function() {
            var lastText;

            var thumbLoadedCallback = function(width) {
                _css.style(_timeOverlay.element(), {
                    'width': width
                });
                _positionOverlay('time', _timeOverlay);
            };

            return function(sec) {
                var thumbUrl = _timeOverlayThumb.updateTimeline(sec, thumbLoadedCallback);

                var text;
                if (_activeCue) {
                    text = _activeCue.text;
                    if (text && (text !== lastText)) {
                        lastText = text;
                        _css.style(_timeOverlay.element(), {
                            'width': (text.length > 32) ? 160 : EMPTY
                        });
                    }
                } else {
                    text = utils.timeFormat(sec);
                    if (!thumbUrl) {
                        _css.style(_timeOverlay.element(), {
                            'width': EMPTY
                        });
                    }
                }
                if (_timeOverlayText.innerHTML !== text) {
                    _timeOverlayText.innerHTML = text;
                }
                _positionOverlay('time', _timeOverlay);
            };
        })();

        function _styleTimeSlider() {
            if (!_elements.timeSliderRail) {
                _css.style(_elements.time, HIDDEN);
            }

            if (_elements.timeSliderThumb) {
                _css.style(_elements.timeSliderThumb, {
                    'margin-left': (_getSkinElement('timeSliderThumb').width / -2)
                });
            }

            var cueClass = 'timeSliderCue',
                cue = _getSkinElement(cueClass),
                cueStyle = {
                    'z-index': 1
                };

            if (cue && cue.src) {
                _buildImage(cueClass);
                cueStyle['margin-left'] = cue.width / -2;
            } else {
                cueStyle.display = JW_CSS_NONE;
            }
            _css(_internalSelector('.jw' + cueClass), cueStyle);

            _setBuffer(0);
            _setProgress(0);
        }

        function _addCue(timePos, text) {
            // test digits or percent
            if (/^[\d\.]+%?$/.test(timePos.toString())) {
                var cueElem = _buildImage('timeSliderCue'),
                    rail = _elements.timeSliderRail,
                    cue = {
                        position: timePos,
                        text: text,
                        element: cueElem
                    };

                if (cueElem && rail) {
                    rail.appendChild(cueElem);
                    cueElem.addEventListener('mouseover', function() {
                        _activeCue = cue;
                    }, false);
                    cueElem.addEventListener('mouseout', function() {
                        _activeCue = NULL;
                    }, false);
                    _cues.push(cue);
                }

            }
            _drawCues();
        }

        function _drawCues() {
            utils.foreach(_cues, function(idx, cue) {
                var style = {};
                if (cue.position.toString().slice(-1) === '%') {
                    style.left = cue.position;
                } else {
                    if (_duration > 0) {
                        style.left = (100 * cue.position / _duration).toFixed(2) + '%';
                        style.display = null;
                    } else {
                        style.left = 0;
                        style.display = 'none';
                    }
                }
                _css.style(cue.element, style);
            });
        }

        function _removeCues() {
            var rail = _elements.timeSliderRail;
            utils.foreach(_cues, function(idx, cue) {
                rail.removeChild(cue.element);
            });
            _cues.length = 0;
        }

        _this.setText = function(text) {
            _css.block(_id); //unblock on redraw
            var jwalt = _elements.alt,
                jwtime = _elements.time;
            if (!_elements.timeSliderRail) {
                _css.style(jwtime, HIDDEN);
            } else {
                _css.style(jwtime, text ? HIDDEN : SHOWING);
            }
            if (jwalt) {
                _css.style(jwalt, text ? SHOWING : HIDDEN);
                jwalt.innerHTML = text || EMPTY;
            }
            _redraw();
        };

        function _styleVolumeSlider(slider, vertical, left, right) {
            var prefix = 'volume' + (vertical ? EMPTY : 'H'),
                direction = vertical ? 'vertical' : 'horizontal';

            _css(_internalSelector('.jw' + prefix + '.jw' + direction), {
                width: _getSkinElement(prefix + 'Rail', vertical).width + (vertical ? 0 :
                    (_getSkinElement(prefix + 'Cap' + left).width +
                        _getSkinElement(prefix + 'RailCap' + left).width +
                        _getSkinElement(prefix + 'RailCap' + right).width +
                        _getSkinElement(prefix + 'Cap' + right).width)
                ),
                height: vertical ? (
                    _getSkinElement(prefix + 'Cap' + left).height +
                    _getSkinElement(prefix + 'Rail').height +
                    _getSkinElement(prefix + 'RailCap' + left).height +
                    _getSkinElement(prefix + 'RailCap' + right).height +
                    _getSkinElement(prefix + 'Cap' + right).height
                ) : EMPTY
            });

            slider.className += ' jw' + direction;
        }

        var _groups = {};

        function _buildLayout() {
            _buildGroup('left');
            _buildGroup('center');
            _buildGroup('right');
            _appendChild(_controlbar, _groups.left);
            _appendChild(_controlbar, _groups.center);
            _appendChild(_controlbar, _groups.right);
            _buildOverlays();

            _css.style(_groups.right, {
                right: _getSkinElement('capRight').width
            });
        }

        function _buildOverlays() {
            if (_elements.hd) {
                _hdOverlay = new html5.menu('hd', _id + '_hd', _skin, _switchLevel);
                if (!_isMobile) {
                    _addOverlay(_hdOverlay, _elements.hd, _showHd, _setHdTimer);
                } else {
                    _addMobileOverlay(_hdOverlay, _elements.hd, _showHd, 'hd');
                }
                _overlays.hd = _hdOverlay;
            }
            if (_elements.cc) {
                _ccOverlay = new html5.menu('cc', _id + '_cc', _skin, _switchCaption);
                if (!_isMobile) {
                    _addOverlay(_ccOverlay, _elements.cc, _showCc, _setCcTimer);
                } else {
                    _addMobileOverlay(_ccOverlay, _elements.cc, _showCc, 'cc');
                }
                _overlays.cc = _ccOverlay;
            }
            if (_elements.mute && _elements.volume && _elements.volume.vertical) {
                _volumeOverlay = new html5.overlay(_id + '_volumeoverlay', _skin);
                _volumeOverlay.setContents(_elements.volume);
                _addOverlay(_volumeOverlay, _elements.mute, _showVolume);
                _overlays.volume = _volumeOverlay;
            }
        }

        function _setCcTimer() {
            _ccTimer = setTimeout(_ccOverlay.hide, 500);
        }

        function _setHdTimer() {
            _hdTimer = setTimeout(_hdOverlay.hide, 500);
        }

        function _addOverlay(overlay, button, hoverAction, timer) {
            if (_isMobile) {
                return;
            }
            var element = overlay.element();
            _appendChild(button, element);
            button.addEventListener('mousemove', hoverAction, FALSE);
            if (timer) {
                button.addEventListener('mouseout', timer, FALSE);
            } else {
                button.addEventListener('mouseout', overlay.hide, FALSE);
            }
            _css.style(element, {
                left: '50%'
            });
        }

        function _addMobileOverlay(overlay, button, tapAction, name) {
            if (!_isMobile) {
                return;
            }
            var element = overlay.element();
            _appendChild(button, element);
            var buttonTouch = new utils.touch(button);
            buttonTouch.addEventListener(utils.touchEvents.TAP, function() {
                _overlayTapHandler(overlay, tapAction, name);
            });
        }

        function _overlayTapHandler(overlay, tapAction, name) {
            if (name === 'cc') {
                if (_captions.length === 2) {
                    tapAction = _cc;
                }
                if (_ccTapTimer) {
                    _clearCcTapTimeout();
                    overlay.hide();
                } else {
                    _ccTapTimer = setTimeout(function() {
                        overlay.hide();
                        _ccTapTimer = UNDEFINED;
                    }, 4000);
                    tapAction();
                }
                _this.sendEvent(events.JWPLAYER_USER_ACTION);
            } else if (name === 'hd') {
                if (_levels.length === 2) {
                    tapAction = _hd;
                }
                if (_hdTapTimer) {
                    _clearHdTapTimeout();
                    overlay.hide();
                } else {
                    _hdTapTimer = setTimeout(function() {
                        overlay.hide();
                        _hdTapTimer = UNDEFINED;
                    }, 4000);
                    tapAction();
                }
                _this.sendEvent(events.JWPLAYER_USER_ACTION);
            }
        }

        function _buildGroup(pos) {
            var elem = _createSpan();
            elem.className = 'jwgroup jw' + pos;
            _groups[pos] = elem;
            if (_layout[pos]) {
                _buildElements(_layout[pos], _groups[pos], pos);
            }
        }

        function _buildElements(group, container, pos) {
            if (group && group.elements.length > 0) {
                for (var i = 0; i < group.elements.length; i++) {
                    var element = _buildElement(group.elements[i], pos);
                    if (element) {
                        if (group.elements[i].name === 'volume' && element.vertical) {
                            _volumeOverlay = new html5.overlay(_id + '_volumeOverlay', _skin);
                            _volumeOverlay.setContents(element);
                        } else {
                            _appendChild(container, element);
                        }
                    }
                }
            }
        }

        function _redraw() {
            clearTimeout(_redrawTimeout);
            _redrawTimeout = setTimeout(_this.redraw, 0);
        }

        _this.redraw = function(resize) {
            _css.block(_id);

            if (resize && _this.visible) {
                _this.show(TRUE);
            }
            _createStyles();

            // ie <= IE10 does not allow fullscreen from inside an iframe. Hide the FS button.
            var ieIframe = (top !== window.self) && utils.isMSIE();
            var casting = _castState.active;
            _css.style(_elements.fullscreen, {
                display: (_audioMode || casting || _hideFullscreen || ieIframe) ? JW_CSS_NONE : EMPTY
            });

            // TODO: hide these all by default (global styles at bottom), and update using classes when model changes:
            // jwinstream, jwaudio, jwhas-hd, jwhas-cc (see jwcancast)
            _css.style(_elements.volumeH, {
                display: _audioMode || _instreamMode ? JW_CSS_BLOCK : JW_CSS_NONE
            });
            var maxWidth = Math.floor(_settings.maxwidth);
            if (maxWidth) {
                if (_controlbar.parentNode && utils.isIE()) {
                    if (!_audioMode &&
                        _controlbar.parentNode.clientWidth > maxWidth + (Math.floor(_settings.margin) * 2)) {
                        _css.style(_controlbar, {
                            width: maxWidth
                        });
                    } else {
                        _css.style(_controlbar, {
                            width: EMPTY
                        });
                    }
                }
            }

            if (_volumeOverlay) {
                _css.style(_volumeOverlay.element(), {
                    display: !(_audioMode || _instreamMode) ? JW_CSS_BLOCK : JW_CSS_NONE
                });
            }
            _css.style(_elements.hd, {
                display: !_audioMode && !casting && _hasHD() ? EMPTY : JW_CSS_NONE
            });
            _css.style(_elements.cc, {
                display: !_audioMode && !casting && _hasCaptions() ? EMPTY : JW_CSS_NONE
            });



            _drawCues();

            // utils.foreach(_overlays, _positionOverlay);

            _css.unblock(_id);

            if (_this.visible) {
                var capLeft = _getSkinElement('capLeft'),
                    capRight = _getSkinElement('capRight'),
                    centerCss = {
                        left: Math.round(utils.parseDimension(_groups.left.offsetWidth) + capLeft.width),
                        right: Math.round(utils.parseDimension(_groups.right.offsetWidth) + capRight.width)
                    };
                _css.style(_groups.center, centerCss);
            }
        };

        function _updateNextPrev() {
            if (!_adMode && _api.jwGetPlaylist().length > 1 && !_sidebarShowing()) {
                _css.style(_elements.next, NOT_HIDDEN);
                _css.style(_elements.prev, NOT_HIDDEN);
            } else {
                _css.style(_elements.next, HIDDEN);
                _css.style(_elements.prev, HIDDEN);
            }
        }

        function _positionOverlay(name, overlay) {
            if (!_cbBounds) {
                _cbBounds = utils.bounds(_controlbar);
            }
            var forceRedraw = true;
            overlay.constrainX(_cbBounds, forceRedraw);
        }


        _this.audioMode = function(mode) {
            if (mode !== UNDEFINED && mode !== _audioMode) {
                _audioMode = !!mode;
                _redraw();
            }
            return _audioMode;
        };

        _this.instreamMode = function(mode) {
            if (mode !== UNDEFINED && mode !== _instreamMode) {
                _instreamMode = !!mode;
                // TODO: redraw
                _css.style(_elements.cast, _instreamMode ? HIDDEN : NOT_HIDDEN);
            }
            return _instreamMode;
        };

        _this.adMode = function(mode) {
            if (_.isBoolean(mode) && mode !== _adMode) {
                _adMode = mode;

                if (mode) {
                    _removeFromArray(_jwhidden, _elements.elapsed);
                    _removeFromArray(_jwhidden, _elements.duration);
                } else {
                    _addOnceToArray(_jwhidden, _elements.elapsed);
                    _addOnceToArray(_jwhidden, _elements.duration);
                }

                _css.style([
                    _elements.cast,
                    _elements.elapsed,
                    _elements.duration
                ], mode ? HIDDEN : NOT_HIDDEN);

                _updateNextPrev();
            }

            return _adMode;
        };

        /** Whether or not to show the fullscreen icon - used when an audio file is played **/
        _this.hideFullscreen = function(mode) {
            if (mode !== UNDEFINED && mode !== _hideFullscreen) {
                _hideFullscreen = !!mode;
                _redraw();
            }
            return _hideFullscreen;
        };

        _this.element = function() {
            return _controlbar;
        };

        _this.margin = function() {
            return parseInt(_settings.margin, 10);
        };

        _this.height = function() {
            return _bgHeight;
        };


        function _setBuffer(pct) {
            if (_elements.timeSliderBuffer) {
                pct = Math.min(Math.max(0, pct), 1);
                _css.style(_elements.timeSliderBuffer, {
                    width: (pct * 100).toFixed(1) + '%',
                    opacity: pct > 0 ? 1 : 0
                });
            }
        }

        function _sliderPercent(name, pct) {
            if (!_elements[name]) {
                return;
            }
            var vertical = _elements[name].vertical,
                prefix = name + (name === 'time' ? 'Slider' : EMPTY),
                size = 100 * Math.min(Math.max(0, pct), 1) + '%',
                progress = _elements[prefix + 'Progress'],
                thumb = _elements[prefix + 'Thumb'],
                style;

            if (progress) {
                style = {};
                if (vertical) {
                    style.height = size;
                    style.bottom = 0;
                } else {
                    style.width = size;
                }
                if (name !== 'volume') {
                    style.opacity = (pct > 0 || _dragging) ? 1 : 0;
                }
                _css.style(progress, style);
            }

            if (thumb) {
                style = {};
                if (vertical) {
                    style.top = 0;
                } else {
                    style.left = size;
                }
                _css.style(thumb, style);
            }
        }

        function _setVolume(pct) {
            _sliderPercent('volume', pct);
            _sliderPercent('volumeH', pct);
        }

        function _setProgress(pct) {
            _sliderPercent('time', pct);
        }

        function _getSkinElement(name) {
            var component = 'controlbar',
                elem, newname = name;
            if (name.indexOf('volume') === 0) {
                if (name.indexOf('volumeH') === 0) {
                    newname = name.replace('volumeH', 'volume');
                }
                else {
                    component = 'tooltip';
                }
            }
            elem = _skin.getSkinElement(component, newname);
            if (elem) {
                return elem;
            } else {
                return {
                    width: 0,
                    height: 0,
                    src: EMPTY,
                    image: UNDEFINED,
                    ready: FALSE
                };
            }
        }

        function _appendChild(parent, child) {
            parent.appendChild(child);
        }


        //because of size impacting whether to show duration/elapsed time,
        // optional resize argument overrides the this.visible return clause.
        _this.show = function(resize) {
            if (_this.visible && !resize) {
                return;
            }
            _this.visible = true;

            var style = {
                display: JW_CSS_INLINE_BLOCK
            };

            _css.style(_controlbar, style);
            _cbBounds = utils.bounds(_controlbar);

            _toggleTimesDisplay();

            _css.block(_id); //unblock on redraw

            _volumeHandler();
            _redraw();

            _clearHideTimeout();
            _hideTimeout = setTimeout(function() {
                _css.style(_controlbar, {
                    opacity: 1
                });
            }, 0);
        };

        _this.showTemp = function() {
            if (!this.visible) {
                _controlbar.style.opacity = 0;
                _controlbar.style.display = JW_CSS_INLINE_BLOCK;
            }
        };

        _this.hideTemp = function() {
            if (!this.visible) {
                _controlbar.style.display = JW_CSS_NONE;
            }
        };


        function _clearHideTimeout() {
            clearTimeout(_hideTimeout);
            _hideTimeout = -1;
        }

        function _clearCcTapTimeout() {
            clearTimeout(_ccTapTimer);
            _ccTapTimer = UNDEFINED;
        }

        function _clearHdTapTimeout() {
            clearTimeout(_hdTapTimer);
            _hdTapTimer = UNDEFINED;
        }

        function _loadCues(vttFile) {
            if (vttFile) {
                utils.ajax(vttFile, _cueLoaded, _cueFailed, TRUE);
            } else {
                _cues.length = 0;
            }
        }

        function _cueLoaded(xmlEvent) {
            var data = new jwplayer.parsers.srt().parse(xmlEvent.responseText, true);
            if (utils.typeOf(data) !== TYPEOF_ARRAY) {
                return _cueFailed('Invalid data');
            }
            _this.addCues(data);
        }

        _this.addCues = function(cues) {
            utils.foreach(cues, function(idx, elem) {
                if (elem.text) {
                    _addCue(elem.begin, elem.text);
                }
            });
        };

        function _cueFailed(error) {
            utils.log('Cues failed to load: ' + error);
        }

        _this.hide = function() {
            if (!_this.visible) {
                return;
            }
            _this.visible = false;
            _css.style(_controlbar, {
                opacity: 0
            });
            _clearHideTimeout();
            _hideTimeout = setTimeout(function() {
                _css.style(_controlbar, {
                    display: JW_CSS_NONE
                });
            }, JW_VISIBILITY_TIMEOUT);
        };


        // Call constructor
        _init();

    };

    /***************************************************************************
     * Player stylesheets - done once on script initialization; * These CSS
     * rules are used for all JW Player instances *
     **************************************************************************/

    _css(CB_CLASS, {
        position: JW_CSS_ABSOLUTE,
        margin: 'auto',
        opacity: 0,
        display: JW_CSS_NONE
    });

    _css(CB_CLASS + ' span', {
        height: JW_CSS_100PCT
    });
    utils.dragStyle(CB_CLASS + ' span', JW_CSS_NONE);

    _css(CB_CLASS + ' .jwgroup', {
        display: JW_CSS_INLINE
    });

    _css(CB_CLASS + ' span, ' + CB_CLASS + ' .jwgroup button,' + CB_CLASS + ' .jwleft', {
        position: JW_CSS_RELATIVE,
        'float': JW_CSS_LEFT
    });

    _css(CB_CLASS + ' .jwright', {
        position: JW_CSS_RELATIVE,
        'float': JW_CSS_RIGHT
    });

    _css(CB_CLASS + ' .jwcenter', {
        position: JW_CSS_ABSOLUTE
    });

    _css(CB_CLASS + ' buttoncontainer,' + CB_CLASS + ' button', {
        display: JW_CSS_INLINE_BLOCK,
        height: JW_CSS_100PCT,
        border: JW_CSS_NONE,
        cursor: 'pointer'
    });

    _css(CB_CLASS + ' .jwcapRight,' + CB_CLASS + ' .jwtimeSliderCapRight,' + CB_CLASS + ' .jwvolumeCapRight', {
        right: 0,
        position: JW_CSS_ABSOLUTE
    });

    _css(CB_CLASS + ' .jwcapBottom', {
        bottom: 0,
        position: JW_CSS_ABSOLUTE
    });

    _css(CB_CLASS + ' .jwtime', {
        position: JW_CSS_ABSOLUTE,
        height: JW_CSS_100PCT,
        width: JW_CSS_100PCT,
        left: 0
    });

    _css(CB_CLASS + ' .jwthumb', {
        position: JW_CSS_ABSOLUTE,
        height: JW_CSS_100PCT,
        cursor: 'pointer'
    });

    _css(CB_CLASS + ' .jwrail', {
        position: JW_CSS_ABSOLUTE,
        cursor: 'pointer'
    });

    _css(CB_CLASS + ' .jwrailgroup', {
        position: JW_CSS_ABSOLUTE,
        width: JW_CSS_100PCT
    });

    _css(CB_CLASS + ' .jwrailgroup span', {
        position: JW_CSS_ABSOLUTE
    });

    _css(CB_CLASS + ' .jwdivider+.jwdivider', {
        display: JW_CSS_NONE
    });

    _css(CB_CLASS + ' .jwtext', {
        padding: '0 5px',
        'text-align': 'center'
    });

    _css(CB_CLASS + ' .jwcast', {
        display: JW_CSS_NONE
    });

    _css(CB_CLASS + ' .jwcast.jwcancast', {
        display: JW_CSS_BLOCK
    });

    _css(CB_CLASS + ' .jwalt', {
        display: JW_CSS_NONE,
        overflow: 'hidden'
    });

    // important
    _css(CB_CLASS + ' .jwalt', {
        position: JW_CSS_ABSOLUTE,
        left: 0,
        right: 0,
        'text-align': 'left'
    }, TRUE);

    _css(CB_CLASS + ' .jwoverlaytext', {
        padding: 3,
        'text-align': 'center'
    });

    _css(CB_CLASS + ' .jwvertical *', {
        display: JW_CSS_BLOCK
    });

    // important
    _css(CB_CLASS + ' .jwvertical .jwvolumeProgress', {
        height: 'auto'
    }, TRUE);

    _css(CB_CLASS + ' .jwprogressOverflow', {
        position: JW_CSS_ABSOLUTE,
        overflow: JW_CSS_HIDDEN
    });

    _setTransition(CB_CLASS, JW_CSS_SMOOTH_EASE);
    _setTransition(CB_CLASS + ' button', JW_CSS_SMOOTH_EASE);
    _setTransition(CB_CLASS + ' .jwtoggling', JW_CSS_NONE);

})(window.jwplayer);
