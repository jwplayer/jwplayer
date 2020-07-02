export const events = {
    /** Global UI events can fire when idle, playing content, or in an ad break */
    globalUi: [
        'viewable', 'adBlock',
        'userActive', 'userInactive',
        'breakpoint', 'resize', 'fullscreen', 'float',
        'controls',
        'mute', 'volume',
        'castAvailable', 'cast', 'relatedReady', 'videoThumbFirstFrame'
    ],
    /** Ad break events fire during an ad break */
    adBreak: [
        'adBreakStart', 'adBreakEnd',
        'adItem', 'adMeta', 'adStarted', 'adImpression', 'adViewableImpression',
        'adPlay', 'adPause', 'adTime', 'adCompanions',
        'adClick', 'adSkipped', 'adComplete', 'adError', 'adWarning'
    ],
    /** Media events fire when idle or playing content, not in an ad break */
    media: [
        'levels', 'levelsChanged',
        'captionsList', 'captionsChanged', 'subtitlesTracks', 'subtitlesTrackChanged',
        'audioTracks', 'audioTrackChanged',
        'mediaType', 'metadataCueParsed', 'meta', 'visualQuality',
        'bufferChange', 'bufferFull', 'providerFirstFrame', 'providerChanged', 'providerPlayer',
        'time', 'seek', 'seeked',
        'fullscreenchange',
        'mediaError'
    ],
    /** Playback events fire when idle or playing content, not in an ad break */
    playback: [
        'ready',
        'idle', 'buffer', 'play', 'pause',
        'playlist', 'playlistItem', 'playlistComplete',
        'beforePlay', 'beforeComplete', 'complete',
        'playAttempt',
        'firstFrame',
        'playbackRateChanged',
        'nextShown', 'destroyPlugin',
        'click', 'displayClick', 'logoClick', 'nextClick', 'nextAutoAdvance',
        'remove'
    ],
    /** Error event order depends on the error type:
     *
     * A "warning" event is any non-fatal error that does not interrupt playback, but may signal some loss of functionality
     * because something did not work as expected. These events can occur at any time, depending on the source of the event.
     *
     * An "autostartNotAllowed" event is a type of warning emitted after setup (after "ready") for players set to autostart.
     * It indicates that playback was not attempted because it is not allowed by the browser without user interaction.
     *
     * "playAttemptFailed" is a type of warning that follows "playAttempt" events, when playback was prevented from starting
     * because the request to play was interrupted (possibly by a call to pause) or blocked by the browser's autoplay policy.
     *
     * An "error" event is a fatal error that interrupts the player. In these cases, the player appears in an error state,
     * because it cannot begin or continue playing the current playlist item.
     *
     * A "setupError" event is a fatal error that only occurs before setup can complete.
     * When there is a setup error, the player appears in an error state and will never fire a "ready" event.
     */
    error: [
        'warning',
        'autostartNotAllowed',
        'playAttemptFailed',
        'error',
        'setupError'
    ]
};
