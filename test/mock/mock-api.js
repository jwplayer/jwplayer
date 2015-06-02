define([], function() {
    function noop() {
        console.log('I shouldn\'t exist.');
    }
    var mockApi = {
        getContainer : function() {
            return document.createElement('div');
        },

        on : noop,

        onAdPlay : noop,
        onAdSkipped : noop,
        onAdComplete : noop,
        onAdError : noop,
        onCaptionsList : noop,
        onCaptionsChange: noop,
        onPlaylistItem : noop,
        onPlaylistComplete : noop,
        onError : noop,
        onResize: noop,
        onReady: noop,
        onFullscreen: noop,
        getState : noop,
        setVolume : noop,
        setMute : noop,
        play : noop,
        pause : noop,
    };
    return mockApi;
});
