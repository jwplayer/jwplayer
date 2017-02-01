define([
    'utils/underscore'
], function(_) {
    var streamTypeUtil = {};

    // DVR if the seekable range length is greater than the minDvrWindow, Live otherwise
    streamTypeUtil.isDvr = function (seekableRange, minDvrWindow) {
        var _minDvrWindow = _.isUndefined(minDvrWindow) ? 120 : Math.max(minDvrWindow, 0);
        return seekableRange >= _minDvrWindow;
    };

    // Determine the adaptive type - Live, DVR, or VOD
    // Duration can be positive or negative, but minDvrWindow should always be positive
    streamTypeUtil.streamType = function(duration, seekableRange, minDvrWindow) {
        var streamType = 'VOD';

        // Live/DVR streams are always Infinity duration
        if (duration === Infinity) {
            streamType = streamTypeUtil.isDvr(seekableRange, minDvrWindow) ? 'DVR' : 'LIVE';
        }

        // Default option is VOD (i.e. positive or non-infinite)
        return streamType;
    };

    return streamTypeUtil;
});