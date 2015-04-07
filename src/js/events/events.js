define([], function() {
    var touchEvents = {
        DRAG: 'jwplayerDrag',
        DRAG_START: 'jwplayerDragStart',
        DRAG_END: 'jwplayerDragEnd',
        TAP: 'jwplayerTap'
    };

    var events = {
        // Script Loaders
        COMPLETE: 'complete',
        ERROR: 'error',

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
        JWPLAYER_INSTREAM_DESTROYED: 'instreamDestroyed',
        JWPLAYER_CAST_AD_CHANGED: 'castAdChanged',

        // Events
        JWPLAYER_MEDIA_COMPLETE: 'complete',
        JWPLAYER_READY: 'ready',
        JWPLAYER_MEDIA_SEEK: 'seek',
        JWPLAYER_MEDIA_BEFOREPLAY: 'beforePlay',
        JWPLAYER_MEDIA_BEFORECOMPLETE: 'beforeComplete',
        JWPLAYER_MEDIA_BUFFER_FULL: 'bufferFull',
        JWPLAYER_DISPLAY_CLICK: 'displayClick',
        JWPLAYER_PLAYLIST_COMPLETE: 'playlistComplete',
        JWPLAYER_CAST_SESSION: 'cast',
        JWPLAYER_MEDIA_ERROR: 'mediaError',
        JWPLAYER_MEDIA_FIRST_FRAME: 'firstFrame',
        JWPLAYER_MEDIA_PLAY_ATTEMPT: 'playAttempt',
        JWPLAYER_MEDIA_LOADED: 'loaded',
        JWPLAYER_MEDIA_SEEKED: 'seeked',

        // Setup Events
        API_SETUP: 'apiSetup',
        API_READY: 'apiReady',
        API_INITIALIZED: 'apiInitialized',
        JWPLAYER_SETUP_ERROR: 'setupError',

        // Utility
        JWPLAYER_ERROR: 'error',
        JWPLAYER_PLAYER_STATE: 'state',
        JWPLAYER_CAST_AVAILABLE: 'castAvailable',

        // Model Changes
        JWPLAYER_MEDIA_BUFFER: 'buffer',
        JWPLAYER_MEDIA_TIME: 'time',
        JWPLAYER_MEDIA_VOLUME: 'volume',
        JWPLAYER_MEDIA_MUTE: 'mute',
        JWPLAYER_MEDIA_META: 'meta',
        JWPLAYER_MEDIA_LEVELS: 'mediaLevels',
        JWPLAYER_MEDIA_LEVEL_CHANGED: 'mediaLevelsChanged',
        JWPLAYER_CONTROLS: 'controls',
        JWPLAYER_FULLSCREEN: 'fullscreen',
        JWPLAYER_RESIZE: 'resize',
        JWPLAYER_PLAYLIST_ITEM: 'playlistItem',
        JWPLAYER_PLAYLIST_LOADED: 'playlist',
        JWPLAYER_AUDIO_TRACKS: 'audioTracks',
        JWPLAYER_AUDIO_TRACK_CHANGED: 'audioTracksChanged',

        // Model - Captions
        JWPLAYER_CAPTIONS_LIST: 'captions',
        JWPLAYER_CAPTIONS_CHANGED: 'captionsChanged',
        JWPLAYER_CAPTIONS_LOADED: 'captionsLoaded',

        // Provider Communication
        JWPLAYER_PROVIDER_CHANGED: 'providerChanged',
        JWPLAYER_PROVIDER_LOADING: 'providerLoading',
        JWPLAYER_PROVIDER_STALLED: 'providerStalled',
        JWPLAYER_PROVIDER_FIRST_FRAME: 'providerFirstFrame',

        // UI Events
        JWPLAYER_USER_ACTION: 'userAction',
        JWPLAYER_PROVIDER_CLICK: 'providerClick',
        JWPLAYER_VIEW_TAB_FOCUS: 'tabFocus',
        JWPLAYER_CONTROLBAR_DRAGGING: 'scrubbing',
        JWPLAYER_INSTREAM_CLICK: 'instreamClick'
    };

    events.touchEvents = touchEvents;

    return events;
});
