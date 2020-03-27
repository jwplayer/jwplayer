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

type Timer = {
    start: (methodName: string) => void;
    end: (methodName: string) => void;
    dump: () => TimerMetrics;
    tick: (event: string) => void;
    clear: (event: string) => void;
    between: (left: string, right: string) => number | null;
}

const Timer = function(): Timer {
    const startTimes = {};
    const sum = {};
    const counts = {};

    const ticks = {};

    /** @lends Timer */
    return {
        // Profile methods
        /**
         * Start timing a method. Increment {@link TimerMetrics} count.
         * If the method was already started, but not finished, it's start will be reset.
         * @memberOf Timer
         * @instance
         * @param {string} methodName - The method or player state name.
         * @returns {void}
         */
        start: function(methodName: string): void {
            startTimes[methodName] = dateTime();
            counts[methodName] = counts[methodName] + 1 || 1;
        },
        /**
         * Finish timing a method. The time since `start` is added to {@link TimerMetrics#sums} sums.
         * @memberOf Timer
         * @instance
         * @param {string} methodName - The method or player state name.
         * @returns {void}
         */
        end: function(methodName: string): void {
            if (!startTimes[methodName]) {
                return;
            }
            const now = dateTime();
            const e = now - startTimes[methodName];
            delete startTimes[methodName];
            sum[methodName] = sum[methodName] + e || e;
        },
        /**
         * Output the timer metrics.
         * @memberOf Timer
         * @instance
         * @returns {TimerMetrics} The timing and count of all "tick" events tracked thus far.
         */
        dump: function(): TimerMetrics {
            // Add running sum of latest method
            // This lets `jwplayer().qoe().item.sums` return a tally of running playing/paused time
            const runningSums = Object.assign({}, sum);
            for (const methodName in startTimes) {
                if (Object.prototype.hasOwnProperty.call(startTimes, methodName)) {
                    const now = dateTime();
                    const e = now - startTimes[methodName];
                    runningSums[methodName] = runningSums[methodName] + e || e;
                }
            }
            return {
                counts: Object.assign({}, counts),
                sums: runningSums,
                events: Object.assign({}, ticks)
            };
        },

        // Profile events
        /**
         * Add or update an event timestamp. The timestamp "tick" is added to {@link TimerMetrics#events} events.
         * @memberOf Timer
         * @instance
         * @param {string} event - The event name.
         * @returns {void}
         */
        tick: function(event: string): void {
            ticks[event] = dateTime();
        },

        /**
         * Remove an event timestamp. The timestamp "tick" is removed from {@link TimerMetrics#events} events.
         * @memberOf Timer
         * @instance
         * @param {string} event - The event name.
         * @returns {void}
         */
        clear: function(event: string): void {
            delete ticks[event];
        },

        /**
         * Get the difference between two events.
         * @memberOf Timer
         * @instance
         * @param {string} left - The first event name.
         * @param {string} right - The second event name.
         * @returns {number|null} The time between events, or null if not found.
         */
        between: function(left: string, right: string): number | null {
            if (ticks[right] && ticks[left]) {
                return ticks[right] - ticks[left];
            }
            return null;
        }
    };
};

export default Timer;
