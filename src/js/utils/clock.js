define([], function() {

    var performance = window.performance;

    var supportsPerformance = !!(performance && performance.now);
    
    var MAX_INTERVAL = 1000;

    var getTime = function() {
        if (supportsPerformance) {
            return performance.now();
        }
        return new Date().getTime();
    };

    var Clock = function() {
        var started = getTime();
        var updated = started;

        var updateClock = function() {
            var delta = getTime() - updated;
            if (delta > MAX_INTERVAL) {
                delta = MAX_INTERVAL;
            } else if (delta < 0) {
                delta = 0;
            }
            updated += delta;
        };
        setInterval(updateClock, 50);

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

    return new Clock();
});
