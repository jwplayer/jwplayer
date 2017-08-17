import sinon from 'sinon';
import SimpleModel from 'model/simplemodel';
import * as menu from 'view/controls/components/settings/menu';
import Controls from 'view/controls/controls';

describe('Controls', function() {

    let controls;
    let settingsMenu;

    beforeEach(function() {
        controls = new Controls({}, document.createElement('div'));
        controls.div = document.createElement('div');
        controls.controlbar = {};
        controls.controlbar.on = sinon.stub();

        sinon.stub(menu, 'SettingsMenu');

        settingsMenu = {
            setup: sinon.spy(),
            element: sinon.stub()
        };
        settingsMenu.element.returns(document.createElement('div'));
        menu.SettingsMenu.returns(settingsMenu);
    });

    afterEach(function() {
        menu.SettingsMenu.restore();
    });

    describe('setupSettingsMenu', function() {

        it.skip('should create a SettingsMenu object', function() {
            controls.setupSettingsMenu();

            expect(controls.settingsMenu).to.equal(settingsMenu);
        });

        it.skip('should setup Settings menu', function() {
            controls.setupSettingsMenu();

            expect(settingsMenu.setup.callCount).to.equal(1);
        });

        it.skip('should add menu to controls div', function() {
            controls.setupSettingsMenu();

            expect(controls.div.children.length).to.equal(1);
        });

        it.skip('should add a visibility listener', function() {
            controls.userActive = sinon.spy();
            controls.setupSettingsMenu();

            const handler = menu.SettingsMenu.args[0][0];

            handler(true);

            expect(controls.userActive.callCount).to.equal(1);
        });
    });

    describe('onMediaModel', function() {

        let model;
        let mediaModel;

        beforeEach(function() {
            model = Object.assign({}, SimpleModel);
            model.change = sinon.spy();
            mediaModel = Object.assign({}, SimpleModel);
            mediaModel.on = sinon.spy();

            controls.onMediaModel(model);

            const changeHandler = model.change.args[0][1];
            changeHandler('', mediaModel);
        });

        it.skip('should setup qualities element on levels change', function() {
            controls.controlbar.elements = { hd: { setup: sinon.spy() } };

            const levelsHandler = mediaModel.on.args[0][1];
            levelsHandler(model);

            expect(controls.controlbar.elements.hd.setup.callCount).to.equal(1);
        });

        it.skip('should update quality element on level change', function() {
            controls.controlbar.elements = { hd: { selectItem: sinon.spy() } };

            const levelHandler = mediaModel.on.args[1][1];
            levelHandler(model);

            expect(controls.controlbar.elements.hd.selectItem.callCount).to.equal(1);
        });

        it.skip('should setup audio tracks element on tracks change', function() {
            controls.controlbar.elements = { audiotracks: { setup: sinon.spy() } };

            const tracksHandler = mediaModel.on.args[2][1];
            tracksHandler(model, []);

            expect(controls.controlbar.elements.audiotracks.setup.callCount).to.equal(1);
        });

        it.skip('should setup audio tracks element on tracks change', function() {
            controls.controlbar.elements = { audiotracks: { selectItem: sinon.spy() } };

            const tracksHandler = mediaModel.on.args[3][1];
            tracksHandler(model);

            expect(controls.controlbar.elements.audiotracks.selectItem.callCount).to.equal(1);
        });
    });
});
