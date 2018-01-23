
const VideoAttachedMixin = {

    attachMedia() {
        this.eventsOn_();
    },

    detachMedia() {
        this.eventsOff_();

        return this.video;
    }
};

export default VideoAttachedMixin;
