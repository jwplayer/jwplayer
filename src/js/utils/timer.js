define([
    'utils/underscore'
], function(_) {
    var Timer = function(id) {
        var _startTimes = {};
        var _sum = {};
        var _counts = {};

        var _ticks = {};

        return {
            // Profile methods
            start : function(methodName) {
                _startTimes[methodName] = _.now();
                _counts[methodName]++;
            },
            end : function(methodName) {
                var e = _.now() - _startTimes[methodName];
                _sum[methodName] += e;
            },
            dump : function() {
                console.log('Player : ' + id);

                _.each(_counts, function(count, method) {
                    console.log(method, ' was called ', count, ' times');
                    console.log('\tTotal time: ', _sum[method], ' Avg time: ', _sum[method]/count);
                });
            },

            // Profile events
            tick : function(event) {
                _ticks[event] = _.now();
            },
            between : function(left, right) {
                return _ticks[right] - _ticks[left];
            }
        };
    };

    return Timer;
});
