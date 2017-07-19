define([
    'utils/clock',
    'utils/underscore'
], function(clock, _) {

    const Timer = function() {
        const startTimes = {};
        const sum = {};
        const counts = {};

        const ticks = {};

        const started = Math.max(1, new Date().getTime());

        return {
            // Profile methods
            start: function(methodName) {
                startTimes[methodName] = started + clock.now();
                counts[methodName] = counts[methodName] + 1 || 1;
            },
            end: function(methodName) {
                if (!startTimes[methodName]) {
                    return;
                }
                const now = started + clock.now();
                const e = now - startTimes[methodName];
                delete startTimes[methodName];
                sum[methodName] = sum[methodName] + e || e;
            },
            dump: function() {
                // Add running sum of latest method
                // This lets `jwplayer().qoe().item.sums` return a tally of running playing/paused time
                const runningSums = _.extend({}, sum);
                for (const methodName in startTimes) {
                    if (Object.prototype.hasOwnProperty.call(startTimes, methodName)) {
                        const now = started + clock.now();
                        const e = now - startTimes[methodName];
                        runningSums[methodName] = runningSums[methodName] + e || e;
                    }
                }
                return {
                    counts: _.extend({}, counts),
                    sums: runningSums,
                    events: _.extend({}, ticks)
                };
            },

            // Profile events
            tick: function(event) {
                ticks[event] = started + clock.now();
            },
            between: function(left, right) {
                if (ticks[right] && ticks[left]) {
                    return ticks[right] - ticks[left];
                }
                return null;
            }
        };
    };

    return Timer;
});
