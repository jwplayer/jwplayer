define([
    'utils/underscore',
    'utils/helpers'
], function(_, utils) {

    var persistItems = [
        'volume',
        'mute',
        'captionLabel',
        'qualityLabel'
    ];

    function getAllItems() {
        var items = {};
        var cookies = document.cookie.split('; ');
        for (var i = 0; i < cookies.length; i++) {
            var split = cookies[i].split('=');
            if (split[0].substr(0, 9) === 'jwplayer.') {
                var name = split[0].substr(9);
                items[name] = utils.serialize(split[1]);
            }
        }
        return items;
    }

    function getItem(name) {
        return getAllItems()[name];
    }

    function setItem(name, value) {
        document.cookie = 'jwplayer.' + name + '=' + value + '; path=/';
    }

    function removeItem(name) {
        setItem(name, '; expires=Thu, 01 Jan 1970 00:00:01 GMT');
    }

    function clear() {
        var all = getAllItems();
        _.each(all, function(val, name) {
            removeItem(name);
        });
    }

    function initModel(model) {
        _.each(persistItems, function(item) {
            model.on('change:' + item, function(model, value) {
                setItem(item, value);
            });
        });
    }

    return {
        model: initModel,
        getAllItems: getAllItems,
        getItem: getItem,
        setItem: setItem,
        removeItem: removeItem,
        clear: clear
    };
});