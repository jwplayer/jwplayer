import { STATE_LOADING, STATE_STALLED, STATE_ERROR } from 'events/events';
import endOfRange from 'utils/time-ranges';

const STALL_DELAY = 256;

const VideoAttachedMixin = {
    stallCheckTimeout_: -1,
    lastStalledTime_: NaN,

    attachMedia: function() {
        this.eventsOn_();
    },

    detachMedia: function() {
        this.stopStallCheck();
        this.eventsOff_();

        return this.video;
    },

    stopStallCheck: function() {
        clearTimeout(this.stallCheckTimeout_);
    },

    startStallCheck: function() {
        this.stopStallCheck();
        this.stallCheckTimeout_ = setTimeout(this.stalledHandler.bind(this, this.video.currentTime), STALL_DELAY);
    },

    stalledHandler: function(checkStartTime) {
        if (checkStartTime !== this.video.currentTime) {
            return;
        }

        if (this.video.paused || this.video.ended) {
            return;
        }

        // A stall after loading/error, should just stay loading/error
        if (this.state === STATE_LOADING || this.state === STATE_ERROR) {
            return;
        }

        // During seek we stay in paused state
        if (this.seeking) {
            return;
        }

        if (this.atEdgeOfLiveStream()) {
            this.setPlaybackRate(1);
        }

        this.setState(STATE_STALLED);
    },

    atEdgeOfLiveStream: function() {
        if (!this.isLive()) {
            return false;
        }

        // currentTime doesn't always get to the end of the buffered range
        const timeFudge = 2;
        return (endOfRange(this.video.buffered) - this.video.currentTime) <= timeFudge;
    },

    setAutoplayAttributes: function() {
        this.video.setAttribute('autoplay', '');
        this.video.setAttribute('muted', '');
    },

    removeAutoplayAttributes: function() {
        this.video.removeAttribute('autoplay');
        this.video.removeAttribute('muted');
    }
};

export default VideoAttachedMixin;
