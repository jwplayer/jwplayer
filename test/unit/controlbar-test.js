import ControlBar from 'view/controls/controlbar';
import SimpleModel from 'model/simplemodel';
import sinon from 'sinon';
import * as utils from 'utils/dom';

const model = Object.assign({}, SimpleModel);
model.change = sinon.stub();
model.change.returnsThis();
model.on = sinon.stub();
model.on.returnsThis();
model.set('localization', {});
model.mediaController = {};
model.mediaController.on = sinon.stub();
model.mediaController.on.returnsThis();

describe('Control Bar', function() {

    let accessibilityContainer;
    let controlBar;
    let container;
    let children;

    beforeEach(function() {
        const spacer = document.createElement('div');
        spacer.className += 'jw-spacer';
        const settingsButton = document.createElement('div');

        const accessible = document.createElement('div');
        accessible.className = 'jw-hidden-accessibility';
        accessibilityContainer = document.createElement('div');
        accessibilityContainer.appendChild(accessible);

        container = document.createElement('div');
        container.appendChild(settingsButton);
        container.appendChild(spacer);

        controlBar = new ControlBar({}, model, accessibilityContainer);
        controlBar.elements.spacer = spacer;
        controlBar.elements.settingsButton = settingsButton;
        controlBar.elements.buttonContainer = container;
        children = container.children;
    });

    describe('updateButtons', function() {

        it('should add nothing to the container if there are no buttons', function() {
            controlBar.updateButtons({});

            expect(children.length).to.equal(2);
        });

        it('should add button after spacer if there is no logo', function() {
            controlBar.updateButtons(model, [{ id: '1' }]);

            expect(children.length).to.equal(3);
        });

        it('should add button after logo if there is one', function() {
            const logo = document.createElement('div');
            logo.setAttribute('button', 'logo');

            container.appendChild(logo);
            controlBar.updateButtons(model, [{ id: '1' }]);

            expect(children.length).to.equal(4);
            expect(children[3].getAttribute('button')).to.equal('1');
        });

        it('should add buttons to the container in order', function() {
            controlBar.updateButtons(model, [{ id: '1' }, { id: '2' }]);

            expect(children.length).to.equal(4);
            expect(children[2].getAttribute('button')).to.equal('1');
            expect(children[3].getAttribute('button')).to.equal('2');
        });
    });

    describe('removeButtons', function() {

        it('should do nothing if the second argument is empty', function() {
            controlBar.removeButtons(container, []);

            expect(children.length).to.equal(2);
        });

        it('should do nothing if there are buttons that do have the same ids', function() {
            container.appendChild(document.createElement('div'));
            container.appendChild(document.createElement('div'));
            container.appendChild(document.createElement('div'));

            children[2].setAttribute('button', '1');
            children[3].setAttribute('button', '2');
            children[4].setAttribute('button', '3');

            controlBar.removeButtons(container, [{ id: '4' }]);

            expect(children.length).to.equal(5);
        });

        it('should remove buttons if there are button that dont have the same ids', function() {
            container.appendChild(document.createElement('div'));
            container.appendChild(document.createElement('div'));
            container.appendChild(document.createElement('div'));

            children[2].setAttribute('button', '1');
            children[3].setAttribute('button', '2');
            children[4].setAttribute('button', '3');

            controlBar.removeButtons(container, [{ id: '1' }, { id: '2' }]);

            expect(children.length).to.equal(3);
            expect(children[2].getAttribute('button')).to.equal('3');
        });
    });

    describe('toggleCaptionsButtonState', function() {

        it('should do nothing if there is no captions button', function() {
            const toggledReturn = controlBar.toggleCaptionsButtonState();
            const toggleClass = sinon.stub(utils, 'toggleClass');

            expect(toggleClass.notCalled).to.be.true;
            expect(toggledReturn).to.be.undefined;

            toggleClass.restore();
        });

        it('should toggle the captions button when the button is present', function() {
            const captionsElement = { element: () => {} };
            controlBar.elements.captionsButton = captionsElement;
            const toggleClass = sinon.stub(utils, 'toggleClass');

            controlBar.toggleCaptionsButtonState();
            expect(toggleClass.called).to.be.true;
            expect(toggleClass.calledWith(captionsElement));

            toggleClass.restore();
        });

    });

    describe('addLogo', function() {

        it('should add a logo image after spacer', function() {
            controlBar.addLogo({
                file: 'logo.svg',
                link: 'http://www.jwplayer.com'
            });

            expect(children.length).to.equal(3);
            expect(children[2].getAttribute('button')).to.equal('logo');
            expect(children[2].children[0].style.backgroundImage.indexOf('logo.svg')).to.not.equal(-1);
        });
    });
});
