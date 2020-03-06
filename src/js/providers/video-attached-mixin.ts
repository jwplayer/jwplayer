import type { GenericObject } from 'types/generic.type';

const VideoAttachedMixin: GenericObject = {

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
