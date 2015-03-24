
define([
    'utils/underscore',
], function(_) {

    return function(_api) {
        var _internalFuncsToGenerate = [
            'getBuffer',
            'getCaptionsList',
            'getControls',
            'getCurrentCaptions',
            'getCurrentQuality',
            'getCurrentAudioTrack',
            'getDuration',
            'getFullscreen',
            'getHeight',
            'getLockState',
            'getMute',
            'getPlaylistIndex',
            'getSafeRegion',
            'getPosition',
            'getQualityLevels',
            'getState',
            'getVolume',
            'getWidth',
            'isBeforeComplete',
            'isBeforePlay',
            'releaseState'
        ];

        var _chainableInternalFuncs = [
            'playlistNext',
            'stop',

            // The following pass an argument to function
            'forceState',
            'playlistPrev',
            'seek',
            'setCurrentCaptions',
            'setControls',
            'setCurrentQuality',
            'setVolume',
            'setCurrentAudioTrack'
        ];


        // given a name "getBuffer", it adds to jwplayer.api a function which internally triggers jwGetBuffer
        function generateInternalFunction(name) {
            var internalName = 'jw' + name.charAt(0).toUpperCase() + name.slice(1);

            _api[name] = function () {
                var value = _api.callInternal.apply(this,
                    [internalName].concat(Array.prototype.slice.call(arguments, 0)));

                if (_.has(_chainableInternalFuncs, name)) {
                    return _api;
                }
                return value;
            };
        }

        _.each(_internalFuncsToGenerate.concat(_chainableInternalFuncs), generateInternalFunction);
    };
});
