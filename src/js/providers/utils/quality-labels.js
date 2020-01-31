// Try and find a corresponding custom label. If there are no custom labels, create one using height, bandwidth, or both
export function generateLabel(level, qualityLabels, redundant) {
    if (!level) {
        return '';
    }
    // flash provider uses bitrate instead of bandwidth
    const bandwidth = level.bitrate || level.bandwidth;
    // flash provider, in some cases, will create its own label. Prefer it over creating a new label
    return getCustomLabel(qualityLabels, bandwidth) ||
        level.label ||
        createLabel(level.height, bandwidth, redundant);
}

// Prefer creating a label with height with a fallback to bandwidth. Make a label using both if redundant
export function createLabel(height, bandwidth, redundant) {
    if (!height && !bandwidth) {
        return '';
    }

    const bandwidthString = `${toKbps(bandwidth)} kbps`;
    let label = bandwidthString;

    if (height) {
        label = `${height}p`;
        if (bandwidth && redundant) {
            label += ` (${bandwidthString})`;
        }
    }

    return label;
}

// Ensures that we're able to find a custom label. As long as there is at least 1 quality label and a defined
// bandwidth, a quality label will always be found. Return null otherwise
export function getCustomLabel(qualityLabels, bandwidth) {
    let label = null;

    if (bandwidth && qualityLabels) {
        const bandwidths = Object.keys(qualityLabels);
        const key = parseFloat(bandwidth);
        if (bandwidths.length && !isNaN(key)) {
            label = qualityLabels[findClosestBandwidth(bandwidths, toKbps(key))];
        }
    }

    return label;
}

// Finds the bandwidth with the smallest difference from the target bandwidth
export function findClosestBandwidth(bandwidths, targetBandwidth) {
    let closest = null;
    let smallestDiff = Infinity;
    let curDiff;

    if (Array.isArray(bandwidths)) {
        bandwidths.forEach(function (cur) {
            curDiff = Math.abs(cur - targetBandwidth);
            if (curDiff < smallestDiff) {
                closest = cur;
                smallestDiff = curDiff;
            }
        });
    }

    return closest;
}

export function toKbps(bandwidth) {
    return Math.floor(bandwidth / 1000);
}

// Use an empty object as the context and populate it like a hash map
export function hasRedundantLevels(levels) {
    if (!Array.isArray(levels)) {
        return false;
    }
    return checkForLevelDuplicates(levels, ['height', 'bitrate', 'bandwidth']);
}

export function hasRedundantLabels(levels) {
    if (!Array.isArray(levels)) {
        return false;
    }
    return checkForLevelDuplicates(levels, ['label']);
}

function checkForLevelDuplicates(levels, dupKeys) {
    return levels.some(function (level) {
        let key;
        for (let i = 0; i < dupKeys.length; i++) {
            // Take the passed keys which are used to detect duplicates and
            // in priority order find one that is populated on the given level
            key = level[dupKeys[i]];
            if (key) {
                break;
            }
        }

        if (!key) {
            return false;
        }
        const foundDuplicate = this[key];
        this[key] = 1;
        return foundDuplicate;
    }, {});
}
