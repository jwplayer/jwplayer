define([], function() {
    var mockApi = {
        getContainer : function() {
            return document.createElement('div');
        },
        onCaptionsList : function() {},
        onCaptionsChange: function() {},
        onPlaylistItem : function() {},
        onPlaylistComplete : function() {},
        onError : function() {},
        onResize: function() {},
        onReady: function() {},
        onFullscreen: function() {},
        getState : function() {}
    };
    return mockApi;
});
