import UI from 'utils/ui';
import { Browser, OS } from 'environment/environment';
import sinon from 'sinon';

const TouchEvent = window.TouchEvent;
const Touch = window.Touch;

describe('UI', function() {

    const TOUCH_SUPPORT = ('ontouchstart' in window);
    const USE_POINTER_EVENTS = ('PointerEvent' in window) && !OS.android;
    const USE_MOUSE_EVENTS = !USE_POINTER_EVENTS && !(TOUCH_SUPPORT && OS.mobile);

    let sandbox;
    let button;

    // Polyfill Event constructors in IE to avoid TypeError "Object doesn't support this action".
    let FocusEvent = window.FocusEvent;
    let KeyboardEvent = window.KeyboardEvent;
    let PointerEvent = window.PointerEvent;
    if (Browser.ie && typeof window.CustomEvent !== 'function') {
        FocusEvent = KeyboardEvent = PointerEvent = function(inType, params) {
            params = params || {};
            const e = document.createEvent('CustomEvent');
            e.initCustomEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable), params.detail);
            Object.assign(e, params);
            return e;
        };
        FocusEvent.prototype = window.UIEvent.prototype;
        KeyboardEvent.prototype = window.UIEvent.prototype;
        PointerEvent.prototype = window.MouseEvent.prototype;
    }

    beforeEach(function() {
        sandbox = sinon.sandbox.create();

        // add fixture
        const fixture = document.createElement('div');
        fixture.id = 'test-container';
        button = document.createElement('div');
        button.id = 'button';
        fixture.appendChild(button);
        document.body.appendChild(fixture);
    });

    afterEach(function() {
        sandbox.restore();

        // remove fixture
        const fixture = document.querySelector('#test-container');
        document.body.removeChild(fixture);
    });

    function spyOnDomEventListenerMethods(elements) {
        elements.forEach(element => {
            element.addEventListener.restore && element.addEventListener.restore();
            element.removeEventListener.restore && element.removeEventListener.restore();
            sandbox.spy(element, 'addEventListener');
            sandbox.spy(element, 'removeEventListener');
        });
    }

    function xyCoords(x, y, obj) {
        return Object.assign(obj || {}, {
            clientX: x,
            clientY: y,
            pageX: x,
            pageY: y,
            screenX: x,
            screenY: y,
            x,
            y
        });
    }

    it('is a class', function() {
        expect(UI).to.be.a('function');
        expect(UI.constructor).to.be.a('function');
    });

    it('extends events', function() {
        const ui = new UI(button);
        expect(ui).to.have.property('on').which.is.a('function');
        expect(ui).to.have.property('once').which.is.a('function');
        expect(ui).to.have.property('off').which.is.a('function');
        // Why do we expose trigger?
        expect(ui).to.have.property('trigger').which.is.a('function');
        ui.destroy();
    });

    it('implements a destroy method', function() {
        const ui = new UI(button);
        expect(ui).to.have.property('destroy').which.is.a('function');
        ui.destroy();
    });

    it('triggers click events with pointer and mouse input', function() {
        if (!USE_POINTER_EVENTS && !USE_MOUSE_EVENTS) {
            return;
        }
        const clickSpy = sandbox.spy();
        const ui = new UI(button).on('click tap', clickSpy);
        let startResult;
        let sourceEvent;
        if (USE_POINTER_EVENTS) {
            const pointerMouseOptions = xyCoords(0, 0, {
                isPrimary: true,
                pointerType: 'mouse',
                view: window,
                bubbles: true,
                cancelable: true
            });
            startResult = button.dispatchEvent(new PointerEvent('pointerdown', pointerMouseOptions));
            sourceEvent = new PointerEvent('pointerup', pointerMouseOptions);
        } else {
            const mouseOptions = xyCoords(0, 0, {
                view: window,
                bubbles: true,
                cancelable: true
            });
            startResult = button.dispatchEvent(new MouseEvent('mousedown', mouseOptions));
            sourceEvent = new MouseEvent('mouseup', mouseOptions);
        }
        button.dispatchEvent(sourceEvent);

        expect(startResult, 'preventDefault not called').to.equal(true);
        expect(clickSpy).to.have.callCount(1);
        expect(clickSpy).calledWith({
            type: 'click',
            pointerType: 'mouse',
            pageX: 0,
            pageY: 0,
            sourceEvent,
            target: button,
            currentTarget: button
        });

        ui.destroy();
    });

    it('triggers tap events with pointer and touch input', function() {
        const tapSpy = sandbox.spy();
        const ui = new UI(button).on('click tap', tapSpy);
        let startResult;
        let sourceEvent;
        if (USE_POINTER_EVENTS) {
            const pointerTouchOptions = xyCoords(0, 0, {
                isPrimary: true,
                pointerType: 'touch',
                view: window,
                bubbles: true,
                cancelable: true
            });
            startResult = button.dispatchEvent(new PointerEvent('pointerdown', pointerTouchOptions));
            sourceEvent = new PointerEvent('pointerup', pointerTouchOptions);
        } else if (TOUCH_SUPPORT) {
            const touch = new Touch({
                identifier: 1,
                target: button
            });
            const touchOptions = {
                changedTouches: [ touch ],
                view: window,
                bubbles: true,
                cancelable: true
            };
            startResult = button.dispatchEvent(new TouchEvent('touchstart', touchOptions));
            sourceEvent = new TouchEvent('touchend', touchOptions);
        } else {
            // Touch not supported in this browser
            ui.destroy();
            return;
        }
        button.dispatchEvent(sourceEvent);

        expect(startResult, 'preventDefault not called').to.equal(true);
        expect(tapSpy).to.have.callCount(1);
        expect(tapSpy).calledWith({
            type: 'tap',
            pointerType: 'touch',
            pageX: 0,
            pageY: 0,
            sourceEvent,
            target: button,
            currentTarget: button
        });
        ui.destroy();
    });

    it('triggers doubleClick events with pointer and mouse input', function() {
        if (!USE_POINTER_EVENTS && !USE_MOUSE_EVENTS) {
            return;
        }
        const doubleClickSpy = sandbox.spy();
        const ui = new UI(button, {
            enableDoubleTap: true
        }).on('doubleClick doubleTap', doubleClickSpy);
        let startResult;
        let sourceEvent;
        if (USE_POINTER_EVENTS) {
            const pointerMouseOptions = xyCoords(0, 0, {
                isPrimary: true,
                pointerType: 'mouse',
                view: window,
                bubbles: true,
                cancelable: true
            });
            startResult = button.dispatchEvent(new PointerEvent('pointerdown', pointerMouseOptions));
            button.dispatchEvent(new PointerEvent('pointerup', pointerMouseOptions));
            button.dispatchEvent(new PointerEvent('pointerdown', pointerMouseOptions));
            sourceEvent = new PointerEvent('pointerup', pointerMouseOptions);
            button.dispatchEvent(sourceEvent);
        } else {
            const mouseOptions = xyCoords(0, 0, {
                view: window,
                bubbles: true,
                cancelable: true
            });
            startResult = button.dispatchEvent(new MouseEvent('mousedown', mouseOptions));
            button.dispatchEvent(new MouseEvent('mouseup', mouseOptions));
            button.dispatchEvent(new MouseEvent('mousedown', mouseOptions));
            sourceEvent = new MouseEvent('mouseup', mouseOptions);
            button.dispatchEvent(sourceEvent);
        }

        expect(startResult, 'preventDefault not called').to.equal(true);
        expect(doubleClickSpy).to.have.callCount(1);
        expect(doubleClickSpy).calledWith({
            type: 'doubleClick',
            pointerType: 'mouse',
            pageX: 0,
            pageY: 0,
            sourceEvent,
            target: button,
            currentTarget: button
        });

        ui.destroy();
    });

    it('triggers doubleTap events with pointer and touch input', function() {
        const doubleTapSpy = sandbox.spy();
        const ui = new UI(button, {
            enableDoubleTap: true
        }).on('doubleClick doubleTap', doubleTapSpy);
        let startResult;
        let sourceEvent;
        if (USE_POINTER_EVENTS) {
            const pointerTouchOptions = xyCoords(0, 0, {
                isPrimary: true,
                pointerType: 'touch',
                view: window,
                bubbles: true,
                cancelable: true
            });
            startResult = button.dispatchEvent(new PointerEvent('pointerdown', pointerTouchOptions));
            button.dispatchEvent(new PointerEvent('pointerup', pointerTouchOptions));
            button.dispatchEvent(new PointerEvent('pointerdown', pointerTouchOptions));
            sourceEvent = new PointerEvent('pointerup', pointerTouchOptions);
            button.dispatchEvent(sourceEvent);
        } else if (TOUCH_SUPPORT) {
            const touch = new Touch({
                identifier: 1,
                target: button
            });
            const touchOptions = {
                changedTouches: [ touch ],
                view: window,
                bubbles: true,
                cancelable: true
            };
            startResult = button.dispatchEvent(new TouchEvent('touchstart', touchOptions));
            button.dispatchEvent(new TouchEvent('touchend', touchOptions));
            button.dispatchEvent(new TouchEvent('touchstart', touchOptions));
            sourceEvent = new TouchEvent('touchend', touchOptions);
            button.dispatchEvent(sourceEvent);
        } else {
            // Touch not supported in this browser
            ui.destroy();
            return;
        }
        expect(startResult, 'preventDefault not called').to.equal(true);
        expect(doubleTapSpy).to.have.callCount(1);
        expect(doubleTapSpy).calledWith({
            type: 'doubleTap',
            pointerType: 'touch',
            pageX: 0,
            pageY: 0,
            sourceEvent,
            target: button,
            currentTarget: button
        });
        ui.destroy();
    });

    it('triggers dragStart, drag and dragEnd events with pointer, mouse and touch input', function() {
        const dragStartSpy = sandbox.spy();
        const dragSpy = sandbox.spy();
        const dragEndSpy = sandbox.spy();
        const ui = new UI(button).on('dragStart', dragStartSpy).on('drag', dragSpy).on('dragEnd', dragEndSpy);
        let startResult;
        let downSourceEvent;
        let moveSourceEvent;
        let upSourceEvent;
        if (USE_POINTER_EVENTS) {
            const pointerOptions = xyCoords(0, 0, {
                isPrimary: true,
                pointerType: 'mouse',
                view: window,
                bubbles: true,
                cancelable: true
            });
            downSourceEvent = new PointerEvent('pointerdown', pointerOptions);
            moveSourceEvent = new PointerEvent('pointermove', xyCoords(5, 5, pointerOptions));
            upSourceEvent = new PointerEvent('pointerup', pointerOptions);
            // TODO: cover 'pointercancel'
        } else if (TOUCH_SUPPORT) {
            const touch = new Touch(xyCoords(0, 0, {
                identifier: 1,
                target: button
            }));
            const touchMoved = new Touch(xyCoords(5, 5, {
                identifier: 1,
                target: button
            }));
            const touchOptions = {
                changedTouches: [ touch ],
                view: window,
                bubbles: true,
                cancelable: true
            };
            const touchMovedOptions = Object.assign({}, touchOptions, {
                changedTouches: [ touchMoved ]
            });
            downSourceEvent = new TouchEvent('touchstart', touchOptions);
            moveSourceEvent = new TouchEvent('touchmove', touchMovedOptions);
            upSourceEvent = new TouchEvent('touchend', touchMovedOptions);
        } else {
            const mouseOptions = xyCoords(0, 0, {
                view: window,
                bubbles: true,
                cancelable: true
            });
            downSourceEvent = new MouseEvent('mousedown', mouseOptions);
            moveSourceEvent = new MouseEvent('mousemove', xyCoords(5, 5, mouseOptions));
            upSourceEvent = new MouseEvent('mouseup', mouseOptions);
        }
        startResult = button.dispatchEvent(downSourceEvent);
        button.dispatchEvent(moveSourceEvent);
        button.dispatchEvent(upSourceEvent);

        expect(startResult, 'preventDefault not called').to.equal(true);
        expect(dragStartSpy, 'dragStart listener').to.have.callCount(1);
        const pointerType = (USE_POINTER_EVENTS || !TOUCH_SUPPORT) ? 'mouse': 'touch';
        expect(dragStartSpy).calledWith({
            type: 'dragStart',
            pointerType,
            pageX: 5,
            pageY: 5,
            sourceEvent: moveSourceEvent,
            target: button,
            currentTarget: button
        });
        expect(dragSpy, 'drag listener').to.have.callCount(1);
        expect(dragSpy).calledWith({
            type: 'drag',
            pointerType,
            pageX: 5,
            pageY: 5,
            sourceEvent: moveSourceEvent,
            target: button,
            currentTarget: button
        });
        expect(dragEndSpy, 'dragEnd listener').to.have.callCount(1);
        expect(dragEndSpy).calledWith({
            type: 'dragEnd',
            pointerType,
            pageX: 5,
            pageY: 5,
            sourceEvent: upSourceEvent,
            target: button,
            currentTarget: button
        });

        ui.destroy();
    });

    it('triggers over, out and move events with pointer and mouse input', function() {
        if (!USE_POINTER_EVENTS && !USE_MOUSE_EVENTS) {
            return;
        }
        const overSpy = sandbox.spy();
        const outSpy = sandbox.spy();
        const moveSpy = sandbox.spy();
        const ui = new UI(button).on('over', overSpy).on('out', outSpy).on('move', moveSpy);
        let overSourceEvent;
        let outSourceEvent;
        let moveSourceEvent;
        if (USE_POINTER_EVENTS) {
            const pointerOptions = xyCoords(0, 0, {
                isPrimary: true,
                pointerType: 'mouse',
                view: window,
                bubbles: true,
                cancelable: true
            });
            overSourceEvent = new PointerEvent('pointerover', pointerOptions);
            outSourceEvent = new PointerEvent('pointerout', pointerOptions);
            moveSourceEvent = new PointerEvent('pointermove', pointerOptions);
        } else {
            const mouseOptions = xyCoords(0, 0, {
                view: window,
                bubbles: true,
                cancelable: true
            });
            overSourceEvent = new MouseEvent('mouseover', mouseOptions);
            outSourceEvent = new MouseEvent('mouseout', mouseOptions);
            moveSourceEvent = new MouseEvent('mousemove', mouseOptions);
        }
        const startResult = button.dispatchEvent(overSourceEvent);
        button.dispatchEvent(outSourceEvent);
        button.dispatchEvent(moveSourceEvent);

        expect(startResult, 'preventDefault not called').to.equal(true);
        expect(overSpy, 'over listener').to.have.callCount(1);
        expect(overSpy).calledWith({
            type: 'over',
            pointerType: 'mouse',
            pageX: 0,
            pageY: 0,
            sourceEvent: overSourceEvent,
            target: button,
            currentTarget: button
        });
        expect(outSpy, 'out listener').to.have.callCount(1);
        expect(outSpy).calledWith({
            type: 'out',
            pointerType: 'mouse',
            pageX: 0,
            pageY: 0,
            sourceEvent: outSourceEvent,
            target: button,
            currentTarget: button
        });
        expect(moveSpy, 'move listener').to.have.callCount(1);
        expect(moveSpy).calledWith({
            type: 'move',
            pointerType: 'mouse',
            pageX: 0,
            pageY: 0,
            sourceEvent: moveSourceEvent,
            target: button,
            currentTarget: button
        });

        ui.destroy();
    });

    it('triggers focus and blur events with focus and blur input', function() {
        const overSpy = sandbox.spy();
        const outSpy = sandbox.spy();
        const ui = new UI(button).on('focus', overSpy).on('blur', outSpy);
        const eventOptions = xyCoords(0, 0, {
            view: window,
            bubbles: true,
            cancelable: true
        });
        const overSourceEvent = new FocusEvent('focus', eventOptions);
        const outSourceEvent = new FocusEvent('blur', eventOptions);
        const startResult = button.dispatchEvent(overSourceEvent);
        button.dispatchEvent(outSourceEvent);

        expect(startResult, 'preventDefault not called').to.equal(true);
        expect(overSpy, 'over listener').to.have.callCount(1);
        expect(overSpy).calledWithMatch({
            type: 'focus',
            sourceEvent: overSourceEvent,
            target: button,
            currentTarget: button
        });
        expect(outSpy, 'out listener').to.have.callCount(1);
        expect(outSpy).calledWithMatch({
            type: 'blur',
            sourceEvent: outSourceEvent,
            target: button,
            currentTarget: button
        });

        ui.destroy();
    });

    it('does not trigger over, out and move events with pointer-touch input', function() {
        if (!USE_POINTER_EVENTS) {
            return;
        }
        const overSpy = sandbox.spy();
        const outSpy = sandbox.spy();
        const moveSpy = sandbox.spy();
        const ui = new UI(button).on('over', overSpy).on('out', outSpy);
        const pointerOptions = {
            isPrimary: true,
            pointerType: 'touch',
            view: window,
            bubbles: true,
            cancelable: true
        };
        const result = button.dispatchEvent(new PointerEvent('pointerover', pointerOptions));
        button.dispatchEvent(new PointerEvent('pointerout', pointerOptions));
        button.dispatchEvent(new PointerEvent('pointermove', pointerOptions));

        expect(result, 'preventDefault not called').to.equal(true);
        expect(overSpy).to.have.callCount(0);
        expect(outSpy).to.have.callCount(0);
        expect(moveSpy).to.have.callCount(0);

        ui.destroy();
    });

    it('triggers enter events with keyboard input', function() {
        if (OS.android) {
            // 'keydown' listeners are not invoked on android
            return;
        }
        const enterSpy = sandbox.spy();
        const ui = new UI(button).on('enter', enterSpy);
        const sourceEvent = new KeyboardEvent('keydown', {
            keyCode: 13
        });
        sandbox.spy(sourceEvent, 'stopPropagation');
        const result = button.dispatchEvent(sourceEvent);
        expect(result, 'preventDefault not called').to.equal(true);
        expect(enterSpy).to.have.callCount(1);
        expect(enterSpy).calledWithMatch({
            type: 'enter',
            sourceEvent,
            target: button,
            currentTarget: button
        });
        expect(sourceEvent.stopPropagation).to.have.callCount(1);

        ui.destroy();
    });

    it('preventScrolling uses setPointerCapture and preventDefault', function() {
        const ui = new UI(button, {
            preventScrolling: true
        });
        let result;
        let event;
        if (USE_POINTER_EVENTS) {
            event = new PointerEvent('pointerdown', {
                isPrimary: true,
                pointerType: 'mouse',
                pointerId: 1,
                view: window,
                bubbles: true,
                cancelable: true
            });
            sandbox.stub(button, 'setPointerCapture').callsFake(sinon.spy());
            sandbox.stub(button, 'releasePointerCapture').callsFake(sinon.spy());
            sandbox.spy(event, 'preventDefault');
            result = button.dispatchEvent(event);
            expect(button.setPointerCapture).to.have.callCount(1);
        } else if (USE_MOUSE_EVENTS) {
            event = new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            sandbox.spy(event, 'preventDefault');
            result = button.dispatchEvent(event);
        } else {
            const touch = new Touch({
                identifier: 1,
                target: button
            });
            event = new TouchEvent('touchstart', {
                changedTouches: [ touch ],
                view: window,
                bubbles: true,
                cancelable: true
            });
            sandbox.spy(event, 'preventDefault');
            result = button.dispatchEvent(event);
        }
        if (!Browser.ie && !OS.android) {
            expect(result, 'preventDefault called').to.equal(false);
            expect(event.preventDefault).to.have.callCount(1);
        }

        ui.destroy();
    });

    it('constructor does not add event listeners to window, document or body ', function() {
        spyOnDomEventListenerMethods([
            window,
            document,
            document.body,
            button
        ]);

        const ui = new UI(button).on('enter over out focus blur move', () => {});
        expect(window.addEventListener, 'window').to.have.callCount(0);
        expect(window.removeEventListener, 'window').to.have.callCount(0);
        expect(document.addEventListener, 'document').to.have.callCount(0);
        expect(document.removeEventListener, 'document').to.have.callCount(0);
        expect(document.body.addEventListener, 'body').to.have.callCount(0);
        expect(document.body.removeEventListener, 'body').to.have.callCount(0);
        expect(button.removeEventListener, 'button').to.have.callCount(0);
        ui.destroy();
    });

    it('adds event listeners based on listeners', function() {
        let ui;

        spyOnDomEventListenerMethods([ button ]);
        ui = new UI(button);
        if (USE_POINTER_EVENTS || !USE_MOUSE_EVENTS) {
            expect(button.addEventListener, 'button without options').to.have.callCount(1);
        } else {
            expect(button.addEventListener, 'button without options').to.have.callCount(2);
        }
        ui.destroy();

        spyOnDomEventListenerMethods([ button ]);
        ui = new UI(button).on('enter over out focus blur move', () => {});
        if (USE_POINTER_EVENTS) {
            expect(button.addEventListener, 'button with useFocus, useHover, useMove').to.have.callCount(7);
        } else if (!USE_MOUSE_EVENTS) {
            expect(button.addEventListener, 'button with useFocus, useHover, useMove').to.have.callCount(4);
        } else {
            expect(button.addEventListener, 'button with useFocus, useHover, useMove').to.have.callCount(8);
        }
        ui.destroy();
    });

    it('remove event listeners with off()', function() {
        spyOnDomEventListenerMethods([ button ]);
        const ui = new UI(button)
            .on('enter over out focus blur move', () => {})
            .off();
        if (USE_POINTER_EVENTS) {
            expect(button.removeEventListener, 'button with useFocus, useHover, useMove').to.have.callCount(6);
        } else if (!USE_MOUSE_EVENTS) {
            expect(button.removeEventListener, 'button with useFocus, useHover, useMove').to.have.callCount(3);
        } else {
            expect(button.removeEventListener, 'button with useFocus, useHover, useMove').to.have.callCount(6);
        }
        ui.destroy();
    });

    it('removes all event listeners on destroy', function() {
        spyOnDomEventListenerMethods([ button ]);

        const ui = new UI(button).on('enter over out focus blur move', () => {});
        ui.destroy();
        if (USE_POINTER_EVENTS) {
            expect(button.removeEventListener, 'button').to.have.callCount(12);
        } else if (!USE_MOUSE_EVENTS) {
            expect(button.removeEventListener, 'button').to.have.callCount(5);
        } else {
            expect(button.removeEventListener, 'button').to.have.callCount(8);
        }
    });

});
