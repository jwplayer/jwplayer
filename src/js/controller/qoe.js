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

    function qualitySwitchHandler (evt) {
        console.log('*********************** quality swithed', evt);
        this.set('visualQuality', {
            bitrate: evt.rate,
            label: evt.label,
            width: evt.width,
            height: evt.height
        });

        this.sendEvent( 'visualQuality', {
            type: 'visualQuality',
            levelIndex: evt.index,
            level: this.get('visualQuality'),
            mode: (evt.autoSwitch) ? 'auto' : 'manual',
            reason: evt.reason
        } );
    }

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
        model.mediaController.on(events.JWPLAYER_PROVIDER_LOADING, function(evt) {
            model._qoeItem.start(evt.newstate);
        });
        model.mediaController.on(events.JWPLAYER_PROVIDER_STALLED, function(evt) {
            model._qoeItem.start(evt.newstate);
        });
        model.mediaController.on(events.JWPLAYER_PLAYER_STATE, function(evt) {
            if (evt.newstate !== states.BUFFERING) {
                model._qoeItem.end(evt.oldstate);
            }
        });
    }

    function initModel(model) {
        this.set('model', model);
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
        model.on('qualityChange', qualitySwitchHandler.bind(this));
    }


    this.model = initModel.bind(this);

    _.extend(this, {
        'get' : function(attr) {
            return this[attr];
        },
        'set' : function(attr, val) {
            this[attr] = val;
        }
    });

    return this;
});
