define([
    'plugins/plugins',
    'utils/underscore',
], function(plugins, _) {

    return function(_api, _controller) {
        // Commented out methods are those which are not direct passthroughs
        //   instead these have custom logic inside api.js
        //   Ultimately they should be moved into this file
        var passthroughs = [
            // 'setup',
            //'load',
            //'play',
            //'pause',
            //'remove',

            'seek',
            'skipAd',
            'stop',
            'playlistNext',
            'playlistPrev',
            'playlistItem',
            'resize',

            'addButton',
            'removeButton',

            'registerPlugin',

            'attachMedia',
            'next'
        ];


        _.each(passthroughs, function(func) {
            _api[func] = function() {
                _controller[func].apply(_controller, arguments);
                return _api;
            };
        });

        _api.registerPlugin = plugins.registerPlugin;
    };
});
