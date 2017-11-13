import sinon from 'sinon';
import SimpleModel from 'model/simplemodel';
import * as menu from 'view/controls/components/settings/menu';
import * as SettingsMenu from 'view/controls/settings-menu';

describe('SettingsMenu', function() {

    let controlbar;
    let settingsMenu;

    before(function() {
        sinon.stub(menu, 'SettingsMenu');
    });

    beforeEach(function() {
        controlbar = {};
        controlbar.on = sinon.stub();
        controlbar.elements = {
            hd: { selectItem: sinon.spy() },
            settingsButton: sinon.spy()
        };

        settingsMenu = {
            setup: sinon.spy(),
            open: sinon.spy(),
            element: sinon.stub(),
            removeSubmenu: sinon.spy(),
            getSubmenu: sinon.spy(),
            activateFirstSubmenu: sinon.spy(),
            activateSubmenu: sinon.spy()
        };
        settingsMenu.element.returns(document.createElement('div'));

        menu.SettingsMenu.returns(settingsMenu);
    });

    describe('createSettingsMenu', function() {

        it('should create a SettingsMenu object', function() {
            const settings = SettingsMenu.createSettingsMenu(controlbar, () => {});

            expect(settings).to.equal(settingsMenu);
        });

        it('should setup Settings menu', function() {
            SettingsMenu.createSettingsMenu(controlbar, () => {});

            const handler = controlbar.on.args[0][1];

            handler('menu', true);

            expect(settingsMenu.activateFirstSubmenu.callCount).to.equal(1);
        });

        it('should get submenu in visibility listener', function() {
            SettingsMenu.userActive = sinon.spy();
            SettingsMenu.createSettingsMenu(controlbar, () => {});

            const handler = controlbar.on.args[0][1];

            handler('menu', true);

            expect(settingsMenu.getSubmenu.callCount).to.equal(1);
        });
    });

    describe('setupSubmenuListeners', function() {

        let model;
        let mediaModel;

        beforeEach(function() {
            model = Object.assign({}, SimpleModel);
            model.change = sinon.spy();
            mediaModel = Object.assign({}, SimpleModel);
            mediaModel.on = sinon.spy();
            mediaModel.change = sinon.spy();

            SettingsMenu.setupSubmenuListeners(settingsMenu, controlbar, model);

            const changeHandler = model.change.args[0][1];
            changeHandler('', mediaModel);
        });

        it('should setup qualities element on levels change', function() {
            controlbar.elements = { hd: { setup: sinon.spy() } };

            const levelsHandler = mediaModel.on.args[0][1];
            levelsHandler(model);

            expect(mediaModel.change.args[0][0]).to.equal('levels');
        });

        it('should update quality element on level change', function() {
            controlbar.elements = { hd: { selectItem: sinon.spy() } };

            const levelHandler = mediaModel.on.args[0][1];
            levelHandler(model);

            expect(mediaModel.on.args[0][0]).to.equal('change:currentLevel');
        });

        it('should setup audio tracks element on tracks change', function() {
            controlbar.elements = { audiotracks: { setup: sinon.spy() } };

            const tracksHandler = mediaModel.change.args[1][1];
            tracksHandler(model, []);

            expect(mediaModel.change.args[1][0]).to.equal('audioTracks');
        });

        it('should setup audio tracks element on tracks change', function() {
            controlbar.elements = { audiotracks: { selectItem: sinon.spy() } };

            const tracksHandler = mediaModel.on.args[1][1];
            tracksHandler(model);

            expect(mediaModel.on.args[1][0]).to.equal('change:currentAudioTrack');
        });
    });
});
