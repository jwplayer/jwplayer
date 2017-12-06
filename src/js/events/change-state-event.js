import { STATE_IDLE, STATE_COMPLETE, STATE_ERROR } from 'events/events';

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
        var eventType = newstate.replace(/(?:ing|d)$/, '');
        var evt = {
            type: eventType,
            newstate: newstate,
            oldstate: oldstate,
            reason: model.mediaModel.get('mediaState')
        };
        // add reason for play/pause events
        if (eventType === 'play') {
            evt.playReason = model.get('playReason');
        } else if (eventType === 'pause') {
            evt.pauseReason = model.get('pauseReason');
        }
        this.trigger(eventType, evt);
    }
}
