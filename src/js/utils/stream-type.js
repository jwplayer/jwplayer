define([
    'utils/underscore'
], function(_) {
    var streamTypeUtil = {};

    // It's DVR if the duration is above the minDvrWindow, Live otherwise
    streamTypeUtil.isDvr = function (duration, minDvrWindow) {
        return Math.abs(duration) >= Math.max(minDvrWindow, 0);
    };

    // Determine the adaptive type - Live, DVR, or VOD
    // Duration can be positive or negative, but minDvrWindow should always be positive
    streamTypeUtil.streamType = function(duration, minDvrWindow) {
        var _minDvrWindow = _.isUndefined(minDvrWindow) ? 120 : minDvrWindow;
        var streamType = 'VOD';

        if (duration === Infinity) {
            // Live streams are always Infinity duration
            streamType = 'LIVE';
        } else if (duration < 0) {
            streamType = streamTypeUtil.isDvr(duration, _minDvrWindow) ? 'DVR' : 'LIVE';
        }

        // Default option is VOD (i.e. positive or non-infinite)
        return streamType;
    };

    return streamTypeUtil;
});
