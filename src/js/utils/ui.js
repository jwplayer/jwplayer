define([
    'utils/backbone.events',
    'events/events',
    'utils/underscore'
], function(Events, events, _) {
    var TOUCH_MOVE = 'touchmove',
        TOUCH_START = 'touchstart',
        TOUCH_END = 'touchend',
        TOUCH_CANCEL = 'touchcancel',
        MOUSE_DOWN = 'mousedown',
        MOUSE_MOVE = 'mousemove',
        MOUSE_UP = 'mouseup';

    var ui = function (elem) {
        var _elem = elem,
            _isPressed = false,
            _startEvent = null,
            _hasMoved = false,
            _lastClickTime = 0;

        _.extend(this, Events);

        elem.addEventListener(TOUCH_START, interactStartHandler);

        elem.addEventListener(MOUSE_DOWN, interactStartHandler);

        function interactStartHandler() {
            _isPressed = true;

            elem.addEventListener(TOUCH_MOVE, interactDragHandler);
            elem.addEventListener(TOUCH_CANCEL, interactEndHandler);
            elem.addEventListener(TOUCH_END, interactEndHandler);

            document.addEventListener(MOUSE_MOVE, interactDragHandler);
            document.addEventListener(MOUSE_UP, interactEndHandler);
        }

        function interactDragHandler(evt) {
            var touchEvents = events.touchEvents;

            if (_hasMoved) {
                triggerEvent(touchEvents.DRAG, evt);
            } else {
                triggerEvent(touchEvents.DRAG_START, evt, _startEvent);
                _hasMoved = true;
                triggerEvent(touchEvents.DRAG, evt);
            }
        }

        function interactEndHandler(evt) {
            var touchEvents = events.touchEvents;

            if (_isPressed) {
                if (_hasMoved) {
                    triggerEvent(touchEvents.DRAG_END, evt);
                } else {
                    // This allows the controlbar/dock/logo click events not to be forwarded to the view
                    evt.cancelBubble = true;
                    if(evt instanceof MouseEvent) {
                        triggerEvent(touchEvents.CLICK, evt);
                    } else {
                        triggerEvent(touchEvents.TAP, evt);
                    }
                }
            }

            elem.removeEventListener(TOUCH_MOVE, interactDragHandler);
            elem.removeEventListener(TOUCH_CANCEL, interactEndHandler);
            elem.removeEventListener(TOUCH_END, interactEndHandler);

            document.removeEventListener(MOUSE_MOVE, interactDragHandler);
            document.removeEventListener(MOUSE_UP, interactEndHandler);

            _hasMoved = false;
            _isPressed = false;
            _startEvent = null;
        }

        function createEvent(type, srcEvent) {
            var source;
            if(srcEvent instanceof MouseEvent) {
                source = srcEvent;
            } else {
                if (srcEvent.touches && srcEvent.touches.length) {
                    source = srcEvent.touches[0];
                }
                else if (srcEvent.changedTouches && srcEvent.changedTouches.length) {
                    source = srcEvent.changedTouches[0];
                }
            }
            if (!source) {
                return null;
            }
            var evt = {
                type: type,
                target: srcEvent.target,
                currentTarget: _elem,
                pageX: source.pageX,
                pageY: source.pageY
            };
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
                if(type === events.touchEvents.CLICK || type === events.touchEvents.TAP){
                    if(Date.now() - _lastClickTime < 500) {
                        type = (type === events.touchEvents.CLICK) ?
                            events.touchEvents.DOUBLE_CLICK : events.touchEvents.DOUBLE_TAP;
                        _lastClickTime = 0;
                    } else {
                        _lastClickTime = Date.now();
                    }
                }
                var evt = finalEvt ? finalEvt : createEvent(type, srcEvent);
                if (evt) {
                    self.trigger(type, evt);
                }
            }

            return false;
        }

        return this;
    };

    return ui;
});
