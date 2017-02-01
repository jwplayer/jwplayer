define([

], function () {
    function getTotalRange(timeRanges) {
        if (!timeRanges || (timeRanges && !timeRanges.length)) {
            return 0;
        }

        var min = Infinity;
        var max = 0;
        for (var i = 0; i < timeRanges.length; i += 1) {
            if (timeRanges.start(i) < min) {
                min = timeRanges.start(i);
            }
            if (timeRanges.end(i) > max) {
                max = timeRanges.end(i);
            }
        }

        return max - min;
    }

    return {
        getTotalRange: getTotalRange,
    };
});
