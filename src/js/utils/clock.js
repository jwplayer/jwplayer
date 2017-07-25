
const performance = window.performance;

const supportsPerformance = !!(performance && performance.now);

const MAX_INTERVAL = 10000;

const getTime = function() {
    if (supportsPerformance) {
        return performance.now();
    }
    return new Date().getTime();
};

const Clock = function() {
    const started = getTime();
    let updated = started;

    const updateClock = function() {
        let delta = getTime() - updated;
        if (delta > MAX_INTERVAL) {
            delta = MAX_INTERVAL;
        } else if (delta < 0) {
            delta = 0;
        }
        updated += delta;
    };
    setInterval(updateClock, 1000);

    Object.defineProperty(this, 'currentTime', {
        get: function() {
            updateClock();
            return updated - started;
        }
    });
};

Clock.prototype.now = function() {
    return this.currentTime;
};

const clock = new Clock();

export default clock;
