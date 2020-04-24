export interface VideoAttachedInt {
    eventsOn_(): void;
    eventsOff_(): void;
    attachMedia(): void;
    detachMedia(): void;
}

const VideoAttachedMixin: VideoAttachedInt = {

    eventsOn_(): void {
        // noop
    },
    eventsOff_(): void {
        // noop
    },

    attachMedia(): void {
        this.eventsOn_();
    },

    detachMedia(): void {
        return this.eventsOff_();
    }
};

export default VideoAttachedMixin;
