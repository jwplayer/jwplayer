
define([
    'underscore',
], function(_) {

    return function(_api, _controller) {

        var modelGetters = [
            'buffer',
            'controls',
            'position',
            'duration',
            'width',
            'height',
            'fullscreen',
            'volume',
            'mute',
            'state',
            'item', // this was playlistindex
            'stretching',
            'playlist'
        ];

        // given a name "buffer", it adds to jwplayer api a function named getBuffer
        _.each(modelGetters, function(attr) {
            var format = attr.slice(0,1).toUpperCase() + attr.slice(1);

            _api['get' + format] = function() {
                if (!_controller._model) {
                    return null;
                }
                return _controller._model.get(attr);
            };
        });



        var passthroughs = [
            'getAudioTracks',
            'getCaptionsList',

            'getCurrentAudioTrack',
            'setCurrentAudioTrack',

            'getCurrentCaptions',
            'setCurrentCaptions',

            'getCurrentQuality',
            'setCurrentQuality',

            'getQualityLevels',

            'getSafeRegion',
            'isBeforeComplete',
            'isBeforePlay',


            // Sisters of the model getters
            'setControls',
            'setFullscreen',
            'setVolume',
            'setMute'

            // These are implemented in api.js, but should be here
            //'getItemMeta',
            //'getMeta',
            //'getPlaylistItem',
            //'getContainer',
            //'playlistItem',
        ];
        _.each(passthroughs, function(func) {
            _api[func] = function() {
                return _controller[func].apply(_controller, arguments);
            };
        });
    };
});
