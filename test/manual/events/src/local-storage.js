const localStorage = window.localStorage || {};

export const NAMESPACE = '';

export const storage = Object.create({
    getSetupVersion(version) {
        try {
            return localStorage.getItem(`${NAMESPACE}setup_v${version}`);
        } catch (error) {
            return null;
        }
    },

    defineProperty: function(property, serialize) {
        const nsProperty = NAMESPACE + property;
        Object.defineProperty(this, property, {
            get: function() {
                try {
                    if (serialize) {
                        return JSON.parse(localStorage.getItem(nsProperty));
                    }
                    return localStorage.getItem(nsProperty);
                } catch (error) {
                    return null;
                }
            },
            set: function(value) {
                try {
                    if (serialize) {
                        localStorage.setItem(nsProperty, JSON.stringify(value));
                    } else {
                        localStorage.setItem(nsProperty, value);
                    }
                } catch (error) {/* noop */}
            }
        });
    }
});

storage.defineProperty('harnessConfig');
storage.defineProperty('eventsFilter');
storage.defineProperty('setupVersion', true);

Object.defineProperty(storage, 'setupConfig', {
    get: function() {
        const version = storage.setupVersion;
        if (!version) {
            return null;
        }
        return storage.getSetupVersion(version);
    },
    set: function(value) {
        let version = storage.setupVersion || 0;
        if (isNaN(version++)) {
            version = 1;
        }
        try {
            localStorage.setItem(`${NAMESPACE}setup_v${version}`, value);
            localStorage.setupVersion = version;
            localStorage.removeItem(`${NAMESPACE}setup_v${version - 20}`);
            if (storage.setupUpdated) {
                storage.setupUpdated(version);
            }
        } catch (error) {
            console.error(error);
        }
    }
});
