define([
], function() {

    return function(_api, _controller) {

        // This file is only required for legacy support of JWPlayer 6

        // Rename
        _api.getPlaylistIndex = _api.getItem;

        // jwNames
        var legacy = {
            jwPlay : _controller.play,
            jwPause : _controller.pause,
            jwSetMute : _controller.setMute,
            jwLoad : _controller.load,
            jwPlaylistItem : _controller.item,
            jwGetAudioTracks : _controller.getAudioTracks,
            jwDetachMedia : _controller.detachMedia,
            jwAttachMedia : _controller.attachMedia,
            jwAddEventListener : _controller.on,
            jwRemoveEventListener : _controller.off,
            jwStop : _controller.stop,
            jwSeek : _controller.seek,
            jwSetVolume : _controller.setVolume,
            jwPlaylistNext : _controller.next,
            jwPlaylistPrev : _controller.prev,
            jwSetFullscreen : _controller.setFullscreen,
            jwGetQualityLevels : _controller.getQualityLevels,
            jwGetCurrentQuality : _controller.getCurrentQuality,
            jwSetCurrentQuality : _controller.setCurrentQuality,
            jwSetCurrentAudioTrack : _controller.setCurrentAudioTrack,
            jwGetCurrentAudioTrack : _controller.getCurrentAudioTrack,
            jwGetCaptionsList : _controller.getCaptionsList,
            jwGetCurrentCaptions : _controller.getCurrentCaptions,
            jwSetCurrentCaptions : _controller.setCurrentCaptions,
            jwSetCues : _controller.setCues
        };

        _api.callInternal = function(method) {
            console.log('You are using the deprecated callInternal method for ' + method);
            var args = Array.prototype.slice.call(arguments, 1);
            legacy[method].apply(_controller, args);
        };
    };
});
