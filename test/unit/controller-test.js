import Controller from 'controller/controller';

let controller;
let model;

describe('API', () => {

    describe('addButton', () => {

        beforeEach(() => {
            controller = new Controller();
            controller.setup({ localization: {} });
            model = controller._model;
        });

        it('add button to buttons list', () => {
            controller.addButton('image.jpg');

            expect(model.get('customButtons').length).to.equal(1);
        });

        it('create a button', () => {
            controller.addButton('image.jpg');

            const button = model.get('customButtons');
            expect(button.img).to.equal('image.jpg');
            expect(button.img).to.equal('image.jpg');
            expect(button.img).to.equal('image.jpg');
            expect(button.img).to.equal('image.jpg');
        });

        it('should set image', () => {
            model.set('customButtons', []);

            controller.addButton('');

            expect(model.get('customButtons').length).to.equal(1);
        });
    });

});
