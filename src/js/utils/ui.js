import { Browser, OS } from 'environment/environment';
import { DRAG, DRAG_START, DRAG_END, CLICK, DOUBLE_CLICK, MOVE, OUT, TAP, DOUBLE_TAP, OVER, ENTER } from 'events/events';
import Events from 'utils/backbone.events';
import { now } from 'utils/date';

const _supportsPointerEvents = ('PointerEvent' in window) && !OS.android;
const _supportsTouchEvents = ('ontouchstart' in window);
const _useMouseEvents = !_supportsPointerEvents && !(_supportsTouchEvents && OS.mobile);
const _isOSXFirefox = Browser.firefox && OS.mac;

function getCoord(e, c) {
    return /touch/.test(e.type) ? (e.originalEvent || e).changedTouches[0]['page' + c] : e['page' + c];
}

function isRightClick(evt) {
    const e = evt || window.event;

    if (!(evt instanceof MouseEvent)) {
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

function isEnterKey(evt) {
    const e = evt || window.event;

    if ((e instanceof KeyboardEvent) && e.keyCode === 13) {
        evt.stopPropagation();
        return true;
    }

    return false;
}

function normalizeUIEvent(type, srcEvent, target) {
    let source;

    if (srcEvent instanceof MouseEvent || (!srcEvent.touches && !srcEvent.changedTouches)) {
        source = srcEvent;
    } else if (srcEvent.touches && srcEvent.touches.length) {
        source = srcEvent.touches[0];
    } else {
        source = srcEvent.changedTouches[0];
    }

    return {
        type: type,
        sourceEvent: srcEvent,
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
    if (!(evt instanceof MouseEvent) && !(evt instanceof window.TouchEvent)) {
        return;
    }
    if (evt.preventManipulation) {
        evt.preventManipulation();
    }
    // prevent scrolling
    if (evt.preventDefault) {
        evt.preventDefault();
    }
}

const UI = function (elem, options) {
    const _elem = elem;
    let _hasMoved = false;
    let _startX = 0;
    let _startY = 0;
    let _lastClickTime = 0;
    let _doubleClickDelay = 300;
    let _touchListenerTarget;
    let _pointerId;

    options = options || {};

    // If its not mobile, add mouse listener.  Add touch listeners so touch devices that aren't Android or iOS
    // (windows phones) still get listeners just in case they want to use them.
    if (_supportsPointerEvents) {
        elem.addEventListener('pointerdown', interactStartHandler);
        if (options.useHover) {
            elem.addEventListener('pointerover', overHandler);
            elem.addEventListener('pointerout', outHandler);
        }
        if (options.useMove) {
            elem.addEventListener('pointermove', moveHandler);
        }
    } else {
        if (_useMouseEvents) {
            elem.addEventListener('mousedown', interactStartHandler);
            if (options.useHover) {
                elem.addEventListener('mouseover', overHandler);
                elem.addEventListener('mouseout', outHandler);
            }
            if (options.useMove) {
                elem.addEventListener('mousemove', moveHandler);
            }
        }

        // Always add this, in case we don't properly identify the device as mobile
        elem.addEventListener('touchstart', interactStartHandler);
    }

    elem.addEventListener('keydown', keyHandler);
    if (options.useFocus) {
        elem.addEventListener('focus', overHandler);
        elem.addEventListener('blur', outHandler);
    }

    // overHandler and outHandler not assigned in touch situations
    function overHandler(evt) {
        if (evt.pointerType !== 'touch') {
            triggerEvent(OVER, evt);
        }
    }

    function moveHandler(evt) {
        if (evt.pointerType !== 'touch') {
            triggerEvent(MOVE, evt);
        }
    }

    function outHandler(evt) {
        // elementFromPoint to handle an issue where setPointerCapture is causing a pointerout event
        if (_useMouseEvents || (_supportsPointerEvents && evt.pointerType !== 'touch' &&
            !elem.contains(document.elementFromPoint(evt.x, evt.y)))) {
            triggerEvent(OUT, evt);
        }
    }

    function keyHandler(evt) {
        if (isEnterKey(evt)) {
            triggerEvent(ENTER, evt);
        }
    }

    function setEventListener(element, eventName, callback) {
        element.removeEventListener(eventName, callback);
        element.addEventListener(eventName, callback);
    }

    function interactStartHandler(evt) {
        _touchListenerTarget = evt.target;
        _startX = getCoord(evt, 'X');
        _startY = getCoord(evt, 'Y');

        if (!isRightClick(evt)) {

            if (evt.type === 'pointerdown' && evt.isPrimary) {
                if (options.preventScrolling) {
                    _pointerId = evt.pointerId;
                    elem.setPointerCapture(_pointerId);
                }
                setEventListener(elem, 'pointermove', interactDragHandler);
                setEventListener(elem, 'pointercancel', interactEndHandler);

                // Listen for mouseup after mouse pointer down because pointerup doesn't fire on swf objects
                if (evt.pointerType === 'mouse' && _touchListenerTarget.nodeName === 'OBJECT') {
                    setEventListener(document, 'mouseup', interactEndHandler);
                } else {
                    setEventListener(elem, 'pointerup', interactEndHandler);
                }
            } else if (evt.type === 'mousedown') {
                setEventListener(document, 'mousemove', interactDragHandler);

                // Handle clicks in OSX Firefox over Flash 'object'
                if (_isOSXFirefox && evt.target.nodeName.toLowerCase() === 'object') {
                    setEventListener(elem, 'click', interactEndHandler);
                } else {
                    setEventListener(document, 'mouseup', interactEndHandler);
                }
            } else if (evt.type === 'touchstart') {
                setEventListener(_touchListenerTarget, 'touchmove', interactDragHandler);
                setEventListener(_touchListenerTarget, 'touchcancel', interactEndHandler);
                setEventListener(_touchListenerTarget, 'touchend', interactEndHandler);
            }

            // Prevent scrolling the screen dragging while dragging on mobile.
            if (options.preventScrolling) {
                preventDefault(evt);
            }
        }
    }

    function interactDragHandler(evt) {
        const movementThreshold = 6;

        if (_hasMoved) {
            triggerEvent(DRAG, evt);
        } else {
            const endX = getCoord(evt, 'X');
            const endY = getCoord(evt, 'Y');
            const moveX = endX - _startX;
            const moveY = endY - _startY;
            if (moveX * moveX + moveY * moveY > movementThreshold * movementThreshold) {
                triggerEvent(DRAG_START, evt);
                _hasMoved = true;
                triggerEvent(DRAG, evt);
            }
        }

        // Prevent scrolling the screen dragging while dragging on mobile.
        if (options.preventScrolling) {
            preventDefault(evt);
        }
    }

    function interactEndHandler(evt) {
        const isPointerEvent = (evt.type === 'pointerup' || evt.type === 'pointercancel');
        if (isPointerEvent && options.preventScrolling) {
            elem.releasePointerCapture(_pointerId);
        }
        elem.removeEventListener('pointermove', interactDragHandler);
        elem.removeEventListener('pointercancel', interactEndHandler);
        elem.removeEventListener('pointerup', interactEndHandler);
        document.removeEventListener('mousemove', interactDragHandler);
        document.removeEventListener('mouseup', interactEndHandler);
        if (_touchListenerTarget) {
            _touchListenerTarget.removeEventListener('touchmove', interactDragHandler);
            _touchListenerTarget.removeEventListener('touchcancel', interactEndHandler);
            _touchListenerTarget.removeEventListener('touchend', interactEndHandler);
        }

        if (_hasMoved) {
            triggerEvent(DRAG_END, evt);
        } else if ((!options.directSelect || evt.target === elem) && evt.type.indexOf('cancel') === -1) {
            if (evt.type === 'mouseup' || evt.type === 'click' || isPointerEvent && evt.pointerType === 'mouse') {
                triggerEvent(CLICK, evt);
            } else {
                triggerEvent(TAP, evt);
                if (evt.type === 'touchend') {
                    // preventDefault to not dispatch the 300ms delayed click after a tap
                    preventDefault(evt);
                }
            }
        }

        _touchListenerTarget = null;
        _hasMoved = false;
    }

    const self = this;
    function triggerEvent(type, srcEvent) {
        let evt;
        if (options.enableDoubleTap && (type === CLICK || type === TAP)) {
            if (now() - _lastClickTime < _doubleClickDelay) {
                const doubleType = (type === CLICK) ?
                    DOUBLE_CLICK : DOUBLE_TAP;
                evt = normalizeUIEvent(doubleType, srcEvent, _elem);
                self.trigger(doubleType, evt);
                _lastClickTime = 0;
            } else {
                _lastClickTime = now();
            }
        }
        evt = normalizeUIEvent(type, srcEvent, _elem);
        self.trigger(type, evt);
    }

    this.triggerEvent = triggerEvent;

    this.destroy = function() {
        this.off();
        elem.removeEventListener('touchstart', interactStartHandler);
        elem.removeEventListener('mousedown', interactStartHandler);
        elem.removeEventListener('keydown', keyHandler);

        if (_touchListenerTarget) {
            _touchListenerTarget.removeEventListener('touchmove', interactDragHandler);
            _touchListenerTarget.removeEventListener('touchcancel', interactEndHandler);
            _touchListenerTarget.removeEventListener('touchend', interactEndHandler);
            _touchListenerTarget = null;
        }

        if (_supportsPointerEvents) {
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

        if (options.useFocus) {
            elem.removeEventListener('focus', overHandler);
            elem.removeEventListener('blur', outHandler);
        }
    };

    return this;
};

// Expose what the source of the event is so that we can ensure it's handled correctly.
// This returns only 'touch' or 'mouse'. 'pen' will be treated as a mouse.
UI.getPointerType = function(evt) {
    if (_supportsPointerEvents && evt instanceof window.PointerEvent) {
        return (evt.pointerType === 'touch') ? 'touch' : 'mouse';
    } else if (_supportsTouchEvents && evt instanceof window.TouchEvent) {
        return 'touch';
    }

    return 'mouse';
};

Object.assign(UI.prototype, Events);

export const getPointerType = UI.getPointerType;

export default UI;
