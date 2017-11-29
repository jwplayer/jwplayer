import { STATE_IDLE } from 'events/events';

export const INITIAL_PLAYER_STATE = {
    audioMode: false,
    flashBlocked: false,
    item: 0,
    itemMeta: {},
    playRejected: false,
    state: STATE_IDLE,
    duration: 0,
    position: 0,
    buffer: 0
};
