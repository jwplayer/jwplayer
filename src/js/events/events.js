define([], function() {
    var touchEvents = {
        DRAG: 'jwplayerDrag',
        DRAG_START: 'jwplayerDragStart',
        DRAG_END: 'jwplayerDragEnd',
        TAP: 'jwplayerTap'
    };

    var events = {
        // Ad events
        JWPLAYER_AD_CLICK: 'adClick',
        JWPLAYER_AD_COMPANIONS: 'adCompanion',
        JWPLAYER_AD_COMPLETE: 'adComplete',
        JWPLAYER_AD_ERROR: 'adError',
        JWPLAYER_AD_IMPRESSION: 'adImpression',
        JWPLAYER_AD_META: 'adMeta',
        JWPLAYER_AD_PAUSE: 'adPause',
        JWPLAYER_AD_PLAY: 'adPlay',
        JWPLAYER_AD_SKIPPED: 'adSkipped',
        JWPLAYER_AD_TIME: 'adTime',

        // Events
        JWPLAYER_MEDIA_COMPLETE: 'complete',
        JWPLAYER_READY: 'ready',
        JWPLAYER_MEDIA_SEEK: 'seek',
        JWPLAYER_MEDIA_BEFOREPLAY: 'beforePlay',
        JWPLAYER_MEDIA_BEFORECOMPLETE: 'beforeComplete',
        JWPLAYER_MEDIA_BUFFER_FULL: 'bufferFull',
        JWPLAYER_DISPLAY_CLICK: 'displayClick',
        JWPLAYER_PLAYLIST_COMPLETE: 'playlistComplete',
        // Cast?


        // Model Changes
        JWPLAYER_MEDIA_BUFFER: 'buffer',
        JWPLAYER_MEDIA_META: 'meta',
        JWPLAYER_CONTROLS: 'controls',
        JWPLAYER_FULLSCREEN: 'fullscreen',
        JWPLAYER_MEDIA_MUTE: 'mute',
        JWPLAYER_MEDIA_VOLUME: 'volume',
        JWPLAYER_CAPTIONS_LIST: 'captionsList',
        JWPLAYER_CAPTIONS_CHANGED: 'captionsChanged',
        JWPLAYER_RESIZE: 'resize',
        JWPLAYER_PLAYLIST_ITEM: 'playlistItem',
        JWPLAYER_PLAYLIST_LOADED: 'playlist',
        JWPLAYER_AUDIO_TRACKS: 'audioTracks',
        JWPLAYER_AUDIO_TRACK_CHANGED: 'audioTracksChanged',
        JWPLAYER_MEDIA_LEVELS: 'mediaLevels',
        JWPLAYER_MEDIA_LEVEL_CHANGED: 'mediaLevelsChanged',

        JWPLAYER_MEDIA_TIME: 'time',
        JWPLAYER_MEDIA_SEEKED: 'seek',

        // Script Loaders
        COMPLETE: 'complete',
        ERROR: 'error',

        API_SETUP: 'apiSetup',
        JWPLAYER_CAPTIONS_LOADED: 'captionsLoaded',
        API_READY: 'apiReady',

        JWPLAYER_ERROR: 'error2',
        JWPLAYER_SETUP_ERROR: 'setupError',
        API_INITIALIZED: 'apiInitialized',
        JWPLAYER_PROVIDER_CHANGED: 'providerChanged',

        // Media Events
        JWPLAYER_MEDIA_ERROR: 'mediaError',
        JWPLAYER_MEDIA_FIRST_FRAME: 'firstFrame',
        JWPLAYER_MEDIA_PLAY_ATTEMPT: 'playAttempt',
        JWPLAYER_MEDIA_LOADED: 'loaded',

        // State events
        JWPLAYER_PLAYER_STATE: 'state',

        JWPLAYER_PROVIDER_CLICK: 'providerClick',
        JWPLAYER_PROVIDER_LOADING: 'providerLoading',
        JWPLAYER_PROVIDER_STALLED: 'providerStalled',
        JWPLAYER_PROVIDER_FIRST_FRAME: 'providerFirstFrame',

        JWPLAYER_VIEW_TAB_FOCUS: 'tabFocus',

        // Controls show/hide
        JWPLAYER_USER_ACTION: 'userAction',
        JWPLAYER_CONTROLBAR_DRAGGING: 'scrubbing',

        // Instream events
        JWPLAYER_INSTREAM_CLICK: 'instreamClick',
        JWPLAYER_INSTREAM_DESTROYED: 'instreamDestroyed',

        // Casting
        JWPLAYER_CAST_SESSION: 'castSession',
        JWPLAYER_CAST_AVAILABLE: 'castAvailable',
        JWPLAYER_CAST_AD_CHANGED: 'castAdChanged'
    };

    events.touchEvents = touchEvents;

    return events;
});
