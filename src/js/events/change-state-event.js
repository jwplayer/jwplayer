define([
    'events/states'
], function(states) {

    // The api should dispatch an idle event when the model's state changes to complete
    // This is to avoid conflicts with the complete event and to maintain legacy event flow
    function normalizeApiState(newstate) {
        if (newstate === states.COMPLETE || newstate === states.ERROR) {
            return states.IDLE;
        }
        return newstate;
    }

    return function(model, newstate, oldstate) {
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
                reason: model.mediaModel.get('state')
            };
            // add reason for play/pause events
            if (eventType === 'play') {
                evt.playReason = model.get('playReason');
            } else if (eventType === 'pause') {
                evt.pauseReason = model.get('pauseReason');
            }
            this.trigger(eventType, evt);
        }
    };
});