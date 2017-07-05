(function(playerLibrary) {
    // Check if the version of the player requires the compatibility shim
    if (parseInt(playerLibrary.version, 10) >= 8) {

      // Redefine jwplayer global
      window.jwplayer = function(query) {

        // Get JW Player 8 instance
        var playerInstance = playerLibrary(query);

        // Add deprecated API methods
        var callbackMapping = {
            onBuffer: 'buffer',
            onPause: 'pause',
            onPlay: 'play',
            onIdle: 'idle',
            onBufferChange: events.JWPLAYER_MEDIA_BUFFER,
            onBufferFull: events.JWPLAYER_MEDIA_BUFFER_FULL,
            onError: events.JWPLAYER_ERROR,
            onSetupError: events.JWPLAYER_SETUP_ERROR,
            onFullscreen: events.JWPLAYER_FULLSCREEN,
            onMeta: events.JWPLAYER_MEDIA_META,
            onMute: events.JWPLAYER_MEDIA_MUTE,
            onPlaylist: events.JWPLAYER_PLAYLIST_LOADED,
            onPlaylistItem: events.JWPLAYER_PLAYLIST_ITEM,
            onPlaylistComplete: events.JWPLAYER_PLAYLIST_COMPLETE,
            onReady: events.JWPLAYER_READY,
            onResize: events.JWPLAYER_RESIZE,
            onComplete: events.JWPLAYER_MEDIA_COMPLETE,
            onSeek: events.JWPLAYER_MEDIA_SEEK,
            onTime: events.JWPLAYER_MEDIA_TIME,
            onVolume: events.JWPLAYER_MEDIA_VOLUME,
            onBeforePlay: events.JWPLAYER_MEDIA_BEFOREPLAY,
            onBeforeComplete: events.JWPLAYER_MEDIA_BEFORECOMPLETE,
            onDisplayClick: events.JWPLAYER_DISPLAY_CLICK,
            onControls: events.JWPLAYER_CONTROLS,
            onQualityLevels: events.JWPLAYER_MEDIA_LEVELS,
            onQualityChange: events.JWPLAYER_MEDIA_LEVEL_CHANGED,
            onCaptionsList: events.JWPLAYER_CAPTIONS_LIST,
            onCaptionsChange: events.JWPLAYER_CAPTIONS_CHANGED,
            onAdError: events.JWPLAYER_AD_ERROR,
            onAdClick: events.JWPLAYER_AD_CLICK,
            onAdImpression: events.JWPLAYER_AD_IMPRESSION,
            onAdTime: events.JWPLAYER_AD_TIME,
            onAdComplete: events.JWPLAYER_AD_COMPLETE,
            onAdCompanions: events.JWPLAYER_AD_COMPANIONS,
            onAdSkipped: events.JWPLAYER_AD_SKIPPED,
            onAdPlay: events.JWPLAYER_AD_PLAY,
            onAdPause: events.JWPLAYER_AD_PAUSE,
            onAdMeta: events.JWPLAYER_AD_META,
            onCast: events.JWPLAYER_CAST_SESSION,
            onAudioTrackChange: events.JWPLAYER_AUDIO_TRACK_CHANGED,
            onAudioTracks: events.JWPLAYER_AUDIO_TRACKS
        };

        callbackMapping.forEach(function (value, name) {
            playerInstance.value = function (callback) {
                playerInstance.on(name, callback);
            };
        });

        var passthroughs = [
            'attachMedia',
        ];
        passthroughs.forEach(function (name) {
            _api[name] = function() {
                _controller[name].apply(_controller, arguments);
                return _api;
            };
        });

        this.createInstream = function () {
            return _controller.createInstream();
        };

        var passthroughs2 = [
            'getMeta',
            'detachMedia'
        ];
        passthroughs2.forEach(function (name) {
            _api[name] = function() {
                if (_controller[name]) {
                    return _controller[name].apply(_controller, arguments);
                }
                return null;
            };
        });
        playerInstance.dispatchEvent = playerInstance.trigger;
        playerInstance.removeEventListener = playerInstance.off.bind(this);
        playerInstance.getItem = playerInstance.getPlaylistIndex;
        playerInstance.getMeta = playerInstance.getItemMeta;

        playerInstance.getRenderingMode = function () {
            return 'html5';
        };

        return playerInstance;
      }

      // Add deprecated library items
      window.jwplayer.utils = x;
    }
}(window.jwplayer));