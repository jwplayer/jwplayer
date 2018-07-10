import { OS, Features } from 'environment/environment';
import { DRAG, DRAG_START, DRAG_END, CLICK, DOUBLE_CLICK, MOVE, OUT, TAP, DOUBLE_TAP, OVER, ENTER } from 'events/events';
import Eventable from 'utils/eventable';
import { now } from 'utils/date';

const noop = function() {};
const document = window.document;
const MouseEvent = window.MouseEvent || noop;
const TouchEvent = window.TouchEvent || noop;

const TOUCH_SUPPORT = ('ontouchstart' in window);
const USE_POINTER_EVENTS = ('PointerEvent' in window) && !OS.android;
const USE_MOUSE_EVENTS = !USE_POINTER_EVENTS && !(TOUCH_SUPPORT && OS.mobile);

const { passiveEvents } = Features;
const DEFAULT_LISTENER_OPTIONS = passiveEvents ? { passive: true } : false;

const DOUBLE_CLICK_DELAY = 300;
const LONG_PRESS_DELAY = 500;

let longPressTimeout;

// ui-test.js: Test number of event listeners added
// https://gist.github.com/robwalch/7d2165353e2621bb7b21e29863b7ba5e
// Research: listener total is 154 with 3IkpdgrX-rcY6EcsD setup
//   36 UI instances listen with 'interactStartHandler'
//   11 buttons with preventDefault
// DONE: unit tests

// TODO: Only add event listeners when on('event') requires it
// DONE: remove need for `useHover`, `useFocus`, `useMove`
// DONE: remove need for `enableDoubleTap`
// DONE: Always make 'focus' and 'blur' trigger 'focus' and 'blur' instead of 'over' and 'out'
// TODO: Optimize on('click tap') to register a single listener
// DONE: Use `directSelect` on start rather than end interaction
// TODO: Investigate alternative solutions to `preventDefault` (button.js)
// TODO: Cleanup usage of UI instances (reference and destroy to cleanup listeners)
// TODO: Add 'rightclick' / longpress support to replace code duplication in rightclick

export default class UI extends Eventable {

    constructor(element, options) {
        super();

        options = options || {};
        const passive = !options.preventScrolling;

        this.directSelect = !!options.directSelect;
        this.dragged = false;
        this.el = element;
        this.handlers = {};
        this.lastClick = 0;
        this.passive = passive;
        this.pointerId;
        this.startX = 0;
        this.startY = 0;
        this.touchTarget;
    }

    on(name, callback, context) {
        if (eventsApi(name)) {
            if (!this.handlers[name]) {
                eventRegisters[name](this);
            }
        }
        return super.on(name, callback, context);
    }

    off(name, callback, context) {
        if (eventsApi(name)) {
            removeEventListeners(this, name);
        } else if (!name) {
            const { handlers } = this;
            Object.keys(handlers).forEach(triggerName => {
                removeEventListeners(this, triggerName);
            });
        }
        return super.off(name, callback, context);
    }

    destroy() {
        this.off();
        const { el, touchTarget } = this;

        if (touchTarget) {
            // touchTarget.removeEventListener('touchmove', interactDragHandler);
            // touchTarget.removeEventListener('touchcancel', interactEndHandler);
            // touchTarget.removeEventListener('touchend', interactEndHandler);
            this.touchTarget = null;
        }

        if (USE_POINTER_EVENTS) {
            if (this.pointerId) {
                el.releasePointerCapture(this.pointerId);
            }
        }

        // document.removeEventListener('mousemove', interactDragHandler);
        // document.removeEventListener('mouseup', interactEndHandler);
    }
}

const eventSplitter = /\s+/;

function eventsApi(name) {
    return name && !(eventSplitter.test(name) || typeof name === 'object');
}

function initInteractionListeners(ui) {
    const initGroup = 'init';
    if (ui.handlers[initGroup]) {
        return;
    }
    const startGroup = 'start';
    const { el, passive } = ui;
    const listenerOptions = passiveEvents ? { passive } : false;

    const interactStartHandler = (e) => {
        if (isRightClick(e)) {
            return;
        }
        const { target, type } = e;
        if (ui.directSelect && target !== el) {
            // The 'directSelect' parameter only allows interactions on the element and not children
            return;
        }

        const { pageX, pageY } = getCoords(e);

        ui.startX = pageX;
        ui.startY = pageY;

        removeEventListeners(ui, startGroup);
        if (type === 'pointerdown' && e.isPrimary) {
            if (!passive) {
                const { pointerId } = e;
                ui.pointerId = pointerId;
                el.setPointerCapture(pointerId);
            }

            addEventListener(ui, startGroup, 'pointermove', interactDragHandler, listenerOptions);
            addEventListener(ui, startGroup, 'pointercancel', interactEndHandler);
            addEventListener(ui, startGroup, 'pointerup', interactEndHandler);
        } else if (type === 'mousedown') {
            document.addEventListener('mousemove', interactDragHandler, listenerOptions);
            document.addEventListener('mouseup', interactEndHandler);
        } else if (type === 'touchstart') {
            ui.touchTarget = target;
            target.addEventListener('touchmove', interactDragHandler, listenerOptions);
            target.addEventListener('touchcancel', interactEndHandler);
            target.addEventListener('touchend', interactEndHandler);

            clearTimeout(longPressTimeout);
            longPressTimeout = setTimeout(() => {
                const { touchTarget } = ui;
                if (touchTarget) {
                    ui.touchTarget = null;
                    touchTarget.removeEventListener('touchmove', interactDragHandler);
                    touchTarget.removeEventListener('touchcancel', interactEndHandler);
                    touchTarget.removeEventListener('touchend', interactEndHandler);
                }
            }, LONG_PRESS_DELAY);

            // Prevent scrolling the screen while dragging on mobile.
            if (!passive) {
                preventDefault(e);
            }
        }
    }

    const interactDragHandler = (e) => {
        clearTimeout(longPressTimeout);

        const movementThreshold = 6;
        if (ui.dragged) {
            triggerEvent(ui, DRAG, e);
        } else {
            const { pageX, pageY } = getCoords(e);
            const moveX = pageX - ui.startX;
            const moveY = pageY - ui.startY;
            if (moveX * moveX + moveY * moveY > movementThreshold * movementThreshold) {
                triggerEvent(ui, DRAG_START, e);
                ui.dragged = true;
                triggerEvent(ui, DRAG, e);
            }
        }

        // Prevent scrolling the screen dragging while dragging on mobile.
        if (!passive && e.type === 'touchmove') {
            preventDefault(e);
        }
    }

    const interactEndHandler = (e) => {
        clearTimeout(longPressTimeout);

        if (ui.pointerId) {
            el.releasePointerCapture(ui.pointerId);
        }
        removeEventListeners(ui, startGroup);
        document.removeEventListener('mousemove', interactDragHandler);
        document.removeEventListener('mouseup', interactEndHandler);
        const { touchTarget } = ui;
        if (touchTarget) {
            ui.touchTarget = null;
            touchTarget.removeEventListener('touchmove', interactDragHandler);
            touchTarget.removeEventListener('touchcancel', interactEndHandler);
            touchTarget.removeEventListener('touchend', interactEndHandler);
        }
        if (ui.dragged) {
            ui.dragged = false;
            triggerEvent(ui, DRAG_END, e);
        } else if (e.type.indexOf('cancel') === -1) {
            const isPointerEvent = (e.type === 'pointerup' || e.type === 'pointercancel');
            const click = e.type === 'mouseup' || isPointerEvent && e.pointerType === 'mouse';
            if (ui.enableDoubleTap) {
                if (now() - ui.lastClick < DOUBLE_CLICK_DELAY) {
                    const doubleType = (click) ? DOUBLE_CLICK : DOUBLE_TAP;
                    triggerEvent(ui, doubleType, e);
                    ui.lastClick = 0;
                } else {
                    ui.lastClick = now();
                }
            }
            if (click) {
                triggerEvent(ui, CLICK, e);
            } else {
                triggerEvent(ui, TAP, e);

                // preventDefault to not dispatch the 300ms delayed click after a tap
                if (e.type === 'touchend' && !passiveEvents) {
                    preventDefault(e);
                }
            }
        }
    }

    // If its not mobile, add mouse listener.  Add touch listeners so touch devices that aren't Android or iOS
    // (windows phones) still get listeners just in case they want to use them.
    if (USE_POINTER_EVENTS) {
        addEventListener(ui, initGroup, 'pointerdown', interactStartHandler, listenerOptions);
    } else {
        if (USE_MOUSE_EVENTS) {
            addEventListener(ui, initGroup, 'mousedown', interactStartHandler, listenerOptions);
        }
        // Always add this, in case we don't properly identify the device as mobile
        addEventListener(ui, initGroup, 'touchstart', interactStartHandler, listenerOptions);
    }
}

const eventRegisters = {
    drag(ui) {
        initInteractionListeners(ui);
    },
    dragStart(ui) {
        initInteractionListeners(ui);
    },
    dragEnd(ui) {
        initInteractionListeners(ui);
    },
    click(ui) {
        initInteractionListeners(ui);
        // const { directSelect, el } = ui;
        // addEventListener(ui, CLICK, 'click', (e) => {
        //     if (directSelect && e.target !== el) {
        //         // The 'directSelect' parameter only allows interactions on the element and not children
        //         return;
        //     }
        //     if (!USE_POINTER_EVENTS && !USE_MOUSE_EVENTS) {
        //         triggerEvent(ui, TAP, e);
        //     } else {
        //         triggerEvent(ui, CLICK, e);
        //     }
        // });
    },
    tap(ui) {
        initInteractionListeners(ui);
    },
    doubleTap(ui) {
        ui.enableDoubleTap = true;
        initInteractionListeners(ui);
    },
    doubleClick(ui) {
        initInteractionListeners(ui);
        // if (USE_POINTER_EVENTS || USE_MOUSE_EVENTS) {
        //     addEventListener(ui, DOUBLE_CLICK, 'dblclick', (e) => {
        //         e.stopPropagation();
        //         triggerEvent(ui, DOUBLE_CLICK, e);
        //     });
        // }
    },
    focus(ui) {
        const focus = 'focus';
        addEventListener(ui, focus, focus, (e) => {
            triggerSimpleEvent(ui, focus, e);
        });
    },
    blur(ui) {
        const blur = 'blur';
        addEventListener(ui, blur, blur, (e) => {
            triggerSimpleEvent(ui, blur, e);
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
            const { el } = ui;
            addEventListener(ui, OUT, 'pointerout', (e) => {
                if (e.pointerType !== 'touch' && 'x' in e) {
                    // elementFromPoint to handle an issue where setPointerCapture is causing a pointerout event
                    const overElement = document.elementFromPoint(e.x, e.y);
                    if (!el.contains(overElement)) {
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
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.stopPropagation();
                triggerSimpleEvent(ui, ENTER, e);
            }
        });
    }
};

function addEventListener(ui, triggerName, domEventName, handler, options) {
    const { el } = ui;

    let listeners = ui.handlers[triggerName];
    if (!listeners) {
        listeners = ui.handlers[triggerName] = {};
    }
    if (listeners[domEventName]) {
        throw new Error('Only one listener per event is allowed in ui.js');
    }
    listeners[domEventName] = handler;
    el.addEventListener(domEventName, handler, options || DEFAULT_LISTENER_OPTIONS);
}

function removeEventListeners(ui, triggerName) {
    const listeners = ui.handlers[triggerName];
    if (listeners) {
        Object.keys(listeners).forEach(domEventName => {
            ui.el.removeEventListener(domEventName, listeners[domEventName]);
        });
        ui.handlers[triggerName] = null;
    }
}

function triggerSimpleEvent(ui, type, sourceEvent) {
    const { el: currentTarget } = ui;
    const { target } = sourceEvent;
    ui.trigger(type, {
        type,
        sourceEvent,
        currentTarget,
        target
    });
}

function triggerEvent(ui, type, sourceEvent) {
    const { el } = ui;
    const event = normalizeUIEvent(type, sourceEvent, el);
    ui.trigger(type, event);
}

function normalizeUIEvent(type, sourceEvent, currentTarget) {
    const { target, touches, changedTouches } = sourceEvent;
    const sourceType = sourceEvent.type;
    let { pointerType } = sourceEvent;
    let source;

    if (sourceEvent instanceof MouseEvent || !(touches || changedTouches)) {
        source = sourceEvent;
        pointerType = pointerType || 'mouse';
    } else {
        source = (touches && touches.length) ? touches[0] : changedTouches[0];
        pointerType = pointerType || 'touch';
    }

    const { pageX, pageY } = source;

    return {
        type,
        pointerType,
        pageX,
        pageY,
        sourceEvent,
        currentTarget,
        target
    };
}

function getCoords(e, c) {
    return ((e.type.indexOf('touch') === 0) ? (e.originalEvent || e).changedTouches[0] : e);
}

function isRightClick(e) {
    if ('which' in e) {
        // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
        return (e.which === 3);
    } else if ('button' in e) {
        // IE and Opera
        return (e.button === 2);
    }
    return false;
}

function preventDefault(evt) {
    if (evt.preventDefault) {
        evt.preventDefault();
    }
}
