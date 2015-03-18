/**
 * ES5 addEventListener polyfill for ie8
 * https://gist.github.com/jonathantneal/3748027
 */
if (!window.addEventListener) {
    window.addEventListener = document.addEventListener = Element.prototype.addEventListener =
            Function.prototype.addEventListener =
    function(event, handler) {
        this.attachEvent(event, handler);
    };
}

/**
 * ES5 removeEventListener polyfill for ie8
 * https://gist.github.com/jonathantneal/3748027
 */
if (!window.removeEventListener) {
    window.removeEventListener = document.removeEventListener = Element.prototype.removeEventListener =
            Function.prototype.removeEventListener =
    function(event, handler) {
        this.detachEvent(event, handler);
    };
}