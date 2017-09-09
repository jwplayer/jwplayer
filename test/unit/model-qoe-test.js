import Model from 'controller/model';
import SimpleModel from 'model/simplemodel';
import { STATE_IDLE, STATE_PLAYING, STATE_LOADING, STATE_STALLED, MEDIA_PLAY_ATTEMPT, PROVIDER_FIRST_FRAME, MEDIA_TIME,
    MEDIA_FIRST_FRAME } from 'events/events';
import { now } from 'utils/date';

describe('Model QoE', function() {

    // mock MediaModel
    var MediaModel = function() {
        this.set('state', STATE_IDLE);
    };
    Object.assign(MediaModel.prototype, SimpleModel);

    it('tracks first frame with provider first frame event', function() {
        var startTime = now();
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());
        var mediaModel = model.get('mediaModel');

        model.mediaController.trigger(MEDIA_PLAY_ATTEMPT);
        mediaModel.set('state', STATE_LOADING);
        mediaModel.set('state', STATE_PLAYING);

        // FIXME: PROVIDER_FIRST_FRAME triggers MEDIA_FIRST_FRAME : we only need one event
        model.mediaController.trigger(PROVIDER_FIRST_FRAME);

        validateQoeFirstFrame(assert, model._qoeItem, startTime);
    });

    it('removes media controller event listeners', function() {
        var startTime = now() - 1;
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());
        model.mediaController.trigger(MEDIA_PLAY_ATTEMPT);
        model.mediaController.trigger(PROVIDER_FIRST_FRAME);
        var qoeItem = model._qoeItem;

        var qoeDump = qoeItem.dump();
        assert.isOk(validateMeasurement(qoeDump.events.playAttempt, startTime), 'play attempt event was fired ' +
            JSON.stringify(qoeDump.events) + ' startTime: ' + startTime);
        assert.isOk(validateMeasurement(qoeDump.events.firstFrame, startTime), 'first frame event was fired');

        // test that listeners are removed by testing that tick events are no longer changed
        qoeItem.tick('playAttempt');
        qoeItem.tick('firstFrame');
        qoeDump = qoeItem.dump();
        var playAttemptTick = qoeDump.events.playAttempt;
        var firstFrameTick = qoeDump.events.firstFrame;

        model.mediaController.trigger(MEDIA_PLAY_ATTEMPT);
        model.mediaController.trigger(MEDIA_TIME, {
            position: 2
        });
        model.mediaController.trigger(PROVIDER_FIRST_FRAME);

        qoeDump = qoeItem.dump();
        assert.equal(qoeDump.events.playAttempt, playAttemptTick, 'play attempt is unchanged after further media events');
        assert.equal(qoeDump.events.firstFrame, firstFrameTick, 'first frame is unchanged after further media events');
    });

    it('tracks stalled time', function() {
        var model = new Model().setup({});

        model.set('mediaModel', new MediaModel());
        var mediaModel = model.get('mediaModel');

        mediaModel.set('state', STATE_LOADING);
        mediaModel.set('state', STATE_PLAYING);
        mediaModel.set('state', STATE_STALLED);
        mediaModel.set('state', STATE_PLAYING);

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

        model.mediaController.trigger(MEDIA_PLAY_ATTEMPT);
        mediaModel.set('state', STATE_LOADING);

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

        var loadTime = qoeItem.between(MEDIA_PLAY_ATTEMPT, MEDIA_FIRST_FRAME);
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
