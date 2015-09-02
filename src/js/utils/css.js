define([
    'utils/strings'
], function(Strings) {

    var _styleRules = {},
        _styleSheet;

    var _css = function(selector, styles) {
        if (!_styleSheet) {
            _styleSheet = document.createElement('style');
            _styleSheet.type = 'text/css';
            document.getElementsByTagName('head')[0].appendChild(_styleSheet);
        }
        var cssText = selector + JSON.stringify(styles).replace(/"/g, '');
        var node = document.createTextNode(cssText);
        if (_styleRules[selector]) {
            _styleSheet.removeChild(_styleRules[selector]);
        }
        _styleRules[selector] = node;
        _styleSheet.appendChild(node);
    };

    var _style = function (elements, styles) {
        if (elements === undefined || elements === null) {
            //utils.log('css.style invalid elements: '+ elements +' '+ JSON.stringify(styles) +' '+ immediate);
            return;
        }
        if (elements.length === undefined) {
            elements = [elements];
        }

        var style;
        var cssRules = {};
        for (style in styles) {
            cssRules[style] = _styleValue(style, styles[style]);
        }

        for (var i = 0; i < elements.length; i++) {
            var element = elements[i], styleName;
            if (element !== undefined && element !== null) {
                for (style in cssRules) {
                    styleName = _styleAttributeName(style);
                    if (element.style[styleName] !== cssRules[style]) {
                        element.style[styleName] = cssRules[style];
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

    function _styleValue(style, value, important) {
        if (value === '' || value === undefined || value === null) {
            return '';
        }
        var importantString = important ? ' !important' : '';

        //string
        if (typeof value === 'string' && isNaN(value)) {
            if ((/png|gif|jpe?g/i).test(value) && value.indexOf('url') < 0) {
                return 'url(' + value + ')';
            }
            return value + importantString;
        }
        // number
        if (value === 0 ||
            style === 'z-index' ||
            style === 'opacity') {
            return '' + value + importantString;
        }
        if ((/color/i).test(style)) {
            return '#' + Strings.pad(value.toString(16).replace(/^0x/i, ''), 6) + importantString;
        }
        return Math.ceil(value) + 'px' + importantString;
    }

    // Removes all css elements which match a particular style
    var _clearCss = function(filter) {
        for (var selector in _styleRules) {
            if (selector.indexOf(filter) >= 0) {
                _styleSheet.removeChild(_styleRules[selector]);
                delete _styleRules[selector];
            }
        }
    };

    var transform = function (element, value) {
        var transform = 'transform',
            style = {};
        value = value || '';
        style[transform] = value;
        style['-webkit-' + transform] = value;
        style['-ms-' + transform] = value;
        style['-moz-' + transform] = value;
        style['-o-' + transform] = value;
        _style(element, style);
    };

    var hexToRgba = function (hexColor, opacity) {
        var style = 'rgb';
        if (hexColor) {
            hexColor = String(hexColor).replace('#', '');
            if (hexColor.length === 3) {
                hexColor = hexColor[0] + hexColor[0] + hexColor[1] + hexColor[1] + hexColor[2] + hexColor[2];
            }
        } else {
            hexColor = '000000';
        }
        var channels = [
            parseInt(hexColor.substr(0, 2), 16),
            parseInt(hexColor.substr(2, 2), 16),
            parseInt(hexColor.substr(4, 2), 16)
        ];
        if (opacity !== undefined && opacity !== 100) {
            style += 'a';
            channels.push(opacity / 100);
        }
        return style + '(' + channels.join(',') + ')';
    };

    return {
        css : _css,
        style : _style,
        clearCss : _clearCss,
        transform : transform,
        hexToRgba : hexToRgba
    };
});
