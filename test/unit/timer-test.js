import Timer from 'api/timer';
import { dateTime } from 'utils/clock';
import { now } from 'utils/date';

describe('clock', function() {
    it('provides date time equal or close to Date.now()', function() {
        const clockTime = dateTime();
        const dateGetTime = now();
        // With rounding differences between Date.now() and performance.now(),
        // and JavaScipt execution, only allow a few milliseconds difference
        expect(Math.abs(clockTime - dateGetTime)).to.be.below(5);
    });
});

describe('timer', function() {

    it('timer start/end test', function() {
        var time = new Timer();
        time.start('test');
        time.end('test');

        var dump = time.dump();
        assert.equal(dump.counts.test, 1, 'test has been called once');
        assert.equal(typeof dump.sums.test, 'number', 'sum is a number');

        var invalidEnd = time.end('notStarted');
        assert.isNotOk(invalidEnd, 'function that has not yet started should have no end time');
    });

    it('timer tick test', function (done) {
        var time = new Timer();

        time.tick('event1');

        setTimeout(function() {
            time.tick('event2');

            var between = time.between('event1', 'event2');
            assert.isOk(between > 5 && between < 30000, 'between tick time is correctly calculated');

            between = time.between('no', 'value');
            assert.equal(between, null, 'invalid tick events returns null');
            done();
        }, 10);
    });
});
