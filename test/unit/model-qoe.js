define([
    'test/underscore',
    'controller/model',
    'events/events',
    'events/states'
], function (_, Model, events, states) {
    /* jshint qunit: true */

    module('Model QoE');

    test('tracks first frame with provider first frame event', function() {
        var startTime = _.now();
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());

        model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
        model.mediaModel.set('state', states.LOADING);
        model.mediaModel.set('state', states.PLAYING);

        // FIXME: JWPLAYER_PROVIDER_FIRST_FRAME triggers JWPLAYER_MEDIA_FIRST_FRAME : we only need one event
        model.mediaController.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME);

        validateQoeFirstFrame(model._qoeItem, startTime);
    });

    test('tracks first frame with first increasing time event', function() {
        var startTime = _.now();
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());

        model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
        model.mediaModel.set('state', states.LOADING);
        model.mediaModel.set('state', states.PLAYING);
        model.mediaController.trigger(events.JWPLAYER_MEDIA_TIME, {
            position: 0
        });
        model.mediaController.trigger(events.JWPLAYER_MEDIA_TIME, {
            position: 1
        });

        validateQoeFirstFrame(model._qoeItem, startTime);
    });

    test('removes media controller event listeners', function() {
        var startTime = _.now();
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());
        model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
        model.mediaController.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME);
        var qoeItem = model._qoeItem;

        var qoeDump = qoeItem.dump();
        ok(validateMeasurement(qoeDump.events.playAttempt, startTime), 'play attempt event was fired');
        ok(validateMeasurement(qoeDump.events.firstFrame, startTime), 'first frame event was fired');

        // test that listeners are removed by testing that tick events are no longer changed
        qoeItem.tick('playAttempt', -1);
        qoeItem.tick('firstFrame', -1);
        model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
        model.mediaController.trigger(events.JWPLAYER_MEDIA_TIME, {
            position: 2
        });
        model.mediaController.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME);

        qoeDump = qoeItem.dump();
        equal(qoeDump.events.playAttempt, -1, 'play attempt is unchanged after further media events');
        equal(qoeDump.events.firstFrame,  -1, 'first frame is unchanged after further media events');
    });

    test('tracks stalled time', function() {
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());

        model.mediaModel.set('state', states.LOADING);
        model.mediaModel.set('state', states.PLAYING);
        model.mediaModel.set('state', states.STALLED);
        model.mediaModel.set('state', states.PLAYING);

        var qoeDump = model._qoeItem.dump();
        ok(validateMeasurement(qoeDump.sums.stalled), 'stalled sum is a valid number');
    });

    test('uses one qoe item per playlist item', function() {
        // Test qoe model observation
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());
        var firstQoeItem = model._qoeItem;

        // no state changes, play attempt or first frame events

        model.set('mediaModel', new MediaModel());
        var secondQoeItem = model._qoeItem;

        model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
        model.mediaModel.set('state', states.LOADING);

        ok(firstQoeItem !== secondQoeItem, 'qoe items are unique between playlistItem changes');

        var firstQoeDump = firstQoeItem.dump();
        var secondQoeDump = secondQoeItem.dump();

        ok(firstQoeDump.events.playAttempt === undefined, 'play attempt is was not tracked for first unplayed item');
        ok(secondQoeDump.events.playAttempt !== undefined, 'play attempt is was tracked for second item');

        ok(firstQoeDump.counts.loading === undefined, 'loading was not tracked for first unplayed item');
        ok(secondQoeDump.counts.loading === 1, 'loading was tracked for second item');

    });

    // mock MediaModel
    var MediaModel = function() {
        this.state = states.IDLE;
    };
    _.extend(MediaModel.prototype, Model.prototype);

    function validateQoeFirstFrame(qoeItem, startTime) {
        ok(!!qoeItem, 'qoeItem is defined');

        var loadTime = qoeItem.between(events.JWPLAYER_MEDIA_PLAY_ATTEMPT, events.JWPLAYER_MEDIA_FIRST_FRAME);
        ok(validateMeasurement(loadTime), 'time to first frame is a valid number');

        var qoeDump = qoeItem.dump();
        equal(qoeDump.counts.idle, 1,       'one idle event');
        equal(qoeDump.counts.loading, 1, 'one loading event');
        equal(qoeDump.counts.playing, 1, 'one playing event');
        ok(validateMeasurement(qoeDump.sums.idle),       'idle sum is a valid number');
        ok(validateMeasurement(qoeDump.sums.loading), 'loading sum is a valid number');
        ok(validateMeasurement(qoeDump.events.playlistItem, startTime), 'playlistItem epoch time is ok');
        ok(validateMeasurement(qoeDump.events.playAttempt, startTime),   'playAttempt epoch time is ok');
        ok(validateMeasurement(qoeDump.events.firstFrame, startTime),     'firstFrame epoch time is ok');
    }

    function validateMeasurement(value, min) {
        return typeof value === 'number' && !isNaN(value) && value >= (min||0);
    }

});
