import endOfRange from 'utils/time-ranges';

describe('time-ranges', function() {

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

    it('returns the end when there is one range', function() {
        var mockRanges = MockTimeRanges([{ start: 1, end: 2 }]);
        var expected = 2;
        var actual = endOfRange(mockRanges);

        assert.deepEqual(actual, expected);
    });

    it('returns the end when there are multiple ranges', function() {
        var mockRanges = MockTimeRanges([{ start: 1, end: 2 }, { start: 3, end: 4 }]);
        var expected = 4;
        var actual = endOfRange(mockRanges);

        assert.deepEqual(actual, expected);
    });

    it('returns 0 when there are no ranges', function() {
        var mockRanges = MockTimeRanges([]);
        var expected = 0;
        var actual = endOfRange(mockRanges);

        assert.deepEqual(actual, expected);
    });

    it('returns 0 when ranges are undefined', function() {
        var mockRanges = MockTimeRanges();
        var expected = 0;
        var actual = endOfRange(mockRanges);

        assert.deepEqual(actual, expected);
    });
});
