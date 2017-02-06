define([
    'utils/underscore',
], function (_) {
    // Try and find a corresponding custom label. If there are no custom labels, create one using height, bandwidth, or both
    function generateLabel(level, qualityLabels, redundant) {
        if (!level) {
            return '';
        }
        // Flash uses bitrate instead of bandwidth
        var bandwidth = level.bandwidth || level.bitrate;
        return getCustomLabel(qualityLabels, bandwidth) || createLabel(level.height, bandwidth, redundant);
    }

    // Prefer creating a label with height with a fallback to bandwidth. Make a label using both if redundant
    function createLabel(height, bandwidth, redundant) {
        if (!height && !bandwidth) {
            return '';
        }

        var bandwidthString = toKbps(bandwidth) + ' kbps';
        var label = bandwidthString;

        if (height) {
            label = height + 'p';
            if (bandwidth && redundant) {
                label += ' (' + bandwidthString + ')';
            }
        }

        return label;
    }

    // Ensures that we're able to find a custom label. As long as there is at least 1 quality label and a defined
    // bandwidth, a quality label will always be found. Return null otherwise
    function getCustomLabel(qualityLabels, bandwidth) {
        var label = null;
        var bandwidths = _.keys(qualityLabels);

        if (bandwidth && qualityLabels && bandwidths.length) {
            var key = parseFloat(bandwidth);
            if (!isNaN(key)) {
                label = qualityLabels[findClosestBandwidth(bandwidths, toKbps(key))];
            }
        }

        return label;
    }

    // Finds the bandwidth with the smallest difference from the target bandwidth
    function findClosestBandwidth(bandwidths, targetBandwidth) {
        var closest = null;
        var smallestDiff = Infinity;
        var curDiff;

        if (_.isArray(bandwidths)) {
            _.forEach(bandwidths, function (cur) {
                curDiff = Math.abs(cur - targetBandwidth);
                if (curDiff < smallestDiff) {
                    closest = cur;
                    smallestDiff = curDiff;
                }
            });
        }

        return closest;
    }

    function toKbps(bandwidth) {
        return Math.floor(bandwidth / 1000);
    }

    return {
        generateLabel: generateLabel,
        createLabel: createLabel,
        getCustomLabel: getCustomLabel,
        findClosestBandwidth: findClosestBandwidth,
        toKbps: toKbps,
    };
});
