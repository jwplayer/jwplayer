define([], function() {

    var AudioClockPolyfill = function() {
        var currentTime = 0;
        var time = new Date().getTime();

        var updateClock = function() {
            var delta = new Date().getTime() - time;
            if (delta > 250) {
                delta = 250;
            } else if (delta < 0) {
                delta = 0;
            }
            time += delta;
            currentTime += delta;
        };
        setInterval(updateClock, 50);

        Object.defineProperty(this, 'currentTime', {
            get: function() {
                updateClock();
                return currentTime / 1000;
            }
        });
    };

    var Clock = function() {
        if ('AudioContext' in window) {
            this.timer = new AudioContext();
        } else {
            this.timer = new AudioClockPolyfill();
        }
    };

    Clock.prototype.now = function() {
        return this.timer.currentTime * 1000;
    };

    return new Clock();
});
