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
        const mockRanges = MockTimeRanges([{ start: 1, end: 2 }]);
        const expected = 2;
        const actual = endOfRange(mockRanges);

        expect(expected).to.deep.equal(actual);
    });

    it('returns the end when there are multiple ranges', function() {
        const mockRanges = MockTimeRanges([{ start: 1, end: 2 }, { start: 3, end: 4 }]);
        const expected = 4;
        const actual = endOfRange(mockRanges);

        expect(expected).to.deep.equal(actual);
    });

    it('returns 0 when there are no ranges', function() {
        const mockRanges = MockTimeRanges([]);
        const expected = 0;
        const actual = endOfRange(mockRanges);

        expect(expected).to.deep.equal(actual);
    });

    it('returns 0 when ranges are undefined', function() {
        const mockRanges = MockTimeRanges();
        const expected = 0;
        const actual = endOfRange(mockRanges);

        expect(expected).to.deep.equal(actual);
    });
});
