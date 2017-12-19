import { STATE_IDLE } from 'events/events';

export const INITIAL_PLAYER_STATE = {
    audioMode: false,
    flashBlocked: false,
    attached: true,
    item: 0,
    itemMeta: {},
    playRejected: false,
    state: STATE_IDLE
};

export const INITIAL_MEDIA_STATE = {
    position: 0,
    duration: 0,
    buffer: 0,
};

export const INITIAL_SOURCE_STATE = {
    setup: false,
    started: false,
    preloaded: false,
    visualQuality: null,
};
