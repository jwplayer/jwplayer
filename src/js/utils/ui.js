define([
    'utils/backbone.events',
    'events/events',
    'utils/underscore',
    'utils/helpers'
], function(Events, events, _, utils) {
    var _usePointerEvents = !_.isUndefined(window.PointerEvent);
    var _useTouchEvents = !_usePointerEvents && utils.isMobile();
    var _useMouseEvents = !_usePointerEvents && ! _useTouchEvents;
    var _isOSXFirefox = utils.isFF() && utils.isOSX();

    function getCoord(e, c) {
        return /touch/.test(e.type) ? (e.originalEvent || e).changedTouches[0]['page' + c] : e['page' + c];
    }

    function isRightClick(evt) {
        var e = evt || window.event;

        if(!(evt instanceof MouseEvent)){
            return false;
        }

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
        if (! (evt instanceof MouseEvent) && ! (evt instanceof window.TouchEvent)) {
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
            _hasMoved = false,
            _startX = 0,
            _startY = 0,
            _lastClickTime = 0,
            _doubleClickDelay = 300,
            _touchListenerTarget,
            _pointerId;

        options = options || {};

        // If its not mobile, add mouse listener.  Add touch listeners so touch devices that aren't Android or iOS
        // (windows phones) still get listeners just in case they want to use them.
        if(_usePointerEvents) {
            elem.addEventListener('pointerdown', interactStartHandler);
            if(options.useHover){
                elem.addEventListener('pointerover', overHandler);
                elem.addEventListener('pointerout', outHandler);
            }
            if(options.useMove){
                elem.addEventListener('pointermove', moveHandler);
            }
        } else if(_useMouseEvents){
            elem.addEventListener('mousedown', interactStartHandler);
            if(options.useHover) {
                elem.addEventListener('mouseover', overHandler);
                elem.addEventListener('mouseout', outHandler);
            }
            if(options.useMove) {
                elem.addEventListener('mousemove', moveHandler);
            }
        }

        // Always add this, in case we don't properly identify the device as mobile
        elem.addEventListener('touchstart', interactStartHandler);

        // overHandler and outHandler not assigned in touch situations
        function overHandler(evt){
            if (_useMouseEvents || (_usePointerEvents && evt.pointerType !== 'touch')) {
                triggerEvent(events.touchEvents.OVER, evt);
            }
        }

        function moveHandler(evt){
            if (_useMouseEvents || (_usePointerEvents && evt.pointerType !== 'touch')) {
                triggerEvent(events.touchEvents.MOVE, evt);
            }
        }

        function outHandler(evt){
            // elementFromPoint to handle an issue where setPointerCapture is causing a pointerout event
            if (_useMouseEvents || (_usePointerEvents && evt.pointerType !== 'touch' &&
                !elem.contains(document.elementFromPoint(evt.x, evt.y)))) {
                triggerEvent(events.touchEvents.OUT, evt);
            }
        }

        function interactStartHandler(evt) {
            _touchListenerTarget = evt.target;
            _startX = getCoord(evt, 'X');
            _startY = getCoord(evt, 'Y');

            if(!isRightClick(evt)){
                if(_usePointerEvents){
                    if(evt.isPrimary){
                        if(options.preventScrolling){
                            _pointerId = evt.pointerId;
                            elem.setPointerCapture(_pointerId);
                        }
                        elem.addEventListener('pointermove', interactDragHandler);
                        elem.addEventListener('pointercancel', interactEndHandler);
                        elem.addEventListener('pointerup', interactEndHandler);
                    }
                } else if(_useMouseEvents){
                    document.addEventListener('mousemove', interactDragHandler);

                    // Handle clicks in OSX Firefox over Flash 'object'
                    if (_isOSXFirefox && evt.target.nodeName.toLowerCase() === 'object') {
                        elem.addEventListener('click', interactEndHandler);
                    } else {
                        document.addEventListener('mouseup', interactEndHandler);
                    }
                }

                _touchListenerTarget.addEventListener('touchmove', interactDragHandler);
                _touchListenerTarget.addEventListener('touchcancel', interactEndHandler);
                _touchListenerTarget.addEventListener('touchend', interactEndHandler);
            }
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
            if (options.preventScrolling) {
                preventDefault(evt);
            }
        }

        function interactEndHandler(evt) {
            var touchEvents = events.touchEvents;

            if(_usePointerEvents) {
                if (options.preventScrolling) {
                    elem.releasePointerCapture(_pointerId);
                }
                elem.removeEventListener('pointermove', interactDragHandler);
                elem.removeEventListener('pointercancel', interactEndHandler);
                elem.removeEventListener('pointerup', interactEndHandler);
            } else if (_useMouseEvents) {
                document.removeEventListener('mousemove', interactDragHandler);
                document.removeEventListener('mouseup', interactEndHandler);
            }

            _touchListenerTarget.removeEventListener('touchmove', interactDragHandler);
            _touchListenerTarget.removeEventListener('touchcancel', interactEndHandler);
            _touchListenerTarget.removeEventListener('touchend', interactEndHandler);

            if (_hasMoved) {
                triggerEvent(touchEvents.DRAG_END, evt);
            } else {
                // Skip if we're not directly selecting the target and if its a cancel
                if((!options.directSelect || evt.target === elem) && evt.type.indexOf('cancel') === -1) {
                    if (_usePointerEvents && evt instanceof window.PointerEvent) {
                        if (evt.pointerType === 'touch') {
                            triggerEvent(touchEvents.TAP, evt);
                        } else {
                            triggerEvent(touchEvents.CLICK, evt);
                        }
                    } else if (_useMouseEvents) {
                        triggerEvent(touchEvents.CLICK, evt);
                    } else {
                        triggerEvent(touchEvents.TAP, evt);

                        // preventDefault to not dispatch the 300ms delayed click after a tap
                        preventDefault(evt);
                    }
                }
            }

            _touchListenerTarget = null;
            _hasMoved = false;
        }

        var self = this;
        function triggerEvent(type, srcEvent) {
            var evt;
            if( options.enableDoubleTap && (type === events.touchEvents.CLICK || type === events.touchEvents.TAP)){
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

            if(_usePointerEvents) {
                if (options.preventScrolling) {
                    elem.releasePointerCapture(_pointerId);
                }
                elem.removeEventListener('pointerover', overHandler);
                elem.removeEventListener('pointerdown', interactStartHandler);
                elem.removeEventListener('pointermove', interactDragHandler);
                elem.removeEventListener('pointermove', moveHandler);
                elem.removeEventListener('pointercancel', interactEndHandler);
                elem.removeEventListener('pointerout', outHandler);
                elem.removeEventListener('pointerup', interactEndHandler);
            }

            elem.removeEventListener('click', interactEndHandler);
            elem.removeEventListener('mouseover', overHandler);
            elem.removeEventListener('mousemove', moveHandler);
            elem.removeEventListener('mouseout', outHandler);
            document.removeEventListener('mousemove', interactDragHandler);
            document.removeEventListener('mouseup', interactEndHandler);
        };

        return this;
    };

    _.extend(UI.prototype, Events);

    return UI;
});
