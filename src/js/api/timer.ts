import { dateTime } from 'utils/clock';

/**
 * QoE metrics returned by `jwplayer()._qoe.dump()`.
 * {@link Api#qoe jwplayer().qoe():PlayerQoE} returns these for the player and the current playlist item.
 * @typedef {object} TimerMetrics
 * @property {object} counts - Lists event counts by event name
 * @property {object} events - Lists last event timestamps (epoch ms) by event name
 * @property {object} sums - Lists total event/state duration by event/state name
 */

type TimerMetric = {
    [key: string]: number;
}

export type TimerMetrics = {
    counts: TimerMetric;
    events: TimerMetric;
    sums: TimerMetric;
}

/**
 * The Timer used to measure player and playlist item QoE
 * @class Timer
 */

class Timer {
    private startTimes: TimerMetric;
    private sum: TimerMetric;
    private counts: TimerMetric;
    private ticks: TimerMetric;

    constructor() {
        this.startTimes = {};
        this.sum = {};
        this.counts = {};
        this.ticks = {};
    }
    // Profile methods
    /**
     * Start timing a method. Increment {@link TimerMetrics} count.
     * If the method was already started, but not finished, it's start will be reset.
     * @memberOf Timer
     * @instance
     * @param {string} methodName - The method or player state name.
     * @returns {void}
     */
    start(methodName: string): void {
        this.startTimes[methodName] = dateTime();
        this.counts[methodName] = this.counts[methodName] + 1 || 1;
    }
    /**
     * Finish timing a method. The time since `start` is added to {@link TimerMetrics#sums} sums.
     * @memberOf Timer
     * @instance
     * @param {string} methodName - The method or player state name.
     * @returns {void}
     */
    end(methodName: string): void {
        if (!this.startTimes[methodName]) {
            return;
        }
        const now = dateTime();
        const e = now - this.startTimes[methodName];
        delete this.startTimes[methodName];
        this.sum[methodName] = this.sum[methodName] + e || e;
    }
    /**
     * Output the timer metrics.
     * @memberOf Timer
     * @instance
     * @returns {TimerMetrics} The timing and count of all "tick" events tracked thus far.
     */
    dump(): TimerMetrics {
        // Add running sum of latest method
        // This lets `jwplayer().qoe().item.sums` return a tally of running playing/paused time
        const runningSums = Object.assign({}, this.sum);
        for (const methodName in this.startTimes) {
            if (Object.prototype.hasOwnProperty.call(this.startTimes, methodName)) {
                const now = dateTime();
                const e = now - this.startTimes[methodName];
                runningSums[methodName] = runningSums[methodName] + e || e;
            }
        }
        return {
            counts: Object.assign({}, this.counts),
            sums: runningSums,
            events: Object.assign({}, this.ticks)
        };
    }

    // Profile events
    /**
     * Add or update an event timestamp. The timestamp "tick" is added to {@link TimerMetrics#events} events.
     * @memberOf Timer
     * @instance
     * @param {string} event - The event name.
     * @returns {void}
     */
    tick(event: string): void {
        this.ticks[event] = dateTime();
    }

    /**
     * Remove an event timestamp. The timestamp "tick" is removed from {@link TimerMetrics#events} events.
     * @memberOf Timer
     * @instance
     * @param {string} event - The event name.
     * @returns {void}
     */
    clear(event: string): void {
        delete this.ticks[event];
    }

    /**
     * Get the difference between two events.
     * @memberOf Timer
     * @instance
     * @param {string} left - The first event name.
     * @param {string} right - The second event name.
     * @returns {number|null} The time between events, or null if not found.
     */
    between(left: string, right: string): number | null {
        if (this.ticks[right] && this.ticks[left]) {
            return this.ticks[right] - this.ticks[left];
        }
        return null;
    }
}

export default Timer;
