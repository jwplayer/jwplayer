import MockModel from 'mock/mock-model';
import SettingsMenu from 'view/controls/components/menu/settings-menu';

class TestApi {
    constructor(){
        this.playing = null;
    }

    play(){
        this.playing = 'playing';
    }

    pause(){
        this.playing = 'paused';
    }
}

describe('Mobile Behavior', function () {
    const model = new MockModel();
    let api = new TestApi();
    let controlbar = {};
    let settingsMenu;

    model.set('state', 'playing');
    controlbar.elements = {
        settingsButton: {
            toggle: function(bool) { 
                if (bool) {
                    return this.show();
                }
                return this.hide();
            },
            element: () => {}
        }
    };
    controlbar.toggleCaptionsButtonState = sinon.spy();
    settingsMenu = new SettingsMenu(api, model, controlbar, '');

    it('should pause when menu is open on breakpoint 0', function () {
        model.set('containerWidth', 250); // breakpoint 0
        api.play();
        expect(api.playing).to.equal('playing');
        settingsMenu.open();
        expect(api.playing).to.equal('paused');
        settingsMenu.close();
        expect(api.playing).to.equal('playing');
    })

    it('should pause when menu is open on breakpoint 1', function () {
        model.set('containerWidth', 320); // breakpoint 1
        api.play();
        expect(api.playing).to.equal('playing');
        settingsMenu.open();
        expect(api.playing).to.equal('paused');
        settingsMenu.close();
        expect(api.playing).to.equal('playing');
    })

    it('should not pause when menu is open on breakpoints higher than 1', function () {
        model.set('containerWidth', 420); // breakpoint 2
        api.play();
        expect(api.playing).to.equal('playing');
        settingsMenu.open();
        expect(api.playing).to.equal('playing');
        settingsMenu.close();
        expect(api.playing).to.equal('playing');
    })
});
