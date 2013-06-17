/**
 * JW Player Touch Framework
 *
 * @author sanil
 * @version 6.6
 */

(function(utils) {

    var TOUCH_MOVE = "touchmove",
        TOUCH_START = "touchstart",
        TOUCH_END = "touchend",
        TOUCH_CANCEL = "touchcancel",
        DRAG = "drag",
        DRAG_START = "dragStart",
        DRAG_END = "dragEnd",
        TAP = "tap";

    utils.touch = function(elem) {

        var _elem = elem,
            _isListening = false,
            _handlers = {},
            _startEvent = null,
            _gotMove = false;

        document.addEventListener(TOUCH_MOVE, touchHandler);
        document.addEventListener(TOUCH_END, touchHandler);
        document.addEventListener(TOUCH_CANCEL, touchHandler);
        elem.addEventListener(TOUCH_START, touchHandler);

        function touchHandler(evt) {
            if(evt.type == TOUCH_START) {
                _isListening = true;
                _startEvent = createEvent(DRAG_START, evt);
            }
            else if(evt.type == TOUCH_MOVE) {
                if(_isListening) {
                    if(_gotMove) {
                        triggerEvent(DRAG, evt);
                    }
                    else {
                        triggerEvent(DRAG_START, evt, _startEvent);
                        _gotMove = true;
                        triggerEvent(DRAG, evt);
                    }
                }
            }
            else {
                if(_isListening) {
                    if(_gotMove) {
                        triggerEvent(DRAG_END, evt);
                    }
                    else {
                        triggerEvent(TAP, evt);
                    }
                }
                _gotMove = false;
                _isListening = false;
                _startEvent = null;
            }
        }

        function triggerEvent(type, srcEvent, finalEvt) {
            if(_handlers[type]) {
                preventDefault(srcEvent);
                var evt = finalEvt ? finalEvt : createEvent(type, srcEvent);
                if (evt) {
                    _handlers[type](evt);
                }
            }
        }

        function createEvent(type, srcEvent) {
            var touch = null;
            if(srcEvent.touches && srcEvent.touches.length) {
                touch = srcEvent.touches[0];
            }
            else if(srcEvent.changedTouches && srcEvent.changedTouches.length) {
                touch = srcEvent.changedTouches[0];   
            }
            if(!touch) {
                return null;
            }
            var rect = _elem.getBoundingClientRect();
            var evt = {};
            evt.type = type;
            evt.target = _elem;
            evt.x = (touch.clientX - rect.left);
            evt.y = (touch.clientY - rect.top);
            evt.deltaX = 0;
            evt.deltaY = 0;
            if(type != TAP && _startEvent) {
                evt.deltaX = evt.x - _startEvent.x;
                evt.deltaY = evt.y - _startEvent.y;
            }
            return evt;
        }
        
        function preventDefault(evt) {
             if(evt.preventManipulation) {
                evt.preventManipulation();
            }
            if(evt.preventDefault) {
                evt.preventDefault();
            }
        }

        this.addEventListener = function(type, handler) {
            _handlers[type] = handler;
        };

        this.removeEventListener = function(type) {
            delete _handlers[type];
        };

        return this;
    };

})(jwplayer.utils);