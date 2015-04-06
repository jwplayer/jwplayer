define(['utils/keymirror'], function(keyMirror) {
    return keyMirror({
        BUFFERING : null,
        IDLE      : null,
        COMPLETE  : null,
        PAUSED    : null,
        PLAYING   : null,

        // These exist at the provider level, but are converted to BUFFERING at higher levels
        LOADING   : null,
        STALLED   : null
    });
});
