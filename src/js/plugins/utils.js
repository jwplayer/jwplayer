define([
    'utils/strings'
], function(strings) {

    var utils = {};

    /**
     * Types of plugin paths
     */
    var _pluginPathType = utils.pluginPathType = {
        ABSOLUTE: 0,
        RELATIVE: 1,
        CDN: 2
    };

    utils.getPluginPathType = function (path) {
        if (typeof path !== 'string') {
            return;
        }
        path = path.split('?')[0];
        var protocol = path.indexOf('://');
        if (protocol > 0) {
            return _pluginPathType.ABSOLUTE;
        }
        var folder = path.indexOf('/');
        var extension = strings.extension(path);
        if (protocol < 0 && folder < 0 && (!extension || !isNaN(extension))) {
            return _pluginPathType.CDN;
        }
        return _pluginPathType.RELATIVE;
    };


    /**
     * Extracts a plugin name from a string
     */
    utils.getPluginName = function (pluginName) {
        /** Regex locates the characters after the last slash, until it encounters a dash. **/
        return pluginName.replace(/^(.*\/)?([^-]*)-?.*\.(swf|js)$/, '$2');
    };

    /**
     * Extracts a plugin version from a string
     */
    utils.getPluginVersion = function (pluginName) {
        return pluginName.replace(/[^-]*-?([^\.]*).*$/, '$1');
    };

    return utils;
});
