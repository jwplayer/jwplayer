define([], function() {
    return {
        BUFFERING : 'buffering',
        IDLE      : 'idle',
        COMPLETE  : 'complete',
        PAUSED    : 'paused',
        PLAYING   : 'playing',

        // These exist at the provider level, but are converted to BUFFERING at higher levels
        LOADING   : 'loading',
        STALLED   : 'stalled'
    };
});