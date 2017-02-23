define(function() {

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */


    /**
     * @summary A polyfill to implement Promises, primarily for IE.
     * Only partially supports thenables, but otherwise passes the A+ conformance
     * tests.
     * Note that Promise.all() and Promise.race() are not tested by that suite.
     *
     * @constructor
     * @struct
     * @param {function(function(*), function(*))=} opt_callback
     */
    var Promise = function(opt_callback) {
      /** @private {!Array.<shaka.polyfill.Promise.Child>} */
      this.thens_ = [];

      /** @private {!Array.<shaka.polyfill.Promise.Child>} */
      this.catches_ = [];

      /** @private {shaka.polyfill.Promise.State} */
      this.state_ = Promise.State.PENDING;

      /** @private {*} */
      this.value_;

      // External callers must supply the callback.  Internally, we may construct
      // child Promises without it, since we can directly access their resolve_ and
      // reject_ methods when convenient.
      if (opt_callback) {
        try {
          opt_callback(this.resolve_.bind(this), this.reject_.bind(this));
        } catch (e) {
          this.reject_(e);
        }
      }
    };


    /**
     * @typedef {{
     *   promise: !shaka.polyfill.Promise,
     *   callback: (function(*)|undefined)
     * }}
     *
     * @summary A child promise, used for chaining.
     * @description
     *   Only exists in the context of a then or catch chain.
     * @property {!shaka.polyfill.Promise} promise
     *   The child promise.
     * @property {(function(*)|undefined)} callback
     *   The then or catch callback to be invoked as part of this chain.
     */
    Promise.Child;


    /**
     * @enum {number}
     */
    Promise.State = {
      PENDING: 0,
      RESOLVED: 1,
      REJECTED: 2
    };

    /**
     * @param {*} value
     * @return {!shaka.polyfill.Promise}
     */
    Promise.resolve = function(value) {
      var p = new Promise();
      p.resolve_(value);
      return p;
    };


    /**
     * @param {*} reason
     * @return {!shaka.polyfill.Promise}
     */
    Promise.reject = function(reason) {
      var p = new Promise();
      p.reject_(reason);
      return p;
    };


    /**
     * @param {!Array.<!shaka.polyfill.Promise>} others
     * @return {!shaka.polyfill.Promise}
     */
    Promise.all = function(others) {
      var p = new Promise();
      if (!others.length) {
        p.resolve_([]);
        return p;
      }

      // The array of results must be in the same order as the array of Promises
      // passed to all().  So we pre-allocate the array and keep a count of how
      // many have resolved.  Only when all have resolved is the returned Promise
      // itself resolved.
      var count = 0;
      var values = new Array(others.length);
      var resolve = function(p, i, newValue) {
        // If one of the Promises in the array was rejected, this Promise was
        // rejected and new values are ignored.  In such a case, the values array
        // and its contents continue to be alive in memory until all of the Promises
        // in the array have completed.
        if (p.state_ == Promise.State.PENDING) {
          values[i] = newValue;
          count++;
          if (count == values.length) {
            p.resolve_(values);
          }
        }
      };

      var reject = p.reject_.bind(p);
      for (var i = 0; i < others.length; ++i) {
        if (others[i] && others[i].then) {
          others[i].then(resolve.bind(null, p, i), reject);
        } else {
          resolve(p, i, others[i]);
        }
      }
      return p;
    };


    /**
     * @param {!Array.<!shaka.polyfill.Promise>} others
     * @return {!shaka.polyfill.Promise}
     */
    Promise.race = function(others) {
      var p = new Promise();

      // The returned Promise is resolved or rejected as soon as one of the others
      // is.
      var resolve = p.resolve_.bind(p);
      var reject = p.reject_.bind(p);
      for (var i = 0; i < others.length; ++i) {
        if (others[i] && others[i].then) {
          others[i].then(resolve, reject);
        } else {
          resolve(others[i]);
        }
      }
      return p;
    };


    /**
     * @param {function(*)=} opt_successCallback
     * @param {function(*)=} opt_failCallback
     * @return {!shaka.polyfill.Promise}
     * @export
     */
    Promise.prototype.then = function(opt_successCallback,
                                                     opt_failCallback) {
      // then() returns a child Promise which is chained onto this one.
      var child = new Promise();
      switch (this.state_) {
        case Promise.State.RESOLVED:
          // This is already resolved, so we can chain to the child ASAP.
          this.schedule_(child, opt_successCallback);
          break;
        case Promise.State.REJECTED:
          // This is already rejected, so we can chain to the child ASAP.
          this.schedule_(child, opt_failCallback);
          break;
        case Promise.State.PENDING:
          // This is pending, so we have to track both callbacks and the child
          // in order to chain later.
          this.thens_.push({ promise: child, callback: opt_successCallback});
          this.catches_.push({ promise: child, callback: opt_failCallback});
          break;
      }

      return child;
    };


    /**
     * @param {function(*)=} opt_callback
     * @return {!shaka.polyfill.Promise}
     * @export
     */
    Promise.prototype.catch = function(opt_callback) {
      // Devolves into a two-argument call to 'then'.
      return this.then(undefined, opt_callback);
    };


    /**
     * @param {*} value
     * @private
     */
    Promise.prototype.resolve_ = function(value) {
      // Ignore resolve calls if we aren't still pending.
      if (this.state_ == Promise.State.PENDING) {
        this.value_ = value;
        this.state_ = Promise.State.RESOLVED;
        // Schedule calls to all of the chained callbacks.
        for (var i = 0; i < this.thens_.length; ++i) {
          this.schedule_(this.thens_[i].promise, this.thens_[i].callback);
        }
        this.thens_ = [];
        this.catches_ = [];
      }
    };


    /**
     * @param {*} reason
     * @private
     */
    Promise.prototype.reject_ = function(reason) {
      // Ignore reject calls if we aren't still pending.
      if (this.state_ == Promise.State.PENDING) {
        this.value_ = reason;
        this.state_ = Promise.State.REJECTED;
        // Schedule calls to all of the chained callbacks.
        for (var i = 0; i < this.catches_.length; ++i) {
          this.schedule_(this.catches_[i].promise, this.catches_[i].callback);
        }
        this.thens_ = [];
        this.catches_ = [];
      }
    };


    /**
     * @param {!shaka.polyfill.Promise} child
     * @param {function(*)|undefined} callback
     * @private
     */
    Promise.prototype.schedule_ = function(child, callback) {

      var wrapper = function() {
        if (callback && typeof callback == 'function') {
          // Wrap around the callback.  Exceptions thrown by the callback are
          // converted to failures.
          try {
            var value = callback(this.value_);
          } catch (exception) {
            child.reject_(exception);
            return;
          }

          // According to the spec, 'then' in a thenable may only be accessed once
          // and any thrown exceptions in the getter must cause the Promise chain
          // to fail.
          var then;
          try {
            then = value && value.then;
          } catch (exception) {
            child.reject_(exception);
            return;
          }

          if (value instanceof Promise) {
            // If the returned value is a Promise, we bind it's state to the child.
            if (value == child) {
              // Without this, a bad calling pattern can cause an infinite loop.
              child.reject_(new TypeError('Chaining cycle detected'));
            } else {
              value.then(child.resolve_.bind(child), child.reject_.bind(child));
            }
          } else if (then) {
            // If the returned value is thenable, chain it to the child.
            Promise.handleThenable_(value, then, child);
          } else {
            // If the returned value is not a Promise, the child is resolved with
            // that value.
            child.resolve_(value);
          }
        } else if (this.state_ == Promise.State.RESOLVED) {
          // No callback for this state, so just chain on down the line.
          child.resolve_(this.value_);
        } else {
          // No callback for this state, so just chain on down the line.
          child.reject_(this.value_);
        }
      };

      // Enqueue a call to the wrapper.
      Promise.q_.push(wrapper.bind(this));
      if (Promise.flushTimer_ == null) {
        Promise.flushTimer_ = Promise.setImmediate_(Promise.flush);
      }
    };


    /**
     * @param {!Object} thenable
     * @param {Function} then
     * @param {!shaka.polyfill.Promise} child
     * @private
     */
    Promise.handleThenable_ = function(thenable, then, child) {
      try {
        var sealed = false;
        then.call(thenable, function(value) {
          if (sealed) return;
          sealed = true;

          var nextThen;
          try {
            nextThen = value && value.then;
          } catch (exception) {
            child.reject_(exception);
            return;
          }

          if (nextThen) {
            Promise.handleThenable_(value, nextThen, child);
          } else {
            child.resolve_(value);
          }
        }, child.reject_.bind(child));
      } catch (exception) {
        child.reject_(exception);
      }
    };


    /**
     * Flush the queue of callbacks.
     * Used directly by some unit tests.
     */
    Promise.flush = function() {

      // Flush as long as we have callbacks.  This means we can finish a chain more
      // quickly, since we avoid the overhead of multiple calls to setTimeout, each
      // of which has a minimum resolution of as much as 15ms on IE11.
      // This helps to fix the out-of-order task bug on IE:
      //   https://github.com/google/shaka-player/issues/251#issuecomment-178146242
      while (Promise.q_.length) {
        // Callbacks may enqueue other callbacks, so clear the timer ID and swap the
        // queue before we do anything else.
        if (Promise.flushTimer_ != null) {
          Promise.clearImmediate_(Promise.flushTimer_);
          Promise.flushTimer_ = null;
        }
        var q = Promise.q_;
        Promise.q_ = [];

        for (var i = 0; i < q.length; ++i) {
          q[i]();
        }
      }
    };


    /**
     * @param {function()} callback
     * @return {number}
     * Schedule a callback as soon as possible.
     * Bound in shaka.polyfill.Promise.install() to a specific implementation.
     * @private
     */
    Promise.setImmediate_ = function(callback) { return 0; };


    /**
     * @param {number} id
     * Clear a scheduled callback.
     * Bound in shaka.polyfill.Promise.install() to a specific implementation.
     * @private
     */
    Promise.clearImmediate_ = function(id) {};


    /**
     * A timer ID to flush the queue.
     * @private {?number}
     */
    Promise.flushTimer_ = null;


    /**
     * A queue of callbacks to be invoked ASAP in the next frame.
     * @private {!Array.<function()>}
     */
    Promise.q_ = [];

    // overhead of this switch every time a callback has to be invoked.
    if (window.setImmediate) {
      // For IE and node.js:
      Promise.setImmediate_ = function(callback) {
        return window.setImmediate(callback);
      };
      Promise.clearImmediate_ = function(id) {
        return window.clearImmediate(id);
      };
    } else {
      // For everyone else:
      Promise.setImmediate_ = function(callback) {
        return window.setTimeout(callback, 0);
      };
      Promise.clearImmediate_ = function(id) {
        return window.clearTimeout(id);
      };
    }

    window.Promise || (window.Promise = Promise);

});
