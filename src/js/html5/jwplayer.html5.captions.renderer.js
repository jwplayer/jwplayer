(function(jwplayer) {
    var html5 = jwplayer.html5,
        utils = jwplayer.utils,
        _style = utils.css.style;

    /** Component that renders the actual captions on screen. **/
    html5.captions.renderer = function(_options, _div) {

        /** Current list with captions. **/
        var _captions,
            /** Container of captions window. **/
            _container,
            /** Container of captions text. **/
            _captionsWindow,
            /** Text container of captions. **/
            _textContainer,
            /** Current actie captions entry. **/
            _current,
            /** Current video position. **/
            _position,
            /** Should the captions be visible or not. **/
            _visible = 'visible',
            /** Interval for resize. **/
            _interval = -1;


        /** Hide the rendering component. **/
        this.hide = function() {
            clearInterval(_interval);
            _style(_container, {
                display: 'none'
            });
        };

        /** Assign list of captions to the renderer. **/
        this.populate = function(captions) {
            _current = -1;
            _captions = captions;
            _select();
        };

        /** Render the active caption. **/
        function _render(html) {
            html = html || '';
            //hide containers before resizing
            _visible = 'hidden';
            _style(_container, {
                visibility: _visible
            });
            //update text and resize after delay
            _textContainer.innerHTML = html;
            if (html.length) {
                _visible = 'visible';
                setTimeout(_resize, 16);
            }
        }

        /** Store new dimensions. **/
        this.resize = function() {
            _resize();
        };

        /** Resize the captions. **/
        function _resize() {
            // only resize if visible
            if (_visible === 'visible') {
                var width = _container.clientWidth,
                    scale = Math.pow(width / 400, 0.6);

                var size = _options.fontSize * scale;
                _style(_textContainer, {
                    maxWidth: width + 'px',
                    fontSize: Math.round(size) + 'px',
                    lineHeight: Math.round(size * 1.4) + 'px',
                    padding: Math.round(1 * scale) + 'px ' + Math.round(8 * scale) + 'px'
                });
                if (_options.windowOpacity) {
                    _style(_captionsWindow, {
                        padding: Math.round(5 * scale) + 'px',
                        borderRadius: Math.round(5 * scale) + 'px'
                    });
                }
                _style(_container, {
                    visibility: _visible
                });
            }
        }

        /** Select a caption for rendering. **/
        function _select() {
            var found = -1;
            for (var i = 0; i < _captions.length; i++) {
                if (_captions[i].begin <= _position &&
                    (i === _captions.length - 1 || _captions[i + 1].begin >= _position)) {
                    found = i;
                    break;
                }
            }
            // If none, empty the text. If not current, re-render.
            if (found === -1) {
                _render('');
            } else if (found !== _current) {
                _current = found;
                _render(_captions[i].text);
            }
        }

        /** Constructor for the renderer. **/
        function _setup() {
            var fontOpacity = _options.fontOpacity,
                windowOpacity = _options.windowOpacity,
                edgeStyle = _options.edgeStyle,
                bgColor = _options.backgroundColor,
                windowStyle = {
                    display: 'inline-block'
                },
                textStyle = {
                    color: utils.hexToRgba(utils.rgbHex(_options.color), fontOpacity),
                    display: 'inline-block',
                    fontFamily: _options.fontFamily,
                    fontStyle: _options.fontStyle,
                    fontWeight: _options.fontWeight,
                    textAlign: 'center',
                    textDecoration: _options.textDecoration,
                    wordWrap: 'break-word'
                };

            if (windowOpacity) {
                windowStyle.backgroundColor = utils.hexToRgba(utils.rgbHex(_options.windowColor), windowOpacity);
            }

            addEdgeStyle(edgeStyle, textStyle, fontOpacity);

            if (_options.back) {
                textStyle.backgroundColor = utils.hexToRgba(utils.rgbHex(bgColor), _options.backgroundOpacity);
            } else if (edgeStyle === null) {
                addEdgeStyle('uniform', textStyle);
            }

            _container = document.createElement('div');
            _captionsWindow = document.createElement('div');
            _textContainer = document.createElement('span');

            _style(_container, {
                display: 'block',
                height: 'auto',
                position: 'absolute',
                bottom: '20px',
                textAlign: 'center',
                width: '100%'
            });

            _style(_captionsWindow, windowStyle);

            _style(_textContainer, textStyle);

            _captionsWindow.appendChild(_textContainer);
            _container.appendChild(_captionsWindow);
            _div.appendChild(_container);
        }

        function addEdgeStyle(option, style, fontOpacity) {
            var color = utils.hexToRgba('#000000', fontOpacity);
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

        /** Show the rendering component. **/
        this.show = function() {
            _style(_container, {
                display: 'block'
            });
            _resize();
            clearInterval(_interval);
            _interval = setInterval(_resize, 250);
        };

        /** Update the video position. **/
        this.update = function(position) {
            _position = position;
            if (_captions) {
                _select();
            }
        };

        _setup();
    };

})(jwplayer);
