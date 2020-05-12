import { serialize } from 'utils/parser';
import ApiSettings from 'api/api-settings';
import type { GenericObject } from 'types/generic.type';
import type SimpleModel from 'model/simplemodel';

let storage = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    removeItem: function(itemName: string): void {}
};

try {
    storage = window.localStorage || storage;
} catch (e) {/* ignore */}

class Storage {
    namespace: string;
    items: string[];
    constructor(namespace: string, persistItems: string[]) {
        this.namespace = namespace;
        this.items = persistItems;
    }

    getAllItems(): GenericObject {
        return this.items.reduce((memo, key) => {
            const val = storage[`${this.namespace}.${key}`];
            if (val) {
                memo[key] = key !== 'captions' ? serialize(val) : JSON.parse(val);
            }
            return memo;
        }, {});
    }

    track(model: SimpleModel): void {
        this.items.forEach((key) => {
            model.on(`change:${key}`, (changeModel, value) => {
                try {
                    if (key === 'captions') {
                        value = JSON.stringify(value);
                    }
                    storage[`${this.namespace}.${key}`] = value;
                } catch (e) {
                    // ignore QuotaExceededError unless debugging
                    if (ApiSettings.debug) {
                        console.error(e);
                    }
                }
            });
        });
    }

    clear(): void {
        this.items.forEach((key) => {
            storage.removeItem(`${this.namespace}.${key}`);
        });
    }
}

export default Storage;
