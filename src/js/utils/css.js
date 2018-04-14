import { pad } from 'utils/strings';
import styleLoader from 'simple-style-loader/addStyles';

export const clearCss = styleLoader.clear;

export function css(selector, styles, playerId, important) {
    playerId = playerId || 'all-players';
    let cssText = '';
    if (typeof styles === 'object') {
        const el = document.createElement('div');
        style(el, styles);
        let styleCSSText = el.style.cssText;
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
}

export function style(elements, styles) {
    if (elements === undefined || elements === null) {
        return;
    }
    if (elements.length === undefined) {
        elements = [elements];
    }

    let property;
    const cssRules = {};
    for (property in styles) {
        if (Object.prototype.hasOwnProperty.call(styles, property)) {
            cssRules[property] = _styleValue(property, styles[property]);
        }
    }

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        let styleName;

        if (element !== undefined && element !== null) {
            for (property in cssRules) {
                if (Object.prototype.hasOwnProperty.call(cssRules, property)) {
                    styleName = _styleAttributeName(property);
                    if (element.style[styleName] !== cssRules[property]) {
                        element.style[styleName] = cssRules[property];
                    }
                }
            }
        }
    }
}

function _styleAttributeName(name) {
    name = name.split('-');
    for (let i = 1; i < name.length; i++) {
        name[i] = name[i].charAt(0).toUpperCase() + name[i].slice(1);
    }
    return name.join('');
}

function _styleValue(property, value) {
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
        property === 'z-index' ||
        property === 'opacity') {
        return '' + value;
    }
    if ((/color/i).test(property)) {
        return '#' + pad(value.toString(16).replace(/^0x/i, ''), 6);
    }
    return Math.ceil(value) + 'px';
}

export function transform(element, value) {
    style(element, {
        transform: value,
        webkitTransform: value,
        msTransform: value,
        mozTransform: value,
        oTransform: value
    });
}

let canvasColorContext;

export function getRgba(color, opacity) {
    let colorFn = 'rgb';
    const hasAlpha = (opacity !== undefined && opacity !== 100);
    if (hasAlpha) {
        colorFn += 'a';
    }
    if (!canvasColorContext) {
        const canvas = document.createElement('canvas');
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
    const data = canvasColorContext.getImageData(0, 0, 1, 1).data;
    colorFn += '(' + data[0] + ', ' + data[1] + ', ' + data[2];
    if (hasAlpha) {
        colorFn += ', ' + (opacity / 100);
    }
    return colorFn + ')';
}
