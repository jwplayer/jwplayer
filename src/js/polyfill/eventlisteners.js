/* jshint browser: true */

/**
 * ES5 addEventListener polyfill for ie8
 */
if (!window.addEventListener) {
    window.addEventListener = document.addEventListener = Element.prototype.addEventListener =
            Function.prototype.addEventListener =
    function(event, handler) {
        this.attachEvent(event, handler);

        return this;
    };
}

/**
 * ES5 removeEventListener polyfill for ie8
 */
if (!window.removeEventListener) {
    window.removeEventListener = document.removeEventListener = Element.prototype.removeEventListener =
            Function.prototype.removeEventListener =
    function(event, handler) {
        this.detachEvent(event, handler);

        return this;
    };
}