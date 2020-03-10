import Events from 'utils/backbone.events';
import type { GenericObject } from '../types/generic.type';

type ModelAttributes = {
    [name: string]: any;
}

export default class SimpleModel extends Events {
    public readonly attributes: ModelAttributes;

    constructor() {
        super();
        this.attributes = Object.create(null);
    }

    addAttributes(attributes: ModelAttributes): void {
        Object.keys(attributes).forEach(attr => {
            this.add(attr, attributes[attr]);
        });
    }

    add(attr: string, value: any): void {
        Object.defineProperty(this, attr, {
            get: () => this.attributes[attr],
            set: (val) => this.set(attr, val),
            enumerable: false
        });
        this.attributes[attr] = value;
    }

    get(attr: string): any {
        return this.attributes[attr];
    }

    set(attr: string, val: any): void {
        if (this.attributes[attr] === val) {
            return;
        }
        const oldVal = this.attributes[attr];
        this.attributes[attr] = val;
        this.trigger('change:' + attr, this, val, oldVal);
    }

    clone(): GenericObject {
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

    change(name: string, callback: () => void, context?: any): SimpleModel {
        // Register a change handler and immediately invoke the callback with the current value
        this.on('change:' + name, callback, context);
        const currentVal = this.get(name);
        callback.call(context, this, currentVal, currentVal);
        return this;
    }
}
