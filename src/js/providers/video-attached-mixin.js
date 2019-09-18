
const VideoAttachedMixin = {

    eventsOn_() {},
    eventsOff_() {},

    attachMedia() {
        this.eventsOn_();
    },

    detachMedia() {
        return this.eventsOff_();
    }
};

export default VideoAttachedMixin;
