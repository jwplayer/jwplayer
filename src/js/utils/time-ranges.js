define([

], function () {
    function endOfRange(timeRanges) {
        var length = timeRanges.length;
        if (!length) {
            return 0;
        }

        return timeRanges.end(length - 1);
    }

    return {
        endOfRange: endOfRange,
    };
});
