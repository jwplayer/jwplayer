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
        const time = new Timer();
        time.start('test');
        time.end('test');

        const dump = time.dump();
        expect(dump.counts.test, 'test has been called once').to.equal(1);
        expect(typeof dump.sums.test, 'sum is a number').to.equal('number');

        const invalidEnd = time.end('notStarted');
        expect(invalidEnd, 'function that has not yet started should have no end time').to.be.undefined;
    });

    it('timer tick test', function (done) {
        const time = new Timer();

        time.tick('event1');

        setTimeout(function() {
            time.tick('event2');

            let between = time.between('event1', 'event2');
            expect(between > 5 && between < 30000, 'between tick time is correctly calculated').to.be.true;

            between = time.between('no', 'value');
            expect(between, 'invalid tick events returns null').to.equal(null);
            done();
        }, 10);
    });
});
