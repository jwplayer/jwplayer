const Date = window.Date;
const performance = window.performance || {
    timing: {}
};
const startDate = performance.timing.navigationStart || (new Date().getTime());

if (!('now' in performance)) {
    performance.now = () => (new Date().getTime()) - startDate;
}

export function now() {
    return performance.now();
}

export function dateTime() {
    return startDate + performance.now();
}
