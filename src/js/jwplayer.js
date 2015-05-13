define([
    'api/global-api',
    'utils/helpers',
    'polyfill/bind',
    'polyfill/eventlisteners',
    '../css/jwplayer.less'
], function (GlobalApi, utils) {
    /*global __webpack_public_path__:true*/
    __webpack_public_path__ = utils.getScriptPath('jwplayer.js');
    return GlobalApi.selectPlayer;
});