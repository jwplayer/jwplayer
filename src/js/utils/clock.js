import { now as getTime } from 'utils/date';

const performance = window.performance || {
    timing: {}
};
const startDate = performance.timing.navigationStart || getTime();

if (!('now' in performance)) {
    performance.now = () => (getTime() - startDate);
}

export function now() {
    return performance.now();
}

export function dateTime() {
    return startDate + performance.now();
}
