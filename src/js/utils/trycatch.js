define([
], function() {
    var tryCatch = function (fn, ctx, args = []) {

        // In debug mode, allow `fn` to throw exceptions
        var jwplayer = window.jwplayer;
        if (jwplayer && jwplayer.debug) {
            return fn.apply(ctx || this, args);
        }

        // else catch exceptions and return a `JWError`
        try {
            return fn.apply(ctx || this, args);
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
