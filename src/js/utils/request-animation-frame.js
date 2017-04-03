define([], function() {
    return {
        requestAnimationFrame: window.requestAnimationFrame || function (callback) {
            return setTimeout(callback, 17);
        },
        cancelAnimationFrame: window.cancelAnimationFrame || clearTimeout
    };
});
