define([
    'utils/helpers',
    'utils/css',
    'underscore'
], function(utils, cssUtils, _) {
    /*jshint -W069 */

    var _css = cssUtils.css,
        DI_CLASS = '.jwplayer .jwdisplayIcon',
        DOCUMENT = document,

        /** Some CSS constants we should use for minimization */
        JW_CSS_100PCT = '100%',
        JW_CSS_CENTER = 'center';

    var DisplayIcon = function(_playerId, _id, _skin, _api) {
        _api.onResize(_setWidth);

        var _container = _createElement('jwdisplayIcon'),
            _bgSkin,
            _capLeftSkin,
            _capRightSkin,
            _hasCaps,
            _icon = _createElement('jwicon', _container),
            _iconCache = {},
            _iconElement,
            _iconWidth = 0;

        _container.id = _id;

        _createBackground();

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
                overstyle = _.extend({}, overstyle);
                overstyle['background-image'] = 'url(' + skinElem.overSrc + ')';
            }
            if (skinElem.src) {
                style = _.extend({}, style);
                if (name.indexOf('Icon') > 0) {
                    _iconWidth = skinElem.width | 0;
                }
                style.width = skinElem.width;
                style['background-image'] = 'url(' + skinElem.src + ')';
                style['background-size'] = skinElem.width + 'px ' + skinElem.height + 'px';
                style['float'] = 'none';

                cssUtils.style(_container, {
                    display: ''
                });
            } else {
                cssUtils.style(_container, {
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
            _setWidth();
        }

        function _setWidth() {

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
            cssUtils.style(_container, style);
        }

        this.element = function() {
            return _container;
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
            cssUtils.rotate(_icon, _currentAngle);
        }

        this.setRotation = startRotation;


        var _hide = this.hide = function() {
            _container.style.opacity = 0;
            _container.style.cursor = '';
        };

        this.show = function() {
            _container.style.opacity = 1;
            _container.style.cursor = 'pointer';
        };

        _hide();
        _redraw();
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

    _css('.jwplayer.jw-flag-dragging .jwdisplayIcon', {
        'display':'none'
    });

    return DisplayIcon;
});
