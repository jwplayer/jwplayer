define([
    'utils/time-ranges',
], function (timeRanges) {
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

    test('returns the largest total time range when ranges are in order', function (assert) {
        var mockRanges = MockTimeRanges([{ start: 1, end: 2 }, { start: 3, end: 4 }]);
        var expected = 3;
        var actual = timeRanges.getTotalRange(mockRanges);

        assert.deepEqual(actual, expected);
    });

    test('returns the largest total time range when ranges are not in order', function (assert) {
        var mockRanges = MockTimeRanges([{ start: 3, end: 4 }, { start: 1, end: 2 }]);
        var expected = 3;
        var actual = timeRanges.getTotalRange(mockRanges);

        assert.deepEqual(actual, expected);
    });

    test('returns range of 0 when no time ranges are given', function (assert) {
        var mockRanges = MockTimeRanges([]);
        var expected = 0;
        var actual = timeRanges.getTotalRange(mockRanges);

        assert.deepEqual(actual, expected);
    });

    test('returns range of 0 when time ranges are undefined', function (assert) {
        var mockRanges = MockTimeRanges(undefined);
        var expected = 0;
        var actual = timeRanges.getTotalRange(mockRanges);

        assert.deepEqual(actual, expected);
    });
})