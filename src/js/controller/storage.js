define([
    'utils/underscore',
    'utils/helpers'
], function(_, utils) {

    function jwPrefix(str) {
        return 'jwplayer.' + str;
    }

    function getAllItems() {
        return _.reduce(this.persistItems, function(memo, key) {
            var val = window.localStorage[jwPrefix(key)];
            if (val) {
                memo[key] = utils.serialize(val);
            }
            return memo;
        }, {});
    }

    function setItem(name, value) {
        window.localStorage[jwPrefix(name)] = value;
    }

    function clear() {
        _.each(this.persistItems, function(val) {
            window.localStorage.removeItem(jwPrefix(val));
        });
    }

    function Storage() { }

    function track(persistItems, model) {
        this.persistItems = persistItems;

        _.each(this.persistItems, function(item) {
            model.on('change:' + item, function(model, value) {
                setItem(item, value);
            });
        });
    }

    _.extend(Storage.prototype, {
        getAllItems: getAllItems,
        track : track,
        clear: clear
    });

    return Storage;
});