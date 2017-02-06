define([

], function () {
    function rewindPosition(amount, currentPosition, seekableRange, streamType) {
        var pos = 0;
        var rewindTarget = currentPosition - amount;

        if (streamType === 'DVR') {
            // When in DVR mode, give the seek position as the distance from the seekable range
            // The provider will use this to calculate the real time to seek to
            pos = Math.min(seekableRange - rewindTarget, seekableRange);
        } else if (streamType === 'VOD') {
            // In VOD mode rewinding gets us closer to 0, with a minimum of value of zero
            pos = Math.max(rewindTarget, 0);
        }

        return pos;
    }
    return {
        rewindPosition: rewindPosition,
    };
});
