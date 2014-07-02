(function(jwplayer) {
    var events = jwplayer.events,
        _utils = jwplayer.utils;

    events.eventdispatcher = function(id, debug) {
        var _id = id,
            _debug = debug,
            _listeners,
            _globallisteners;

        /** Clears all event listeners **/
        this.resetEventListeners = function() {
            _listeners = {};
            _globallisteners = [];
        };

        this.resetEventListeners();

        /** Add an event listener for a specific type of event. **/
        this.addEventListener = function(type, listener, count) {
            try {
                if (!_utils.exists(_listeners[type])) {
                    _listeners[type] = [];
                }

                if (_utils.typeOf(listener) === 'string') {
                    /*jshint evil:true*/
                    listener = (new Function('return ' + listener))();
                }
                _listeners[type].push({
                    listener: listener,
                    count: count || null
                });
            } catch (err) {
                _utils.log('error', err);
            }
            return false;
        };

        /** Remove an event listener for a specific type of event. **/
        this.removeEventListener = function(type, listener) {
            var listenerIndex;
            if (!_listeners[type]) {
                return;
            }
            try {
                if (listener === undefined) {
                    _listeners[type] = [];
                    return;
                }
                for (listenerIndex = 0; listenerIndex < _listeners[type].length; listenerIndex++) {
                    if (_listeners[type][listenerIndex].listener.toString() === listener.toString()) {
                        _listeners[type].splice(listenerIndex, 1);
                        break;
                    }
                }
            } catch (err) {
                _utils.log('error', err);
            }
            return false;
        };

        /** Add an event listener for all events. **/
        this.addGlobalListener = function(listener, count) {
            try {
                if (_utils.typeOf(listener) === 'string') {
                    /*jshint evil:true*/
                    listener = (new Function('return ' + listener))();
                }
                _globallisteners.push({
                    listener: listener,
                    count: count || null
                });
            } catch (err) {
                _utils.log('error', err);
            }
            return false;
        };

        /** Add an event listener for all events. **/
        this.removeGlobalListener = function(listener) {
            if (!listener) {
                return;
            }
            try {
                for (var index = _globallisteners.length; index--;) {
                    if (_globallisteners[index].listener.toString() === listener.toString()) {
                        _globallisteners.splice(index, 1);
                    }
                }
            } catch (err) {
                _utils.log('error', err);
            }
            return false;
        };


        /** Send an event **/
        this.sendEvent = function(type, data) {
            if (!_utils.exists(data)) {
                data = {};
            }
            _utils.extend(data, {
                id: _id,
                version: jwplayer.version,
                type: type
            });
            if (_debug) {
                _utils.log(type, data);
            }
            dispatchEvent(_listeners[type], data, type);
            dispatchEvent(_globallisteners, data, type);
        };

        function dispatchEvent(listeners, data, type) {
            if (!listeners) {
                return;
            }
            for (var index = 0; index < listeners.length; index++) {
                var listener = listeners[index];
                if (listener) {
                    if (listener.count !== null && --listener.count === 0) {
                        delete listeners[index];
                    }
                    try {
                        listener.listener(data);
                    } catch (err) {
                        _utils.log('Error handling "' + type +
                            '" event listener [' + index + ']: ' + err.toString(), listener.listener, data);
                    }
                }
            }
        }
    };
})(window.jwplayer);
