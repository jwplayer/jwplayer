import { OS, Features } from 'environment/environment';
import { DRAG, DRAG_START, DRAG_END, CLICK, DOUBLE_CLICK, ENTER, MOVE, OUT, OVER } from 'events/events';
import Events from 'utils/backbone.events';
import { now } from 'utils/date';
import { addClass, removeClass } from 'utils/dom';

const TOUCH_SUPPORT = ('ontouchstart' in window);
const USE_POINTER_EVENTS = ('PointerEvent' in window) && !OS.android;
const USE_MOUSE_EVENTS = !USE_POINTER_EVENTS && !(TOUCH_SUPPORT && OS.mobile);

const WINDOW_GROUP = 'window';
const INIT_GROUP = 'init';
const SELECT_GROUP = 'select';

const keydown = 'keydown';
const { passiveEvents } = Features;
const DEFAULT_LISTENER_OPTIONS = passiveEvents ? { passive: true } : false;

const MOVEMENT_THRESHOLD = 6;
const DOUBLE_CLICK_DELAY = 300;
const LONG_PRESS_DELAY = 500;

let longPressTimeout;
let lastInteractionListener;

export default class UI extends Events {

    constructor(element, options) {
        super();

        options = options || {};
        const passive = !options.preventScrolling;

        this.directSelect = !!options.directSelect;
        this.dragged = false;
        this.enableDoubleClick = false;
        this.el = element;
        this.handlers = {};
        this.options = {};
        this.lastClick = 0;
        this.lastStart = 0;
        this.passive = passive;
        this.pointerId = null;
        this.startX = 0;
        this.startY = 0;
        this.event = null;
        this.clicking = false;
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
            removeHandlers(this, name);
        } else if (!name) {
            const { handlers } = this;
            Object.keys(handlers).forEach(triggerName => {
                removeHandlers(this, triggerName);
            });
        }
        return super.off(name, callback, context);
    }

    destroy() {
        if (!this.el) {
            return;
        }
        this.off();
        if (USE_POINTER_EVENTS) {
            releasePointerCapture(this);
        }
        this.el = null;
    }
}

const eventSplitter = /\s+/;

function eventsApi(name) {
    return name && !(eventSplitter.test(name) || typeof name === 'object');
}

function initInteractionListeners(ui) {
    if (ui.handlers[INIT_GROUP]) {
        return;
    }
    const { el, passive } = ui;
    const listenerOptions = passiveEvents ? { passive } : false;

    const interactStartHandler = (e) => {
        removeClass(el, 'jw-tab-focus');
        if (isRightClick(e)) {
            return;
        }
        const { target, type } = e;
        if (ui.directSelect && target !== el) {
            // The 'directSelect' parameter only allows interactions on the element and not children
            return;
        }

        const { pageX, pageY } = getCoords(e);

        ui.dragged = false;
        ui.startX = pageX;
        ui.startY = pageY;

        removeHandlers(ui, WINDOW_GROUP);
        if (type === 'pointerdown' && e.isPrimary) {
            if (!passive) {
                const { pointerId } = e;
                ui.pointerId = pointerId;
                el.setPointerCapture(pointerId);
            }

            addEventListener(ui, WINDOW_GROUP, 'pointermove', interactDragHandler, listenerOptions);
            addEventListener(ui, WINDOW_GROUP, 'pointercancel', interactEndHandler);
            addEventListener(ui, WINDOW_GROUP, 'pointerup', interactEndHandler);
        } else if (type === 'mousedown') {
            addEventListener(ui, WINDOW_GROUP, 'mousemove', interactDragHandler, listenerOptions);
            addEventListener(ui, WINDOW_GROUP, 'mouseup', interactEndHandler);
        } else if (type === 'touchstart') {
            addEventListener(ui, WINDOW_GROUP, 'touchmove', interactDragHandler, listenerOptions);
            addEventListener(ui, WINDOW_GROUP, 'touchcancel', interactEndHandler);
            addEventListener(ui, WINDOW_GROUP, 'touchend', interactEndHandler);
        }
    };

    const interactDragHandler = (e) => {
        if (ui.dragged) {
            triggerEvent(ui, DRAG, e);
        } else {
            const { pageX, pageY } = getCoords(e);
            const moveX = pageX - ui.startX;
            const moveY = pageY - ui.startY;
            if (moveX * moveX + moveY * moveY > MOVEMENT_THRESHOLD * MOVEMENT_THRESHOLD) {
                triggerEvent(ui, DRAG_START, e);
                ui.dragged = true;
                triggerEvent(ui, DRAG, e);
            }
        }

        // Prevent scrolling the screen dragging while dragging on mobile.
        if (!passive && e.type === 'touchmove') {
            preventDefault(e);
        }
    };

    const interactEndHandler = (e) => {
        clearTimeout(longPressTimeout);
        if (!ui.el) {
            return;
        }
        releasePointerCapture(ui);
        removeHandlers(ui, WINDOW_GROUP);
        if (ui.dragged) {
            ui.dragged = false;
            triggerEvent(ui, DRAG_END, e);
        }
    };

    initFocusListeners(ui, INIT_GROUP);
    initStartEventsListeners(ui, INIT_GROUP, interactStartHandler, listenerOptions);
}

function initSelectListeners(ui) {
    if (ui.handlers[SELECT_GROUP]) {
        return;
    }

    const { el } = ui;

    
    const interactClickHandler = (e) => {
        if (isRightClick(e)) {
            return;
        }
        if (!!ui.directSelect && e.target !== el) {
            return;
        }
        if (now() - ui.lastStart > LONG_PRESS_DELAY && ui.clicking === true) { 
            ui.clicking = false;
            return;
        }
        checkDoubleClick(ui, e);
        triggerEvent(ui, CLICK, e);

        ui.clicking = false;
    };

    const interactPreClickHandler = (e) => {
        const { target } = e;
        if (isRightClick(e)) {
            return;
        }
        if (!!ui.directSelect && target !== el) {
            return;
        }

        if (e.isPrimary && target.tageName === 'BUTTON') {
            target.focus();
        }
        ui.lastStart = now();
        ui.clicking = true;
    };

    initFocusListeners(ui, SELECT_GROUP);
    initStartEventsListeners(ui, SELECT_GROUP, interactPreClickHandler);
    addEventListener(ui, SELECT_GROUP, 'click', interactClickHandler);
}

function initFocusListeners(ui, group) {
    if (!lastInteractionListener) {
        lastInteractionListener = new UI(document).on('interaction');
    }
    if (ui.handlers[INIT_GROUP] || ui.handlers[SELECT_GROUP]) {
        return;
    }
    const { el } = ui;
    addEventListener(ui, group, 'blur', () => {
        removeClass(el, 'jw-tab-focus');
        ui.clicking = false;
    });
    addEventListener(ui, group, 'focus', () => {
        if (lastInteractionListener.event && lastInteractionListener.event.type === keydown) {
            addClass(el, 'jw-tab-focus');
        }
    });
}

function checkDoubleClick(ui, e) {
    if (ui.enableDoubleClick) {
        if (now() - ui.lastClick < DOUBLE_CLICK_DELAY) {
            triggerEvent(ui, DOUBLE_CLICK, e);
            ui.lastClick = 0;
        } else {
            ui.lastClick = now();
        }
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
        initSelectListeners(ui);
    },
    doubleClick(ui) {
        ui.enableDoubleClick = true;
        initSelectListeners(ui);
    },
    longPress(ui) {
        const longPress = 'longPress';
        if (OS.iOS) {
            const cancel = () => {
                clearTimeout(longPressTimeout);
            };
            addEventListener(ui, longPress, 'touchstart', (e) => {
                cancel();
                longPressTimeout = setTimeout(() => {
                    triggerEvent(ui, longPress, e);
                }, LONG_PRESS_DELAY);
            });
            addEventListener(ui, longPress, 'touchmove', cancel);
            addEventListener(ui, longPress, 'touchcancel', cancel);
            addEventListener(ui, longPress, 'touchend', cancel);
        } else {
            ui.el.oncontextmenu = (e) => {
                triggerEvent(ui, longPress, e);
                return false;
            };
        }
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
                if (e.pointerType !== 'touch' && 'clientX' in e) {
                    // elementFromPoint to handle an issue where setPointerCapture is causing a pointerout event
                    const overElement = document.elementFromPoint(e.clientX, e.clientY);
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
        addEventListener(ui, ENTER, keydown, (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.stopPropagation();
                triggerSimpleEvent(ui, ENTER, e);
            }
        });
    },
    keydown(ui) {
        addEventListener(ui, keydown, keydown, (e) => {
            triggerSimpleEvent(ui, keydown, e);
        }, false);
    },
    gesture(ui) {
        const gesture = 'gesture';
        const triggerGesture = (e) => triggerEvent(ui, gesture, e);
        addEventListener(ui, gesture, 'click', triggerGesture);
        addEventListener(ui, gesture, keydown, triggerGesture);
    },
    interaction(ui) {
        const interaction = 'interaction';
        const triggerGesture = e => {
            ui.event = e;
        };
        addEventListener(ui, interaction, 'mousedown', triggerGesture, true);
        addEventListener(ui, interaction, keydown, triggerGesture, true);
    },
    tap() {
        //noop for backwards compatibilility
    },
    doubleTap() {
        //noop for backwards compatibility
    },
};

export function getElementWindow(element) {
    const document = element.ownerDocument || element;
    return (document.defaultView || document.parentWindow || window);
}

function addEventListener(ui, triggerName, domEventName, handler, options = DEFAULT_LISTENER_OPTIONS) {
    let listeners = ui.handlers[triggerName];
    let listenerOptions = ui.options[triggerName];
    if (!listeners) {
        listeners = ui.handlers[triggerName] = {};
        listenerOptions = ui.options[triggerName] = {};
    }
    if (listeners[domEventName]) {
        throw new Error(`${triggerName} ${domEventName} already registered`);
    }
    listeners[domEventName] = handler;
    listenerOptions[domEventName] = options;

    const { el } = ui;
    const element = triggerName === WINDOW_GROUP ? getElementWindow(el) : el;

    element.addEventListener(domEventName, handler, options);
}

function removeHandlers(ui, triggerName) {
    const { el, handlers, options } = ui;
    const element = triggerName === WINDOW_GROUP ? getElementWindow(el) : el;
    const listeners = handlers[triggerName];
    const listenerOptions = options[triggerName];
    if (listeners) {
        Object.keys(listeners).forEach(domEventName => {
            const useCapture = listenerOptions[domEventName];
            if (typeof useCapture === 'boolean') {
                element.removeEventListener(domEventName, listeners[domEventName], useCapture);
            } else {
                element.removeEventListener(domEventName, listeners[domEventName]);
            }
        });
        handlers[triggerName] = null;
        options[triggerName] = null;
    }
}

function releasePointerCapture(ui) {
    const { el } = ui;
    if (ui.pointerId !== null) {
        el.releasePointerCapture(ui.pointerId);
        ui.pointerId = null;
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
    let { pointerType } = sourceEvent;
    let source;

    if (touches || changedTouches) {
        source = (touches && touches.length) ? touches[0] : changedTouches[0];
        pointerType = pointerType || 'touch';
    } else {
        source = sourceEvent;
        pointerType = pointerType || 'mouse';
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

function getCoords(e) {
    return ((e.type.indexOf('touch') === 0) ? (e.originalEvent || e).changedTouches[0] : e);
}

export function isRightClick(e) {
    if (!!e.ctrlKey && e.type === 'click') {
        return true;
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

function preventDefault(evt) {
    if (evt.preventDefault) {
        evt.preventDefault();
    }
}

function initStartEventsListeners(ui, group, handler, options) {
    // If its not mobile, add mouse listener.  Add touch listeners so touch devices that aren't Android or iOS
    // (windows phones) still get listeners just in case they want to use them.
    if (USE_POINTER_EVENTS) {
        addEventListener(ui, group, 'pointerdown', handler, options);
    } else {
        if (USE_MOUSE_EVENTS) {
            addEventListener(ui, group, 'mousedown', handler, options);
        }
        // Always add this, in case we don't properly identify the device as mobile
        addEventListener(ui, group, 'touchstart', handler, options);
    }
}