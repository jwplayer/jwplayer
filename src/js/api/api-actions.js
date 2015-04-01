define([
    'utils/underscore',
], function(_) {

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
            'stop',
            'playlistNext',
            'playlistPrev',
            'playlistItem',
            'resize',

            //'addButton',
            'removeButton',

            'registerPlugin',

            'attachMedia',
            'detachMedia'
        ];

        _.each(passthroughs, function(func) {
            _api[func] = function() {
                //return _controller[func].bind(_controller);
                return _controller[func].apply(_controller, arguments);
            };
        });
    };
});
