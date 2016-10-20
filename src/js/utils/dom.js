define([
    'utils/strings',
    'utils/underscore',
    'utils/jqueryfuncs'
], function(strings, _, jqueryfuncs) {

    var dom = {};

    // Given a string, convert to element and return
    dom.createElement = function (html) {
        var newElement = document.createElement('div');
        newElement.innerHTML = html;
        return newElement.firstChild;
    };

    /** Used for styling dimensions in CSS --
     * return the string unchanged if it's a percentage width; add 'px' otherwise **/
    dom.styleDimension = function (dimension) {
        return dimension + (dimension.toString().indexOf('%') > 0 ? '' : 'px');
    };

    var classNameArray = function(element) {
        return _.isString(element.className) ? element.className.split(' ') : [];
    };

    var setClassName = function(element, className) {
        className = strings.trim(className);
        if (element.className !== className) {
            element.className = className;
        }
    };

    dom.classList = function (element) {
        if (element.classList) {
            return element.classList;
        }
        /* ie9 does not support classList http://caniuse.com/#search=classList */
        return classNameArray(element);
    };

    dom.hasClass = jqueryfuncs.hasClass;

    dom.addClass = function (element, classes) {
        // TODO:: use _.union on the two arrays

        var originalClasses = classNameArray(element);
        var addClasses = _.isArray(classes) ? classes : classes.split(' ');

        _.each(addClasses, function (c) {
            if (!_.contains(originalClasses, c)) {
                originalClasses.push(c);
            }
        });

        setClassName(element, originalClasses.join(' '));
    };

    dom.removeClass = function (element, c) {
        var originalClasses = classNameArray(element);
        var removeClasses = _.isArray(c) ? c : c.split(' ');

        setClassName(element, _.difference(originalClasses, removeClasses).join(' '));
    };

    dom.replaceClass = function (element, pattern, replaceWith) {
        var classes = (element.className || '');
        if (pattern.test(classes)) {
            classes = classes.replace(pattern, replaceWith);
        } else if (replaceWith) {
            classes += ' ' + replaceWith;
        }
        setClassName(element, classes);
    };

    dom.toggleClass = function (element, c, toggleTo) {
        var hasClass = dom.hasClass(element, c);
        toggleTo = _.isBoolean(toggleTo) ? toggleTo : !hasClass;

        // short circuit if nothing to do
        if (toggleTo === hasClass) {
            return;
        }

        if (toggleTo) {
            dom.addClass(element, c);
        } else {
            dom.removeClass(element, c);
        }
    };

    dom.emptyElement = function (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    };

    dom.addStyleSheet = function(url) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.getElementsByTagName('head')[0].appendChild(link);
    };

    dom.empty = function(element) {
        if (!element) {
            return;
        }
        while (element.childElementCount > 0) {
            element.removeChild(element.children[0]);
        }
    };

    dom.bounds = function(element) {
        var bounds = {
            left: 0,
            right: 0,
            width: 0,
            height: 0,
            top: 0,
            bottom: 0
        };
        if (!element || !document.body.contains(element)) {
            return bounds;
        }
        var rect = element.getBoundingClientRect(),
            scrollOffsetY = window.pageYOffset,
            scrollOffsetX = window.pageXOffset;
        if (!rect.width && !rect.height && !rect.left && !rect.top) {
            //element is not visible / no layout
            return bounds;
        }
        bounds.left = rect.left + scrollOffsetX;
        bounds.right = rect.right + scrollOffsetX;
        bounds.top = rect.top + scrollOffsetY;
        bounds.bottom = rect.bottom + scrollOffsetY;
        bounds.width = rect.right - rect.left;
        bounds.height = rect.bottom - rect.top;
        return bounds;
    };

    return dom;
});

