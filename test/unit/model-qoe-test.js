import SimpleModel from 'model/simplemodel';

define([
    'test/underscore',
    'controller/model',
    'events/events',
    'events/states'
], function (_, Model, events, states) {


    describe('Model QoE', function() {


        // mock MediaModel
        var MediaModel = function() {
            this.set('state', states.IDLE);
        };
        _.extend(MediaModel.prototype, SimpleModel);


        it('tracks first frame with provider first frame event', function() {
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

        it('tracks first frame with first increasing time event', function() {
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

        it('removes media controller event listeners', function() {
            var startTime = _.now();
            var model = new Model().setup({});

            model.set('mediaModel', new MediaModel());
            model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
            model.mediaController.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME);
            var qoeItem = model._qoeItem;

            var qoeDump = qoeItem.dump();
            assert.isOk(validateMeasurement(qoeDump.events.playAttempt, startTime), 'play attempt event was fired');
            assert.isOk(validateMeasurement(qoeDump.events.firstFrame, startTime), 'first frame event was fired');

            // test that listeners are removed by testing that tick events are no longer changed
            qoeItem.tick('playAttempt');
            qoeItem.tick('firstFrame');
            qoeDump = qoeItem.dump();
            var playAttemptTick = qoeDump.events.playAttempt;
            var firstFrameTick = qoeDump.events.firstFrame;

            model.mediaController.trigger(events.JWPLAYER_MEDIA_PLAY_ATTEMPT);
            model.mediaController.trigger(events.JWPLAYER_MEDIA_TIME, {
                position: 2
            });
            model.mediaController.trigger(events.JWPLAYER_PROVIDER_FIRST_FRAME);

            qoeDump = qoeItem.dump();
            assert.equal(qoeDump.events.playAttempt, playAttemptTick, 'play attempt is unchanged after further media events');
            assert.equal(qoeDump.events.firstFrame, firstFrameTick, 'first frame is unchanged after further media events');
        });

        it('tracks stalled time', function() {
            var model = new Model().setup({});

            model.set('mediaModel', new MediaModel());
            var mediaModel = model.get('mediaModel');

            mediaModel.set('state', states.LOADING);
            mediaModel.set('state', states.PLAYING);
            mediaModel.set('state', states.STALLED);
            mediaModel.set('state', states.PLAYING);

            var qoeDump = model._qoeItem.dump();
            assert.isOk(validateMeasurement(qoeDump.sums.stalled), 'stalled sum is a valid number');
        });

        it('uses one qoe item per playlist item', function() {
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

            assert.isOk(firstQoeItem !== secondQoeItem, 'qoe items are unique between playlistItem changes');

            var firstQoeDump = firstQoeItem.dump();
            var secondQoeDump = secondQoeItem.dump();

            assert.isOk(firstQoeDump.events.playAttempt === undefined,
                'play attempt is was not tracked for first unplayed item');
            assert.isOk(secondQoeDump.events.playAttempt !== undefined,
                'play attempt is was tracked for second item');
            assert.isOk(firstQoeDump.counts.loading === undefined,
                'loading was not tracked for first unplayed item');
            assert.isOk(secondQoeDump.counts.loading === 1,
                'loading was tracked for second item');

        });

        function validateQoeFirstFrame(assert, qoeItem, startTime) {
            assert.isOk(!!qoeItem, 'qoeItem is defined');

            var loadTime = qoeItem.between(events.JWPLAYER_MEDIA_PLAY_ATTEMPT, events.JWPLAYER_MEDIA_FIRST_FRAME);
            assert.isOk(validateMeasurement(loadTime), 'time to first frame is a valid number');

            var qoeDump = qoeItem.dump();
            assert.equal(qoeDump.counts.idle, 1, 'one idle event');
            assert.equal(qoeDump.counts.loading, 1, 'one loading event');
            assert.equal(qoeDump.counts.playing, 1, 'one playing event');
            assert.isOk(validateMeasurement(qoeDump.sums.idle), 'idle sum is a valid number');
            assert.isOk(validateMeasurement(qoeDump.sums.loading), 'loading sum is a valid number');
            assert.isOk(validateMeasurement(qoeDump.sums.playing), 'playing sum is a valid number');
            assert.isOk(validateMeasurement(qoeDump.events.playlistItem, startTime), 'playlistItem epoch time is ok');
            assert.isOk(validateMeasurement(qoeDump.events.playAttempt, startTime), 'playAttempt epoch time is ok');
            assert.isOk(validateMeasurement(qoeDump.events.firstFrame, startTime), 'firstFrame epoch time is ok');
        }

        function validateMeasurement(value, min) {
            return typeof value === 'number' && !isNaN(value) && value >= (min || 0);
        }

    });
});
