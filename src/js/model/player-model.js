import { STATE_IDLE } from 'events/events';

export const INITIAL_PLAYER_STATE = {
    audioMode: false,
    flashBlocked: false,
    item: 0,
    itemMeta: {},
    playbackRate: 1,
    playRejected: false,
    state: STATE_IDLE,
    itemReady: false
};

export const INITIAL_MEDIA_STATE = {
    position: 0,
    duration: 0,
    buffer: 0,
};
