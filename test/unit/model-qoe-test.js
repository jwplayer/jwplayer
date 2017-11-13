import Model from 'controller/model';
import { STATE_IDLE, STATE_PLAYING, STATE_LOADING, STATE_STALLED, MEDIA_PLAY_ATTEMPT, PROVIDER_FIRST_FRAME, MEDIA_TIME,
    MEDIA_FIRST_FRAME } from 'events/events';
import { dateTime } from 'utils/clock';
import { now } from 'utils/date';

describe('Model QoE', function() {

    it('tracks first frame with provider first frame event', function() {
        const startTime = Math.min(dateTime(), now());
        const model = new Model().setup();
        const mediaModel = model.mediaModel;
        const qoeItem = model._qoeItem;

        mediaModel.set('state', STATE_IDLE);
        model.mediaController.trigger(MEDIA_PLAY_ATTEMPT);
        mediaModel.set('state', STATE_LOADING);
        mediaModel.set('state', STATE_PLAYING);

        // FIXME: PROVIDER_FIRST_FRAME triggers MEDIA_FIRST_FRAME : we only need one event
        model.mediaController.trigger(PROVIDER_FIRST_FRAME);

        expect(!!qoeItem, 'qoeItem is defined').to.be.true;

        const loadTime = qoeItem.between(MEDIA_PLAY_ATTEMPT, MEDIA_FIRST_FRAME);
        expect(validateMeasurement(loadTime), 'time to first frame is a valid number').to.be.true;

        const qoeDump = qoeItem.dump();
        expect(qoeDump.counts.idle).to.equal(1, 'one idle event');
        expect(qoeDump.counts.loading).to.equal(1, 'one loading event');
        expect(qoeDump.counts.playing).to.equal(1, 'one playing event');
        expect(validateMeasurement(qoeDump.sums.idle), 'idle sum is a valid number').to.be.true;
        expect(validateMeasurement(qoeDump.sums.loading), 'loading sum is a valid number').to.be.true;
        expect(validateMeasurement(qoeDump.sums.playing), 'playing sum is a valid number').to.be.true;
        expect(validateMeasurement(qoeDump.events.playlistItem, startTime), 'playlistItem epoch time is ok').to.be.true;
        expect(validateMeasurement(qoeDump.events.playAttempt, startTime), 'playAttempt epoch time is ok').to.be.true;
        expect(validateMeasurement(qoeDump.events.firstFrame, startTime), 'firstFrame epoch time is ok').to.be.true;
    });

    it('removes media controller event listeners', function() {
        const startTime = Math.min(dateTime(), now());
        const model = new Model().setup();
        const qoeItem = model._qoeItem;

        model.mediaController.trigger(MEDIA_PLAY_ATTEMPT);
        model.mediaController.trigger(PROVIDER_FIRST_FRAME);

        let qoeDump = qoeItem.dump();
        expect(validateMeasurement(qoeDump.events.playAttempt, startTime), 'play attempt event was fired ' +
            JSON.stringify(qoeDump.events) + ' startTime: ' + startTime).to.be.true;
        expect(validateMeasurement(qoeDump.events.firstFrame, startTime), 'first frame event was fired').to.be.true;

        // test that listeners are removed by testing that tick events are no longer changed
        qoeItem.tick('playAttempt');
        qoeItem.tick('firstFrame');
        qoeDump = qoeItem.dump();
        const playAttemptTick = qoeDump.events.playAttempt;
        const firstFrameTick = qoeDump.events.firstFrame;

        model.mediaController.trigger(MEDIA_PLAY_ATTEMPT);
        model.mediaController.trigger(MEDIA_TIME, {
            position: 2
        });
        model.mediaController.trigger(PROVIDER_FIRST_FRAME);

        qoeDump = qoeItem.dump();
        expect(playAttemptTick).to.equal(qoeDump.events.playAttempt, 'play attempt is unchanged after further media events');
        expect(firstFrameTick).to.equal(qoeDump.events.firstFrame, 'first frame is unchanged after further media events');
    });

    it('tracks stalled time', function() {
        const model = new Model().setup();
        const mediaModel = model.mediaModel;
        const qoeItem = model._qoeItem;

        mediaModel.set('state', STATE_LOADING);
        mediaModel.set('state', STATE_PLAYING);
        mediaModel.set('state', STATE_STALLED);
        mediaModel.set('state', STATE_PLAYING);

        const qoeDump = qoeItem.dump();
        expect(validateMeasurement(qoeDump.sums.stalled), 'stalled sum is a valid number').to.be.true;
    });

    it('uses one qoe item per playlist item', function() {
        // Test qoe model observation
        const model = new Model().setup();
        const firstQoeItem = model._qoeItem;

        // no state changes, play attempt or first frame events
        const mediaModel = new Model.MediaModel();
        model.set('mediaModel', mediaModel);
        const secondQoeItem = model._qoeItem;

        model.mediaController.trigger(MEDIA_PLAY_ATTEMPT);
        mediaModel.set('state', STATE_LOADING);

        expect(firstQoeItem !== secondQoeItem, 'qoe items are unique between playlistItem changes').to.be.true;

        const firstQoeDump = firstQoeItem.dump();
        const secondQoeDump = secondQoeItem.dump();

        expect(firstQoeDump.events.playAttempt === undefined, 'play attempt is was not tracked for first unplayed item').to.be.true;
        expect(secondQoeDump.events.playAttempt !== undefined, 'play attempt is was tracked for second item').to.be.true;
        expect(firstQoeDump.counts.loading === undefined, 'loading was not tracked for first unplayed item').to.be.true;
        expect(secondQoeDump.counts.loading === 1, 'loading was tracked for second item').to.be.true;
    });

    function validateMeasurement(value, min) {
        return typeof value === 'number' && !isNaN(value) && value >= (min || 0);
    }
});
