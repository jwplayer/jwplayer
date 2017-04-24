define(['utils/underscore'], function(_) {
    // https://github.com/taylorhakes/promise-polyfill
    // v2.1.0

    // ** THIS POLYFILL BREAKS WEBPACK **
    // Use polyfill for setImmediate for performance gains
    // var asap = (typeof setImmediate === 'function' && setImmediate) ||
        // function(fn) { setTimeout(fn, 1); };
    var asap = _.defer;

    // Polyfill for Function.prototype.bind
    function bind(fn, thisArg) {
        return function() {
            fn.apply(thisArg, arguments);
        };
    }

    var isArray = Array.isArray || function(value) {
        return Object.prototype.toString.call(value) === '[object Array]';
    };

    function PromisePolyfill(fn) {
        if (typeof this !== 'object') {
            throw new TypeError('Promises must be constructed via new');
        }
        if (typeof fn !== 'function') {
            throw new TypeError('not a function');
        }
        this._state = null;
        this._value = null;
        this._deferreds = [];

        doResolve(fn, bind(resolvePolyfill, this), bind(rejectPolyfill, this));
    }

    function handle(deferred) {
        var me = this;
        if (this._state === null) {
            this._deferreds.push(deferred);
            return;
        }
        asap(function () {
            var cb = me._state ? deferred.onFulfilled : deferred.onRejected;
            if (cb === null) {
                (me._state ? deferred.resolve : deferred.reject)(me._value);
                return;
            }
            var ret;
            try {
                ret = cb(me._value);
            } catch (e) {
                deferred.reject(e);
                return;
            }
            deferred.resolve(ret);
        });
    }

    function resolvePolyfill(newValue) {
        try { // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
            if (newValue === this) {
                throw new TypeError('A promise cannot be resolved with itself.');
            }
            if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
                var then = newValue.then;
                if (typeof then === 'function') {
                    doResolve(bind(then, newValue), bind(resolvePolyfill, this), bind(rejectPolyfill, this));
                    return;
                }
            }
            this._state = true;
            this._value = newValue;
            finale.call(this);
        } catch (e) {
            rejectPolyfill.call(this, e);
        }
    }

    function rejectPolyfill(newValue) {
        this._state = false;
        this._value = newValue;
        finale.call(this);
    }

    function finale() {
        for (var i = 0, len = this._deferreds.length; i < len; i++) {
            handle.call(this, this._deferreds[i]);
        }
        this._deferreds = null;
    }

    function Handler(onFulfilled, onRejected, resolve, reject) {
        this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
        this.onRejected = typeof onRejected === 'function' ? onRejected : null;
        this.resolve = resolve;
        this.reject = reject;
    }

    function doResolve(fn, onFulfilled, onRejected) {
        var done = false;
        try {
            fn(function (value) {
                if (done) {
                    return;
                }
                done = true;
                onFulfilled(value);
            }, function (reason) {
                if (done) {
                    return;
                }
                done = true;
                onRejected(reason);
            });
        } catch (ex) {
            if (done) {
                return;
            }
            done = true;
            onRejected(ex);
        }
    }

    /* eslint dot-notation: 0 */
    PromisePolyfill.prototype['catch'] = function (onRejected) {
        return this.then(null, onRejected);
    };

    PromisePolyfill.prototype.then = function (onFulfilled, onRejected) {
        var me = this;
        return new PromisePolyfill(function (resolve, reject) {
            handle.call(me, new Handler(onFulfilled, onRejected, resolve, reject));
        });
    };

    PromisePolyfill.all = function () {
        var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);

        return new PromisePolyfill(function (resolve, reject) {
            if (args.length === 0) {
                return resolve([]);
            }
            var remaining = args.length;

            function res(i, val) {
                try {
                    if (val && (typeof val === 'object' || typeof val === 'function')) {
                        var then = val.then;
                        if (typeof then === 'function') {
                            then.call(val, function (val2) {
                                res(i, val2);
                            }, reject);
                            return;
                        }
                    }
                    args[i] = val;
                    if (--remaining === 0) {
                        resolve(args);
                    }
                } catch (ex) {
                    reject(ex);
                }
            }

            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        });
    };

    PromisePolyfill.resolve = function (value) {
        if (value && typeof value === 'object' && value.constructor === PromisePolyfill) {
            return value;
        }

        return new PromisePolyfill(function (resolve) {
            resolve(value);
        });
    };

    PromisePolyfill.reject = function (value) {
        return new PromisePolyfill(function (resolve, reject) {
            reject(value);
        });
    };

    PromisePolyfill.race = function (values) {
        return new PromisePolyfill(function (resolve, reject) {
            for (var i = 0, len = values.length; i < len; i++) {
                values[i].then(resolve, reject);
            }
        });
    };

    PromisePolyfill._setImmediateFn = function _setImmediateFn(fn) {
        asap = fn;
    };

    /* eslint no-unused-expressions: 0 */
    window.Promise || (window.Promise = PromisePolyfill);

});
