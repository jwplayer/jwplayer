define([
    'utils/strings',
    'simple-style-loader/addStyles'
], function(Strings, styleLoader) {

    var _css = function(selector, styles, playerId, important) {
        playerId = playerId || 'all-players';
        var cssText = '';
        if (typeof styles === 'object') {
            var el = document.createElement('div');
            _style(el, styles);
            var styleCSSText = el.style.cssText;
            if (important && styleCSSText) {
                styleCSSText = styleCSSText.replace(/;/g, ' !important;');
            }
            cssText = '{' + styleCSSText + '}';
        } else if (typeof styles === 'string') {
            cssText = styles;
        }

        if (cssText === '' || cssText === '{}') {
            styleLoader.clear(playerId, selector);
            return;
        }

        styleLoader.style([[selector, selector + cssText]], playerId);
    };

    var _style = function (elements, styles) {
        if (elements === undefined || elements === null) {
            return;
        }
        if (elements.length === undefined) {
            elements = [elements];
        }

        var style;
        var cssRules = {};
        for (style in styles) {
            if (Object.prototype.hasOwnProperty.call(styles, style)) {
                cssRules[style] = _styleValue(style, styles[style]);
            }
        }

        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var styleName;

            if (element !== undefined && element !== null) {
                for (style in cssRules) {
                    if (Object.prototype.hasOwnProperty.call(cssRules, style)) {
                        styleName = _styleAttributeName(style);
                        if (element.style[styleName] !== cssRules[style]) {
                            element.style[styleName] = cssRules[style];
                        }
                    }
                }
            }
        }
    };

    function _styleAttributeName(name) {
        name = name.split('-');
        for (var i = 1; i < name.length; i++) {
            name[i] = name[i].charAt(0).toUpperCase() + name[i].slice(1);
        }
        return name.join('');
    }

    function _styleValue(style, value) {
        if (value === '' || value === undefined || value === null) {
            return '';
        }
        // string
        if (typeof value === 'string' && isNaN(value)) {
            if ((/png|gif|jpe?g/i).test(value) && value.indexOf('url') < 0) {
                return 'url(' + value + ')';
            }
            return value;
        }
        // number
        if (value === 0 ||
            style === 'z-index' ||
            style === 'opacity') {
            return '' + value;
        }
        if ((/color/i).test(style)) {
            return '#' + Strings.pad(value.toString(16).replace(/^0x/i, ''), 6);
        }
        return Math.ceil(value) + 'px';
    }

    var transform = function (element, value) {
        _style(element, {
            transform: value,
            webkitTransform: value,
            msTransform: value,
            mozTransform: value,
            oTransform: value
        });
    };

    var canvasColorContext;
    var getRgba = function (color, opacity) {
        var style = 'rgb';
        var hasAlpha = (opacity !== undefined && opacity !== 100);
        if (hasAlpha) {
            style += 'a';
        }
        if (!canvasColorContext) {
            var canvas = document.createElement('canvas');
            canvas.height = 1;
            canvas.width = 1;
            canvasColorContext = canvas.getContext('2d');
        }
        if (!color) {
            color = '#000000';
        } else if (!isNaN(parseInt(color, 16))) {
            color = '#' + color;
        }
        canvasColorContext.clearRect(0, 0, 1, 1);
        canvasColorContext.fillStyle = color;
        canvasColorContext.fillRect(0, 0, 1, 1);
        var data = canvasColorContext.getImageData(0, 0, 1, 1).data;
        style += '(' + data[0] + ', ' + data[1] + ', ' + data[2];
        if (hasAlpha) {
            style += ', ' + (opacity / 100);
        }
        return style + ')';
    };

    return {
        css: _css,
        style: _style,
        clearCss: styleLoader.clear,
        transform: transform,
        hexToRgba: getRgba, // deprecate in favor of getRgba
        getRgba: getRgba
    };
});
