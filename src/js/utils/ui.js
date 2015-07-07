define([
    'utils/backbone.events',
    'events/events',
    'utils/underscore',
    'utils/helpers'
], function(Events, events, _, utils) {
    var TouchEvent = window.TouchEvent || {};

    function getCoord(e, c) {
        return /touch/.test(e.type) ? (e.originalEvent || e).changedTouches[0]['page' + c] : e['page' + c];
    }

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

    function normalizeUIEvent(type, srcEvent, target) {
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
            currentTarget: target,
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
        // When cancelable is false, it means the page is likely scrolling
        if (evt.cancelable && evt.preventDefault) {
            evt.preventDefault();
        }
    }

    var UI = function (elem, options) {
        var _elem = elem,
            _enableDoubleTap = (options && options.enableDoubleTap), // and double click
            _preventScrolling = (options && options.preventScrolling),
            _hasMoved = false,
            _startX = 0,
            _startY = 0,
            _lastClickTime = 0,
            _doubleClickDelay = 300,
            _touchListenerTarget,
            _isDesktop = !utils.isMobile();


        // If its not mobile, add mouse listener.  Add touch listeners so touch devices that aren't Android or iOS
        // (windows phones) still get listeners just in case they want to use them.
        if(_isDesktop){
            elem.addEventListener('mousedown', interactStartHandler);
        }
        elem.addEventListener('touchstart', interactStartHandler);

        function interactStartHandler(evt) {
            var isMouseEvt = evt instanceof MouseEvent;
            _touchListenerTarget = evt.target;
            _startX = getCoord(evt, 'X');
            _startY = getCoord(evt, 'Y');

            if(!isMouseEvt || (isMouseEvt && !isRightClick(evt))){
                if(_isDesktop){
                    document.addEventListener('mousemove', interactDragHandler);
                }
                _touchListenerTarget.addEventListener('touchmove', interactDragHandler);
            }

            if (_isDesktop){
                document.addEventListener('mouseup', interactEndHandler);
            }
            _touchListenerTarget.addEventListener('touchcancel', interactEndHandler);
            _touchListenerTarget.addEventListener('touchend', interactEndHandler);
        }

        function interactDragHandler(evt) {
            var touchEvents = events.touchEvents;
            var movementThreshhold = 6;

            if (_hasMoved) {
                triggerEvent(touchEvents.DRAG, evt);
            } else {
                var endX = getCoord(evt, 'X');
                var endY = getCoord(evt, 'Y');
                var moveX = endX - _startX;
                var moveY = endY - _startY;
                if (moveX * moveX + moveY * moveY > movementThreshhold * movementThreshhold) {
                    triggerEvent(touchEvents.DRAG_START, evt);
                    _hasMoved = true;
                    triggerEvent(touchEvents.DRAG, evt);
                }
            }

            // Prevent scrolling the screen dragging while dragging on mobile.
            if (_preventScrolling) {
                preventDefault(evt);
            }
        }

        function interactEndHandler(evt) {
            var touchEvents = events.touchEvents;

            if(_isDesktop){
                document.removeEventListener('mousemove', interactDragHandler);
                document.removeEventListener('mouseup', interactEndHandler);
            }
            _touchListenerTarget.removeEventListener('touchmove', interactDragHandler);
            _touchListenerTarget.removeEventListener('touchcancel', interactEndHandler);
            _touchListenerTarget.removeEventListener('touchend', interactEndHandler);

            if (_hasMoved) {
                triggerEvent(touchEvents.DRAG_END, evt);
            } else {
                if(evt instanceof MouseEvent) {
                    if (! isRightClick(evt)) {
                        triggerEvent(touchEvents.CLICK, evt);
                    }
                } else {
                    triggerEvent(touchEvents.TAP, evt);

                    // preventDefault to not dispatch the 300ms delayed click after a tap
                    preventDefault(evt);
                }
            }

            _touchListenerTarget = null;
            _hasMoved = false;
        }

        var self = this;
        function triggerEvent(type, srcEvent) {
            var evt;
            if( _enableDoubleTap && (type === events.touchEvents.CLICK || type === events.touchEvents.TAP)){
                if(_.now() - _lastClickTime < _doubleClickDelay) {
                    var doubleType = (type === events.touchEvents.CLICK) ?
                        events.touchEvents.DOUBLE_CLICK : events.touchEvents.DOUBLE_TAP;
                    evt = normalizeUIEvent(doubleType, srcEvent, _elem);
                    self.trigger(doubleType, evt);
                    _lastClickTime = 0;
                } else {
                    _lastClickTime = _.now();
                }
            }
            evt = normalizeUIEvent(type, srcEvent, _elem);
            self.trigger(type, evt);
        }

        this.triggerEvent = triggerEvent;

        this.destroy = function() {
            elem.removeEventListener('touchstart', interactStartHandler);
            elem.removeEventListener('mousedown', interactStartHandler);

            if(_touchListenerTarget){
                _touchListenerTarget.removeEventListener('touchmove', interactDragHandler);
                _touchListenerTarget.removeEventListener('touchcancel', interactEndHandler);
                _touchListenerTarget.removeEventListener('touchend', interactEndHandler);
            }

            document.removeEventListener('mousemove', interactDragHandler);
            document.removeEventListener('mouseup', interactEndHandler);
        };

        return this;
    };

    _.extend(UI.prototype, Events);

    return UI;
});
