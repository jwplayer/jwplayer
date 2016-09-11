define([
    'test/underscore',
    'controller/model',
    'utils/simplemodel',
    'events/events',
    'events/states'
], function (_, Model, SimpleModel, events, states) {
    /* jshint qunit: true */

    QUnit.module('Model QoE');
    var test = QUnit.test.bind(QUnit);

    // mock MediaModel
    var MediaModel = function() {
        this.set('state', states.IDLE);
    };
    _.extend(MediaModel.prototype, SimpleModel);


    test('tracks first frame with provider first frame event', function(assert) {
        var startTime = _.now();
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());
        var mediaModel = model.get('mediaModel');

        model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
        mediaModel.set('state', states.LOADING);
        mediaModel.set('state', states.PLAYING);

        // FIXME: JWPLAYER_PROVIDER_FIRST_FRAME triggers JWPLAYER_MEDIA_FIRST_FRAME : we only need one event
        model.mediaController.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME);

        validateQoeFirstFrame(assert, model._qoeItem, startTime);
    });

    test('tracks first frame with first increasing time event', function(assert) {
        var startTime = _.now();
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());
        var mediaModel = model.get('mediaModel');

        model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
        mediaModel.set('state', states.LOADING);
        mediaModel.set('state', states.PLAYING);
        model.mediaController.trigger(events.JWPLAYER_MEDIA_TIME, {
            position: 0
        });
        model.mediaController.trigger(events.JWPLAYER_MEDIA_TIME, {
            position: 1
        });

        validateQoeFirstFrame(assert, model._qoeItem, startTime);
    });

    test('removes media controller event listeners', function(assert) {
        var startTime = _.now();
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());
        model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
        model.mediaController.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME);
        var qoeItem = model._qoeItem;

        var qoeDump = qoeItem.dump();
        assert.ok(validateMeasurement(qoeDump.events.playAttempt, startTime), 'play attempt event was fired');
        assert.ok(validateMeasurement(qoeDump.events.firstFrame, startTime), 'first frame event was fired');

        // test that listeners are removed by testing that tick events are no longer changed
        qoeItem.tick('playAttempt', -1);
        qoeItem.tick('firstFrame', -1);
        model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
        model.mediaController.trigger(events.JWPLAYER_MEDIA_TIME, {
            position: 2
        });
        model.mediaController.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME);

        qoeDump = qoeItem.dump();
        assert.equal(qoeDump.events.playAttempt, -1, 'play attempt is unchanged after further media events');
        assert.equal(qoeDump.events.firstFrame,  -1, 'first frame is unchanged after further media events');
    });

    test('tracks stalled time', function(assert) {
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());
        var mediaModel = model.get('mediaModel');

        mediaModel.set('state', states.LOADING);
        mediaModel.set('state', states.PLAYING);
        mediaModel.set('state', states.STALLED);
        mediaModel.set('state', states.PLAYING);

        var qoeDump = model._qoeItem.dump();
        assert.ok(validateMeasurement(qoeDump.sums.stalled), 'stalled sum is a valid number');
    });

    test('uses one qoe item per playlist item', function(assert) {
        // Test qoe model observation
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());
        var firstQoeItem = model._qoeItem;

        // no state changes, play attempt or first frame events

        model.set('mediaModel', new MediaModel());
        var mediaModel = model.get('mediaModel');
        var secondQoeItem = model._qoeItem;

        model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
        mediaModel.set('state', states.LOADING);

        assert.ok(firstQoeItem !== secondQoeItem, 'qoe items are unique between playlistItem changes');

        var firstQoeDump = firstQoeItem.dump();
        var secondQoeDump = secondQoeItem.dump();

        assert.ok(firstQoeDump.events.playAttempt === undefined,
            'play attempt is was not tracked for first unplayed item');
        assert.ok(secondQoeDump.events.playAttempt !== undefined,
            'play attempt is was tracked for second item');
        assert.ok(firstQoeDump.counts.loading === undefined,
            'loading was not tracked for first unplayed item');
        assert.ok(secondQoeDump.counts.loading === 1,
            'loading was tracked for second item');

    });

    function validateQoeFirstFrame(assert, qoeItem, startTime) {
        assert.ok(!!qoeItem, 'qoeItem is defined');

        var loadTime = qoeItem.between(events.JWPLAYER_MEDIA_PLAY_ATTEMPT, events.JWPLAYER_MEDIA_FIRST_FRAME);
        assert.ok(validateMeasurement(loadTime), 'time to first frame is a valid number');

        var qoeDump = qoeItem.dump();
        assert.equal(qoeDump.counts.idle, 1,       'one idle event');
        assert.equal(qoeDump.counts.loading, 1, 'one loading event');
        assert.equal(qoeDump.counts.playing, 1, 'one playing event');
        assert.ok(validateMeasurement(qoeDump.sums.idle),       'idle sum is a valid number');
        assert.ok(validateMeasurement(qoeDump.sums.loading), 'loading sum is a valid number');
        assert.ok(validateMeasurement(qoeDump.events.playlistItem, startTime), 'playlistItem epoch time is ok');
        assert.ok(validateMeasurement(qoeDump.events.playAttempt, startTime),   'playAttempt epoch time is ok');
        assert.ok(validateMeasurement(qoeDump.events.firstFrame, startTime),     'firstFrame epoch time is ok');
    }

    function validateMeasurement(value, min) {
        return typeof value === 'number' && !isNaN(value) && value >= (min||0);
    }

});
