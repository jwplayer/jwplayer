import type { ProviderLevel } from 'providers/data-normalizer';
import type { GenericObject } from 'types/generic.type';

type QualityLabels = {
    [key: number]: string;
};

// Try and find a corresponding custom label. If there are no custom labels, create one using height, bandwidth, or both
export function generateLabel(level?: ProviderLevel, qualityLabels?: QualityLabels | null, redundant?: boolean): string {
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
function createLabel(height?: number, bandwidth?: number, redundant?: boolean): string {
    if (!height && !bandwidth) {
        return '';
    }

    let label = '';
    let bandwidthString = '';

    if (bandwidth) {
        bandwidthString = `${toKbps(bandwidth)} kbps`;
        label = bandwidthString;
    }

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
function getCustomLabel(qualityLabels?: QualityLabels | null, bandwidth?: number): string | null {
    let label: string | null = null;

    if (bandwidth && qualityLabels) {
        const bandwidths = Object.keys(qualityLabels);
        if (bandwidths.length) {
            const closestBandwidth = findClosestBandwidth(bandwidths, toKbps(bandwidth));
            if (closestBandwidth) {
                label = qualityLabels[closestBandwidth];
            }
        }
    }

    return label;
}

// Finds the bandwidth with the smallest difference from the target bandwidth
function findClosestBandwidth(bandwidths: string[], targetBandwidth: number): string | null {
    let closest: string | null = null;
    let smallestDiff = Infinity;
    let curDiff: number;

    bandwidths.forEach(cur => {
        curDiff = Math.abs(parseFloat(cur) - targetBandwidth);
        if (curDiff < smallestDiff) {
            closest = cur;
            smallestDiff = curDiff;
        }
    });

    return closest;
}

export function toKbps(bandwidth: number): number {
    return Math.floor(bandwidth / 1000);
}

// Use an empty object as the context and populate it like a hash map
export function hasRedundantLevels(levels: ProviderLevel[]): boolean {
    if (!Array.isArray(levels)) {
        return false;
    }
    return checkForLevelDuplicates(levels, ['height', 'bitrate', 'bandwidth']);
}

export function hasRedundantLabels(levels: ProviderLevel[]): boolean {
    if (!Array.isArray(levels)) {
        return false;
    }
    return checkForLevelDuplicates(levels, ['label']);
}

function checkForLevelDuplicates(levels: ProviderLevel[], dupKeys: string[]): boolean {
    return levels.some(function (this: GenericObject, level: ProviderLevel): boolean {
        let key: any;
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
        const foundDuplicate = this[key] || false;
        this[key] = true;
        return foundDuplicate;
    }, {});
}
