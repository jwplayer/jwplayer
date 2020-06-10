import FloatingController from 'view/floating/floating-controller';
import MockModel from 'mock/mock-model';
import { STATE_IDLE, STATE_COMPLETE, STATE_ERROR } from 'events/events';
import viewsManager from 'view/utils/views-manager';

const createElementsForConstructor = () => {
    const els = [];
    // els are not appended to the dom so should be cleaned up when test is over
    for (let i = 0; i < 3; i++) {
        const el = document.createElement('div');
        el.classList.add('test-el');
        els.push(el);
    }
    return {
        player: els[0],
        wrapper: els[1],
        preview: {
            el: els[2]
        }
    };
}

const createSimpleFloatController = (deps = {}) => {
    const model = deps.model || new MockModel();
    const bounds = deps.bounds || {};
    const els = deps.els || createElementsForConstructor();
    const fc = new FloatingController(model, bounds, els, deps.isMobile);
    fc._floatingUI = {
        enable: sinon.spy(),
        disable: sinon.spy()
    };
    return fc;
};

const wrapViewsManagerWithSpies = () => {
    const origRemove = viewsManager.removeScrollHandler;
    const origAdd = viewsManager.addScrollHandler;

    viewsManager.removeScrollHandler = sinon.spy();
    viewsManager.addScrollHandler = sinon.spy();

    const restore = () => {
        viewsManager.removeScrollHandler = origRemove;
        viewsManager.addScrollHandler = origAdd;
    };
    const reset = () => {
        viewsManager.removeScrollHandler.resetHistory();
        viewsManager.addScrollHandler.resetHistory();
    };

    return {
        reset,
        restore
    };
};

describe('FloatingController', function() {
    let clock;
    before(() => {
        clock = sinon.useFakeTimers()
    });
    after(() => {
        clock.restore();
    });
    afterEach(() => {
        clock.runAll();
    });
    it('sets up with the expected properties', () => {
        const model = new MockModel();
        const bounds = {};
        const elements = createElementsForConstructor();
        const fc = new FloatingController(model, bounds, elements);
        expect(fc._playerEl).to.eq(elements.player);
        expect(fc._wrapperEl).to.eq(elements.wrapper);
        expect(fc._preview).to.eq(elements.preview);
        expect(fc._model).to.eq(model);

        expect(fc._floatingUI).to.be.an('object');
        expect(fc._floatingStoppedForever).to.be.false;
        expect(fc._lastIntRatio).to.eq(0);
        expect(fc._playerBounds).to.eq(bounds);

        expect(fc._boundThrottledMobileFloatScrollHandler).to.be.a('function')
    });
    describe('#initFloatingBehavior', () => {
        let managerResetMethods;
        before(() => {
            managerResetMethods = wrapViewsManagerWithSpies();
        });
        afterEach(() => {
            managerResetMethods.reset();
        });
        after(() => {
            managerResetMethods.restore();
        });
        it('does nothing if floating has been stopped forever', () => {
            const fc = createSimpleFloatController();
            fc._floatingStoppedForever = true;
            managerResetMethods.reset();
            fc.initFloatingBehavior();
            expect(viewsManager.removeScrollHandler.called).to.be.false;
        });
        it('removes the scroll handler, even if floating config has been removed', () => {
            const fc = createSimpleFloatController();
            fc._floatingStoppedForever = false;
            fc._model.set('floating', null);
            managerResetMethods.reset();
            fc.initFloatingBehavior();
            expect(viewsManager.removeScrollHandler.calledWith(fc._boundThrottledMobileFloatScrollHandler)).to.be.true;
        });
        it('does not enact any behavior if there is no floating config', () => {
            const fc = createSimpleFloatController();
            fc._floatingStoppedForever = false;
            fc._model.set('floating', null);
            managerResetMethods.reset();

            fc._boundThrottledMobileFloatScrollHandler = sinon.spy();
            fc.checkFloatIntersection = sinon.spy();
            fc.startFloating = sinon.spy();
            fc.stopFloating = sinon.spy();

            fc.initFloatingBehavior();

            expect(fc._boundThrottledMobileFloatScrollHandler.called).to.be.false;
            expect(fc.checkFloatIntersection.called).to.be.false;
            expect(fc.startFloating.called).to.be.false;
            expect(fc.stopFloating.called).to.be.false;
        });
        describe('when float mode is notVisible', () => {
            it('sets up a scroll handler and calls #_boundThrottledMobileFloatScrollHandler on mobile', () => {
                const fc = createSimpleFloatController({
                    isMobile: true
                });
                fc._model.set('floating', { mode: 'notVisible' });
                managerResetMethods.reset();

                fc._boundThrottledMobileFloatScrollHandler = sinon.spy();

                fc.initFloatingBehavior();

                expect(fc._boundThrottledMobileFloatScrollHandler.called).to.be.true;
                expect(viewsManager.addScrollHandler.calledWith(fc._boundThrottledMobileFloatScrollHandler)).to.be.true;
            });
            it('checks the float intersection when on desktop', () => {
                const fc = createSimpleFloatController();
                fc._model.set('floating', { mode: 'notVisible' });
                fc.checkFloatIntersection = sinon.spy();

                fc.initFloatingBehavior();

                expect(fc.checkFloatIntersection.called).to.be.true;
            });
        });
        describe('when float mode is always', () => {
            it('calls #startFloating', () => {
                const mockModel = new MockModel();
                // patch this to avoid duplicate calls to the init method
                mockModel.change = () => {};
                const fc = createSimpleFloatController({ model: mockModel });
                fc._model.set('floating', { mode: 'always' });
                fc.startFloating = sinon.spy();

                fc.initFloatingBehavior();

                expect(fc.startFloating.called).to.be.true;
            });
        })
        describe('when float mode is never', () => {
            it('calls #stopFloating', () => {
                const mockModel = new MockModel();
                // patch this to avoid duplicate calls to the init method
                mockModel.change = () => {};
                const fc = createSimpleFloatController({ model: mockModel });
                fc._model.set('floating', { mode: 'never' });
                fc.stopFloating = sinon.spy();

                fc.initFloatingBehavior();

                expect(fc.stopFloating.called).to.be.true;
            });
        })
    });
    describe('#updatePlayerBounds', () => {
        it('updates the internal player bounds of the controller', () => {
            const fc = createSimpleFloatController();
            const testBounds = { test: 'bounds' };
            fc.updatePlayerBounds(testBounds)
            expect(fc._playerBounds).to.eq(testBounds);
        });
    });
    describe('#getFloatingConfig', () => {
        it('returns the floating property on the model', () => {
            const fc = createSimpleFloatController();
            const testProp = { };
            fc._model.set('floating', testProp);
            expect(fc.getFloatingConfig()).to.eq(testProp);
        });
    });
    describe('#getFloatMode', () => {
        it('returns the floating.mode property on the model', () => {
            it('returns the floating property on the model', () => {
                const fc = createSimpleFloatController();
                const testProp = { mode: 'teehee' };
                fc._model.set('floating', testProp);
                expect(fc.getFloatMode()).to.eq('teehee');
            });
        });
        it('defaults to notVisible', () => {
            const fc = createSimpleFloatController();
            const testProp = {  };
            fc._model.set('floating', testProp);
            expect(fc.getFloatMode()).to.eq('notVisible');
        });
    });
    describe('#resize', () => {
        it('updates the floating size when floating', () => {
            const fc = createSimpleFloatController();
            fc.updateFloatingSize = sinon.spy();
            fc._model.set('isFloating', true);
            fc.resize();
            expect(fc.updateFloatingSize.called).to.be.true;
        });
        it('does nothing when not floating', () => {
            const fc = createSimpleFloatController();
            fc.updateFloatingSize = sinon.spy();
            fc._model.set('isFloating', false);
            fc.resize();
            expect(fc.updateFloatingSize.called).to.be.false;
        });
    });
    describe('#shouldFloatOnViewable', () => {
        it('returns false when state is STATE_IDLE, STATE_ERROR, or STATE_COMPLETE', () => {
            const fc = createSimpleFloatController();
            fc._model.set('state', STATE_IDLE);
            expect(fc.shouldFloatOnViewable()).to.be.false;
            fc._model.set('state', STATE_ERROR);
            expect(fc.shouldFloatOnViewable()).to.be.false;
            fc._model.set('state', STATE_COMPLETE);
            expect(fc.shouldFloatOnViewable()).to.be.false;
        });
        it('returns true when state is not STATE_IDLE, STATE_ERROR or STATE_COMPLETE', () => {
            const fc = createSimpleFloatController();
            fc._model.set('state', 'playing');
            expect(fc.shouldFloatOnViewable()).to.be.true;
        });
    });
    describe('#startFloating', () => {
        it('does nothing when _floatingPlayer is not null', () => {
            //start floating to get floatingPlayer variable set
            const fc = createSimpleFloatController();
            fc.startFloating();
            expect(fc.getFloatingPlayer()).to.not.eq(null);

            fc.updateFloatingSize = sinon.spy();
            fc.startFloating();
            expect(fc.updateFloatingSize.called).to.be.false;
            // reset currently floating player
            fc.stopFloating();
        });
        describe('when mobileFloatIntoPlace is false', () => {
            it(`sets isFloating on the model to true,
                adds the appropriate classes and styles to the player element,
                calls #updateFloatingSize,
                and triggers a responsive listener
            `, () => {
                const fc = createSimpleFloatController();
                expect(fc._model.get('isFloating')).to.be.undefined;
                fc._preview.el = {
                    style: {
                        backgroundImage: 'url(preview.img)'
                    }
                };
                fc.updateFloatingSize = sinon.spy();
                fc._model.trigger = sinon.spy();
                fc.startFloating();
                expect(fc._model.get('isFloating')).to.be.true;
                expect(fc._playerEl.classList.contains('jw-flag-floating')).to.be.true;
                expect(fc._playerEl.style.backgroundImage).to.eq('url("preview.img")');
                expect(fc.updateFloatingSize.called).to.be.true;
                expect(fc._floatingUI.enable.called).to.be.true;
                expect(fc._model.trigger.calledWith('forceResponsiveListener', {})).to.be.true;
                // reset currently floating player
                fc.stopFloating();
            });
            it('does not enable the floating ui when in instream mode', () => {
                const fc = createSimpleFloatController();
                fc._model.set('instreamMode', true);
                fc.updateFloatingSize = sinon.spy();
                fc.startFloating();
                expect(fc._floatingUI.enable.called).to.be.false;
                // reset currently floating player
                fc.stopFloating();
            });
        });
        describe('when mobileFloatIntoPlace is true', () => {
            it('applies a transform animation to the container', () => {
                const fc = createSimpleFloatController();
                fc.updateFloatingSize = sinon.spy();
                fc.updatePlayerBounds({ top: 45 });
                fc.startFloating(true);
                expect(fc._wrapperEl.style.transform).to.eq('translateY(-17px)');

                clock.next();
                expect(fc._wrapperEl.style.transform).to.eq('translateY(0px)');
                expect(fc._wrapperEl.style.transition).to.eq('transform 150ms cubic-bezier(0, 0.25, 0.25, 1) 0s');
                fc.stopFloating();
            });
        });
    });
    describe('#stopFloating', () => {
        describe('when forever is true', () => {
            it('sets floatingStoppedForever to true and removes a scroll listener even when the current floating controller is different than this one', () => {
                const prevFc = createSimpleFloatController();
                prevFc.startFloating();

                const fc = createSimpleFloatController();
                const managerResetMethods = wrapViewsManagerWithSpies();
                fc.stopFloating(true);

                expect(fc._floatingStoppedForever).to.be.true;
                expect(viewsManager.removeScrollHandler.calledWith(fc._boundThrottledMobileFloatScrollHandler)).to.be.true;
                managerResetMethods.restore();
                prevFc.stopFloating();
            });
        });
        describe('if the current floating controller does not equal this one', () => {
            it('does nothing', () => {
                const prevFc = createSimpleFloatController();
                prevFc.startFloating();

                const fc = createSimpleFloatController();
                fc._model.set('isFloating', true);
                fc.stopFloating();

                // This should remain unchanged
                expect(fc._model.get('isFloating')).to.be.true;

                prevFc.stopFloating();
            });
        });
        describe('when the current controller is the floating one', () => {
            it(`sets isFloating to false,
                resetFloatingStyles on the player and wrapper elements,
                calls #disableFloatingUI,
                forces the responsive listener to be called
                and forces the aspect ratio listener to be called
            `, () => {
                clock.runAll();
                const fc = createSimpleFloatController();
                fc.disableFloatingUI = sinon.spy();
                fc._model.trigger = sinon.spy();
                fc.startFloating();
                fc.stopFloating();

                expect(fc._model.get('isFloating')).to.be.false;
                expect(fc.getFloatingPlayer()).to.eq(null);
                expect(fc.disableFloatingUI.called).to.be.true;
                expect(fc._model.trigger.calledWith('forceResponsiveListener', {})).to.be.true;
                expect(fc._model.trigger.calledWith('forceAspectRatioChange', {})).to.be.true;
                expect(fc._playerEl.style.backgroundImage).to.eq('');
                expect(fc._wrapperEl.style.width).to.eq('');
                expect(fc._wrapperEl.style.maxWidth).to.eq('');
                expect(fc._wrapperEl.style.width).to.eq('');
                expect(fc._wrapperEl.style.height).to.eq('');
                expect(fc._wrapperEl.style.left).to.eq('');
                expect(fc._wrapperEl.style.right).to.eq('');
                expect(fc._wrapperEl.style.top).to.eq('');
                expect(fc._wrapperEl.style.bottom).to.eq('');
                expect(fc._wrapperEl.style.margin).to.eq('');
                expect(fc._wrapperEl.style.transform).to.eq('');
                expect(fc._wrapperEl.style.transition).to.eq('');
                expect(fc._wrapperEl.style['transition-timing-function']).to.eq('');
            });
            describe('when mobileFloatIntoPlace is true', () => {
                it('resets the styles after a timeout', () => {
                    clock.runAll();
                    const fc = createSimpleFloatController();
                    fc.disableFloatingUI = sinon.spy();
                    fc._model.trigger = sinon.spy();
                    fc.startFloating(true);
                    fc.stopFloating(false, true);
                    clock.next();

                    expect(fc._wrapperEl.style.transform).to.eq('translateY(0px)');

                    clock.tick(150);
                    expect(fc._wrapperEl.style.transform).to.eq('');
                });
            });
        });
    });
    describe('#updateFloatingSize', () => {
        it('sets the appropriate styles on the wrapper element', () => {
            const fc = createSimpleFloatController();
            fc._model.set('width', 500);
            fc._model.set('height', 600);

            fc.updateFloatingSize();

            expect(fc._wrapperEl.style.width).to.eq('500px');
            expect(fc._wrapperEl.style.height).to.eq('');
        });
        it('sets width and height with an aspect ratio', () => {
            const fc = createSimpleFloatController();
            fc._model.trigger = sinon.spy();
            fc._model.set('aspectratio', null);
            fc._model.set('width', 500);
            fc._model.set('height', 600);

            fc.updateFloatingSize();

            expect(fc._model.trigger.calledWith('forceAspectRatioChange', { ratio: '120%' })).to.be.true;
        });
    });
    describe('#enableFloatingUI', () => {
        it('tells the floatingUI to enable', () => {
            const fc = createSimpleFloatController();
            fc.enableFloatingUI();
            expect(fc._floatingUI.enable.called).to.be.true;
        });
    });
    describe('#disbleFloatingUI', () => {
        it('tells the floatingUI to disable', () => {
            const fc = createSimpleFloatController();
            fc.disableFloatingUI();
            expect(fc._floatingUI.disable.called).to.be.true;
        });
    });
    describe('#getFloatingPlayer', () => {
        it('returns the currently floating player', () => {
            const fcOne = createSimpleFloatController();
            const fcTwo = createSimpleFloatController();
            fcTwo.startFloating();
            expect(fcOne.getFloatingPlayer()).to.eq(fcTwo._playerEl);
            expect(fcTwo.getFloatingPlayer()).to.eq(fcTwo._playerEl);
            fcTwo.stopFloating();
        });
    });
    describe('#destroy', () => {
        it('sets the _floatingPlayer to null if the current controller is the one floating', () => {
            const fc = createSimpleFloatController();
            fc.startFloating();
            fc.destroy();

            expect(fc.getFloatingPlayer()).to.be.null;
        });
        it('removes the scroll handler when on mobile', () => {
            const fc = createSimpleFloatController({
                isMobile: true
            });
            fc._model.set('floating', {});
            const wrapFuncs = wrapViewsManagerWithSpies();
            fc.destroy();
            expect(viewsManager.removeScrollHandler.calledWith(fc._boundThrottledMobileFloatScrollHandler)).to.be.true;

            wrapFuncs.restore();
        });
        it('removes the change listener', () => {
            const fc = createSimpleFloatController();
            fc._model.off = sinon.spy();
            fc.destroy();
            expect(fc._model.off.calledWith('change:floating', fc._boundInitFloatingBehavior)).to.be.true;
        });
    });
    describe('#updateFloating', () => {
        // Can't test due to reliance on isIframe which always returns true in the test env
    });
    describe('#throttledMobileFloatScrollHandler', () => {
        // Typical debounce function, nothing much to gain from testing, esp with the complexity
    });
    describe('#checkFloatOnScroll', () => {
        before(() => {
            const longEl = document.createElement('div');
            longEl.style.width = '100px';
            longEl.style.height = '5000px'
            longEl.classList.add('test-el');
            document.body.append(longEl);
        });
        after(() => {
            document.querySelector('.test-el').remove();
        });
        afterEach(() => {
            window.scrollTo(0, 0);
        });
        it('updates floating with a constant of 0 when not floating and the threshold has been crossed', () => {
            const fc = createSimpleFloatController();
            fc.updateFloating = sinon.spy();
            fc._model.set('isFloating', false);
            fc.updatePlayerBounds({
                top: 100
            });

            window.scrollTo(0, 500);
            fc.checkFloatOnScroll();
            expect(fc.updateFloating.calledWith(0, false)).to.be.true;
        });
        it('does nothing when not floating and the threshold has not been crossed', () => {
            const fc = createSimpleFloatController();
            fc.updateFloating = sinon.spy();
            fc._model.set('isFloating', false);
            fc.updatePlayerBounds({
                top: 700
            });

            window.scrollTo(0, 500);
            fc.checkFloatOnScroll();
            expect(fc.updateFloating.called).to.be.false;
        });
        it('updates floating with a constant of 1 when floating and the threshold has not been crossed', () => {
            const fc = createSimpleFloatController();
            fc.updateFloating = sinon.spy();
            fc._model.set('isFloating', true);
            fc.updatePlayerBounds({
                top: 700
            });

            window.scrollTo(0, 500);
            fc.checkFloatOnScroll();
            expect(fc.updateFloating.calledWith(1, false)).to.be.true;
        });
        it('does nothing when floating and the threshold has been crossed', () => {
            const fc = createSimpleFloatController();
            fc.updateFloating = sinon.spy();
            fc._model.set('isFloating', true);
            fc.updatePlayerBounds({
                top: 100
            });

            window.scrollTo(0, 500);
            fc.checkFloatOnScroll();
            expect(fc.updateFloating.called).to.be.false;
        });
        it('does nothing when floating mode is not `notVisible`', () => {
            const fc = createSimpleFloatController();
            fc.updateFloating = sinon.spy();
            fc._model.set('isFloating', true);
            fc._model.set('floating', { mode: 'always' });
            fc.updatePlayerBounds({
                top: 700
            });

            window.scrollTo(0, 500);
            fc.checkFloatOnScroll();
            expect(fc.updateFloating.called).to.be.false;
        });
    });
    describe('#checkFloatIntersection', () => {
        it('sets canFloat to true when intersectionRatio is >= 5', () => {
            const fc = createSimpleFloatController();
            expect(fc._canFloat).to.be.undefined;
            fc.checkFloatIntersection(.5);
            expect(fc._canFloat).to.be.true;
        });
        describe('when float mode is not visible', () => {
            describe('when we are not using mobile behavior', () => {
                describe('when we have not stopped floating forever', () => {
                    describe('when canFloat is true', () => {
                        it('updates floating with the proper intersection ratio', () => {
                            const fc = createSimpleFloatController();
                            fc._model.set('floating', {});
                            fc._lastIntRatio = .75;
                            fc.fosMobileBehavior = () => false;
                            fc._floatingStoppedForever = false;
                            fc._canFloat = true;
                            fc.updateFloating = sinon.spy();
                            fc.checkFloatIntersection(.5);
                            expect(fc.updateFloating.calledWith(.5)).to.be.true;
                        });
                        it('defaults the ratio to the lastIntRatio', () => {
                            const fc = createSimpleFloatController();
                            fc._model.set('floating', {});
                            fc._lastIntRatio = .75;
                            fc.fosMobileBehavior = () => false;
                            fc._floatingStoppedForever = false;
                            fc._canFloat = true;
                            fc.updateFloating = sinon.spy();
                            fc.checkFloatIntersection();
                            expect(fc.updateFloating.calledWith(.75)).to.be.true;
                        });
                        it('does not update floating when canFloat is false', () => {
                            const fc = createSimpleFloatController();
                            fc._model.set('floating', {});
                            fc.fosMobileBehavior = () => false;
                            fc._floatingStoppedForever = false;
                            fc._canFloat = false;
                            fc.updateFloating = sinon.spy();
                            fc.checkFloatIntersection(.25);
                            expect(fc.updateFloating.called).to.be.false;
                        });
                    });
                    it('does not update floating when we have stopped floating forever', () => {
                        const fc = createSimpleFloatController();
                        fc._model.set('floating', {});
                        fc.fosMobileBehavior = () => false;
                        fc._floatingStoppedForever = true;
                        fc._canFloat = true;
                        fc.updateFloating = sinon.spy();
                        fc.checkFloatIntersection(.5);
                        expect(fc.updateFloating.called).to.be.false;
                    });
                });
                it('does not update floating when we are using mobile behavior', () => {
                    const fc = createSimpleFloatController();
                    fc._model.set('floating', {});
                    fc.fosMobileBehavior = () => true;
                    fc._floatingStoppedForever = false;
                    fc._canFloat = true;
                    fc.updateFloating = sinon.spy();
                    fc.checkFloatIntersection(.5);
                    expect(fc.updateFloating.called).to.be.false;
                });
            });
        });
        it('sets lastIntRatio only when ratio is a number', () => {
            const fc = createSimpleFloatController();
            fc.checkFloatIntersection(.5);
            expect(fc._lastIntRatio).to.eq(.5);

            fc.checkFloatIntersection('blah');
            expect(fc._lastIntRatio).to.eq(.5);
        });
    });
    describe('#updateStyles', () => {
        it('does nothing when floating has been stopped forever', () => {
            const fc = createSimpleFloatController();
            fc._boundThrottledMobileFloatScrollHandler = sinon.spy();
            fc._model.set('floating', {});
            fc._floatingStoppedForever = true;
            fc.updateStyles();
            expect(fc._boundThrottledMobileFloatScrollHandler.called).to.be.false;
        });
        describe('when floating has not been stopped forever', () => {
            it('does nothing when there is no floating config', () => {
                const fc = createSimpleFloatController();
                fc._model.set('floating', null);
                fc._boundThrottledMobileFloatScrollHandler = sinon.spy();
                fc.updateStyles();
                expect(fc._boundThrottledMobileFloatScrollHandler.called).to.be.false;
            });
            it('does nothing when floating mode is not `notVisible`', () => {
                const fc = createSimpleFloatController();
                fc._model.set('floating', { mode: 'always' });
                fc._boundThrottledMobileFloatScrollHandler = sinon.spy();
                fc.updateStyles();
                expect(fc._boundThrottledMobileFloatScrollHandler.called).to.be.false;
            });
            it('calls _boundThrottledMobileFloatScrollHandler when floating mode is `notVisible`', () => {
                const fc = createSimpleFloatController();
                fc._model.set('floating', { mode: 'notVisible' });
                fc._boundThrottledMobileFloatScrollHandler = sinon.spy();
                fc.updateStyles();
                expect(fc._boundThrottledMobileFloatScrollHandler.called).to.be.true;
            });
        });
    });
});
