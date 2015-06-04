define([
    'utils/underscore'
], function(_) {
    var Timer = function() {
        var _startTimes = {};
        var _sum = {};
        var _counts = {};

        var _ticks = {};

        return {
            // Profile methods
            start : function(methodName) {
                _startTimes[methodName] = _.now();
                _counts[methodName] = _counts[methodName]+1 || 1;
            },
            end : function(methodName) {
                if (!_startTimes[methodName]) {
                    return;
                }

                var e = _.now() - _startTimes[methodName];
                _sum[methodName] = _sum[methodName] + e || e;
            },
            dump : function() {
                return {
                    counts : _counts,
                    sums : _sum,
                    events : _ticks
                };
            },

            // Profile events
            tick : function(event, time) {
                // If a time is given, use that instead of now()
                _ticks[event] = time || _.now();
            },
            between : function(left, right) {
                if (_ticks[right] && _ticks[left]) {
                    return _ticks[right] - _ticks[left];
                }
                return -1;
            }
        };
    };

    return Timer;
});
