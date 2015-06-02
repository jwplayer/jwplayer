define([
    'utils/backbone.events',
    'events/events',
    'utils/underscore'
], function(Events, events, _) {

    var TOUCH_MOVE = 'touchmove',
        TOUCH_START = 'touchstart',
        TOUCH_END = 'touchend',
        TOUCH_CANCEL = 'touchcancel';

    var touch = function (elem) {
        var _elem = elem,
            _isListening = false,
            _startEvent = null,
            _gotMove = false,
            touchEvents = events.touchEvents;

        _.extend(this, Events);

        document.addEventListener(TOUCH_MOVE, touchHandler);
        document.addEventListener(TOUCH_END, documentEndHandler);
        document.addEventListener(TOUCH_CANCEL, touchHandler);
        elem.addEventListener(TOUCH_START, touchHandler);
        elem.addEventListener(TOUCH_END, touchHandler);

        function documentEndHandler(evt) {
            if (_isListening) {
                if (_gotMove) {
                    triggerEvent(touchEvents.DRAG_END, evt);
                }
            }
            _gotMove = false;
            _isListening = false;
            _startEvent = null;
        }

        function touchHandler(evt) {
            if (evt.type === TOUCH_START) {
                _isListening = true;
                _startEvent = createEvent(touchEvents.DRAG_START, evt);
            }
            else if (evt.type === TOUCH_MOVE) {
                if (_isListening) {
                    if (_gotMove) {
                        triggerEvent(touchEvents.DRAG, evt);
                    }
                    else {
                        triggerEvent(touchEvents.DRAG_START, evt, _startEvent);
                        _gotMove = true;
                        triggerEvent(touchEvents.DRAG, evt);
                    }
                }
            }
            else {
                if (_isListening) {
                    if (_gotMove) {
                        triggerEvent(touchEvents.DRAG_END, evt);
                    }
                    else {
                        // This allows the controlbar/dock/logo tap events not to be forwarded to the view
                        evt.cancelBubble = true;
                        triggerEvent(touchEvents.TAP, evt);
                    }
                }
                _gotMove = false;
                _isListening = false;
                _startEvent = null;
            }
        }

        function createEvent(type, srcEvent) {
            var touch = null;
            if (srcEvent.touches && srcEvent.touches.length) {
                touch = srcEvent.touches[0];
            }
            else if (srcEvent.changedTouches && srcEvent.changedTouches.length) {
                touch = srcEvent.changedTouches[0];
            }
            if (!touch) {
                return null;
            }
            var rect = _elem.getBoundingClientRect();
            var evt = {
                type: type,
                target: _elem,
                x: ((touch.pageX - window.pageXOffset) - rect.left),
                y: touch.pageY,
                deltaX: 0,
                deltaY: 0
            };
            if (type !== touchEvents.TAP && _startEvent) {
                evt.deltaX = evt.x - _startEvent.x;
                evt.deltaY = evt.y - _startEvent.y;
            }
            return evt;
        }

        function preventDefault(evt) {
            if (evt.preventManipulation) {
                evt.preventManipulation();
            }
            if (evt.preventDefault) {
                evt.preventDefault();
            }
        }

        var self = this;
        function triggerEvent(type, srcEvent, finalEvt) {
            if (self._events[type]) {
                preventDefault(srcEvent);
                var evt = finalEvt ? finalEvt : createEvent(type, srcEvent);
                if (evt) {
                    self.trigger(type, evt);
                }
            }
        }

        return this;
    };

    return touch;
});
