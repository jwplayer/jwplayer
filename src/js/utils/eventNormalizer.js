import { STATE_LOADING, STATE_STALLED, STATE_BUFFERING } from 'events/events';

export function normalizeState(newstate) {
    if (newstate === STATE_LOADING || newstate === STATE_STALLED) {
        return STATE_BUFFERING;
    }
    return newstate;
}

export function normalizeReason(newstate, reason) {
    if (newstate === STATE_BUFFERING) {
        return reason === STATE_STALLED ? reason : STATE_LOADING;
    }
    return reason;
}
