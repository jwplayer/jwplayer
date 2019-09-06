import InfoOverlay from 'view/controls/info-overlay';
import MockModel from 'mock/mock-model';
import MockApi from 'mock/mock-api';

describe('Info Overlay Client ID', function () {
    let model = new MockModel();
    model.setup({});

    function noop () {}

    function createAPI(doNotTrackUser) {
        let api = new MockApi();
        let oldGetPlugin = api.getPlugin;
        api.getPlugin = function(name) {
            if (name === 'jwpsrv') {
                return {
                    doNotTrackUser: () => doNotTrackUser
                };
            } else {
                return oldGetPlugin(name);
            }
        };
        return api;
    }

    afterEach(() => {
        localStorage.removeItem('jwplayerLocalId');
    });

    it('should not show client id in the info overlay if doNotTrackUser returns true', function() {
        let api = createAPI(true);
        let element = document.createElement('div');
        let infoOverlay = new InfoOverlay(element, model, api, noop);
        document.body.appendChild(element);
        expect(api.getPlugin('jwpsrv').doNotTrackUser()).to.be.true;
        infoOverlay.open();
        expect(element.querySelector('.jw-info-clientid').innerText).to.eql('');

    });
    it('should show client id in the info overlay if doNotTrackUser returns false', function() {
        localStorage.setItem('jwplayerLocalId', 'test123');

        let api = createAPI(false);
        let element = document.createElement('div');
        let infoOverlay = new InfoOverlay(element, model, api, noop);
        document.body.appendChild(element);
        expect(api.getPlugin('jwpsrv').doNotTrackUser()).to.be.false;
        infoOverlay.open();
        expect(element.querySelector('.jw-info-clientid').innerText).to.eql('Client ID: test123');
    });
});
