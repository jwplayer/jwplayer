(function(jwplayer) {
    var _ = jwplayer._;

    function addLegacyMapping(playerInstance) {

        // New API - dummy to fallback to old API
        playerInstance.get = function (attr) {
            attr = attr[0].toUpperCase() + attr.slice(1);
            return playerInstance['get' + attr]();
        };

        playerInstance.set = function (attr, val) {
            var cased = attr;
            cased = cased[0].toUpperCase() + cased.slice(1);
            try {
                return playerInstance['set' + cased](val);
            } catch (e) {
                throw 'Attempt to set ' + attr + ' failed';
            }
        };

        var eventMapping = {
            onIdle: 'state:idle',
            onPause: 'state:pause',
            onPlay: 'state:play',
            onBuffer: 'state:buffer',

            onAdClick: 'ad:click',
            onAdCompanions: 'ad:companion',
            onAdComplete: 'ad:complete',
            onAdError: 'ad:error',
            onAdImpression: 'ad:impression',
            onAdMeta: 'ad:meta',
            onAdPause: 'ad:pause',
            onAdPlay: 'ad:play',
            onAdSkipped: 'ad:skipped',
            onAdTime: 'ad:time',

            onResize: 'action:resize',
            onCast: 'action:cast',
            onDisplayClick: 'action:click',
            onSeek: 'action:seek',

            onBeforePlay: 'playback:beforeplay',
            onBeforeComplete: 'playback:beforecomplete',
            onBufferChange: 'playback:buffer',
            onComplete: 'playback:complete',
            onControls: 'playback:controls',
            onFullscreen: 'playback:fullscreen',
            onMeta: 'playback:meta',
            onMute: 'playback.mute',
            onReady: 'playback:ready',
            onTime: 'playback:time',
            onVolume: 'playback:volume',

            onAudioTrackChange: 'adaptive.audio.change',
            onAudioTracks: 'adaptive.audio.load',
            onQualityChange: 'adaptive:video:change',
            onQualityLevels: 'adaptive:video:load',

            onCaptionsChange: 'captions:change',
            onCaptionsList: 'captions:load',

            onPlaylist: 'playlist:init',
            onPlaylistItem: 'playlist:item',
            onPlaylistComplete: 'playlist.complete',

            onError: 'error',
            onSetupError: 'error',
            onBufferFull: 'blah'
        };

        var mapping = _.invert(eventMapping);

        playerInstance.on = function (event, callback) {
            var oldMethod = mapping[event];

            return playerInstance[oldMethod](callback);
        };

        playerInstance.off = function () {
            throw '.off() is not supported yet';
        };
    }

    jwplayer.api.addLegacyMapping = addLegacyMapping;

}(window.jwplayer));
