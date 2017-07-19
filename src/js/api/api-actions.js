define([
    'plugins/plugins',
    'utils/underscore',
], function(plugins, _) {
    return function ApiActions(_api, _controller) {
        // Commented out methods are those which are not direct passthroughs
        //   instead these have custom logic inside api.js
        //   Ultimately they should be moved into this file
        var passthroughs = [
            // 'setup',
            // 'remove',
            // 'load',
            // 'play',
            // 'pause',
            // 'playlistNext',
            // 'playlistPrev',
            // 'playlistItem',
            // 'seek',

            'skipAd',
            'stop',
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
