((playerLibrary) => {

    // Check if the version of the player requires the compatibility shim
    if (parseInt(playerLibrary.version, 10) >= 7) {

        // Redefine jwplayer global
        window.jwplayer = (query) => {

            // Get JW Player 8 instance
            var playerInstance = playerLibrary(query);

            playerInstance.dispatchEvent = playerInstance.trigger;
            playerInstance.removeEventListener = playerInstance.off.bind(this);
            playerInstance.getItem = playerInstance.getPlaylistIndex;
            playerInstance.getMeta = playerInstance.getItemMeta;
            playerInstance.getRenderingMode = () => {
                return 'html5';
            };

            // Add deprecated API methods
            var callbackMap = {
                onBuffer: 'buffer',
                onPause: 'pause',
                onPlay: 'play',
                onIdle: 'idle',
                onBufferChange: 'bufferChange',
                onBufferFull: 'bufferFull',
                onError: 'error',
                onSetupError: 'setupError',
                onFullscreen: 'fullscreen',
                onMeta: 'meta',
                onMute: 'mute',
                onPlaylist: 'playlist',
                onPlaylistItem: 'playlistItem',
                onPlaylistComplete: 'playlistComplete',
                onReady: 'ready',
                onResize: 'resize',
                onComplete: 'complete',
                onSeek: 'seek',
                onTime: 'time',
                onVolume: 'volume',
                onBeforePlay: 'beforePlay',
                onBeforeComplete: 'beforeComplete',
                onDisplayClick: 'displayClick',
                onControls: 'controls',
                onQualityLevels: 'levels',
                onQualityChange: 'levelsChanged',
                onCaptionsList: 'captionsList',
                onCaptionsChange: 'captionsChanged',
                onAdError: 'adError',
                onAdClick: 'adClick',
                onAdImpression: 'adImpression',
                onAdTime: 'adTime',
                onAdComplete: 'adComplete',
                onAdCompanions: 'adCompanions',
                onAdSkipped: 'adSkipped',
                onAdPlay: 'adPlay',
                onAdPause: 'adPause',
                onAdMeta: 'adMeta',
                onCast: 'cast',
                onAudioTrackChange: 'audioTrackChanged',
                onAudioTracks: 'audioTracks'
            };

            callbackMap.forEach((value, name) => {
                playerInstance[value] = (callback) => {
                    playerInstance.on(name, callback);
                };
            });
            return playerInstance;
        }
    }
    // Add deprecated library items
})(window.jwplayer);
