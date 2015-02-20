(function(jwplayer) {
    /*jshint maxparams:5*/
    /*jshint -W069 */
    var html5 = jwplayer.html5,
        utils = jwplayer.utils,
        _css = utils.css,

        DI_CLASS = '.jwplayer .jwdisplayIcon',
        DOCUMENT = document,

        /** Some CSS constants we should use for minimization */
        JW_CSS_NONE = 'none',
        JW_CSS_100PCT = '100%',
        JW_CSS_CENTER = 'center';

    html5.displayicon = function(_id, _api, textStyle, textStyleOver) {
        var _skin = _api.skin,
            _playerId = _api.id,
            _container,
            _bgSkin,
            _capLeftSkin,
            _capRightSkin,
            _hasCaps,
            _text,
            _icon,
            _iconCache = {},
            _iconElement,
            _iconWidth = 0,
            _setWidthTimeout = -1,
            _repeatCount = 0;

        if (_api instanceof jwplayer.html5.instream) {
            _playerId = _playerId.replace('_instream', '');
        }

        function _init() {
            _container = _createElement('jwdisplayIcon');
            _container.id = _id;

            _createBackground();
            _text = _createElement('jwtext', _container, textStyle, textStyleOver);
            _icon = _createElement('jwicon', _container);

            _api.jwAddEventListener(jwplayer.events.JWPLAYER_RESIZE, _setWidth);

            _hide();
            _redraw();
        }

        function _internalSelector() {
            return '#' + _id;
        }

        function _createElement(name, parent, style, overstyle) {
            var elem = DOCUMENT.createElement('div');

            elem.className = name;
            if (parent) {
                parent.appendChild(elem);
            }

            if (_container) {
                _styleIcon(name, '.' + name, style, overstyle);
            }
            return elem;
        }

        function _createBackground() {
            _bgSkin = _getSkinElement('background');
            _capLeftSkin = _getSkinElement('capLeft');
            _capRightSkin = _getSkinElement('capRight');
            _hasCaps = (_capLeftSkin.width * _capRightSkin.width > 0);

            var style = {
                'background-image': 'url(' + _capLeftSkin.src + '), url(' +
                    _bgSkin.src + '), url(' + _capRightSkin.src + ')',
                'background-position': 'left,center,right',
                'background-repeat': 'no-repeat',
                padding: '0 ' + _capRightSkin.width + 'px 0 ' + _capLeftSkin.width + 'px',
                height: _bgSkin.height,
                'margin-top': _bgSkin.height / -2
            };
            _css(_internalSelector(), style);

            if (!utils.isMobile()) {
                if (_bgSkin.overSrc) {
                    style['background-image'] = 'url(' +
                        _capLeftSkin.overSrc + '), url(' + _bgSkin.overSrc + '), url(' + _capRightSkin.overSrc + ')';
                }
                _css('.jw-tab-focus ' + _internalSelector() +
                    ', #' + _playerId + ' .jwdisplay:hover ' + _internalSelector(), style);
            }
        }

        function _styleIcon(name, selector, style, overstyle) {
            var skinElem = _getSkinElement(name);
            if (name === 'replayIcon' && !skinElem.src) {
                skinElem = _getSkinElement('playIcon');
            }
            if (skinElem.overSrc) {
                overstyle = utils.extend({}, overstyle);
                overstyle['background-image'] = 'url(' + skinElem.overSrc + ')';
            }
            if (skinElem.src) {
                style = utils.extend({}, style);
                if (name.indexOf('Icon') > 0) {
                    _iconWidth = skinElem.width | 0;
                }
                style.width = skinElem.width;
                style['background-image'] = 'url(' + skinElem.src + ')';
                style['background-size'] = skinElem.width + 'px ' + skinElem.height + 'px';
                style['float'] = 'none';

                _css.style(_container, {
                    display: 'table'
                });
            } else {
                _css.style(_container, {
                    display: 'none'
                });
            }
            if (style) {
                _css('#' + _playerId + ' .jwdisplay ' + selector, style);
            }
            if (overstyle) {
                _css('#' + _playerId + ' .jwdisplay:hover ' + selector, overstyle);
            }
            _iconElement = skinElem;
        }

        function _getSkinElement(name) {
            var elem = _skin.getSkinElement('display', name),
                overElem = _skin.getSkinElement('display', name + 'Over');

            if (elem) {
                elem.overSrc = (overElem && overElem.src) ? overElem.src : '';
                return elem;
            }
            return {
                src: '',
                overSrc: '',
                width: 0,
                height: 0
            };
        }

        function _redraw() {
            var showText = _hasCaps || (_iconWidth === 0);

            _css.style(_text, {
                display: (_text.innerHTML && showText) ? '' : JW_CSS_NONE
            });

            _repeatCount = showText ? 30 : 0;
            _setWidth();
        }

        function _setWidth() {
            clearTimeout(_setWidthTimeout);
            if (_repeatCount-- > 0) {
                _setWidthTimeout = setTimeout(_setWidth, 33);
            }

            var px100pct = 'px ' + JW_CSS_100PCT;
            var contentWidth = Math.ceil(Math.max(_iconElement.width,
                        utils.bounds(_container).width - _capRightSkin.width - _capLeftSkin.width));
            var backgroundSize = [
                    _capLeftSkin.width + px100pct,
                    contentWidth + px100pct,
                    _capRightSkin.width + px100pct
            ].join(', ');
            var style = {
                'background-size': backgroundSize
            };
            if (_container.parentNode) {
                style.left = (_container.parentNode.clientWidth % 2 === 1) ? '0.5px' : '';
            }
            _css.style(_container, style);
        }

        this.element = function() {
            return _container;
        };

        this.setText = function(text) {
            var style = _text.style;
            _text.innerHTML = text ? text.replace(':', ':<br>') : '';
            style.height = '0';
            style.display = 'block';
            if (text) {
                while (numLines(_text) > 2) {
                    _text.innerHTML = _text.innerHTML.replace(/(.*) .*$/, '$1...');
                }
            }
            style.height = '';
            style.display = '';
            _redraw();
        };

        this.setIcon = function(name) {
            var icon = _iconCache[name];
            if (!icon) {
                icon = _createElement('jwicon');
                icon.id = _container.id + '_' + name;
                _iconCache[name] = icon;
            }
            _styleIcon(name + 'Icon', '#' + icon.id);
            if (_container.contains(_icon)) {
                _container.replaceChild(icon, _icon);
            } else {
                _container.appendChild(icon);
            }
            _icon = icon;
        };

        var _bufferInterval,
            _bufferAngle = 0,
            _currentAngle;

        function startRotation(angle, interval) {
            clearInterval(_bufferInterval);
            _currentAngle = 0;
            _bufferAngle = angle | 0;
            if (_bufferAngle === 0) {
                rotateIcon();
            } else {
                _bufferInterval = setInterval(rotateIcon, interval);
            }
        }

        function rotateIcon() {
            _currentAngle = (_currentAngle + _bufferAngle) % 360;
            utils.rotate(_icon, _currentAngle);
        }

        this.setRotation = startRotation;

        function numLines(element) {
            return Math.floor(element.scrollHeight /
                DOCUMENT.defaultView.getComputedStyle(element, null).lineHeight.replace('px', ''));
        }


        var _hide = this.hide = function() {
            _container.style.opacity = 0;
            _container.style.cursor = '';
        };

        this.show = function() {
            _container.style.opacity = 1;
            _container.style.cursor = 'pointer';
        };

        _init();
    };

    _css(DI_CLASS, {
        display: 'table',
        position: 'relative',
        'margin-left': 'auto',
        'margin-right': 'auto',
        top: '50%',
        'float': 'none'
    });

    _css(DI_CLASS + ' div', {
        position: 'relative',
        display: 'table-cell',
        'vertical-align': 'middle',
        'background-repeat': 'no-repeat',
        'background-position': JW_CSS_CENTER
    });

    _css(DI_CLASS + ' div', {
        'vertical-align': 'middle'
    }, true);

    _css(DI_CLASS + ' .jwtext', {
        color: '#fff',
        padding: '0 1px',
        'max-width': '300px',
        'overflow-y': 'hidden',
        'text-align': JW_CSS_CENTER,
        '-webkit-user-select': JW_CSS_NONE,
        '-moz-user-select': JW_CSS_NONE,
        '-ms-user-select': JW_CSS_NONE,
        'user-select': JW_CSS_NONE
    });

})(jwplayer);
