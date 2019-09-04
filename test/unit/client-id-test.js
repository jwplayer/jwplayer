// import InfoOverlay from 'view/controls/info-overlay';
// import MockModel from 'mock/mock-model';
// import MockApi from 'mock/mock-api';
// import { registerPlugin } from 'plugins/plugins';


// describe('Info Overlay Client ID', function () {
//     let element;
//     let model;
//     let api;
//     let infoOverlay;

//     function noop () {}

//     function PluginClass () {}

//     PluginClass.prototype.doNotTrackUser = function () {
//         return model.get('doNotTrack');
//     };
    
//     beforeEach(function () {
//         infoOverlay = new InfoOverlay(element, model, api, noop);
//         api = new MockApi();
//         model = new MockModel();
//         element = document.createElement('div');

//         model.setup({ doNotTrack: true });
//     });

//     it('should not show client id in the info overlay if doNotTrackUser returns true', function() {
//         registerPlugin('jwpsrv', '8.0', new PluginClass());

//     });
// });