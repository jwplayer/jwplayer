define([
    'controller/setup-steps',
    'utils/backbone.events',
    'utils/underscore',
    'events/events'
], function(SetupSteps, Events, _, events) {
    var Setup = function(_api, _model, _view, _setPlaylist) {
        var _this = this;
        var _setupFailureTimeout;
        var _queue = SetupSteps.getQueue();
        var _errorTimeoutSeconds = 30;

        this.start = function () {
            _setupFailureTimeout = setTimeout(_setupTimeoutHandler, _errorTimeoutSeconds * 1000);
            _nextTask();
        };

        this.destroy = function() {
            clearTimeout(_setupFailureTimeout);
            this.off();
            _queue.length = 0;
            _api = null;
            _model = null;
            _view = null;
        };

        function _setupTimeoutHandler() {
            _error('Setup Timeout Error', 'Setup took longer than ' + _errorTimeoutSeconds + ' seconds to complete.');
        }

        function _nextTask() {
            for (var taskName in _queue) {
                if (Object.prototype.hasOwnProperty.call(_queue, taskName)) {
                    var c = _queue[taskName];
                    if (!c.complete && !c.running && _api && _allComplete(c.depends)) {
                        c.running = true;
                        callTask(c);
                    }
                }
            }
        }

        function callTask(task) {
            var resolve = function(resolveState) {
                resolveState = resolveState || {};
                _taskComplete(task, resolveState);
            };

            task.method(resolve, _model, _api, _view, _setPlaylist);
        }

        function _allComplete(dependencies) {
            // return true if empty array,
            //  or if each object has an attribute 'complete' which is true
            return _.all(dependencies, function(name) {
                return _queue[name].complete;
            });
        }

        function _taskComplete(task, resolveState) {
            if (resolveState.type === 'error') {
                _error(resolveState.msg, resolveState.reason);
            } else if (resolveState.type === 'complete') {
                clearTimeout(_setupFailureTimeout);
                _this.trigger(events.JWPLAYER_READY);
            } else {
                task.complete = true;
                _nextTask();
            }
        }

        function _error(message, reason) {
            clearTimeout(_setupFailureTimeout);
            _this.trigger(events.JWPLAYER_SETUP_ERROR, {
                message: message + ': ' + reason
            });
            _this.destroy();
        }
    };

    Setup.prototype = Events;

    return Setup;
});
