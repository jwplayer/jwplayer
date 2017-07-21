
// It's DVR if the duration is above the minDvrWindow, Live otherwise
export function isDvr(duration, minDvrWindow) {
    return Math.abs(duration) >= Math.max(minDvrWindow, 0);
}

// Determine the adaptive type - Live, DVR, or VOD
// Duration can be positive or negative, but minDvrWindow should always be positive
export function streamType(duration, minDvrWindow) {
    const _minDvrWindow = (minDvrWindow === undefined) ? 120 : minDvrWindow;
    let type = 'VOD';

    if (duration === Infinity) {
        // Live streams are always Infinity duration
        type = 'LIVE';
    } else if (duration < 0) {
        type = isDvr(duration, _minDvrWindow) ? 'DVR' : 'LIVE';
    }

    // Default option is VOD (i.e. positive or non-infinite)
    return type;
}
