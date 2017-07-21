import parser from 'utils/parser';

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
                memo[key] = parser.serialize(val);
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
                    const jwplayer = window.jwplayer;
                    if (jwplayer && jwplayer.debug) {
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
