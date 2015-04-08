define([
    'utils/timer',
    'events/events',
    'events/states',
    'underscore'
], function(Timer, events, states, _) {

    // This is to provide a first frame event even when
    //  a provider does not give us one.
    var onTimeIncreasesGenerator = (function(callback) {
        var lastVal = Number.MIN_VALUE;
        return function (evt) {
            if (evt.position > lastVal) {
                callback();
            }
            // sometimes the number will wrap around (ie 100 down to 0)
            //  so always update
            lastVal = evt.position;
        };
    });

    function unbindFirstFrameEvents(model) {
        model.mediaController.off(events.JWPLAYER_PROVIDER_FIRST_FRAME, model._triggerFirstFrame);
        model.mediaController.off(events.JWPLAYER_MEDIA_TIME, model._onTime);
    }

    function trackFirstFrame(model) {
        unbindFirstFrameEvents(model);

        // When it occurs, send the event, and unbind all listeners
        model._triggerFirstFrame = _.once(function() {
            var qoeItem = model._qoeItem;
            qoeItem.tick(events.JWPLAYER_MEDIA_FIRST_FRAME);

            var time = qoeItem.between(events.JWPLAYER_MEDIA_PLAY_ATTEMPT, events.JWPLAYER_MEDIA_FIRST_FRAME);
            model.mediaController.trigger(events.JWPLAYER_MEDIA_FIRST_FRAME, {loadtime : time});
            unbindFirstFrameEvents(model);
        });

        model._onTime = onTimeIncreasesGenerator(model._triggerFirstFrame);

        model.mediaController.once(events.JWPLAYER_PROVIDER_FIRST_FRAME, model._triggerFirstFrame);
        model.mediaController.on(events.JWPLAYER_MEDIA_TIME, model._onTime);
    }


    function trackStalledTime(model) {
        model.mediaController.on(events.JWPLAYER_PROVIDER_LOADING, function() {
            model._qoeItem.start(states.LOADING);
        });
        model.mediaController.on(events.JWPLAYER_PROVIDER_STALLED, function() {
            model._qoeItem.start(states.STALLED);
        });
        model.on('change:state', function(mod, newstate, oldstate) {
            if (newstate !== states.BUFFERING) {
                model._qoeItem.end(oldstate);
            }
        });
    }

    function initModel(model) {
        model.on(events.JWPLAYER_PLAYLIST_ITEM, function() {
            // reset item level qoe
            model._qoeItem = new Timer();
            model._qoeItem.tick(events.JWPLAYER_PLAYLIST_ITEM);

            model.mediaController.once(events.JWPLAYER_MEDIA_PLAY_ATTEMPT, function() {
                model._qoeItem.tick(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
            });

            trackFirstFrame(model);
            trackStalledTime(model);
        });
    }

    return {
        model : initModel
    };
});
