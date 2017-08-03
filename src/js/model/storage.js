import { serialize } from 'utils/parser';
import ApiSettings from 'api/api-settings';

let storage = {
    removeItem: function() {}
};

try {
    storage = window.localStorage;
} catch (e) {/* ignore */}

function Storage(namespace, persistItems) {
    this.namespace = namespace;
    this.items = persistItems;
}

Object.assign(Storage.prototype, {
    getAllItems() {
        return this.items.reduce((memo, key) => {
            const val = storage[`${this.namespace}.${key}`];
            if (val) {
                memo[key] = serialize(val);
            }
            return memo;
        }, {});
    },
    track(model) {
        this.items.forEach((key) => {
            model.on(`change:${key}`, (changeModel, value) => {
                try {
                    storage[`${this.namespace}.${key}`] = value;
                } catch (e) {
                    // ignore QuotaExceededError unless debugging
                    if (ApiSettings.debug) {
                        console.error(e);
                    }
                }
            });
        });
    },
    clear() {
        this.items.forEach((key) => {
            storage.removeItem(`${this.namespace}.${key}`);
        });
    }
});

export default Storage;
