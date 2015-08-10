define([
], function() {
    var trycatch = {};

    trycatch.tryCatch = function (fn, ctx, args) {
        // IE8 requires these not be undefined
        ctx = ctx || this;
        args = args || [];

        // if in debug mode, let 'er blow!
        if (window.jwplayer && window.jwplayer.debug) {
            return fn.apply(ctx, args);
        }

        // else be careful
        try {
            return fn.apply(ctx, args);
        }
        catch (e) {
            return new Error(fn.name, e);
        }
    };

    trycatch.Error = function (name, message) {
        this.name = name;
        this.message = message;
    };

    return trycatch;
});