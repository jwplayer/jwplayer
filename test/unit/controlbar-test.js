import ControlBar from 'view/controls/controlbar';
import SimpleModel from 'model/simplemodel';
import _ from 'test/underscore';
import sinon from 'sinon';

const model = _.extend({}, SimpleModel);
// model.change = sinon.mock(_.extend({}, SimpleModel));
model.change = sinon.stub();
model.change.returnsThis();
model.on = sinon.stub();
model.on.returnsThis();
model.set('localization', {});

describe('Control Bar', () => {

    let controlBar;
    let container;
    let buttons;

    beforeEach(() => {
        controlBar = new ControlBar({}, model);
        container = document.createElement('div');
        controlBar.elements = { right: container };
        buttons = controlBar.elements.right.children;
    });

    describe('updateButtons', () => {

        it('should add nothing to the container if there are no buttons', () => {
            controlBar.updateButtons({});

            expect(buttons.length).to.equal(0);
        });

        it('should removeButtons before adding any', () => {
            controlBar.removeButtons = sinon.stub();
            container.insertBefore = sinon.spy();

            controlBar.updateButtons(model, [{ id: '1' }]);

            expect(controlBar.removeButtons.calledBefore(container.insertBefore)).to.be.true;
        });

        it('should add button to the container', () => {
            controlBar.updateButtons(model, [{ id: '1' }]);

            expect(buttons.length).to.equal(1);
        });

        it('should add buttons to the container in order', () => {
            controlBar.updateButtons(model, [{ id: '1' }, { id: '2' }]);

            expect(buttons.length).to.equal(2);
            expect(buttons[0].getAttribute('button')).to.equal('1');
            expect(buttons[1].getAttribute('button')).to.equal('2');
        });
    });

    describe('removeButtons', () => {

        it('should do nothing if there are no buttons in the container', () => {
            controlBar.removeButtons(container);

            expect(buttons.length).to.equal(0);
        });

        it('should do nothing if there are buttons dont have the same ids', () => {
            container.appendChild(document.createElement('div'));
            container.appendChild(document.createElement('div'));
            container.appendChild(document.createElement('div'));

            buttons[0].setAttribute('button', '1');
            buttons[1].setAttribute('button', '2');
            buttons[2].setAttribute('button', '3');

            controlBar.removeButtons(container, [{ id: '4' }]);

            expect(buttons.length).to.equal(3);
        });

        it('should remove buttons if there are buttons dont have the same ids', () => {
            container.appendChild(document.createElement('div'));
            container.appendChild(document.createElement('div'));
            container.appendChild(document.createElement('div'));

            buttons[0].setAttribute('button', '1');
            buttons[1].setAttribute('button', '2');
            buttons[2].setAttribute('button', '3');

            controlBar.removeButtons(container, [{ id: '1' }, { id: '2' }]);

            expect(buttons.length).to.equal(1);
            expect(buttons[0].getAttribute('button')).to.equal('3');
        });
    });
});
