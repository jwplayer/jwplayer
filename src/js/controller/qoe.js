define([
    'utils/timer',
    'events/events',
    'utils/underscore'
], function(Timer, events, _) {

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
        model.mediaController.off(events.JWPLAYER_MEDIA_PLAY_ATTEMPT, model._onPlayAttempt);
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
            model.mediaController.trigger(events.JWPLAYER_MEDIA_FIRST_FRAME, {loadTime : time});
            unbindFirstFrameEvents(model);
        });

        model._onTime = onTimeIncreasesGenerator(model._triggerFirstFrame);

        model._onPlayAttempt = function() {
            model._qoeItem.tick(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
        };

        model.mediaController.on(events.JWPLAYER_MEDIA_PLAY_ATTEMPT, model._onPlayAttempt);
        model.mediaController.once(events.JWPLAYER_PROVIDER_FIRST_FRAME, model._triggerFirstFrame);
        model.mediaController.on(events.JWPLAYER_MEDIA_TIME, model._onTime);
    }

    function initModel(model) {

        function onMediaModel(model, mediaModel, oldMediaModel) {
            // finish previous item
            if (model._qoeItem && oldMediaModel) {
                model._qoeItem.end(oldMediaModel.get('state'));
            }
            // reset item level qoe
            model._qoeItem = new Timer();
            model._qoeItem.tick(events.JWPLAYER_PLAYLIST_ITEM);
            model._qoeItem.start(mediaModel.get('state'));

            trackFirstFrame(model);

            mediaModel.on('change:state', function (mediaModel, newstate, oldstate) {
                model._qoeItem.end(oldstate);
                model._qoeItem.start(newstate);
            });
        }

        model.on('change:mediaModel', onMediaModel);
    }

    return {
        model : initModel
    };
});
