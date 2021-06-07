import UI from 'utils/ui';
import { Browser, OS } from 'environment/environment';
import sinon from 'sinon';

const TouchEvent = window.TouchEvent;
const Touch = window.Touch;

describe('UI', function() {

    const TOUCH_SUPPORT = ('ontouchstart' in window);
    const USE_POINTER_EVENTS = ('PointerEvent' in window) && !OS.android;
    const USE_MOUSE_EVENTS = !USE_POINTER_EVENTS && !(TOUCH_SUPPORT && OS.mobile);
    const CREATE_TOUCH_THROWS = (function() {
        try {
            const touch = new Touch({
                identifier: 1,
                target: document.createElement('div')
            });
            const touchOptions = xyCoords(0, 0, {
                changedTouches: [ touch ],
                view: window,
                bubbles: true,
                cancelable: true
            });
            return !createTouchEvent('touchstart', touchOptions);
        } catch (error) {
            return true;
        }
    }());

    let sandbox;
    let div;

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
        sandbox = sinon.createSandbox();

        // add fixture
        const fixture = document.createElement('div');
        fixture.id = 'test-container';
        div = document.createElement('div');
        div.id = 'button';
        fixture.appendChild(div);
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

    function createTouch(touchOptions) {
        const params = touchOptions || xyCoords(0, 0, {
            identifier: 1,
            view: window,
            target: button
        });
        if (CREATE_TOUCH_THROWS) {
            return document.createTouch(window, button, 1,
                params.pageX || 0, params.pageY || 0, params.screenX || 0, params.screenY || 0);
        }
        return new Touch(params);
    }
    function createTouchEvent(type, touchOptions) {
        const params = touchOptions || xyCoords(0, 0, {
            changedTouches: [ createTouch(touchOptions) ],
            view: window,
            bubbles: true,
            cancelable: true
        });
        if (CREATE_TOUCH_THROWS) {
            const e = document.createEvent('TouchEvent');
            e.initTouchEvent(type, Boolean(params.bubbles), Boolean(params.cancelable), params.view, params.detail,
                params.screenX || 0, params.screenY || 0, params.clientX || 0, params.clientY || 0,
                false, false, false, false,
                document.createTouchList.apply(document, params.changedTouches),
                document.createTouchList.apply(document, params.changedTouches),
                document.createTouchList.apply(document, params.changedTouches));
            return e;
        }
        return new TouchEvent(type, params);
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
        const ui = new UI(div);
        expect(ui).to.have.property('on').which.is.a('function');
        expect(ui).to.have.property('once').which.is.a('function');
        expect(ui).to.have.property('off').which.is.a('function');
        // Why do we expose trigger?
        expect(ui).to.have.property('trigger').which.is.a('function');
        ui.destroy();
    });

    it('implements a destroy method', function() {
        const ui = new UI(div);
        expect(ui).to.have.property('destroy').which.is.a('function');
        ui.destroy();
    });

    it('triggers click events with input', function() {
        const clickSpy = sandbox.spy();
        const ui = new UI(div).on('click', clickSpy);
        div.click();
        expect(clickSpy).to.have.callCount(1);
        expect(!!clickSpy.args[0].defaultPrevented).to.equal(false);
        ui.destroy();
    });

    it('triggers doubleClick events with input', function() {
        const doubleClickSpy = sandbox.spy();
        const ui = new UI(div, {
            enableDoubleClick: true
        }).on('doubleClick', doubleClickSpy);
        div.click();
        div.click();
        const defaultPrevented = !!doubleClickSpy.args[0].defaultPrevented;
        expect(defaultPrevented, 'preventDefault not called').to.equal(false);
        expect(doubleClickSpy).to.have.callCount(1);

        ui.destroy();
    });

    it('triggers dragStart, drag and dragEnd events with pointer, mouse and touch input', function() {
        const dragStartSpy = sandbox.spy();
        const dragSpy = sandbox.spy();
        const dragEndSpy = sandbox.spy();
        const ui = new UI(div).on('dragStart', dragStartSpy).on('drag', dragSpy).on('dragEnd', dragEndSpy);
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
            const touch = createTouch(xyCoords(0, 0, {
                identifier: 1,
                target: button
            }));
            const touchMoved = createTouch(xyCoords(5, 5, {
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
            downSourceEvent = createTouchEvent('touchstart', touchOptions);
            moveSourceEvent = createTouchEvent('touchmove', touchMovedOptions);
            upSourceEvent = createTouchEvent('touchend', touchMovedOptions);
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
        startResult = div.dispatchEvent(downSourceEvent);
        div.dispatchEvent(moveSourceEvent);
        div.dispatchEvent(upSourceEvent);

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
        const ui = new UI(div).on('over', overSpy).on('out', outSpy).on('move', moveSpy);
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
        const startResult = div.dispatchEvent(overSourceEvent);
        div.dispatchEvent(outSourceEvent);
        div.dispatchEvent(moveSourceEvent);

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
        const ui = new UI(div).on('focus', overSpy).on('blur', outSpy);
        const eventOptions = xyCoords(0, 0, {
            view: window,
            bubbles: true,
            cancelable: true
        });
        const overSourceEvent = new FocusEvent('focus', eventOptions);
        const outSourceEvent = new FocusEvent('blur', eventOptions);
        const startResult = div.dispatchEvent(overSourceEvent);
        div.dispatchEvent(outSourceEvent);

        expect(startResult, 'preventDefault not called').to.equal(true);
        expect(overSpy, 'over listener').to.have.callCount(1);
        expect(overSpy).calledWith({
            type: 'focus',
            sourceEvent: overSourceEvent,
            target: button,
            currentTarget: button
        });
        expect(outSpy, 'out listener').to.have.callCount(1);
        expect(outSpy).calledWith({
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
        const ui = new UI(div).on('over', overSpy).on('out', outSpy);
        const pointerOptions = {
            isPrimary: true,
            pointerType: 'touch',
            view: window,
            bubbles: true,
            cancelable: true
        };
        const result = div.dispatchEvent(new PointerEvent('pointerover', pointerOptions));
        div.dispatchEvent(new PointerEvent('pointerout', pointerOptions));
        div.dispatchEvent(new PointerEvent('pointermove', pointerOptions));

        expect(result, 'preventDefault not called').to.equal(true);
        expect(overSpy).to.have.callCount(0);
        expect(outSpy).to.have.callCount(0);
        expect(moveSpy).to.have.callCount(0);

        ui.destroy();
    });

    it('preventScrolling uses setPointerCapture and preventDefault', function() {
        const ui = new UI(div, {
            preventScrolling: true
        }).on('drag');
        let result;
        let event;
        if (USE_POINTER_EVENTS) {
            const pointerCoordsOptions = {
                isPrimary: true,
                pointerType: 'mouse',
                pointerId: 1234,
                view: window,
                bubbles: true,
                cancelable: true
            };
            const pointerMouseOptions = xyCoords(0, 0, pointerCoordsOptions);

            event = new PointerEvent('pointerdown', pointerMouseOptions);
            sandbox.stub(div, 'setPointerCapture').callsFake(sinon.spy());
            sandbox.stub(div, 'releasePointerCapture').callsFake(sinon.spy());
            sandbox.spy(event, 'preventDefault');
            result = div.dispatchEvent(event);
            div.dispatchEvent(new PointerEvent('pointermove', xyCoords(5, 5, pointerCoordsOptions)));
            div.dispatchEvent(new PointerEvent('pointerup', pointerMouseOptions));
            expect(div.setPointerCapture).to.have.callCount(1);
            expect(div.releasePointerCapture).to.have.callCount(1);
        } else if (USE_MOUSE_EVENTS) {
            event = new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            sandbox.spy(event, 'preventDefault');
            result = div.dispatchEvent(event);
        } else {
            const touch = createTouch({
                identifier: 1,
                target: button
            });
            event = createTouchEvent('touchstart', {
                changedTouches: [ touch ],
                view: window,
                bubbles: true,
                cancelable: true
            });
            sandbox.spy(event, 'preventDefault');
            result = div.dispatchEvent(event);
        }
        if (USE_POINTER_EVENTS || USE_MOUSE_EVENTS) {
            expect(result, 'preventDefault not called').to.equal(true);
            expect(event.preventDefault).to.have.callCount(0);
        } else {
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

        const ui = new UI(div).on('over out focus blur move', () => {});
        expect(window.addEventListener, 'window').to.have.callCount(0);
        expect(window.removeEventListener, 'window').to.have.callCount(0);
        expect(document.addEventListener, 'document').to.have.callCount(0);
        expect(document.removeEventListener, 'document').to.have.callCount(0);
        expect(document.body.addEventListener, 'body').to.have.callCount(0);
        expect(document.body.removeEventListener, 'body').to.have.callCount(0);
        expect(div.removeEventListener, 'button').to.have.callCount(0);
        ui.destroy();
    });

    it('adds event listeners based on listeners', function() {
        let ui;

        spyOnDomEventListenerMethods([ div ]);
        ui = new UI(div);
        expect(div.addEventListener, 'div without options').to.have.callCount(0);
        ui.destroy();

        spyOnDomEventListenerMethods([ div ]);
        ui = new UI(div)
            .on('click doubleClick dragStart drag dragEnd over out focus blur move', () => {});
        if (USE_POINTER_EVENTS) {
            expect(div.addEventListener, 'div with all listeners').to.have.callCount(11);
        } else if (!USE_MOUSE_EVENTS) {
            expect(div.addEventListener, 'div with all listeners').to.have.callCount(6);
        } else {
            expect(div.addEventListener, 'div with all listeners').to.have.callCount(11);
        }
        ui.destroy();
    });

    it.only('handles enter-click by additing additional enter listener to non button elements', function() {
        let ui_div;
        let ui_button;

        const button = document.createElement('button')
        div.parentElement.appendChild(button);
        console.info(button.tagName);
        spyOnDomEventListenerMethods([ div, button ]);
        ui_div = new UI(div);
        ui_button = new UI(button);
        expect(div.addEventListener, 'div without options').to.have.callCount(0);
        expect(button.addEventListener, 'button without options').to.have.callCount(0);
        ui_div.destroy();
        ui_button.destroy();

        spyOnDomEventListenerMethods([ div, button ]);
        ui_div = new UI(div).on('click', () => {});
        ui_button = new UI(button).on('click', () => {});

        expect(div.addEventListener, 'div with all listeners').to.have.callCount(5);
        expect(button.addEventListener, 'button with all listeners').to.have.callCount(4);
        ui_div.destroy();
        ui_button.destroy();
    });

    it('remove event listeners with off()', function() {
        spyOnDomEventListenerMethods([ div ]);
        const ui = new UI(div)
            .on('click doubleClick dragStart drag dragEnd over out focus blur move', () => {})
            .off();
        if (USE_POINTER_EVENTS) {
            expect(div.addEventListener, 'div with all listeners').to.have.callCount(11);
            expect(div.removeEventListener, 'div with all listeners').to.have.callCount(11);
        } else if (!USE_MOUSE_EVENTS) {
            expect(div.addEventListener, 'div with all listeners').to.have.callCount(6);
            expect(div.removeEventListener, 'div with all listeners').to.have.callCount(6);
        } else {
            expect(div.addEventListener, 'div with all listeners').to.have.callCount(11);
            expect(div.removeEventListener, 'div with all listeners').to.have.callCount(11);
        }
        ui.destroy();
    });

    it('removes all event listeners on destroy', function() {
        spyOnDomEventListenerMethods([ div ]);

        const ui = new UI(div).on('click doubleClick dragStart drag dragEnd over out focus blur move', () => {});
        ui.destroy();
        if (USE_POINTER_EVENTS) {
            expect(div.addEventListener, 'div with all listeners').to.have.callCount(11);
            expect(div.removeEventListener, 'div with all listeners').to.have.callCount(11);
        } else if (!USE_MOUSE_EVENTS) {
            expect(div.addEventListener, 'div with all listeners').to.have.callCount(6);
            expect(div.removeEventListener, 'div with all listeners').to.have.callCount(6);
        } else {
            expect(div.addEventListener, 'div with all listeners').to.have.callCount(11);
            expect(div.removeEventListener, 'div with all listeners').to.have.callCount(11);
        }
    });

});
