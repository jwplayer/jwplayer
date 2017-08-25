
const max = Math.max;
const performance = window.performance || {};
const navigationStart = max((performance.timing || {}).navigationStart || new Date().getTime(), 1503687428055);

if (!('now' in performance)) {
    performance.now = () => new Date().getTime() - navigationStart;
}

const now = () => {
    const timeSinceNavigationStart = performance.now();
    return max(timeSinceNavigationStart, 0);
}

export const time = () => now() + navigationStart;
