import Events from 'utils/backbone.events';

const SimpleModel = {
    on: Events.on,
    once: Events.once,
    off: Events.off,
    trigger: Events.trigger,
    get(attr) {
        this.attributes = this.attributes || {};
        return this.attributes[attr];
    },
    set(attr, val) {
        this.attributes = this.attributes || {};

        if (this.attributes[attr] === val) {
            return;
        }
        const oldVal = this.attributes[attr];
        this.attributes[attr] = val;
        this.trigger('change:' + attr, this, val, oldVal);
    },
    clone() {
        const cloned = {};
        const attributes = this.attributes;
        if (attributes) {
            /* eslint guard-for-in: 0 */
            for (let prop in attributes) {
                cloned[prop] = attributes[prop];
            }
        }
        return cloned;
    },
    change(name, callback, context) {
        name.split(' ').forEach((handlerName) => {
            // Register a change handler and immediately invoke the callback with the current value
            const eventName = 'change:' + handlerName;
            const currentVal = this.get(handlerName);

            this.on(eventName, callback, context);
            callback.call(context, this, currentVal, currentVal);
        });

        return this;
    }
};

export default SimpleModel;
