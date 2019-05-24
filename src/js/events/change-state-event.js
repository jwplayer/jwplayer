import { STATE_IDLE, STATE_COMPLETE, STATE_ERROR } from 'events/events';
import { normalizeReason } from 'utils/eventNormalizer';

// The api should dispatch an idle event when the model's state changes to complete
// This is to avoid conflicts with the complete event and to maintain legacy event flow
function normalizeApiState(newstate) {
    if (newstate === STATE_COMPLETE || newstate === STATE_ERROR) {
        return STATE_IDLE;
    }
    return newstate;
}

export default function ChangeStateEvent(model, newstate, oldstate) {
    newstate = normalizeApiState(newstate);
    oldstate = normalizeApiState(oldstate);
    // do not dispatch idle a second time after complete
    if (newstate !== oldstate) {
        // buffering, playing and paused states become:
        // buffer, play and pause events
        const type = newstate.replace(/(?:ing|d)$/, '');
        const reason = normalizeReason(newstate, model.mediaModel.get('mediaState'));

        const evt = {
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
