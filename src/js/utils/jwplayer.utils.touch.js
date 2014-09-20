(function (utils) {

    var TOUCH_MOVE = 'touchmove',
        TOUCH_START = 'touchstart',
        TOUCH_END = 'touchend',
        TOUCH_CANCEL = 'touchcancel';

    utils.touch = function (elem) {
        var _elem = elem,
            _isListening = false,
            _handlers = {},
            _startEvent = null,
            _gotMove = false,
            _events = utils.touchEvents;

        document.addEventListener(TOUCH_MOVE, touchHandler);
        document.addEventListener(TOUCH_END, documentEndHandler);
        document.addEventListener(TOUCH_CANCEL, touchHandler);
        elem.addEventListener(TOUCH_START, touchHandler);
        elem.addEventListener(TOUCH_END, touchHandler);

        function documentEndHandler(evt) {
            if (_isListening) {
                if (_gotMove) {
                    triggerEvent(_events.DRAG_END, evt);
                }
            }
            _gotMove = false;
            _isListening = false;
            _startEvent = null;
        }

        function touchHandler(evt) {
            if (evt.type === TOUCH_START) {
                _isListening = true;
                _startEvent = createEvent(_events.DRAG_START, evt);
            }
            else if (evt.type === TOUCH_MOVE) {
                if (_isListening) {
                    if (_gotMove) {
                        triggerEvent(_events.DRAG, evt);
                    }
                    else {
                        triggerEvent(_events.DRAG_START, evt, _startEvent);
                        _gotMove = true;
                        triggerEvent(_events.DRAG, evt);
                    }
                }
            }
            else {
                if (_isListening) {
                    if (_gotMove) {
                        triggerEvent(_events.DRAG_END, evt);
                    }
                    else {
                        // This allows the controlbar/dock/logo tap events not to be forwarded to the view
                        evt.cancelBubble = true;
                        triggerEvent(_events.TAP, evt);
                    }
                }
                _gotMove = false;
                _isListening = false;
                _startEvent = null;
            }
        }

        function triggerEvent(type, srcEvent, finalEvt) {
            if (_handlers[type]) {
                preventDefault(srcEvent);
                var evt = finalEvt ? finalEvt : createEvent(type, srcEvent);
                if (evt) {
                    _handlers[type](evt);
                }
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
            if (type !== _events.TAP && _startEvent) {
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

        this.addEventListener = function (type, handler) {
            _handlers[type] = handler;
        };

        this.removeEventListener = function (type) {
            delete _handlers[type];
        };

        return this;
    };

})(jwplayer.utils);