import { trim } from 'utils/strings';
import _ from 'utils/underscore';

// hasClass uses code from jQuery
// jQuery v1.11.2 | (c) 2005, 2014 jQuery Foundation, Inc. | Released under the MIT license | jquery.org/license
export function hasClass(element, searchClass) {
    const className = ' ' + searchClass + ' ';
    return (element.nodeType === 1 && (' ' + element.className + ' ')
        .replace(/[\t\r\n\f]/g, ' ').indexOf(className) >= 0);
}

// Given a string, convert to element and return
let parser = new DOMParser();

export function createElement(html) {
    const doc = parser.parseFromString(html, 'text/html');
    if (doc) {
        return doc.body.firstChild;
    }
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.firstChild;
}

// Used for styling dimensions in CSS
// Return the string unchanged if it's a percentage width; add 'px' otherwise
export function styleDimension(dimension) {
    return dimension + (dimension.toString().indexOf('%') > 0 ? '' : 'px');
}

function classNameArray(element) {
    return _.isString(element.className) ? element.className.split(' ') : [];
}

function setClassName(element, className) {
    className = trim(className);
    if (element.className !== className) {
        element.className = className;
    }
}

export function classList(element) {
    if (element.classList) {
        return element.classList;
    }
    /* ie9 does not support classList http://caniuse.com/#search=classList */
    return classNameArray(element);
}

export function addClass(element, classes) {
    // TODO:: use _.union on the two arrays

    var originalClasses = classNameArray(element);
    var addClasses = _.isArray(classes) ? classes : classes.split(' ');

    _.each(addClasses, function (c) {
        if (!_.contains(originalClasses, c)) {
            originalClasses.push(c);
        }
    });

    setClassName(element, originalClasses.join(' '));
}

export function removeClass(element, c) {
    var originalClasses = classNameArray(element);
    var removeClasses = _.isArray(c) ? c : c.split(' ');

    setClassName(element, _.difference(originalClasses, removeClasses).join(' '));
}

export function replaceClass(element, pattern, replaceWith) {
    var classes = (element.className || '');
    if (pattern.test(classes)) {
        classes = classes.replace(pattern, replaceWith);
    } else if (replaceWith) {
        classes += ' ' + replaceWith;
    }
    setClassName(element, classes);
}

export function toggleClass(element, c, toggleTo) {
    const hasIt = hasClass(element, c);
    toggleTo = _.isBoolean(toggleTo) ? toggleTo : !hasIt;

    // short circuit if nothing to do
    if (toggleTo === hasIt) {
        return;
    }

    if (toggleTo) {
        addClass(element, c);
    } else {
        removeClass(element, c);
    }
}

export function emptyElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

export function addStyleSheet(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.getElementsByTagName('head')[0].appendChild(link);
}

export function empty(element) {
    if (!element) {
        return;
    }
    emptyElement(element);
}

export function bounds(element) {
    const boundsRect = {
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        top: 0,
        bottom: 0
    };

    if (!element || !document.body.contains(element)) {
        return boundsRect;
    }

    var rect = element.getBoundingClientRect();
    var scrollOffsetY = window.pageYOffset;
    var scrollOffsetX = window.pageXOffset;

    if (!rect.width && !rect.height && !rect.left && !rect.top) {
        // element is not visible / no layout
        return boundsRect;
    }

    boundsRect.left = rect.left + scrollOffsetX;
    boundsRect.right = rect.right + scrollOffsetX;
    boundsRect.top = rect.top + scrollOffsetY;
    boundsRect.bottom = rect.bottom + scrollOffsetY;
    boundsRect.width = rect.right - rect.left;
    boundsRect.height = rect.bottom - rect.top;

    return boundsRect;
}

export function prependChild(parentElement, childElement) {
    parentElement.insertBefore(childElement, parentElement.firstChild);
}
