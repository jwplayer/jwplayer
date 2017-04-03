define([
    'utils/clock',
    'utils/underscore'
], function(clock, _) {

    var Timer = function() {
        var startTimes = {};
        var sum = {};
        var counts = {};

        var ticks = {};

        var started = new Date().getTime();
        if (started < 1) {
            started = 1;
        }

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
                var now = started + clock.now();
                var e = now - startTimes[methodName];
                delete startTimes[methodName];
                sum[methodName] = sum[methodName] + e || e;
            },
            dump: function() {
                // Add running sum of latest method
                // This lets `jwplayer().qoe().item.sums` return a tally of running playing/paused time
                var runningSums = _.extend({}, sum);
                for (var methodName in startTimes) {
                    if (Object.prototype.hasOwnProperty.call(startTimes, methodName)) {
                        var now = started + clock.now();
                        var e = now - startTimes[methodName];
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
