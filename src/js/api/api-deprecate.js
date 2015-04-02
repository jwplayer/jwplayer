define([
], function() {

    return function(_api, _controller) {

        // This file is only required for legacy support of JWPlayer 6

        // Rename
        _api.getPlaylistIndex = _api.getIndex;

        // jwNames
        _api.jwPlay = _controller.play;
        _api.jwPause = _controller.pause;
        _api.jwSetMute = _controller.setMute;
        _api.jwLoad = _controller.load;
        _api.jwPlaylistItem = _controller.item;
        _api.jwGetAudioTracks = _controller.getAudioTracks;
        _api.jwDetachMedia = _controller.detachMedia;
        _api.jwAttachMedia = _controller.attachMedia;
        _api.jwAddEventListener = _controller.on;
        _api.jwRemoveEventListener = _controller.off;

        _api.jwStop = _controller.stop;
        _api.jwSeek = _controller.seek;
        _api.jwSetVolume = _controller.setVolume;
        _api.jwPlaylistNext = _controller.next;
        _api.jwPlaylistPrev = _controller.prev;
        _api.jwSetFullscreen = _controller.setFullscreen;
        _api.jwGetQualityLevels = _controller.getQualityLevels;
        _api.jwGetCurrentQuality = _controller.getCurrentQuality;
        _api.jwSetCurrentQuality = _controller.setCurrentQuality;
        _api.jwSetCurrentAudioTrack = _controller.setCurrentAudioTrack;
        _api.jwGetCurrentAudioTrack = _controller.getCurrentAudioTrack;
        _api.jwGetCaptionsList = _controller.getCaptionsList;
        _api.jwGetCurrentCaptions = _controller.getCurrentCaptions;
        _api.jwSetCurrentCaptions = _controller.setCurrentCaptions;
        _api.jwSetCues = _controller.setCues;

        _api.callInternal = function(method) {
            _api[method]();
        };
    };
});
