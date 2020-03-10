//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

/*
 * Source: https://github.com/jashkenas/backbone/blob/1.1.2/backbone.js#L68
 */

// Mixin module modified into a class which can be extended

type EventsAction = 'on'|'once'|'off'|'trigger';

type EventListenerDictionary = {
    [name: string]: EventListener;
}

type EventListenersDictionary = {
    [name: string]: Array<EventListener>;
}

type EventListener = {
    callback: EventCallback;
    context: any;
}

type EventCallback = {
    (): void;
    _callback?: () => void;
};

export default class Events {
    static on;
    static once;
    static off;
    static trigger;

    private _events?: EventListenersDictionary;

    /**
     * Adds an event listener.
     * @param {string} name - The event name. Passing "all" will bind the callback to all events.
     * @param {function} callback - The event callback.
     * @param {any} [context] - The context to apply to the callback's function invocation.
     * @returns {any} `this` context for chaining.
     */
    on(name: string | EventListenerDictionary, callback: EventCallback, context?: any): Events {
        if (!eventsApi(this, 'on', name, [callback, context]) || !callback) {
            return this;
        }
        const _events = this._events || (this._events = {});
        const events = _events[name] || (_events[name] = []);
        events.push({ callback, context });
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
    once(name: string | EventListenerDictionary, callback: EventCallback, context?: any): Events {
        if (!eventsApi(this, 'once', name, [callback, context]) || !callback) {
            return this;
        }
        let count = 0;
        const self = this;
        const onceCallback = function (this: any): void {
            if (count++) {
                return;
            }
            self.off(name, onceCallback);
            // eslint-disable-next-line prefer-rest-params
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
    off(name?: string | EventListenerDictionary, callback?: EventCallback, context?: any): Events {
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
                const retain: Array<EventListener> = this._events[name] = [];
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
     * @param {string} name - The event name.
     * @param {...any} args - Event callback arguments.
     * @returns {any} `this` context for chaining.
     */
    trigger(name: string, ...args: any[]): Events {
        if (!this._events) {
            return this;
        }
        if (!eventsApi(this, 'trigger', name, args)) {
            return this;
        }
        const events = this._events[name];
        const allEvents = this._events.all;
        if (events) {
            triggerEvents(events, args, this);
        }
        if (allEvents) {
            // eslint-disable-next-line prefer-rest-params
            triggerEvents(allEvents, arguments, this);
        }
        return this;
    }

    /**
     * "Safe" version of `trigger` that causes each callback's execution
     * to be wrapped in a try-catch block
     * @param {string} name - The event name.
     * @param {...any} args - Event callback arguments.
     * @returns {any} `this` context for chaining.
     */
    triggerSafe(name: string, ...args: any[]): Events {
        if (!this._events) {
            return this;
        }
        if (!eventsApi(this, 'trigger', name, args)) {
            return this;
        }
        const events = this._events[name];
        const allEvents = this._events.all;
        if (events) {
            triggerEvents(events, args, this, name);
        }
        if (allEvents) {
            // eslint-disable-next-line prefer-rest-params
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
function eventsApi(obj: Events, action: EventsAction, name: string | EventListenerDictionary | undefined, rest: any[]): name is string {
    if (!name) {
        return true;
    }
    // Handle event maps.
    if (typeof name === 'object') {
        for (let key in name) {
            if (Object.prototype.hasOwnProperty.call(name, key)) {
                // eslint-disable-next-line prefer-spread
                obj[action].apply(obj, [key, name[key]].concat(rest));
            }
        }
        return false;
    }
    // Handle space separated event names.
    if (eventSplitter.test(name)) {
        const names = name.split(eventSplitter);
        for (let i = 0, l = names.length; i < l; i++) {
            // eslint-disable-next-line prefer-spread
            obj[action].apply(obj, [names[i]].concat(rest));
        }
        return false;
    }
    return true;
}

function triggerEvents(events: Array<EventListener>, args: any[] | IArguments, context: any, catchExceptionsForName?: string): void {
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
