define([
    'utils/timer',
    'events/events',
    'events/states',
    'utils/underscore'
], function(Timer, events, states, _) {

    var onTimeIncreasesGenerator = (function(callback) {
        var lastVal;
        return function (evt) {
            lastVal = lastVal || evt.position;
            if (evt.position > lastVal) {
                // first frame would be now minus how much time passed in video
                var time = _.now() - evt.position * 1000;
                callback({time : time});
            }
        };
    });

    function unbindFirstFrameEvents(model) {
        model.off(events.JWPLAYER_PROVIDER_FIRST_FRAME, model._triggerFirstFrame);
        model.off(events.JWPLAYER_MEDIA_TIME, model._onTime);
    }

    function firstFrame(model) {
        unbindFirstFrameEvents(model);

        model._qoeItem.tick(events.JWPLAYER_PLAYLIST_ITEM);

        // When it occurs, send the event, and unbind all listeners
        model._triggerFirstFrame = _.once(function(evt) {
            // if the provider gives a time, it will be used for calculations
            model._qoeItem.tick(events.JWPLAYER_MEDIA_FIRST_FRAME, evt.time);

            model.trigger(events.JWPLAYER_MEDIA_FIRST_FRAME);
            unbindFirstFrameEvents(model);
        });

        model._onTime = onTimeIncreasesGenerator(model._triggerFirstFrame);

        model.once(events.JWPLAYER_PROVIDER_FIRST_FRAME, model._triggerFirstFrame);
        model.on(events.JWPLAYER_MEDIA_TIME, model._onTime);
    }

    function stalling(model) {
        model.on(events.JWPLAYER_PROVIDER_LOADING, function(evt) {
            model._qoeItem.start(evt.newstate);
        });
        model.on(events.JWPLAYER_PROVIDER_STALLING, function(evt) {
            model._qoeItem.start(evt.newstate);
        });
        model.on(events.JWPLAYER_PLAYER_STATE, function(evt) {
            if (evt.newstate !== states.BUFFERING) {
                model._qoeItem.end(evt.oldstate);
            }
        });
    }

    function initModel(model) {
        model.on(events.JWPLAYER_PLAYLIST_ITEM, function() {
            // reset item level qoe
            model._qoeItem = new Timer();
            firstFrame(model);
        });

        stalling(model);
    }

    return {
        model : initModel
    };
});
