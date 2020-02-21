/** @module */
import { StreamType } from 'types/generic.type';

/**
 * It's DVR if the duration is not Infinity and above the minDvrWindow, Live otherwise.
 * @param {number} duration - The duration or seekable range of a stream in seconds.
 * @param {number} minDvrWindow - The duration threshold beyond which a stream should be treated as DVR instead of Live.
 * @returns {boolean} DVR or not.
 */
export function isDvr(duration: number, minDvrWindow: number): boolean {
    return duration !== Infinity && Math.abs(duration) >= Math.max(validMinDvrWindow(minDvrWindow), 0);
}

/**
 * Determine the adaptive type.
 * @param {number} duration - The duration or seekable range of a stream in seconds. Can be positive or negative.
 * Positive or non-infinite values will result in a return value of 'VOD'. Infinite values always return 'LIVE'.
 * @param {number} minDvrWindow - The duration threshold beyond which a stream should be treated as DVR instead of Live.
 * minDvrWindow should always be positive.
 * @returns {StreamType} The stream typeR.
 */
export function streamType(duration: number, minDvrWindow: number): StreamType {
    let type: StreamType = 'VOD';

    if (duration === Infinity) {
        type = 'LIVE';
    } else if (duration < 0) {
        type = isDvr(duration, validMinDvrWindow(minDvrWindow)) ? 'DVR' : 'LIVE';
    }
    return type;
}

function validMinDvrWindow(minDvrWindow: number): number {
    return (minDvrWindow === undefined) ? 120 : Math.max(minDvrWindow, 0);
}
