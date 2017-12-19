//     Backbone.js 1.1.2

// Backbone.Events
// ---------------

// A module that can be mixed in to *any object* in order to provide it with
// custom events. You may bind with `on` or remove with `off` callback
// functions to an event; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     Object.assign(object, Backbone.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//

const slice = [].slice;

// Combine mixins into a class which can be extended
export default class Events {

    /**
     * Adds an event listener.
     * @param {string} name - The event name. Passing "all" will bind the callback to all events.
     * @param {function} callback - The event callback.
     * @param {any} [context] - The context to apply to the callback's function invocation.
     * @return {Api}
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
     * @return {Api}
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
     * @return {Api}
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

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
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

// Make class properties enumerable and static
Object.defineProperty(Events.prototype, 'on', { enumerable: true });
Object.defineProperty(Events.prototype, 'once', { enumerable: true });
Object.defineProperty(Events.prototype, 'off', { enumerable: true });
Object.defineProperty(Events.prototype, 'trigger', { enumerable: true });

Events.on = Events.prototype.on;
Events.once = Events.prototype.once;
Events.off = Events.prototype.off;
Events.trigger = Events.prototype.trigger;

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
        for (var key in name) {
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
