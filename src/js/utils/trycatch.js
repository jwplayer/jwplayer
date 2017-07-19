define([
], function() {
    var tryCatch = function (fn, ctx, args) {
        // IE8 requires these not be undefined
        ctx = ctx || this;
        args = args || [];

        // if in debug mode, let 'er blow!
        var jwplayer = window.jwplayer;
        if (jwplayer && jwplayer.debug) {
            return fn.apply(ctx, args);
        }

        // else be careful
        try {
            return fn.apply(ctx, args);
        } catch (e) {
            return new JWError(fn.name, e);
        }
    };

    var JWError = function (name, error) {
        this.name = name;
        this.message = error.message || error.toString();
        this.error = error;
    };

    return {
        tryCatch: tryCatch,
        Error: JWError
    };
});
