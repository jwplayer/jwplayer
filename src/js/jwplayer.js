define([
    'api/global-api',
    'polyfill/bind',
    'polyfill/eventlisteners',
    '../css/styles.less',
    '../css/imports/errorscreen.less'
], function (GlobalApi) {
    return GlobalApi.selectPlayer;
});