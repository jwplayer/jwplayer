define([
    'utils/timer',
    'utils/underscore'
], function(Timer, _) {

    // Copied from events.js until we can export individual constants with ES6
    var JWPLAYER_PLAYLIST_ITEM = 'playlistItem';
    var JWPLAYER_MEDIA_PLAY_ATTEMPT = 'playAttempt';
    var JWPLAYER_PROVIDER_FIRST_FRAME = 'providerFirstFrame';
    var JWPLAYER_MEDIA_FIRST_FRAME = 'firstFrame';
    var JWPLAYER_MEDIA_TIME = 'time';

    var TAB_HIDDEN = 'tabHidden';
    var TAB_VISIBLE = 'tabVisible';

    var VISIBILITY_CHANGE = 'visibilitychange';

    // This is to provide a first frame event even when
    //  a provider does not give us one.
    var onTimeIncreasesGenerator = (function(callback) {
        var lastVal = 0;
        return function (evt) {
            var pos = evt.position;
            if (pos > lastVal) {
                callback();
            }
            // sometimes the number will wrap around (ie 100 down to 0)
            //  so always update
            lastVal = pos;
        };
    });

    function unbindFirstFrameEvents(model) {
        model.mediaController.off(JWPLAYER_MEDIA_PLAY_ATTEMPT, model._onPlayAttempt);
        model.mediaController.off(JWPLAYER_PROVIDER_FIRST_FRAME, model._triggerFirstFrame);
        model.mediaController.off(JWPLAYER_MEDIA_TIME, model._onTime);
        document.removeEventListener(VISIBILITY_CHANGE, model._onTabVisible);
    }

    function trackFirstFrame(model) {
        unbindFirstFrameEvents(model);

        // When it occurs, send the event, and unbind all listeners
        model._triggerFirstFrame = _.once(function() {
            var qoeItem = model._qoeItem;
            qoeItem.tick(JWPLAYER_MEDIA_FIRST_FRAME);

            var time = qoeItem.getFirstFrame();
            model.mediaController.trigger(JWPLAYER_MEDIA_FIRST_FRAME, {loadTime : time});
            unbindFirstFrameEvents(model);
        });

        model._onTime = onTimeIncreasesGenerator(model._triggerFirstFrame);

        model._onPlayAttempt = function() {
            model._qoeItem.tick(JWPLAYER_MEDIA_PLAY_ATTEMPT);
        };

        // track visibility change
        model._onTabVisible = function(e) {
            var hidden = e.target.hidden;
            if (hidden === true) {
                model._qoeItem.tick(TAB_HIDDEN);
            } else if (hidden === false) {
                model._qoeItem.tick(TAB_VISIBLE);
            }
        };
        document.addEventListener(VISIBILITY_CHANGE, model._onTabVisible, false);

        model.mediaController.on(JWPLAYER_MEDIA_PLAY_ATTEMPT, model._onPlayAttempt);
        model.mediaController.once(JWPLAYER_PROVIDER_FIRST_FRAME, model._triggerFirstFrame);
        model.mediaController.on(JWPLAYER_MEDIA_TIME, model._onTime);
    }

    function initModel(model) {

        function onMediaModel(model, mediaModel, oldMediaModel) {
            // finish previous item
            if (model._qoeItem && oldMediaModel) {
                model._qoeItem.end(oldMediaModel.get('state'));
            }
            // reset item level qoe
            model._qoeItem = new Timer();
            model._qoeItem.getFirstFrame = function() {
                var time = this.between(JWPLAYER_MEDIA_PLAY_ATTEMPT, JWPLAYER_MEDIA_FIRST_FRAME);
                // If time between the tab becoming visible and first frame is valid
                // and less than the time since play attempt, play was not attempted until the tab became visible
                var timeActive = this.between(TAB_VISIBLE, JWPLAYER_MEDIA_FIRST_FRAME);
                if (timeActive > 0 && timeActive < time) {
                    return timeActive;
                }
                return time;
            };
            model._qoeItem.tick(JWPLAYER_PLAYLIST_ITEM);
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
