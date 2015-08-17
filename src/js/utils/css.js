define([
    'utils/helpers',
    'utils/strings'
], function(utils, Strings) {

    var MAX_CSS_RULES = 50000,
        _styleSheets = {},
        _styleSheet,
        _rules = {},
        _ruleIndexes = {},
        _exists = utils.exists;

    function _createStylesheet(debugText) {
        var styleSheet = document.createElement('style');
        if (debugText) {
            styleSheet.appendChild(document.createTextNode(debugText));
        }
        styleSheet.type = 'text/css';
        document.getElementsByTagName('head')[0].appendChild(styleSheet);
        return styleSheet;
    }

    var _css = function (selector, styles, important) {
        important = important || false;

        if (!_rules[selector]) {
            _rules[selector] = {};
        }

        if (!_updateStyles(_rules[selector], styles, important)) {
            //no change in css
            return;
        }

        if (!_styleSheets[selector]) {
            // set stylesheet for selector
            var numberRules = _styleSheet && _styleSheet.sheet && _styleSheet.sheet.cssRules &&
                _styleSheet.sheet.cssRules.length || 0;
            if (!_styleSheet || numberRules > MAX_CSS_RULES) {
                _styleSheet = _createStylesheet();
            }
            _styleSheets[selector] = _styleSheet;
        }
        _updateStylesheet(selector);
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

    function _updateStyles(cssRules, styles, important) {
        var dirty = false,
            style, val;
        for (style in styles) {
            val = _styleValue(style, styles[style], important);
            if (val !== '') {
                if (val !== cssRules[style]) {
                    cssRules[style] = val;
                    dirty = true;
                }
            } else if (cssRules[style] !== undefined) {
                delete cssRules[style];
                dirty = true;
            }
        }
        return dirty;
    }



    function _styleAttributeName(name) {
        name = name.split('-');
        for (var i = 1; i < name.length; i++) {
            name[i] = name[i].charAt(0).toUpperCase() + name[i].slice(1);
        }
        return name.join('');
    }

    function _styleValue(style, value, important) {
        if (!_exists(value)) {
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

    function _updateStylesheet(selector) {
        var sheet = _styleSheets[selector].sheet,
            cssRules,
            ruleIndex,
            ruleText;
        if (sheet) {
            cssRules = sheet.cssRules;
            ruleIndex = _ruleIndexes[selector];
            ruleText = _getRuleText(selector);

            if (ruleIndex !== undefined && ruleIndex < cssRules.length &&
                cssRules[ruleIndex].selectorText === selector) {
                if (ruleText === cssRules[ruleIndex].cssText) {
                    //no update needed
                    return;
                }
                sheet.deleteRule(ruleIndex);
            } else {
                ruleIndex = cssRules.length;
                _ruleIndexes[selector] = ruleIndex;
            }
            _insertRule(sheet, ruleText, ruleIndex);
        }
    }

    function _insertRule(sheet, text, index) {
        utils.tryCatch(function() {
            sheet.insertRule(text, index);
        });
    }

    function _getRuleText(selector) {
        var styles = _rules[selector];
        selector += ' { ';
        for (var style in styles) {
            selector += style + ': ' + styles[style] + '; ';
        }
        return selector + '}';
    }


    // Removes all css elements which match a particular style
    var _clearCss = function (filter) {
        for (var rule in _rules) {
            if (rule.indexOf(filter) >= 0) {
                delete _rules[rule];
            }
        }
        for (var selector in _styleSheets) {
            if (selector.indexOf(filter) >= 0) {
                _updateStylesheet(selector);
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
        if (typeof element === 'string') {
            _css(element, style);
        } else {
            _style(element, style);
        }
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

    utils.style = _style;

    return {
        css : _css,
        style : _style,
        clearCss : _clearCss,
        transform : transform,
        hexToRgba : hexToRgba
    };
});
