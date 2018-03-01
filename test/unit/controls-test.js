import Controls from 'view/controls/controls';
import sinon from 'sinon';

describe('Controls', function() {

    it('is a class', function() {
        expect(Controls).to.be.a('function');
        expect(Controls.constructor).to.be.a('function');
    });

    const controls = new Controls(document, document.createElement('div'));
    controls.settingsMenu = {};

    describe('userActive', function() {

        afterEach(function() {
            controls.off();
        });

        it('triggers a "userActive" event', function() {
            const spy = sinon.spy();
            controls.on('userActive', spy);
            controls.showing = false;
            controls.userActive(0);
            expect(spy).to.have.callCount(1);
        });

        it('triggers a "userInactive" event', function() {
            const spy = sinon.spy();
            controls.on('userInactive', spy);
            controls.userInactive();
            expect(spy).to.have.callCount(1);
        });
    });


});
