import { OS, Features } from 'environment/environment';
import { DRAG, DRAG_START, DRAG_END, CLICK, DOUBLE_CLICK, MOVE, OUT, TAP, DOUBLE_TAP, OVER, ENTER } from 'events/events';
import Events from 'utils/backbone.events';
import { now } from 'utils/date';

const noop = function() {};
const document = window.document;
const KeyboardEvent = window.KeyboardEvent || noop;
const MouseEvent = window.MouseEvent || noop;
const PointerEvent = window.PointerEvent || noop;
const TouchEvent = window.TouchEvent || noop;

const TOUCH_SUPPORT = ('ontouchstart' in window);
const USE_POINTER_EVENTS = ('PointerEvent' in window) && !OS.android;
const USE_MOUSE_EVENTS = !USE_POINTER_EVENTS && !(TOUCH_SUPPORT && OS.mobile);

let unique = 0;

// ui-test.js: Test number of event listeners added
// https://gist.github.com/robwalch/7d2165353e2621bb7b21e29863b7ba5e
// Research: listener total is 154 with 3IkpdgrX-rcY6EcsD setup
//   36 UI instances listen with 'interactStartHandler'
//   11 buttons with preventDefault
// TODO: unit tests

// TODO: Only add event listeners when on('event') requires it
// DONE: remove need for `useHover`, `useFocus`, `useMove`
// TODO: remove need for `enableDoubleTap`
// DONE: Always make 'focus' and 'blur' trigger 'focus' and 'blur' instead of 'over' and 'out'
// TODO: Optimize on('click tap') to register a single listener
// TODO: Replace `directSelect` with useCapture (addEventListener(name, callback, true || { useCapture: true }))
// TODO: Investigate alternative solutions to `preventDefault` (button.js)
// TODO: Cleanup usage of UI instances (reference and destroy to cleanup listeners)

const UI = function (elem, options) {
    const _this = this;
    let _hasMoved = false;
    let _startX = 0;
    let _startY = 0;
    let _lastClickTime = 0;
    let _doubleClickDelay = 300;
    let _touchListenerTarget;
    let _pointerId;
    let longPressTimeout;
    let longPressDelay = 500;

    this.id = ++unique;
    this.elem = elem;
    this.handlers = {};

    // console.log(`${this.id}. (${elem.className})`, options);

    options = options || {};

    const listenerOptions = Features.passiveEvents ? { passive: !options.preventScrolling } : false;
    
    // If its not mobile, add mouse listener.  Add touch listeners so touch devices that aren't Android or iOS
    // (windows phones) still get listeners just in case they want to use them.
    if (USE_POINTER_EVENTS) {
        elem.addEventListener('pointerdown', interactStartHandler, listenerOptions);
    } else {
        if (USE_MOUSE_EVENTS) {
            elem.addEventListener('mousedown', interactStartHandler, listenerOptions);
        }

        // Always add this, in case we don't properly identify the device as mobile
        elem.addEventListener('touchstart', interactStartHandler, listenerOptions);
    }

    function setEventListener(element, eventName, callback) {
        element.removeEventListener(eventName, callback);
        element.addEventListener(eventName, callback);
    }

    function interactStartHandler(evt) {
        const target = evt.target;
        _startX = getCoord(evt, 'X');
        _startY = getCoord(evt, 'Y');

        if (!isRightClick(evt)) {

            if (evt.type === 'pointerdown' && evt.isPrimary) {
                if (options.preventScrolling) {
                    _pointerId = evt.pointerId;
                    elem.setPointerCapture(_pointerId);
                }
                setEventListener(elem, 'pointermove', interactDragHandler, listenerOptions);
                setEventListener(elem, 'pointercancel', interactEndHandler);
                setEventListener(elem, 'pointerup', interactEndHandler);
            } else if (evt.type === 'mousedown') {
                setEventListener(document, 'mousemove', interactDragHandler, listenerOptions);
                setEventListener(document, 'mouseup', interactEndHandler);
            } else if (evt.type === 'touchstart') {
                _touchListenerTarget = target;
                longPressTimeout = setTimeout(() => {
                    if (_touchListenerTarget) {
                        _touchListenerTarget.removeEventListener('touchmove', interactDragHandler);
                        _touchListenerTarget.removeEventListener('touchcancel', interactEndHandler);
                        _touchListenerTarget.removeEventListener('touchend', interactEndHandler);
                        _touchListenerTarget = null;
                    }
                }, longPressDelay);

                setEventListener(_touchListenerTarget, 'touchmove', interactDragHandler, listenerOptions);
                setEventListener(_touchListenerTarget, 'touchcancel', interactEndHandler);
                setEventListener(_touchListenerTarget, 'touchend', interactEndHandler);
            }

            // Prevent scrolling the screen while dragging on mobile.
            if (options.preventScrolling) {
                preventDefault(evt);
            }
        }
    }

    function interactDragHandler(evt) {
        clearTimeout(longPressTimeout);

        const movementThreshold = 6;
        if (_hasMoved) {
            triggerEvent(_this, DRAG, evt);
        } else {
            const endX = getCoord(evt, 'X');
            const endY = getCoord(evt, 'Y');
            const moveX = endX - _startX;
            const moveY = endY - _startY;
            if (moveX * moveX + moveY * moveY > movementThreshold * movementThreshold) {
                triggerEvent(_this, DRAG_START, evt);
                _hasMoved = true;
                triggerEvent(_this, DRAG, evt);
            }
        }

        // Prevent scrolling the screen dragging while dragging on mobile.
        if (options.preventScrolling) {
            preventDefault(evt);
        }
    }

    function interactEndHandler(evt) {
        clearTimeout(longPressTimeout);

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
            triggerEvent(_this, DRAG_END, evt);
        }
        // KA: dded 'directSelect' parameter to UI for interactions where the event should only be fired if the target is the listened element and not its children
        else if ((!options.directSelect || evt.target === elem) && evt.type.indexOf('cancel') === -1) {
            const click = evt.type === 'mouseup' || isPointerEvent && evt.pointerType === 'mouse';
            if (options.enableDoubleTap) {
                if (now() - _lastClickTime < _doubleClickDelay) {
                    const doubleType = (click) ? DOUBLE_CLICK : DOUBLE_TAP;
                    triggerEvent(_this, doubleType, evt);
                    _lastClickTime = 0;
                } else {
                    _lastClickTime = now();
                }
            }
            if (click) {
                triggerEvent(_this, CLICK, evt);
            } else {
                triggerEvent(_this, TAP, evt);
                if (evt.type === 'touchend') {
                    // preventDefault to not dispatch the 300ms delayed click after a tap
                    preventDefault(evt);
                }
            }
        }

        _touchListenerTarget = null;
        _hasMoved = false;
    }

    this.destroy = function() {
        this.off();

        elem.removeEventListener('touchstart', interactStartHandler);
        elem.removeEventListener('mousedown', interactStartHandler);

        if (_touchListenerTarget) {
            _touchListenerTarget.removeEventListener('touchmove', interactDragHandler);
            _touchListenerTarget.removeEventListener('touchcancel', interactEndHandler);
            _touchListenerTarget.removeEventListener('touchend', interactEndHandler);
            _touchListenerTarget = null;
        }

        if (USE_POINTER_EVENTS) {
            if (options.preventScrolling) {
                elem.releasePointerCapture(_pointerId);
            }
            elem.removeEventListener('pointerdown', interactStartHandler);
            elem.removeEventListener('pointermove', interactDragHandler);
            elem.removeEventListener('pointercancel', interactEndHandler);
            elem.removeEventListener('pointerup', interactEndHandler);
        }

        document.removeEventListener('mousemove', interactDragHandler);
        document.removeEventListener('mouseup', interactEndHandler);
    };

    return this;
};

const eventSplitter = /\s+/;

function eventsApi(name) {
    return name && !(eventSplitter.test(name) || typeof name === 'object');
}

Object.assign(UI.prototype, Events, {
    on(name, callback, context) {
        if (eventsApi(name)) {
            // console.log(`${this.id}. (${this.elem.className}).on`, name, callback);
            if (!this.handlers[name]) {
                eventRegisters[name](this);
            }
        }
        return Events.on.call(this, name, callback, context);
    },
    off(name, callback, context) {
        if (eventsApi(name)) {
            // console.log(`${this.id}. (${this.elem.className}).off`, name, callback);
            removeEventListeners(this, name);
        } else if (!name) {
            const { handlers } = this;
            Object.keys(handlers).forEach(triggerName => {
                removeEventListeners(this, triggerName);
            });
        }
        return Events.off.call(this, name, callback, context);
    },
    // trigger(name, event) {
    //     if (!this._events) {
    //         return this;
    //     }
    //     if (eventsApi(name)) {
    //         console.log(`${this.id}. (${this.elem.className}).trigger`, name, event);
    //     }
    //     return Events.trigger.call(this, name, event);
    // }
});

const eventRegisters = {
    click() {

    },
    tap() {

    },
    doubleClick() {

    },
    doubleTap() {

    },
    drag() {

    },
    dragStart() {

    },
    dragEnd() {

    },
    focus(ui) {
        const focus = 'focus';
        addEventListener(ui, focus, focus, (e) => {
            triggerEvent(ui, focus, e);
        });
    },
    blur(ui) {
        const blur = 'blur';
        addEventListener(ui, blur, blur, (e) => {
            triggerEvent(ui, blur, e);
        });
    },
    over(ui) {
        if (USE_POINTER_EVENTS || USE_MOUSE_EVENTS) {
            addEventListener(ui, OVER, USE_POINTER_EVENTS ? 'pointerover' : 'mouseover', (e) => {
                if (e.pointerType !== 'touch') {
                    triggerEvent(ui, OVER, e);
                }
            });
        }
    },
    out(ui) {
        if (USE_POINTER_EVENTS) {
            addEventListener(ui, OUT, 'pointerout', (e) => {
                if (e.pointerType !== 'touch' && 'x' in e) {
                    // elementFromPoint to handle an issue where setPointerCapture is causing a pointerout event
                    const overElement = document.elementFromPoint(e.x, e.y);
                    if (!ui.elem.contains(overElement)) {
                        triggerEvent(ui, OUT, e);
                    }
                }
            });
        } else if (USE_MOUSE_EVENTS) {
            addEventListener(ui, OUT, 'mouseout', (e) => {
                triggerEvent(ui, OUT, e);
            });
        }
    },
    move(ui) {
        if (USE_POINTER_EVENTS || USE_MOUSE_EVENTS) {
            addEventListener(ui, MOVE, USE_POINTER_EVENTS ? 'pointermove' : 'mousemove', (e) => {
                if (e.pointerType !== 'touch') {
                    triggerEvent(ui, MOVE, e);
                }
            });
        }
    },
    enter(ui) {
        addEventListener(ui, ENTER, 'keydown', (e) => {
            if (isEnterKey(e)) {
                triggerEvent(ui, ENTER, e);
            }
        });
    }
};

function addEventListener(ui, triggerName, domEventName, handler, options) {
    const { elem } = ui;

    let listeners = ui.handlers[triggerName];
    if (!listeners) {
        listeners = ui.handlers[triggerName] = {};
    }
    if (listeners[domEventName]) {
        throw new Error('Only one listener per event is allowed in ui.js');
    }
    listeners[domEventName] = handler;
    elem.addEventListener(domEventName, handler, options || false);
}

function removeEventListeners(ui, triggerName) {
    const listeners = ui.handlers[triggerName];
    if (listeners) {
        Object.keys(listeners).forEach(domEventName => {
            ui.elem.removeEventListener(domEventName, listeners[domEventName]);
        });
    }
}

function triggerEvent(ui, type, srcEvent) {
    const { elem } = ui;
    const event = normalizeUIEvent(type, srcEvent, elem);
    ui.trigger(type, event);
}


export default UI;

// Expose what the source of the event is so that we can ensure it's handled correctly.
// This returns only 'touch' or 'mouse'. 'pen' will be treated as a mouse.
export function getPointerType(evt) {
    if ((TOUCH_SUPPORT && evt instanceof TouchEvent) ||
        (USE_POINTER_EVENTS && evt instanceof PointerEvent && evt.pointerType === 'touch')) {
        return 'touch';
    }

    return 'mouse';
}

function getCoord(e, c) {
    return /^touch/.test(e.type) ? (e.originalEvent || e).changedTouches[0]['page' + c] : e['page' + c];
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
    if (!(evt instanceof MouseEvent) && !(evt instanceof TouchEvent)) {
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
