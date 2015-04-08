define([
    'utils/helpers',
    'parsers/captions/parsers.srt',
    'underscore',
    'events/events',
    'events/states',
    'utils/backbone.events',
    'view/touch',
    'view/thumbs',
    'view/menu',
    'view/overlay',
    'utils/css'
], function(utils, SrtParser, _, events, states, Events, Touch, Thumbs, Menu, Overlay, cssUtils) {

    var _setTransition = cssUtils.transitionStyle,
        _isMobile = utils.isMobile(),
        _nonChromeAndroid = utils.isAndroid(4, true),
        _iFramed = (window.top !== window.self),
        _css = cssUtils.css,

        /** Controlbar element types * */
        CB_BUTTON = 'button',
        CB_TEXT = 'text',
        CB_DIVIDER = 'divider',
        CB_SLIDER = 'slider',

        JW_VISIBILITY_TIMEOUT = 250,

        HIDDEN = {
            display: 'none'
        },
        SHOWING = {
            display: 'block'
        },
        NOT_HIDDEN = {
            display: ''
        };

    function _removeFromArray(array, item) {
        var index = _.indexOf(array, item);
        if (index > -1) {
            array.splice(index, 1);
        }
    }

    function _addOnceToArray(array, item) {
        var index = _.indexOf(array, item);
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
    var Controlbar = function(_skin, _api, _model) {
        var _config = _model.componentConfig('controlbar') || {},
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
                            _layoutElement('prev', CB_BUTTON),
                            _layoutElement('next', CB_BUTTON),
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
                            _layoutElement('hd', CB_BUTTON),
                            _layoutElement('cc', CB_BUTTON),
                            _layoutElement('mute', CB_BUTTON),
                            _layoutElement('volume', CB_SLIDER),
                            _layoutElement('volumeH', CB_SLIDER),
                            _layoutElement('cast', CB_BUTTON),
                            _layoutElement('fullscreen', CB_BUTTON)
                        ]
                    }
                }
            },

            _settings,
            _layout = _skin.getComponentLayout('controlbar') || _defaults.layout,
            _elements = {},
            _bgHeight,
            _controlbar = _createSpan(),
            _id = _api.getContainer().id + '_controlbar',
            _duration = 0,
            _position = 0,
            _levels = [],
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
            _audioMode = false,
            _instreamMode = false,
            _adMode = false,
            _hideFullscreen = false,
            _dragging = null,
            _cues = [],
            _activeCue,
            _toggles = {
                play: 'pause',
                mute: 'unmute',
                cast: 'casting',
                fullscreen: 'normalscreen'
            },

            _toggleStates = {
                play: false,
                mute: false,
                cast: false,
                fullscreen: _config.fullscreen || false
            },

            _buttonMapping = {
                play: _play,
                mute: _mute,
                fullscreen: _fullscreen,
                next: _next,
                prev: _prev,
                hd: _hd,
                cc: _cc,
                cast: _cast
            },

            _sliderMapping = {
                time: _seekThrottled,
                volume: _volume
            },
            _groups = {},
            _overlays = {},
            _jwhidden = [],
            _this = _.extend(this, Events);

        // Store the attempted seek, until the previous one completes
        var _seekTo;
        var _seekThrottler = _.throttle(_seek, 400);

        var _setTimeOverlay = (function() {
            var lastText;

            var thumbLoadedCallback = function(width) {
                cssUtils.style(_timeOverlay.element(), {
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
                        cssUtils.style(_timeOverlay.element(), {
                            'width': (text.length > 32) ? 160 : ''
                        });
                    }
                } else {
                    text = utils.timeFormat(sec);
                    if (!thumbUrl) {
                        cssUtils.style(_timeOverlay.element(), {
                            'width': ''
                        });
                    }
                }
                if (_timeOverlayText.innerHTML !== text) {
                    _timeOverlayText.innerHTML = text;
                }
                _positionOverlay('time', _timeOverlay);
            };
        })();

        _controlbar.id = _id;
        _controlbar.className = 'jwcontrolbar';

        cssUtils.clearCss(_internalSelector());
        cssUtils.block(_id + 'build');
        _createStyles();
        _buildControlbar();
        cssUtils.unblock(_id + 'build');
        _addEventListeners();
        _playlistHandler();
        _castAvailable();

        _this.visible = false;

        _.defer(function() {
            _volumeHandler(_model);
        });

        function _layoutElement(name, type, className) {
            return {
                name: name,
                type: type,
                className: className
            };
        }

        function _addEventListeners() {
            _api.onFullscreen(_fullscreenHandler);
            _api.onResize(_resizeHandler);
            _api.onCaptionsList(_captionsHandler);
            _api.onCaptionsChange(_captionChanged);

            _model.on('change:state', _stateHandler);
            _model.on('change:item', _itemHandler);
            _model.on('change:buffer', _bufferHandler);
            _model.on('change:position', _timeUpdated); // pos and dur come together from time event
            _model.on('change:duration', _timeUpdated);
            _model.on('change:mute', _volumeHandler);
            _model.on('change:volume', _volumeHandler);
            _model.on('change:castAvailable', _castAvailable);      // TODO: Unconfirmed
            _model.on('change:castState', _onCastState);            // TODO: Unconfirmed
            _model.on('change:playlist', _playlistHandler);

            _model.mediaController.on(events.JWPLAYER_MEDIA_LEVELS, _qualityHandler);             // TODO: Unconfirmed
            _model.mediaController.on(events.JWPLAYER_MEDIA_LEVEL_CHANGED, _qualityLevelChanged); // TODO: Unconfirmed


            if (!_isMobile) {
                _controlbar.addEventListener('mouseover', function() {
                    // Slider listeners
                    window.addEventListener('mousedown', _killSelect, false);
                }, false);
                _controlbar.addEventListener('mouseout', function() {
                    // Slider listeners
                    window.removeEventListener('mousedown', _killSelect);
                    document.onselectstart = null;
                }, false);
            }
        }

        function _resizeHandler() {
            _cbBounds = utils.bounds(_controlbar);
            if (_cbBounds.width > 0) {
                _this.show(true);
            }
        }

        function isLiveStream(position, duration) {
            var isIpadStream = (duration === Number.POSITIVE_INFINITY);
            var isSafariStream = (duration === 0 && position !== 0 && utils.isSafari() && !_isMobile);

            return isIpadStream || isSafariStream;
        }

        function _timeUpdated(model) {
            cssUtils.block(_id); //unblock on redraw
            var position = model.get('position');
            var duration = model.get('duration');

            _updateSeekbar(position, duration);
        }

        function _updateSeekbar(position, duration) {
            // Positive infinity for live streams on iPad, 0 for live streams on Safari (HTML5)
            if (isLiveStream(position, duration)) {
                _this.setText(_model.playlist[_model.item].title || 'Live broadcast');  // TODO: Unconfirmed

                // so that elapsed time doesn't display for live streams
                _toggleTimesDisplay(false);
            } else {
                var timeString;
                if (_elements.elapsed) {
                    timeString = utils.timeFormat(position);
                    _elements.elapsed.innerHTML = timeString;
                }
                if (_elements.duration) {
                    timeString = utils.timeFormat(duration);
                    _elements.duration.innerHTML = timeString;
                }
                if (duration > 0) {
                    _setProgress(position / duration);
                } else {
                    _setProgress(0);
                }
                _duration = duration;
                _position = position;
                if (!_instreamMode) {
                    _this.setText();
                }
            }
        }

        function _stateHandler(model, state) {
            switch (state) {
                case states.BUFFERING:
                case states.PLAYING:
                    if (_elements.timeSliderThumb) {
                        cssUtils.style(_elements.timeSliderThumb, {
                            opacity: 1
                        });
                    }
                    _toggleButton('play', true);
                    break;
                case states.PAUSED:
                    if (!_dragging) {
                        _toggleButton('play', false);
                    }
                    break;
                case states.IDLE:
                    _toggleButton('play', false);
                    if (_elements.timeSliderThumb) {
                        cssUtils.style(_elements.timeSliderThumb, {
                            opacity: 0
                        });
                    }
                    if (_elements.timeRail) {
                        _elements.timeRail.className = 'jwrail';
                    }
                    _setBuffer(0);
                    _updateSeekbar(0,0);

                    break;
            }
        }

        function _itemHandler(model, index) {
            if (!_instreamMode) {
                var tracks = _model.playlist[index].tracks,
                    tracksloaded = false,
                    cuesloaded = false;
                _removeCues();
                if (_.isArray(tracks) && !_isMobile) {
                    for (var i = 0; i < tracks.length; i++) {
                        if (!tracksloaded && tracks[i].file && tracks[i].kind &&
                            tracks[i].kind.toLowerCase() === 'thumbnails') {
                            _timeOverlayThumb.load(tracks[i].file);
                            tracksloaded = true;
                        }
                        if (tracks[i].file && tracks[i].kind &&
                            tracks[i].kind.toLowerCase() === 'chapters') {
                            _loadCues(tracks[i].file);
                            cuesloaded = true;
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

        function _volumeHandler(model) {
            var muted = model.get('mute');
            _currentVolume = model.get('volume') / 100;
            _toggleButton('mute', muted || _currentVolume === 0);
            _setVolume(muted ? 0 : _currentVolume);
        }

        function _bufferHandler(model, buffer) {
            _setBuffer(buffer / 100);
        }

        function _fullscreenHandler(evt) {
            _toggleButton('fullscreen', evt.fullscreen);
            _updateNextPrev();
            if (_this.visible) {
                _this.show(true);
            }
        }

        function _playlistHandler() {

            cssUtils.style([
                _elements.hd,
                _elements.cc
            ], HIDDEN);

            _updateNextPrev();
            _redraw();
        }

        function _hasHD() {
            return (!_instreamMode && _levels.length > 1 && _hdOverlay);
        }

        function _qualityHandler(evt) {
            _levels = evt.levels || [];
            if (_hasHD()) {
                cssUtils.style(_elements.hd, NOT_HIDDEN);
                _hdOverlay.clearOptions();
                for (var i = 0; i < _levels.length; i++) {
                    _hdOverlay.addOption(_levels[i].label, i);
                }
                _qualityLevelChanged(evt);
            } else {
                cssUtils.style(_elements.hd, HIDDEN);
            }
            _redraw();
        }

        function _qualityLevelChanged(evt) {
            _currentQuality = Math.floor(evt.currentQuality);
            if (_elements.hd) {
                _elements.hd.querySelector('button').className =
                    (_levels.length === 2 && _currentQuality === 0) ? 'off' : '';
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
                cssUtils.style(_elements.cc, NOT_HIDDEN);
                _ccOverlay.clearOptions();
                for (var i = 0; i < _captions.length; i++) {
                    _ccOverlay.addOption(_captions[i].label, i);
                }
                _captionChanged(evt);
            } else {
                cssUtils.style(_elements.cc, HIDDEN);
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
                    (_captions.length === 2 && _currentCaptions === 0) ? 'off' : '';
            }
            if (_ccOverlay && _currentCaptions >= 0) {
                _ccOverlay.setActive(evt.track);
            }
        }

        function _castAvailable(evt) {
            // chromecast button is displayed after receiving this event
            if (_elements.cast) {
                if (utils.canCast()) {
                    utils.addClass(_elements.cast, 'jwcancast');
                } else {
                    utils.removeClass(_elements.cast, 'jwcancast');
                }
            }

            _onCastState(_model, evt || _castState);
        }

        function _onCastState(model, evt) {
            _castState = evt;

            _toggleButton('cast', evt.active);

            _redraw();
        }

        /**
         * Styles specific to this controlbar/skin
         */
        function _createStyles() {
            _settings = _.extend({}, _defaults, _skin.getComponentSettings('controlbar'), _config);

            _bgHeight = _getSkinElement('background').height;

            var margin = _audioMode ? 0 : _settings.margin;
            var styles = {
                height: _bgHeight,
                bottom: margin,
                left: margin,
                right: margin,
                'max-width': _audioMode ? '' : _settings.maxwidth
            };
            cssUtils.style(_controlbar, styles);

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
            return '#' + _id + (name ? ' ' + name : '');
        }

        function _createSpan() {
            return _createElement('span');
        }

        function _createElement(tagname) {
            return document.createElement(tagname);
        }

        function _buildControlbar() {
            var capLeft = _buildImage('capLeft');
            var capRight = _buildImage('capRight');
            var bg = _buildImage('background', {
                position: 'absolute',
                left: _getSkinElement('capLeft').width,
                right: _getSkinElement('capRight').width,
                'background-repeat': 'repeat-x'
            }, true);

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
                    height: vertical ? skinElem.height : ''
                };
            } else {
                newStyle = {
                    background: 'url("' + skinElem.src + '") no-repeat' + center,
                    'background-size': size,
                    width: skinElem.width,
                    height: vertical ? skinElem.height : ''
                };
            }
            element.skin = skinElem;
            _css(_internalSelector((vertical ? '.jwvertical ' : '') + '.jw' + name), _.extend(newStyle, style));
            _elements[name] = element;
            return element;
        }

        function _buildButton(name, pos) {
            if (!_getSkinElement(name + 'Button').src) {
                return null;
            }

            // Don't show volume or mute controls on mobile, since it's not possible to modify audio levels in JS
            if (_isMobile && (name === 'mute' || name.indexOf('volume') === 0)) {
                return null;
            }
            // Having issues with stock (non-chrome) Android browser and showing overlays.
            //  Just remove HD/CC buttons in that case
            if (_nonChromeAndroid && /hd|cc/.test(name)) {
                return null;
            }


            var element = _createSpan();
            var span = _createSpan();
            var divider = _buildDivider(_dividerElement);
            var button = _createElement('button');
            element.className = 'jw' + name;
            if (pos === 'left') {
                _appendChild(element, span);
                _appendChild(element, divider);
            } else {
                _appendChild(element, divider);
                _appendChild(element, span);
            }

            if (!_isMobile) {
                button.addEventListener('click', _buttonClickHandler(name), false);
            } else if (name !== 'hd' && name !== 'cc') {
                var buttonTouch = new Touch(button);
                buttonTouch.on(events.touchEvents.TAP, _buttonClickHandler(name));
            }

            button.innerHTML = '&nbsp;';
            button.tabIndex = -1;
            //fix for postbacks on mobile devices when a <form> is used
            button.setAttribute('type', 'button');
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

            if (_toggleStates[name]) {
                utils.addClass(element, 'jwtoggle');
            } else {
                utils.removeClass(element, 'jwtoggle');
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
                        _this.trigger(events.JWPLAYER_USER_ACTION);
                    }
                }
                if (evt.preventDefault) {
                    evt.preventDefault();
                }
            };
        }


        function _play() {
            _api.play();    // TODO: How does this change interact with buffering
        }

        function _mute() {
            _model.setMute();

            _volumeHandler(_model);
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
                cssUtils.style(_jwhidden, NOT_HIDDEN);
            } else {
                cssUtils.style(_jwhidden, HIDDEN);
            }
        }

        function _showVolume() {
            if (_audioMode || _instreamMode) {
                return;
            }
            cssUtils.block(_id); // unblock on position overlay
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
            _model.setVolume(pct * 100);
        }

        function _seekThrottled(pct) {
            _seekTo = pct;
            _seekThrottler(pct);
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
                position = pct * _duration;
            }
            _api.seek(position);
        }

        function _fullscreen() {
            _api.setFullscreen();
        }

        function _next() {
            _api.playlistNext();
        }

        function _prev() {
            _api.playlistPrev();
        }

        function _toggleButton(name, state) {
            if (!_.isBoolean(state)) {
                state = !_toggleStates[name];
            }

            if (_elements[name]) {
                if (state) {
                    utils.addClass(_elements[name], 'jwtoggle');
                } else {
                    utils.removeClass(_elements[name], 'jwtoggle');
                }

                // Use the jwtoggling class to temporarily disable the animation
                utils.addClass(_elements[name], 'jwtoggling');
                setTimeout(function() {
                    utils.removeClass(_elements[name], 'jwtoggling');
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
                cssUtils.style(element, style);
                element.innerHTML = (name !== 'alt') ? '00:00' : '';

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
            if (_levels.length > 2) {
                if (_hdTimer) {
                    clearTimeout(_hdTimer);
                    _hdTimer = undefined;
                }
                cssUtils.block(_id); // unblock on position overlay
                _hdOverlay.show();
                _positionOverlay('hd', _hdOverlay);
                _hideOverlays('hd');
            }
        }

        function _showCc() {
            if (_captions && _captions.length > 2) {
                if (_ccTimer) {
                    clearTimeout(_ccTimer);
                    _ccTimer = undefined;
                }
                cssUtils.block(_id); // unblock on position overlay
                _ccOverlay.show();
                _positionOverlay('cc', _ccOverlay);
                _hideOverlays('cc');
            }
        }

        function _switchLevel(newlevel) {
            if (newlevel >= 0 && newlevel < _levels.length) {
                _api.setCurrentQuality(newlevel);
                _clearHdTapTimeout();
                _hdOverlay.hide();
            }
        }

        function _switchCaption(newcaption) {
            if (newcaption >= 0 && newcaption < _captions.length) {
                _api.setCurrentCaptions(newcaption);
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
                _api.openExtension();   // TODO: Need to set up this so that we can cast
            } else {
                _api.startCasting();    // TODO: Need to set up this so that we can cast
            }
        }

        function _buildSlider(name) {
            if (_isMobile && name.indexOf('volume') === 0) {
                return;
            }

            var slider = _createSpan(),
                vertical = name === 'volume',
                skinPrefix = name + (name === 'time' ? 'Slider' : ''),
                capPrefix = skinPrefix + 'Cap',
                left = vertical ? 'Top' : 'Left',
                right = vertical ? 'Bottom' : 'Right',
                capLeft = _buildImage(capPrefix + left, null, false, false, vertical),
                capRight = _buildImage(capPrefix + right, null, false, false, vertical),
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
                left: vertical ? '' : capLeftSkin.width,
                right: vertical ? '' : capRightSkin.width,
                top: vertical ? capLeftSkin.height : '',
                bottom: vertical ? capRightSkin.height : '',
                width: vertical ? '100%' : '',
                height: vertical ? 'auto' : ''
            });

            _elements[name] = slider;
            slider.vertical = vertical;

            if (name === 'time') {
                _timeOverlay = new Overlay(_id + '_timetooltip', _skin);
                _timeOverlayThumb = new Thumbs(_id + '_thumb');
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
                sliderPrefix = (name === 'time' ? 'Slider' : '');
                var prefix = name + sliderPrefix + railElements[i],
                    element = _buildImage(prefix, null, !vertical, (name.indexOf('volume') === 0), vertical),
                    capLeft = _buildImage(prefix + 'Cap' + left, null, false, false, vertical),
                    capRight = _buildImage(prefix + 'Cap' + right, null, false, false, vertical),
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
                        'min-width': (vertical ? '' : capLeftSkin.width + capRightSkin.width)
                    });
                    railElement.capSize = vertical ? capLeftSkin.height + capRightSkin.height :
                        capLeftSkin.width + capRightSkin.width;

                    _css(_internalSelector('.' + element.className), {
                        left: vertical ? '' : capLeftSkin.width,
                        right: vertical ? '' : capRightSkin.width,
                        top: vertical ? capLeftSkin.height : '',
                        bottom: vertical ? capRightSkin.height : '',
                        height: vertical ? 'auto' : ''
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

            var thumb = _buildImage(name + sliderPrefix + 'Thumb', null, false, false, vertical);
            if (thumb) {
                _css(_internalSelector('.' + thumb.className), {
                    opacity: name === 'time' ? 0 : 1,
                    'margin-top': vertical ? thumb.skin.height / -2 : ''
                });

                thumb.className += ' jwthumb';
                _appendChild(vertical && progressRail ? progressRail : rail, thumb);
            }

            if (!_isMobile) {
                var sliderName = name;
                if (sliderName === 'volume' && !vertical) {
                    sliderName += 'H';
                }
                rail.addEventListener('mousedown', _sliderMouseDown(sliderName), false);
            } else {
                var railTouch = new Touch(rail);
                railTouch.on(events.touchEvents.DRAG_START, _sliderDragStart);
                railTouch.on(events.touchEvents.DRAG, _sliderDragEvent);
                railTouch.on(events.touchEvents.DRAG_END, _sliderDragEvent);
                railTouch.on(events.touchEvents.TAP, _sliderTapEvent);
            }

            if (name === 'time' && !_isMobile) {
                rail.addEventListener('mousemove', _showTimeTooltip, false);
                rail.addEventListener('mouseout', _hideTimeTooltip, false);
            }

            _elements[name + 'Rail'] = rail;

            return rail;
        }

        function _idle() {
            var currentState = _model.state;
            return (currentState === states.IDLE);
        }

        function _killSelect(evt) {
            evt.preventDefault();
            document.onselectstart = function() {
                return false;
            };
        }

        function _draggingStart(name) {
            _draggingEnd();
            _dragging = name;
            window.addEventListener('mouseup', _sliderMouseEvent, false);
            window.addEventListener('mousemove', _sliderMouseEvent, false);
        }

        function _draggingEnd() {
            window.removeEventListener('mouseup', _sliderMouseEvent);
            window.removeEventListener('mousemove', _sliderMouseEvent);
            _dragging = null;
        }

        function _sliderDragStart() {
            _elements.timeRail.className = 'jwrail';
            if (!_idle()) {
                _seekDrag(true);
                _draggingStart('time');
                _showTimeTooltip();
                _this.trigger(events.JWPLAYER_USER_ACTION);
            }
        }

        function _seekDrag(bool) {
            _model.seekDrag(bool);
            _this.trigger(events.JWPLAYER_CONTROLBAR_DRAGGING, {dragging : bool});
        }

        var _sliderDragEvent = function(evt) {
            if (!_dragging) {
                return;
            }

            var rail = _elements[_dragging].querySelector('.jwrail'),
                railRect = utils.bounds(rail),
                pct = evt.x / railRect.width;
            if (pct > 100) {
                pct = 100;
            }
            if (evt.type === events.touchEvents.DRAG_END) {
                _elements.timeRail.className = 'jwrail';
                _draggingEnd();

                // Send seek event, *then* set seekdrag false
                _sliderMapping.time(pct);
                _seekDrag(false);

                _hideTimeTooltip();
                _this.trigger(events.JWPLAYER_USER_ACTION);
            } else {
                _setProgress(pct);
                _sliderMapping.time(pct);
                _this.trigger(events.JWPLAYER_USER_ACTION);
            }
        };

        function _sliderTapEvent(evt) {
            var rail = _elements.time.querySelector('.jwrail'),
                railRect = utils.bounds(rail),
                pct = evt.x / railRect.width;
            if (pct > 100) {
                pct = 100;
            }
            if (!_idle()) {
                _sliderMapping.time(pct);
                _this.trigger(events.JWPLAYER_USER_ACTION);
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
                        _seekDrag(true);
                        _draggingStart(name);
                    }
                } else {
                    _draggingStart(name);
                }
            };
        }

        var _sliderMouseEvent = function(evt) {
            if (!_dragging || evt.button) {
                return;
            }

            var rail = _elements[_dragging].querySelector('.jwrail'),
                railRect = utils.bounds(rail),
                name = _dragging,
                pct;

            if (_iFramedFullscreenIE()) {
                pct = _elements[name].vertical ? ((railRect.bottom * 100 - evt.pageY) / (railRect.height * 100)) :
                ((evt.pageX - (railRect.left * 100)) / (railRect.width * 100));
            } else {
                pct = _elements[name].vertical ? ((railRect.bottom - evt.pageY) / railRect.height) :
                ((evt.pageX - railRect.left) / railRect.width);
            }
            if (evt.type === 'mouseup') {

                _elements[name + 'Rail'].className = 'jwrail';
                _draggingEnd();

                // Send seek event, *then* set seekdrag false
                _sliderMapping[name.replace('H', '')](pct);
                if (name === 'time') {
                    _seekDrag(false);
                }
            } else {
                if (_dragging === 'time') {
                    _setProgress(pct);
                } else {
                    _setVolume(pct);
                }

                _sliderMapping[_dragging.replace('H', '')](pct);
            }
            return false;
        };

        function _showTimeTooltip(evt) {
            if (evt) {
                _positionTimeTooltip.apply(this, arguments);
            }

            if (_timeOverlay && _duration && !_audioMode && !_isMobile) {
                cssUtils.block(_id); // unblock on position overlay
                _timeOverlay.show();
                _positionOverlay('time', _timeOverlay);
            }
        }

        function _hideTimeTooltip() {
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

            var position,
                width;
            if (_iFramedFullscreenIE()) {
                position = (evt.pageX ? (evt.pageX - _railBounds.left*100) : evt.x);
                width = _railBounds.width *100;
            } else {
                position = (evt.pageX ? (evt.pageX - _railBounds.left) : evt.x);
                width = _railBounds.width;
            }

            _timeOverlay.positionX(Math.round(position));
            _setTimeOverlay(_duration * position / width);
        }

        function _styleTimeSlider() {
            if (!_elements.timeSliderRail) {
                cssUtils.style(_elements.time, HIDDEN);
            }

            if (_elements.timeSliderThumb) {
                cssUtils.style(_elements.timeSliderThumb, {
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
                cueStyle.display = 'none';
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
                        _activeCue = null;
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
                cssUtils.style(cue.element, style);
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
            cssUtils.block(_id); //unblock on redraw
            var jwalt = _elements.alt,
                jwtime = _elements.time;
            if (!_elements.timeSliderRail) {
                cssUtils.style(jwtime, HIDDEN);
            } else {
                cssUtils.style(jwtime, text ? HIDDEN : SHOWING);
            }
            if (jwalt) {
                cssUtils.style(jwalt, text ? SHOWING : HIDDEN);
                jwalt.innerHTML = text || '';
            }
            _redraw();
        };

        function _styleVolumeSlider(slider, vertical, left, right) {
            var prefix = 'volume' + (vertical ? '' : 'H'),
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
                ) : ''
            });

            slider.className += ' jw' + direction;
        }

        function _buildLayout() {
            _buildGroup('left');
            _buildGroup('center');
            _buildGroup('right');
            _appendChild(_controlbar, _groups.left);
            _appendChild(_controlbar, _groups.center);
            _appendChild(_controlbar, _groups.right);
            _buildOverlays();

            cssUtils.style(_groups.right, {
                right: _getSkinElement('capRight').width
            });
        }

        function _buildOverlays() {
            if (_elements.hd) {
                _hdOverlay = new Menu('hd', _id + '_hd', _skin, _switchLevel);
                if (!_isMobile) {
                    _addOverlay(_hdOverlay, _elements.hd, _showHd, _setHdTimer);
                } else {
                    _addMobileOverlay(_hdOverlay, _elements.hd, _showHd, 'hd');
                }
                _overlays.hd = _hdOverlay;
            }
            if (_elements.cc) {
                _ccOverlay = new Menu('cc', _id + '_cc', _skin, _switchCaption);
                if (!_isMobile) {
                    _addOverlay(_ccOverlay, _elements.cc, _showCc, _setCcTimer);
                } else {
                    _addMobileOverlay(_ccOverlay, _elements.cc, _showCc, 'cc');
                }
                _overlays.cc = _ccOverlay;
            }
            if (_elements.mute && _elements.volume && _elements.volume.vertical) {
                _volumeOverlay = new Overlay(_id + '_volumeoverlay', _skin);
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
            button.addEventListener('mousemove', hoverAction, false);
            if (timer) {
                button.addEventListener('mouseout', timer, false);
            } else {
                button.addEventListener('mouseout', overlay.hide, false);
            }
            cssUtils.style(element, {
                left: '50%'
            });
        }

        function _addMobileOverlay(overlay, button, tapAction, name) {
            if (!_isMobile) {
                return;
            }
            var element = overlay.element();
            _appendChild(button, element);
            var buttonTouch = new Touch(button);
            buttonTouch.on(events.touchEvents.TAP, function() {
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
                        _ccTapTimer = undefined;
                    }, 4000);
                    tapAction();
                }
                _this.trigger(events.JWPLAYER_USER_ACTION);
            } else if (name === 'hd') {
                if (_levels.length === 2) {
                    tapAction = _hd;
                }
                if (_hdTapTimer) {
                    _clearHdTapTimeout();
                    overlay.hide();
                } else {
                    // TODO:: _.throttle
                    _hdTapTimer = setTimeout(function() {
                        overlay.hide();
                        _hdTapTimer = undefined;
                    }, 4000);
                    tapAction();
                }
                _this.trigger(events.JWPLAYER_USER_ACTION);
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
                            _volumeOverlay = new Overlay(_id + '_volumeOverlay', _skin);
                            _volumeOverlay.setContents(element);
                        } else {
                            _appendChild(container, element);
                        }
                    }
                }
            }
        }

        function _iFramedFullscreenIE() {
            return (_iFramed && utils.isIE() && _seek.jwGetFullscreen());
        }

        function _redraw() {
            clearTimeout(_redrawTimeout);
            // Scoping issue in IE8.  _this.redraw isn't always defined.
            if(_this.redraw) {
                _redrawTimeout = setTimeout(_this.redraw , 0);
            }
        }

        _this.redraw = function(resize) {
            cssUtils.block(_id);

            if (resize && _this.visible) {
                _this.show(true);
            }
            _createStyles();

            // ie <= IE10 does not allow fullscreen from inside an iframe. Hide the FS button.
            var ieIframe = _iFramed && utils.isMSIE();
            var casting = _castState.active;
            cssUtils.style(_elements.fullscreen, {
                display: (_audioMode || casting || _hideFullscreen || ieIframe) ? 'none' : ''
            });

            // TODO: hide these all by default (global styles at bottom), and update using classes when model changes:
            // jwinstream, jwaudio, jwhas-hd, jwhas-cc (see jwcancast)
            cssUtils.style(_elements.volumeH, {
                display: _audioMode || _instreamMode ? 'block' : 'none'
            });
            var maxWidth = Math.floor(_settings.maxwidth);
            if (maxWidth) {
                if (_controlbar.parentNode && utils.isIE()) {
                    if (!_audioMode &&
                        _controlbar.parentNode.clientWidth > maxWidth + (Math.floor(_settings.margin) * 2)) {
                        cssUtils.style(_controlbar, {
                            width: maxWidth
                        });
                    } else {
                        cssUtils.style(_controlbar, {
                            width: ''
                        });
                    }
                }
            }

            if (_volumeOverlay) {
                cssUtils.style(_volumeOverlay.element(), {
                    display: !(_audioMode || _instreamMode) ? 'block' : 'none'
                });
            }
            cssUtils.style(_elements.hd, {
                display: !_audioMode && !casting && _hasHD() ? '' : 'none'
            });
            cssUtils.style(_elements.cc, {
                display: !_audioMode && _hasCaptions() ? '' : 'none'
            });



            _drawCues();

            // utils.foreach(_overlays, _positionOverlay);

            cssUtils.unblock(_id);

            if (_this.visible) {
                var capLeft  = _getSkinElement('capLeft'),
                    capRight = _getSkinElement('capRight'),
                    centerCss;
                if (_iFramedFullscreenIE()) {
                    centerCss = {
                        left: Math.round(utils.parseDimension(_groups.left.offsetWidth*62) + capLeft.width),
                        right: Math.round(utils.parseDimension(_groups.right.offsetWidth*86) + capRight.width)
                    };
                } else {
                    centerCss = {
                        left: Math.round(utils.parseDimension(_groups.left.offsetWidth) + capLeft.width),
                        right: Math.round(utils.parseDimension(_groups.right.offsetWidth) + capRight.width)
                    };
                }
                cssUtils.style(_groups.center, centerCss);
            }
        };

        function _updateNextPrev() {
            if (!_adMode && _model.playlist.length > 1) {
                cssUtils.style(_elements.next, NOT_HIDDEN);
                cssUtils.style(_elements.prev, NOT_HIDDEN);
            } else {
                cssUtils.style(_elements.next, HIDDEN);
                cssUtils.style(_elements.prev, HIDDEN);
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
            if (mode !== undefined && mode !== _audioMode) {
                _audioMode = !!mode;
                _redraw();
            }
            return _audioMode;
        };

        _this.instreamMode = function(mode) {
            if (mode !== undefined && mode !== _instreamMode) {
                _instreamMode = !!mode;
                // TODO: redraw

                // instreamMode is when we add a second cbar overtop the original
                cssUtils.style(_elements.cast, _instreamMode ? HIDDEN : NOT_HIDDEN);
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

                cssUtils.style([
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
            if (mode !== undefined && mode !== _hideFullscreen) {
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
                cssUtils.style(_elements.timeSliderBuffer, {
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
                prefix = name + (name === 'time' ? 'Slider' : ''),
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
                cssUtils.style(progress, style);
            }

            if (thumb) {
                style = {};
                if (vertical) {
                    style.top = 0;
                } else {
                    style.left = size;
                }
                cssUtils.style(thumb, style);
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
                } else {
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
                    src: '',
                    image: undefined,
                    ready: false
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
                display: 'inline-block'
            };

            cssUtils.style(_controlbar, style);
            _cbBounds = utils.bounds(_controlbar);

            _toggleTimesDisplay();

            cssUtils.block(_id); //unblock on redraw

            _volumeHandler(_model);
            _redraw();

            _clearHideTimeout();
            _hideTimeout = setTimeout(function() {
                cssUtils.style(_controlbar, {
                    opacity: 1
                });
            }, 0);
        };

        _this.showTemp = function() {
            if (!this.visible) {
                _controlbar.style.opacity = 0;
                _controlbar.style.display = 'inline-block';
            }
        };

        _this.hideTemp = function() {
            if (!this.visible) {
                _controlbar.style.display = 'none';
            }
        };


        function _clearHideTimeout() {
            clearTimeout(_hideTimeout);
            _hideTimeout = -1;
        }

        function _clearCcTapTimeout() {
            clearTimeout(_ccTapTimer);
            _ccTapTimer = undefined;
        }

        function _clearHdTapTimeout() {
            clearTimeout(_hdTapTimer);
            _hdTapTimer = undefined;
        }

        function _loadCues(vttFile) {
            if (vttFile) {
                utils.ajax(vttFile, _cueLoaded, _cueFailed, true);
            } else {
                _cues.length = 0;
            }
        }

        function _cueLoaded(xmlEvent) {
            var parser = new SrtParser();
            var data = parser.parse(xmlEvent.responseText, true);
            if (!_.isArray(data)) {
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
            // Don't hide for mobile ads if controls are enabled
            if (_instreamMode && _isMobile && _model.controls) {
                return;
            }
            _this.visible = false;
            cssUtils.style(_controlbar, {
                opacity: 0
            });
            _clearHideTimeout();
            _hideTimeout = setTimeout(function() {
                cssUtils.style(_controlbar, {
                    display: 'none'
                });
            }, JW_VISIBILITY_TIMEOUT);
        };
    };

    /***************************************************************************
     * Player stylesheets - done once on script initialization; * These CSS
     * rules are used for all JW Player instances *
     **************************************************************************/

    (function() {
        var JW_CSS_ABSOLUTE = 'absolute',
            JW_CSS_RELATIVE = 'relative',
            JW_CSS_SMOOTH_EASE = 'opacity .25s, background .25s, visibility .25s',
            CB_CLASS = 'span.jwcontrolbar';

        _css(CB_CLASS, {
            position: JW_CSS_ABSOLUTE,
            margin: 'auto',
            opacity: 0,
            display: 'none'
        });

        _css(CB_CLASS + ' span', {
            height: '100%'
        });
        cssUtils.dragStyle(CB_CLASS + ' span', 'none');

        _css(CB_CLASS + ' .jwgroup', {
            display: 'inline'
        });

        _css(CB_CLASS + ' span, ' + CB_CLASS + ' .jwgroup button,' + CB_CLASS + ' .jwleft', {
            position: JW_CSS_RELATIVE,
            'float': 'left'
        });

        _css(CB_CLASS + ' .jwright', {
            position: JW_CSS_RELATIVE,
            'float': 'right'
        });

        _css(CB_CLASS + ' .jwcenter', {
            position: JW_CSS_ABSOLUTE
        });

        _css(CB_CLASS + ' button', {
            display: 'inline-block',
            height: '100%',
            border: 'none',
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
            height: '100%',
            width: '100%',
            left: 0
        });

        _css(CB_CLASS + ' .jwthumb', {
            position: JW_CSS_ABSOLUTE,
            height: '100%',
            cursor: 'pointer'
        });

        _css(CB_CLASS + ' .jwrail', {
            position: JW_CSS_ABSOLUTE,
            cursor: 'pointer'
        });

        _css(CB_CLASS + ' .jwrailgroup', {
            position: JW_CSS_ABSOLUTE,
            width: '100%'
        });

        _css(CB_CLASS + ' .jwrailgroup span', {
            position: JW_CSS_ABSOLUTE
        });

        _css(CB_CLASS + ' .jwdivider+.jwdivider', {
            display: 'none'
        });

        _css(CB_CLASS + ' .jwtext', {
            padding: '0 5px',
            'text-align': 'center'
        });

        _css(CB_CLASS + ' .jwcast', {
            display: 'none'
        });

        _css(CB_CLASS + ' .jwcast.jwcancast', {
            display: 'block'
        });

        _css(CB_CLASS + ' .jwalt', {
            display: 'none',
            overflow: 'hidden'
        });

        // important
        _css(CB_CLASS + ' .jwalt', {
            position: JW_CSS_ABSOLUTE,
            left: 0,
            right: 0,
            'text-align': 'left'
        }, true);

        _css(CB_CLASS + ' .jwoverlaytext', {
            padding: 3,
            'text-align': 'center'
        });

        _css(CB_CLASS + ' .jwvertical *', {
            display: 'block'
        });

        // important
        _css(CB_CLASS + ' .jwvertical .jwvolumeProgress', {
            height: 'auto'
        }, true);

        _css(CB_CLASS + ' .jwprogressOverflow', {
            position: JW_CSS_ABSOLUTE,
            overflow: 'hidden'
        });

        _setTransition(CB_CLASS, JW_CSS_SMOOTH_EASE);
        _setTransition(CB_CLASS + ' button', JW_CSS_SMOOTH_EASE);
        _setTransition(CB_CLASS + ' .jwtoggling', 'none');
    })();

    return Controlbar;
});
