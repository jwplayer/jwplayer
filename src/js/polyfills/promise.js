// https://github.com/taylorhakes/promise-polyfill
// v6.0.2

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
const setTimeoutFunc = window.setTimeout;
const setImmediateFunc = window.setImmediate;

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
    return function () {
        fn.apply(thisArg, arguments);
    };
}

function PromisePolyfill(fn) {
    if (typeof this !== 'object') {
        throw new TypeError('Promises must be constructed via new');
    }
    if (typeof fn !== 'function') {
        throw new TypeError('not a function');
    }
    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];

    doResolve(fn, this);
}

function handle(self, deferred) {
    while (self._state === 3) {
        self = self._value;
    }
    if (self._state === 0) {
        self._deferreds.push(deferred);
        return;
    }
    self._handled = true;
    PromisePolyfill._immediateFn(function () {
        var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
        if (cb === null) {
            (self._state === 1 ? resolvePromise : rejectPromise)(deferred.promise, self._value);
            return;
        }
        var ret;
        try {
            ret = cb(self._value);
        } catch (e) {
            rejectPromise(deferred.promise, e);
            return;
        }
        resolvePromise(deferred.promise, ret);
    });
}

function resolvePromise(self, newValue) {
    try {
        // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
        if (newValue === self) {
            throw new TypeError('A promise cannot be resolved with itself.');
        }
        if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
            var then = newValue.then;
            if (newValue instanceof PromisePolyfill) {
                self._state = 3;
                self._value = newValue;
                finale(self);
                return;
            } else if (typeof then === 'function') {
                doResolve(bind(then, newValue), self);
                return;
            }
        }
        self._state = 1;
        self._value = newValue;
        finale(self);
    } catch (e) {
        rejectPromise(self, e);
    }
}

function rejectPromise(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
}

function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
        PromisePolyfill._immediateFn(function() {
            if (!self._handled) {
                PromisePolyfill._unhandledRejectionFn(self._value);
            }
        });
    }

    for (var i = 0, len = self._deferreds.length; i < len; i++) {
        handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
}

function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
    var done = false;
    try {
        fn(function (value) {
            if (done) {
                return;
            }
            done = true;
            resolvePromise(self, value);
        }, function (reason) {
            if (done) {
                return;
            }
            done = true;
            rejectPromise(self, reason);
        });
    } catch (ex) {
        if (done) {
            return;
        }
        done = true;
        rejectPromise(self, ex);
    }
}

/* eslint dot-notation: 0 */
PromisePolyfill.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
};

PromisePolyfill.prototype.then = function (onFulfilled, onRejected) {
    var prom = new (this.constructor)(noop);

    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
};

PromisePolyfill.all = function (arr) {
    var args = Array.prototype.slice.call(arr);

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
                        then.call(val, function (resultVal) {
                            res(i, resultVal);
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

// Use polyfill for setImmediate for performance gains
PromisePolyfill._immediateFn = (typeof setImmediateFunc === 'function' &&
    function (fn) {
        setImmediateFunc(fn);
    }) ||
    function (fn) {
        setTimeoutFunc(fn, 0);
    };

PromisePolyfill._unhandledRejectionFn = function _unhandledRejectionFn(err) {
    if (typeof console !== 'undefined' && console) {
        console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
    }
};

const Promise = window.Promise || (window.Promise = PromisePolyfill);

export const resolved = Promise.resolve();

export default Promise;
