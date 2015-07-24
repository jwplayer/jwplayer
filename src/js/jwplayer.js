define([
    'api/global-api',
    'utils/helpers',
    '../css/jwplayer.less'
], function (GlobalApi, utils) {
    /*global __webpack_public_path__:true*/
    __webpack_public_path__ = utils.loadFrom();

    return GlobalApi.selectPlayer;
});