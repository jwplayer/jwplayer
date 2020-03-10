import {
    STATE_IDLE,
    STATE_LOADING,
    STATE_STALLED,
    STATE_BUFFERING,
    STATE_COMPLETE,
    STATE_ERROR,
    InternalPlayerState
} from 'events/events';
import type Model from '../controller/model';
import type { PauseReason, PlayReason } from '../controller/model';

interface StateChangeEvent {
    type: string;
    newstate: StateChangeEventState;
    oldstate: StateChangeEventState;
    reason: InternalPlayerState;
    playReason?: PlayReason;
    pauseReason?: PauseReason;
}

type StateChangeEventState = Exclude<InternalPlayerState, 'complete' | 'error'>;

// The api should dispatch an idle event when the model's state changes to complete
// This is to avoid conflicts with the complete event and to maintain legacy event flow
function normalizeApiState(newstate: InternalPlayerState): StateChangeEventState {
    if (newstate === STATE_COMPLETE || newstate === STATE_ERROR) {
        return STATE_IDLE as StateChangeEventState;
    }
    return newstate as StateChangeEventState;
}

function normalizeReason(newstate: InternalPlayerState, reason: InternalPlayerState): InternalPlayerState {
    if (newstate === STATE_BUFFERING) {
        return reason === STATE_STALLED ? reason : STATE_LOADING;
    }
    return reason;
}

export default function ChangeStateEvent(this: any, model: Model, newstate: InternalPlayerState, oldstate: InternalPlayerState): void {
    newstate = normalizeApiState(newstate);
    oldstate = normalizeApiState(oldstate);
    // do not dispatch idle a second time after complete
    if (newstate !== oldstate) {
        // buffering, playing and paused states become:
        // buffer, play and pause events
        const type = newstate.replace(/(?:ing|d)$/, '');
        const reason = normalizeReason(newstate, model.mediaModel.get('mediaState'));

        const evt: StateChangeEvent = {
            type,
            newstate,
            oldstate,
            reason
        };
        // add reason for play/pause events
        if (type === 'play') {
            evt.playReason = model.get('playReason');
        } else if (type === 'pause') {
            evt.pauseReason = model.get('pauseReason');
        }
        this.trigger(type, evt);
    }
}
