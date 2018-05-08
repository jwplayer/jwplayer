import { trim } from 'utils/strings';
import { isString, contains, difference, isBoolean } from 'utils/underscore';

export function hasClass(element, searchClass) {
    return element.classList.contains(searchClass);
}

// Given a string, convert to element and return
export function createElement(html) {
    const newElement = document.createElement('div');
    newElement.innerHTML = html;
    return newElement.firstChild;
}

// Used for styling dimensions in CSS
// Return the string unchanged if it's a percentage width; add 'px' otherwise
export function styleDimension(dimension) {
    return dimension + (dimension.toString().indexOf('%') > 0 ? '' : 'px');
}

function classNameArray(element) {
    return isString(element.className) ? element.className.split(' ') : [];
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

    const originalClasses = classNameArray(element);
    const addClasses = Array.isArray(classes) ? classes : classes.split(' ');

    addClasses.forEach(function (c) {
        if (!contains(originalClasses, c)) {
            originalClasses.push(c);
        }
    });

    setClassName(element, originalClasses.join(' '));
}

export function removeClass(element, c) {
    const originalClasses = classNameArray(element);
    const removeClasses = Array.isArray(c) ? c : c.split(' ');

    setClassName(element, difference(originalClasses, removeClasses).join(' '));
}

export function replaceClass(element, pattern, replaceWith) {
    let classes = (element.className || '');
    if (pattern.test(classes)) {
        classes = classes.replace(pattern, replaceWith);
    } else if (replaceWith) {
        classes += ' ' + replaceWith;
    }
    setClassName(element, classes);
}

export function toggleClass(element, c, toggleTo) {
    const hasIt = hasClass(element, c);
    toggleTo = isBoolean(toggleTo) ? toggleTo : !hasIt;

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
    const link = document.createElement('link');
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

    const rect = element.getBoundingClientRect();
    const scrollOffsetY = window.pageYOffset;
    const scrollOffsetX = window.pageXOffset;

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
