import Timer from 'api/timer';
import { dateTime } from 'utils/clock';

describe('clock', function() {
    it('provides date time equal or close to Date.now()', function() {
        const DateNowTime = Date.now();
        const clockDateTime = dateTime();
        // With rounding differences between Date.now() and navigationStart + performance.now(),
        // and JavaScript execution, only allow 0.05s difference.
        expect(clockDateTime).to.be.closeTo(DateNowTime, 50);
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
