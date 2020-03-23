import { now as getTime } from 'utils/date';
import type { GenericObject } from '../types/generic.type';

const performance: Performance | GenericObject = window.performance || {
    timing: {}
};
const startDate = performance.timing.navigationStart || getTime();

if (!('now' in performance)) {
    performance.now = () => (getTime() - startDate);
}

export function now(): number {
    return performance.now();
}

export function dateTime(): number {
    return startDate + performance.now();
}
