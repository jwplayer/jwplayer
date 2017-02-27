define([
    'utils/underscore',
    'utils/helpers'
], function(_, utils) {
    var storage = {
        removeItem: utils.noop
    };

    try {
        storage = window.localStorage;
    } catch (e) {/* ignore */}

    function jwPrefix(str) {
        return 'jwplayer.' + str;
    }

    function getAllItems() {
        return _.reduce(this.persistItems, function(memo, key) {
            var val = storage[jwPrefix(key)];
            if (val) {
                memo[key] = utils.serialize(val);
            }
            return memo;
        }, {});
    }

    function setItem(name, value) {
        try {
            storage[jwPrefix(name)] = value;
        } catch (e) {
            // ignore QuotaExceededError unless debugging
            var jwplayer = window.jwplayer;
            if (jwplayer && jwplayer.debug) {
                console.error(e);
            }
        }
    }

    function clear() {
        _.each(this.persistItems, function(val) {
            storage.removeItem(jwPrefix(val));
        });
    }

    function Storage() {
        this.persistItems = [
            'volume',
            'mute',
            'captionLabel',
            'qualityLabel'
        ];
    }

    function track(model) {
        _.each(this.persistItems, function(item) {
            model.on('change:' + item, function(changeModel, value) {
                setItem(item, value);
            });
        });
    }

    _.extend(Storage.prototype, {
        getAllItems: getAllItems,
        track: track,
        clear: clear
    });

    return Storage;
});
