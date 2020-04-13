import type { GenericObject } from 'types/generic.type';
import * as playerutils from 'utils/playerutils';
import * as validator from 'utils/validator';
import * as parser from 'utils/parser';
import {
    trim,
    pad,
    extension,
    hms,
    seconds,
    prefix,
    suffix,
} from 'utils/strings';
import Timer from 'api/timer';
import { tryCatch, JwError as Error } from 'utils/trycatch';
import { indexOf } from 'utils/underscore';
import { isIframe, flashVersion } from 'utils/browser';
import {
    addClass,
    hasClass,
    removeClass,
    replaceClass,
    toggleClass,
    classList,
    styleDimension,
    createElement,
    emptyElement,
    addStyleSheet,
    bounds,
    openLink,
    replaceInnerHtml
} from 'utils/dom';
import {
    css,
    clearCss,
    style,
    transform,
    getRgba
} from 'utils/css';
import { ajax } from 'utils/ajax';
import { between } from 'utils/math';
import { log } from 'utils/log';
import { genId } from 'utils/random-id-generator';

// TODO: deprecate (jwplayer-ads-vast uses utils.crossdomain(url))
function crossdomain(uri: string): boolean {
    const a = document.createElement('a');
    const b = document.createElement('a');
    a.href = location.href;
    try {
        b.href = uri;
        b.href = b.href; /* IE fix for relative urls */ // eslint-disable-line no-self-assign
        return a.protocol + '//' + a.host !== b.protocol + '//' + b.host;
    } catch (e) {/* swallow */}
    return true;
}

// The predicate received the arguments (key, value) instead of (value, key)
const foreach = function (aData: GenericObject, fnEach: (key: string, value: any) => void): void {
    for (let key in aData) {
        if (Object.prototype.hasOwnProperty.call(aData, key)) {
            fnEach(key, aData[key]);
        }
    }
};

const noop = () => {
    // noop
};

const helpers: { [key: string]: () => any } = Object.assign({}, parser, validator, playerutils, {
    addClass,
    hasClass,
    removeClass,
    replaceClass,
    toggleClass,
    classList,
    styleDimension,
    createElement,
    emptyElement,
    addStyleSheet,
    bounds,
    openLink,
    replaceInnerHtml,
    css,
    clearCss,
    style,
    transform,
    getRgba,
    ajax,
    crossdomain,
    tryCatch,
    Error,
    Timer,
    log,
    genId,
    between,
    foreach,
    flashVersion,
    isIframe,
    indexOf,
    trim,
    pad,
    extension,
    hms,
    seconds,
    prefix,
    suffix,
    noop
});

if (__HEADLESS__) {
    Object.assign(helpers, {
        addClass: noop,
        hasClass: noop,
        removeClass: noop,
        replaceClass: noop,
        toggleClass: noop,
        classList: () => [],
        createElement: (html) => document.createElement(html),
        emptyElement: noop,
        addStyleSheet: noop,
        openLink:
            (link, target, additionalOptions) =>
                console.error(`[headless] utils.openLink(${link}, ${target}, ${additionalOptions})`),
        replaceInnerHtml: noop,
        css: noop,
        clearCss: noop,
        style: noop,
        transform: noop
    });
}
export default helpers;
