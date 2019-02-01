//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

/*
 * Source: https://github.com/jashkenas/backbone/blob/1.1.2/backbone.js#L68
 */

// Mixin module modified into a class which can be extended

const slice = [].slice;

export default class Events {

    /**
     * Adds an event listener.
     * @param {string} name - The event name. Passing "all" will bind the callback to all events.
     * @param {function} callback - The event callback.
     * @param {any} [context] - The context to apply to the callback's function invocation.
     * @returns {any} `this` context for chaining.
     */
    on(name, callback, context) {
        if (!eventsApi(this, 'on', name, [callback, context]) || !callback) {
            return this;
        }
        const _events = this._events || (this._events = {});
        const events = _events[name] || (_events[name] = []);
        events.push({ callback: callback, context: context });
        return this;
    }

    /**
     * Adds an event listener which is triggered at most once.
     * The listener is removed after the first call.
     * @param {string} name - The event name. Passing "all" will bind the callback to all events.
     * @param {function} callback - The event callback.
     * @param {any} [context] - The context to apply to the callback's function invocation.
     * @returns {any} `this` context for chaining.
     */
    once(name, callback, context) {
        if (!eventsApi(this, 'once', name, [callback, context]) || !callback) {
            return this;
        }
        let count = 0;
        const self = this;
        const onceCallback = function () {
            if (count++) {
                return;
            }
            self.off(name, onceCallback);
            callback.apply(this, arguments);
        };
        onceCallback._callback = callback;
        return this.on(name, onceCallback, context);
    }

    /**
     * Removes one or more callbacks.
     * @param {string} [name] - The event name. If null, all bound callbacks for all events will be removed.
     * @param {function} [callback] - If null, all callbacks for the event will be removed.
     * @param {any} [context] - If null, all callbacks with that function will be removed.
     * @returns {any} `this` context for chaining.
     */
    off(name, callback, context) {
        if (!this._events || !eventsApi(this, 'off', name, [callback, context])) {
            return this;
        }
        if (!name && !callback && !context) {
            delete this._events;
            return this;
        }
        const names = name ? [name] : Object.keys(this._events);
        for (let i = 0, l = names.length; i < l; i++) {
            name = names[i];
            const events = this._events[name];
            if (events) {
                const retain = this._events[name] = [];
                if (callback || context) {
                    for (let j = 0, k = events.length; j < k; j++) {
                        const ev = events[j];
                        if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                            (context && context !== ev.context)) {
                            retain.push(ev);
                        }
                    }
                }
                if (!retain.length) {
                    delete this._events[name];
                }
            }
        }
        return this;
    }

    /**
     * Trigger one or many events, firing all bound callbacks. Callbacks are
     * passed the same arguments as `trigger`, apart from the event name
     * (unless you're listening on `"all"`, which will cause your callback to
     * receive the true name of the event as the first argument).
     * @param {string} [name] - The event name.
     * @returns {any} `this` context for chaining.
     */
    trigger(name) {
        if (!this._events) {
            return this;
        }
        const args = slice.call(arguments, 1);
        if (!eventsApi(this, 'trigger', name, args)) {
            return this;
        }
        const events = this._events[name];
        const allEvents = this._events.all;
        if (events) {
            triggerEvents(events, args, this);
        }
        if (allEvents) {
            triggerEvents(allEvents, arguments, this);
        }
        return this;
    }

    /**
     * "Safe" version of `trigger` that causes each callback's execution
     * to be wrapped in a try-catch block
     * @param {string} [name] - The event name.
     * @returns {any} `this` context for chaining.
     */
    triggerSafe(name) {
        if (!this._events) {
            return this;
        }
        const args = slice.call(arguments, 1);
        if (!eventsApi(this, 'trigger', name, args)) {
            return this;
        }
        const events = this._events[name];
        const allEvents = this._events.all;
        if (events) {
            triggerEvents(events, args, this, name);
        }
        if (allEvents) {
            triggerEvents(allEvents, arguments, this, name);
        }
        return this;
    }
}

// Add static methods to class for legacy use - Object.assign(this, Events)
export const on = Events.prototype.on;
export const once = Events.prototype.once;
export const off = Events.prototype.off;
export const trigger = Events.prototype.trigger;
export const triggerSafe = Events.prototype.triggerSafe;

Events.on = on;
Events.once = once;
Events.off = off;
Events.trigger = trigger;

// Regular expression used to split event strings.
const eventSplitter = /\s+/;

// Implement fancy features of the Events API such as multiple event
// names `"change blur"` and jQuery-style event maps `{change: action}`
// in terms of the existing API.
function eventsApi(obj, action, name, rest) {
    if (!name) {
        return true;
    }
    // Handle event maps.
    if (typeof name === 'object') {
        for (let key in name) {
            if (Object.prototype.hasOwnProperty.call(name, key)) {
                obj[action].apply(obj, [key, name[key]].concat(rest));
            }
        }
        return false;
    }
    // Handle space separated event names.
    if (eventSplitter.test(name)) {
        const names = name.split(eventSplitter);
        for (let i = 0, l = names.length; i < l; i++) {
            obj[action].apply(obj, [names[i]].concat(rest));
        }
        return false;
    }
    return true;
}

function triggerEvents(events, args, context, catchExceptionsForName) {
    let i = -1;
    const l = events.length;
    while (++i < l) {
        const ev = events[i];
        if (catchExceptionsForName) {
            try {
                ev.callback.apply(ev.context || context, args);
            } catch (e) {
                /* eslint-disable no-console */
                console.log('Error in "' + catchExceptionsForName + '" event handler:', e);
            }
        } else {
            ev.callback.apply(ev.context || context, args);
        }
    }
}
