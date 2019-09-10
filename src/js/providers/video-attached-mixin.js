
const VideoAttachedMixin = {

    attachMedia() {
        this.eventsOn_();
    },

    detachMedia() {
        return this.eventsOff_();
    }
};

export default VideoAttachedMixin;
