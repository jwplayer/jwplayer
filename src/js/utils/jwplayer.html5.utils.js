/**
 * HTML5-only utilities for the JW Player.
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {
    var DOCUMENT = document;

    /**
     * Cleans up a css dimension (e.g. '420px') and returns an integer.
     */
    utils.parseDimension = function(dimension) {
        if (typeof dimension === 'string') {
            if (dimension === '') {
                return 0;
            } else if (dimension.lastIndexOf('%') > -1) {
                return dimension;
            }
            return parseInt(dimension.replace('px', ''), 10);
        }
        return dimension;
    };

    /** Format the elapsed / remaining text. **/
    utils.timeFormat = function(sec) {
        if (sec > 0) {
            var hrs = Math.floor(sec / 3600),
                mins = Math.floor((sec - hrs * 3600) / 60),
                secs = Math.floor(sec % 60);

            return (hrs ? hrs + ':' : '') + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
        } else {
            return '00:00';
        }
    };

    utils.bounds = function(element) {
        var bounds = {
            left: 0,
            right: 0,
            width: 0,
            height: 0,
            top: 0,
            bottom: 0
        };
        if (!element || !DOCUMENT.body.contains(element)) {
            return bounds;
        }
        if (element.getBoundingClientRect) {
            var rect = element.getBoundingClientRect(element),
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
        } else {
            /*jshint -W084 */ // For the while loop assignment
            bounds.width = element.offsetWidth | 0;
            bounds.height = element.offsetHeight | 0;
            do {
                bounds.left += element.offsetLeft | 0;
                bounds.top += element.offsetTop | 0;
            } while (element = element.offsetParent);
            bounds.right = bounds.left + bounds.width;
            bounds.bottom = bounds.top + bounds.height;
        }
        return bounds;
    };

    utils.empty = function(element) {
        if (!element) {
            return;
        }
        while (element.childElementCount > 0) {
            element.removeChild(element.children[0]);
        }
    };

})(jwplayer.utils);
