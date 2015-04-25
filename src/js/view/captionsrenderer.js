define([
    'utils/css',
    'events/states',
    'utils/underscore'
], function(cssUtils, states, _) {
    var _style = cssUtils.style;

    var _defaults = {
        back: true,
        fontSize: 15,
        fontFamily: 'Arial,sans-serif',
        fontOpacity: 100,
        backgroundColor: '#000',
        backgroundOpacity: 100,
        // if back == false edgeStyle defaults to 'uniform',
        // otherwise it's 'none'
        edgeStyle: null,
        windowColor: '#FFF',
        windowOpacity: 0
    };

    /** Component that renders the actual captions on screen. **/
    var CaptionsRenderer = function (_model) {

        var _options = {},
            /** Current list with captions. **/
            _captions,
            /** Captions view layer **/
            _display,
            /** Container of captions text. **/
            _captionsWindow,
            /** Text container of captions. **/
            _textContainer,
            /** Current actie captions entry. **/
            _current,
            /** Current video position. **/
            _position;

        _display = document.createElement('div');

        this.show = function () {
            _display.className = 'jw-captions jw-captions-enabled';
        };

        this.hide = function () {
            _display.className = 'jw-captions';
        };

        /** Assign list of captions to the renderer. **/
        this.populate = function(captions) {
            _current = -1;
            _captions = captions;
            if (!captions) {
                _render('');
                return;
            }
            _select();
        };
        
        /** Render the active caption. **/
        function _render(html) {
            html = html || '';
            var windowClassName = 'jw-captions-window';
            if (html) {
                _textContainer.innerHTML = html;
                windowClassName += ' jw-captions-window-active';
            } else {
                if (_textContainer.firstChild) {
                    _textContainer.removeChild(_textContainer.firstChild);
                }
            }
            _captionsWindow.className = windowClassName;
        }

        this.resize = function () {
            var width = _display.clientWidth,
                scale = Math.pow(width / 400, 0.6);
            if (scale) {
                var size = _options.fontSize * scale;
                _style(_display, {
                    fontSize: Math.round(size) + 'px'
                });
            }
        };

        /** Select a caption for rendering. **/
        function _select() {
            var found = -1;
            if (_current >= 0 && _intersects(_current)) {
                // no change
                return;
            }
            for (var i = 0; i < _captions.length; i++) {
                if (_intersects(i)) {
                    found = i;
                    break;
                }
            }
            // If none, empty the text. If not current, re-render.
            if (found === -1) {
                _render('');
            } else if (found !== _current) {
                _current = found;
                _render(_captions[_current].text);
            }
        }

        function _intersects(i) {
            return (_captions[i].begin <= _position &&
                (i === _captions.length - 1 || _captions[i + 1].begin >= _position));
        }

        /** Constructor for the renderer. **/
        this.setup = function(options) {
            _options = _.extend({}, _defaults, options);

            var fontOpacity = _options.fontOpacity,
                windowOpacity = _options.windowOpacity,
                edgeStyle = _options.edgeStyle,
                bgColor = _options.backgroundColor,
                windowStyle = {},
                textStyle = {
                    color: cssUtils.hexToRgba(cssUtils.rgbHex(_options.color), fontOpacity),
                    fontFamily: _options.fontFamily,
                    fontStyle: _options.fontStyle,
                    fontWeight: _options.fontWeight,
                    textDecoration: _options.textDecoration
                };

            if (windowOpacity) {
                windowStyle.backgroundColor = cssUtils.hexToRgba(cssUtils.rgbHex(_options.windowColor), windowOpacity);
            }

            addEdgeStyle(edgeStyle, textStyle, fontOpacity);

            if (_options.back) {
                textStyle.backgroundColor = cssUtils.hexToRgba(cssUtils.rgbHex(bgColor), _options.backgroundOpacity);
            } else if (edgeStyle === null) {
                addEdgeStyle('uniform', textStyle);
            }

            _captionsWindow = document.createElement('div');
            _textContainer = document.createElement('span');
            _captionsWindow.className = 'jw-captions-window';
            _textContainer.className = 'jw-captions-text';

            _style(_captionsWindow, windowStyle);
            _style(_textContainer, textStyle);

            _captionsWindow.appendChild(_textContainer);
            _display.appendChild(_captionsWindow);

            this.populate(_model.get('captionsTrack'));
        };

        function addEdgeStyle(option, style, fontOpacity) {
            var color = cssUtils.hexToRgba('#000000', fontOpacity);
            if (option === 'dropshadow') { // small drop shadow
                style.textShadow = '0 2px 1px ' + color;
            } else if (option === 'raised') { // larger drop shadow
                style.textShadow = '0 0 5px ' + color + ', 0 1px 5px ' + color + ', 0 2px 5px ' + color;
            } else if (option === 'depressed') { // top down shadow
                style.textShadow = '0 -2px 1px ' + color;
            } else if (option === 'uniform') { // outline
                style.textShadow = '-2px 0 1px ' + color + ',2px 0 1px ' + color +
                    ',0 -2px 1px ' + color + ',0 2px 1px ' + color + ',-1px 1px 1px ' +
                    color + ',1px 1px 1px ' + color + ',1px -1px 1px ' + color +
                    ',1px 1px 1px ' + color;
            }
        }

        /** Update the video position. **/
        this.update = function (position) {
            _position = position;
            if (_captions) {
                _select();
            }
        };

        this.element = function() {
          return _display;
        };

        _model.on('change:captionsTrack', function(model, captionsTrack) {
            this.populate(captionsTrack);
        }, this);
        _model.on('change:captions', function() {
            this.update(0);
        }, this);
        _model.on('change:position', function(model, pos) {
            this.update(pos);
        }, this);
        _model.mediaController.on('seek', function(e) {
            this.update(e.position);
        }, this);
        _model.on('change:state', function(model, state) {
            var captions = model.get('captions');
            switch (state) {
                case states.IDLE:
                case states.COMPLETE:
                    this.hide();
                    break;
                default:
                    if (captions.length && _model.get('captionsIndex') > 0) {
                        this.show();
                    }
                    break;
            }
        }, this);
    };

    return CaptionsRenderer;
});
