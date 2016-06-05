define([
    'utils/timer'
], function (timer) {
    /* jshint qunit: true */

    QUnit.module('timer');
    var test = QUnit.test.bind(QUnit);

    test('timer start/end test', function(assert) {
        var time = new timer();
        time.start('test');
        time.end('test');

        var dump = time.dump();
        assert.equal(dump.counts.test, 1, 'test has been called once');
        assert.equal(typeof dump.sums.test, 'number', 'sum is a number');

        var invalidEnd = time.end('notStarted');
        assert.notOk(invalidEnd, 'function that has not yet started should have no end time');
    });

    test('timer tick test', function(assert) {
        var time = new timer();

        time.tick('event1', 5);
        time.tick('event2', 10);

        var between = time.between('event1', 'event2');
        assert.equal(between, 5, 'between tick time is correctly calculated');

        between = time.between('no', 'value');
        assert.equal(between, -1, 'invalid tick events returns -1');
    });

});
