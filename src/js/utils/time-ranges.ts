export default function endOfRange(timeRanges: TimeRanges): number {
    if (!timeRanges || !timeRanges.length) {
        return 0;
    }

    return timeRanges.end(timeRanges.length - 1);
}
