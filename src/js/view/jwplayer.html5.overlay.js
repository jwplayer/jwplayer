/**
 * JW Player HTML5 overlay component
 *
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
    var html5 = jwplayer.html5,
        utils = jwplayer.utils,
        _css = utils.css,
        _setTransition = utils.transitionStyle,

        OVERLAY_CLASS = '.jwoverlay',
        CONTENTS_CLASS = 'jwcontents',

        TOP = 'top',
        BOTTOM = 'bottom',
        RIGHT = 'right',
        LEFT = 'left',
        WHITE = '#ffffff',

        _defaults = {
            fontcase: undefined,
            fontcolor: WHITE,
            fontsize: 12,
            fontweight: undefined,
            activecolor: WHITE,
            overcolor: WHITE
        };

    /** HTML5 Overlay class **/
    html5.overlay = function(id, skin, inverted) {
        var _this = this,
            _id = id,
            _skin = skin,
            _inverted = inverted,
            _container,
            _contents,
            _arrow,
            _arrowElement,
            _settings = utils.extend({}, _defaults, _skin.getComponentSettings('tooltip')),
            _borderSizes = {};

        function _init() {
            _container = _createElement(OVERLAY_CLASS.replace('.', ''));
            _container.id = _id;

            var arrow = _createSkinElement('arrow', 'jwarrow');
            _arrowElement = arrow[0];
            _arrow = arrow[1];

            _css.style(_arrowElement, {
                position: 'absolute',
                //bottom: _inverted ? undefined : -1 * _arrow.height,
                bottom: _inverted ? undefined : 0,
                top: _inverted ? 0 : undefined,
                width: _arrow.width,
                height: _arrow.height,
                left: '50%'
            });

            _createBorderElement(TOP, LEFT);
            _createBorderElement(BOTTOM, LEFT);
            _createBorderElement(TOP, RIGHT);
            _createBorderElement(BOTTOM, RIGHT);
            _createBorderElement(LEFT);
            _createBorderElement(RIGHT);
            _createBorderElement(TOP);
            _createBorderElement(BOTTOM);

            var back = _createSkinElement('background', 'jwback');
            _css.style(back[0], {
                left: _borderSizes.left,
                right: _borderSizes.right,
                top: _borderSizes.top,
                bottom: _borderSizes.bottom
            });

            _contents = _createElement(CONTENTS_CLASS, _container);
            _css(_internalSelector(CONTENTS_CLASS) + ' *', {
                color: _settings.fontcolor,
                font: _settings.fontweight + ' ' + (_settings.fontsize) + 'px Arial,Helvetica,sans-serif',
                'text-transform': (_settings.fontcase === 'upper') ? 'uppercase' : undefined
            });


            if (_inverted) {
                utils.transform(_internalSelector('jwarrow'), 'rotate(180deg)');
            }

            _css.style(_container, {
                padding: (_borderSizes.top + 1) + 'px ' + _borderSizes.right +
                    'px ' + (_borderSizes.bottom + 1) + 'px ' + _borderSizes.left + 'px'
            });

            _this.showing = false;
        }

        function _internalSelector(name) {
            return '#' + _id + (name ? ' .' + name : '');
        }

        function _createElement(className, parent) {
            var elem = document.createElement('div');
            if (className) {
                elem.className = className;
            }
            if (parent) {
                parent.appendChild(elem);
            }
            return elem;
        }


        function _createSkinElement(name, className) {
            var skinElem = _getSkinElement(name),
                elem = _createElement(className, _container);

            _css.style(elem, _formatBackground(skinElem));
            //_css(_internalSelector(className.replace(' ', '.')), _formatBackground(skinElem));

            return [elem, skinElem];

        }

        function _formatBackground(elem) {
            return {
                background: 'url(' + elem.src + ') center',
                'background-size': elem.width + 'px ' + elem.height + 'px'
            };
        }

        function _createBorderElement(dim1, dim2) {
            if (!dim2) {
                dim2 = '';
            }
            var created = _createSkinElement('cap' + dim1 + dim2, 'jwborder jw' + dim1 + (dim2 ? dim2 : '')),
                elem = created[0],
                skinElem = created[1],
                elemStyle = utils.extend(_formatBackground(skinElem), {
                    width: (dim1 === LEFT || dim2 === LEFT || dim1 === RIGHT || dim2 === RIGHT) ?
                        skinElem.width : undefined,
                    height: (dim1 === TOP || dim2 === TOP || dim1 === BOTTOM || dim2 === BOTTOM) ?
                        skinElem.height : undefined
                });


            elemStyle[dim1] = ((dim1 === BOTTOM && !_inverted) || (dim1 === TOP && _inverted)) ? _arrow.height : 0;
            if (dim2) {
                elemStyle[dim2] = 0;
            }

            _css.style(elem, elemStyle);
            //_css(_internalSelector(elem.className.replace(/ /g, '.')), elemStyle);

            var dim1style = {},
                dim2style = {},
                dims = {
                    left: skinElem.width,
                    right: skinElem.width,
                    top: (_inverted ? _arrow.height : 0) + skinElem.height,
                    bottom: (_inverted ? 0 : _arrow.height) + skinElem.height
                };
            if (dim2) {
                dim1style[dim2] = dims[dim2];
                dim1style[dim1] = 0;
                dim2style[dim1] = dims[dim1];
                dim2style[dim2] = 0;
                _css(_internalSelector('jw' + dim1), dim1style);
                _css(_internalSelector('jw' + dim2), dim2style);
                _borderSizes[dim1] = dims[dim1];
                _borderSizes[dim2] = dims[dim2];
            }
        }

        _this.element = function() {
            return _container;
        };

        _this.setContents = function(contents) {
            utils.empty(_contents);
            _contents.appendChild(contents);
        };

        _this.positionX = function(x) {
            _css.style(_container, {
                left: Math.round(x)
            });
        };

        _this.constrainX = function(containerBounds, forceRedraw) {
            if (_this.showing && containerBounds.width !== 0) {
                // reset and check bounds
                var width = _this.offsetX(0);
                if (width) {
                    if (forceRedraw) {
                        _css.unblock();
                    }
                    var bounds = utils.bounds(_container);
                    if (bounds.width !== 0) {
                        if (bounds.right > containerBounds.right) {
                            _this.offsetX(containerBounds.right - bounds.right);
                        } else if (bounds.left < containerBounds.left) {
                            _this.offsetX(containerBounds.left - bounds.left);
                        }
                    }
                }
            }
        };

        _this.offsetX = function(offset) {
            offset = Math.round(offset);
            var width = _container.clientWidth;
            if (width !== 0) {
                _css.style(_container, {
                    'margin-left': Math.round(-width / 2) + offset
                });
                _css.style(_arrowElement, {
                    'margin-left': Math.round(-_arrow.width / 2) - offset
                });
            }
            return width;
        };

        _this.borderWidth = function() {
            return _borderSizes.left;
        };

        function _getSkinElement(name) {
            var elem = _skin.getSkinElement('tooltip', name);
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

        _this.show = function() {
            _this.showing = true;
            _css.style(_container, {
                opacity: 1,
                visibility: 'visible'
            });
        };

        _this.hide = function() {
            _this.showing = false;
            _css.style(_container, {
                opacity: 0,
                visibility: 'hidden'
            });
        };

        // Call constructor
        _init();

    };

    /*************************************************************
     * Player stylesheets - done once on script initialization;  *
     * These CSS rules are used for all JW Player instances      *
     *************************************************************/

    _css(OVERLAY_CLASS, {
        position: 'absolute',
        visibility: 'hidden',
        opacity: 0
    });

    _css(OVERLAY_CLASS + ' .jwcontents', {
        position: 'relative',
        'z-index': 1
    });

    _css(OVERLAY_CLASS + ' .jwborder', {
        position: 'absolute',
        'background-size': '100%' + ' ' + '100%'
    }, true);

    _css(OVERLAY_CLASS + ' .jwback', {
        position: 'absolute',
        'background-size': '100%' + ' ' + '100%'
    });

    _setTransition(OVERLAY_CLASS, 'opacity .25s, visibility .25s');

})(jwplayer);
