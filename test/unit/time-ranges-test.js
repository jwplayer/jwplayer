define([
    'utils/time-ranges'
], function (timeRangesUtil) {
    /* jshint qunit: true */
    QUnit.module('time-ranges');
    var test = QUnit.test.bind(QUnit);

    function MockTimeRanges(ranges) {
        return {
            start: function (index) {
                return ranges[index].start;
            },
            end: function (index) {
                return ranges[index].end;
            },
            length: ranges ? ranges.length : 0,
        };
    }

    test('returns the end when there is one range', function (assert) {
        var mockRanges = MockTimeRanges([{start: 1, end: 2}]);
        var expected = 2;
        var actual = timeRangesUtil.endOfRange(mockRanges);

        assert.deepEqual(actual, expected);
    });

    test('returns the end when there are multiple ranges', function (assert) {
        var mockRanges = MockTimeRanges([{start: 1, end: 2}, {start: 3, end: 4}]);
        var expected = 4;
        var actual = timeRangesUtil.endOfRange(mockRanges);

        assert.deepEqual(actual, expected);
    });

    test('returns 0 when there are no ranges', function (assert) {
        var mockRanges = MockTimeRanges([]);
        var expected = 0;
        var actual = timeRangesUtil.endOfRange(mockRanges);

        assert.deepEqual(actual, expected);
    });

    test('returns 0 when ranges are undefined', function (assert) {
        var mockRanges = MockTimeRanges();
        var expected = 0;
        var actual = timeRangesUtil.endOfRange(mockRanges);

        assert.deepEqual(actual, expected);
    });
});