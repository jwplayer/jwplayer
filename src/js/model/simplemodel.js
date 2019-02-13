import Events from 'utils/backbone.events';


export default class SimpleModel extends Events {

    constructor() {
        super();
        this.attributes = Object.create(null);
    }

    addAttributes(attributes) {
        Object.keys(attributes).forEach(attr => {
            this.add(attr, attributes[attr]);
        });
    }

    add(attr, value) {
        Object.defineProperty(this, attr, {
            get: () => this.attributes[attr],
            set: (val) => this.set(attr, val),
            enumerable: false
        });
        this.attributes[attr] = value;
    }

    get(attr) {
        return this.attributes[attr];
    }

    set(attr, val) {
        if (this.attributes[attr] === val) {
            return;
        }
        const oldVal = this.attributes[attr];
        this.attributes[attr] = val;
        this.trigger('change:' + attr, this, val, oldVal);
    }

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
    }

    change(name, callback, context) {
        // Register a change handler and immediately invoke the callback with the current value
        this.on('change:' + name, callback, context);
        const currentVal = this.get(name);
        callback.call(context, this, currentVal, currentVal);
        return this;
    }
}
