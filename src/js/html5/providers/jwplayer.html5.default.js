(function(jwplayer) {

    var noop = jwplayer.utils.noop,
        _ = jwplayer._,
        events = jwplayer.events,
        states = events.state,
        returnFalse = _.constant(false);

    var defaultProvider = {
        // This function is required to determine if a provider can work on a given source
        supports : returnFalse,

        // Basic playback features
        play : noop,
        load : noop,
        stop : noop,
        volume : noop,
        mute : noop,
        seek : noop,
        seekDrag : noop, // only for html5 ?
        resize : noop,
        remove : noop,  // removes from page
        destroy : noop, // frees memory

        setVisibility : noop,
        setFullscreen : returnFalse,
        setContainer : returnFalse,
        getContainer : noop,

        isAudioFile : returnFalse,
        supportsFullscreen : returnFalse,

        getQualityLevels : noop,
        getCurrentQuality : noop,
        setCurrentQuality : noop,

        // TODO :: The following are targets for removal after refactoring
        checkComplete : noop,
        setControls : noop,
        attachMedia : noop,
        detachMedia : noop,

        setState: function(state) {
            if (state === this.state) {
                return;
            }

            var oldState = this.state || states.IDLE;
            this.state = state;

            this.sendEvent(events.JWPLAYER_PLAYER_STATE, {
                oldstate: oldState,
                newstate: state
            });
        }
    };


    // Make available to other providers for extending
    jwplayer.html5.DefaultProvider  = defaultProvider;

})(jwplayer);
