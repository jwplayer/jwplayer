define([], function() {
    var touchEvents = {
        DRAG: 'drag',
        DRAG_START: 'dragStart',
        DRAG_END: 'dragEnd',
        CLICK: 'click',
        DOUBLE_CLICK: 'doubleClick',
        TAP: 'tap',
        DOUBLE_TAP: 'doubleTap',
        OVER: 'over',
        MOVE: 'move',
        OUT: 'out'
    };

    var events = {
        // Script Loaders
        COMPLETE: 'complete',
        ERROR: 'error',

        // Ad events
        JWPLAYER_AD_CLICK: 'adClick',
        JWPLAYER_AD_COMPANIONS: 'adCompanions',
        JWPLAYER_AD_COMPLETE: 'adComplete',
        JWPLAYER_AD_ERROR: 'adError',
        JWPLAYER_AD_IMPRESSION: 'adImpression',
        JWPLAYER_AD_META: 'adMeta',
        JWPLAYER_AD_PAUSE: 'adPause',
        JWPLAYER_AD_PLAY: 'adPlay',
        JWPLAYER_AD_SKIPPED: 'adSkipped',
        JWPLAYER_AD_TIME: 'adTime',
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
        JWPLAYER_SETUP_ERROR: 'setupError',

        // Utility
        JWPLAYER_ERROR: 'error',
        JWPLAYER_PLAYER_STATE: 'state',
        JWPLAYER_CAST_AVAILABLE: 'castAvailable',

        // Model Changes
        JWPLAYER_MEDIA_BUFFER: 'bufferChange',
        JWPLAYER_MEDIA_TIME: 'time',
        JWPLAYER_MEDIA_TYPE: 'mediaType',
        JWPLAYER_MEDIA_VOLUME: 'volume',
        JWPLAYER_MEDIA_MUTE: 'mute',
        JWPLAYER_MEDIA_META: 'meta',
        JWPLAYER_MEDIA_LEVELS: 'levels',
        JWPLAYER_MEDIA_LEVEL_CHANGED: 'levelsChanged',
        JWPLAYER_CONTROLS: 'controls',
        JWPLAYER_FULLSCREEN: 'fullscreen',
        JWPLAYER_RESIZE: 'resize',
        JWPLAYER_PLAYLIST_ITEM: 'playlistItem',
        JWPLAYER_PLAYLIST_LOADED: 'playlist',
        JWPLAYER_AUDIO_TRACKS: 'audioTracks',
        JWPLAYER_AUDIO_TRACK_CHANGED: 'audioTrackChanged',

        // View Component Actions
        JWPLAYER_LOGO_CLICK: 'logoClick',

        // Model - Captions
        JWPLAYER_CAPTIONS_LIST: 'captionsList',
        JWPLAYER_CAPTIONS_CHANGED: 'captionsChanged',

        // Provider Communication
        JWPLAYER_PROVIDER_CHANGED: 'providerChanged',
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
