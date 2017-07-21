/*
    This script is a compatibility bridge between our new API, introduced in JW8, and our old API. Our new API removes
    several methods and properties and may break any scripts interacting with the new player. We provide this script to
    you so that you can upgrade to the latest & greatest immediately; however, we encourage you to read through this source,
    upgrade your usage of our API, and remove this bridge. It will save your page some time & space.
 */
(function(playerLibrary) {
    /*
        Ensure JW Player is loaded before trying to modify it.
        If your script is exiting here, make sure this script is loaded after your player library
    */
    if (!playerLibrary) {
        return;
    }

    /*
        Check if the version of the player requires the compatibility shim. Only versions below 8 require this script.
    */
    if (parseInt(playerLibrary.version, 10) >= 8) {
        var jwplayerCompatible = function(query) {
            var playerInstance = playerLibrary(query);
            if (!playerInstance.trigger) {
                return playerInstance;
            }

            /*
                We've removed a few methods from the public API, and our events now implement Backbone events.
             */
            playerInstance.dispatchEvent = playerInstance.trigger;
            playerInstance.removeEventListener = playerInstance.off;
            playerInstance.getItem = playerInstance.getPlaylistIndex;
            playerInstance.getMeta = playerInstance.getItemMeta;
            playerInstance.getRenderingMode = function() {
                return 'html5';
            };

            /*
                In JW8 we've removed the on* events. They've been replaced by the on() method, which accepts a string and
                a callback. The event name is typically the name as it's on* event, with the "on" removed and the first letter
                decapitalized.
            */
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

            Object.keys(callbackMap).forEach(function(key) {
                playerInstance[key] = function (callback) {
                    return playerInstance.on(callbackMap[key], callback);
                };
            });

            return playerInstance;
        };

        /*
         We've removed our browser/OS inspection utils, is* (isChrome, isAndroid, etc.) and have replaced them with
         an Environment object. This object details the environment in which the player thinks it's in. Refer to our
         API docs for more information.
         */
        var environment = playerLibrary(document.createElement('div')).getEnvironment();
        var utils = playerLibrary.utils;
        var valueFn = function (getter) { return function() { return getter; }; };

        utils.isAndroidNative = valueFn(environment.OS.androidNative);
        utils.isAndroid = valueFn(environment.OS.android);
        utils.isChrome = valueFn(environment.Browser.chrome);
        utils.isEdge = valueFn(environment.Browser.edge);
        utils.isFF = valueFn(environment.Browser.firefox);
        utils.isFacebook = valueFn(environment.Browser.facebook);
        utils.isFlashSupported = valueFn(environment.Features.flash);
        utils.isIE = valueFn(environment.Browser.ie);
        utils.isIETrident = function () { return environment.Browser.ie && environment.Browser.version.major >= 11; };
        utils.isIOS = valueFn(environment.OS.iOS);
        utils.isIPad = valueFn(environment.OS.iPad);
        utils.isIPod = valueFn(environment.OS.iPhone);
        utils.isMSIE = valueFn(environment.Browser.msie);
        utils.isMobile = valueFn(environment.OS.mobile);
        utils.isOSX = valueFn(environment.OS.mac);
        utils.isSafari = valueFn(environment.Browser.safari);

        /*
         Extend new library function with the same properties as the original.
         */
        jwplayerCompatible._ = playerLibrary._;
        jwplayerCompatible.api = playerLibrary.api;
        jwplayerCompatible.events = playerLibrary.events;
        jwplayerCompatible.playlist = playerLibrary.playlist;
        jwplayerCompatible.plugins = playerLibrary.plugins;
        jwplayerCompatible.utils = utils;
        jwplayerCompatible.version = playerLibrary.version;
        jwplayerCompatible.vid = playerLibrary.vid;

        window.jwplayer = jwplayerCompatible;
    }
}(window.jwplayer));
