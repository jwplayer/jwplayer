define([
    'utils/backbone.events',
    'events/events',
    'utils/underscore'
], function(Events, events, _) {
    var TouchEvent = window.TouchEvent || {};

    var UI = function (elem, options) {
        var _elem = elem,
            _enableDoubleTap = (options && options.enableDoubleTap),
            _hasMoved = false,
            _lastClickTime = 0,
            _doubleClickDelay = 300;

        elem.addEventListener('touchstart', interactStartHandler);
        elem.addEventListener('mousedown', interactStartHandler);

        function isRightClick(evt) {
            var e = evt || window.event;

            if ('which' in e) {
                // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
                return (e.which === 3);
            } else if ('button' in e) {
                // IE and Opera
                return (e.button === 2);
            }

            return false;
        }

        function interactStartHandler() {
            elem.addEventListener('touchmove', interactDragHandler);
            elem.addEventListener('touchcancel', interactEndHandler);
            elem.addEventListener('touchend', interactEndHandler);

            document.addEventListener('mousemove', interactDragHandler);
            document.addEventListener('mouseup', interactEndHandler);
        }

        function interactDragHandler(evt) {
            var touchEvents = events.touchEvents;

            if (_hasMoved) {
                triggerEvent(touchEvents.DRAG, evt);
            } else {
                triggerEvent(touchEvents.DRAG_START, evt);
                _hasMoved = true;
                triggerEvent(touchEvents.DRAG, evt);
            }
        }

        function interactEndHandler(evt) {
            var touchEvents = events.touchEvents;

            elem.removeEventListener('touchmove', interactDragHandler);
            elem.removeEventListener('touchcancel', interactEndHandler);
            elem.removeEventListener('touchend', interactEndHandler);

            document.removeEventListener('mousemove', interactDragHandler);
            document.removeEventListener('mouseup', interactEndHandler);

            if (_hasMoved) {
                triggerEvent(touchEvents.DRAG_END, evt);
            } else {
                // This allows the controlbar/dock/logo click events not to be forwarded to the view
                evt.stopPropagation();
                if(evt instanceof MouseEvent) {
                    if (! isRightClick(evt)) {
                        triggerEvent(touchEvents.CLICK, evt);
                    }
                } else {
                    triggerEvent(touchEvents.TAP, evt);
                }
            }

            _hasMoved = false;
        }

        function normalizeUIEvent(type, srcEvent) {
            var source;
            if(srcEvent instanceof MouseEvent || (!srcEvent.touches && !srcEvent.changedTouches)) {
                source = srcEvent;
            } else {
                if (srcEvent.touches && srcEvent.touches.length) {
                    source = srcEvent.touches[0];
                } else {
                    source = srcEvent.changedTouches[0];
                }
            }
            return {
                type: type,
                target: srcEvent.target,
                currentTarget: _elem,
                pageX: source.pageX,
                pageY: source.pageY
            };
        }

        // Preventdefault to prevent click events
        function preventDefault(evt) {
            // Because sendEvent from utils.eventdispatcher clones evt objects instead of passing them
            //  we cannot call evt.preventDefault() on them
            if (! (evt instanceof MouseEvent) && ! (evt instanceof TouchEvent)) {
                return;
            }

            if (evt.preventManipulation) {
                evt.preventManipulation();
            }
            if (evt.preventDefault) {
                evt.preventDefault();
            }
        }

        var self = this;
        function triggerEvent(type, srcEvent) {
            preventDefault(srcEvent);
            if( _enableDoubleTap && (type === events.touchEvents.CLICK || type === events.touchEvents.TAP)){
                if(_.now() - _lastClickTime < _doubleClickDelay) {
                    type = (type === events.touchEvents.CLICK) ?
                        events.touchEvents.DOUBLE_CLICK : events.touchEvents.DOUBLE_TAP;
                    _lastClickTime = 0;
                } else {
                    _lastClickTime = _.now();
                }
            }
            var evt = normalizeUIEvent(type, srcEvent);
            self.trigger(type, evt);

            return false;
        }

        this.triggerEvent = triggerEvent;

        this.destroy = function() {
            elem.removeEventListener('touchstart', interactStartHandler);
            elem.removeEventListener('mousedown', interactStartHandler);

            elem.removeEventListener('touchmove', interactDragHandler);
            elem.removeEventListener('touchcancel', interactEndHandler);
            elem.removeEventListener('touchend', interactEndHandler);

            document.removeEventListener('mousemove', interactDragHandler);
            document.removeEventListener('mouseup', interactEndHandler);
        };

        return this;
    };

    _.extend(UI.prototype, Events);

    return UI;
});
