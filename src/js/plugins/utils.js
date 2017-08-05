import strings from 'utils/strings';

export const PLUGIN_PATH_TYPE_ABSOLUTE = 0;
export const PLUGIN_PATH_TYPE_RELATIVE = 1;
export const PLUGIN_PATH_TYPE_CDN = 2;

export const getPluginPathType = function (path) {
    if (typeof path !== 'string') {
        return;
    }
    path = path.split('?')[0];
    var protocol = path.indexOf('://');
    if (protocol > 0) {
        return PLUGIN_PATH_TYPE_ABSOLUTE;
    }
    var folder = path.indexOf('/');
    var extension = strings.extension(path);
    if (protocol < 0 && folder < 0 && (!extension || !isNaN(extension))) {
        return PLUGIN_PATH_TYPE_CDN;
    }
    return PLUGIN_PATH_TYPE_RELATIVE;
};


/**
 * Extracts a plugin name from a string
 */
export const getPluginName = function (pluginName) {
    /** Regex locates the characters after the last slash, until it encounters a dash. **/
    return pluginName.replace(/^(.*\/)?([^-]*)-?.*\.(swf|js)$/, '$2');
};

/**
 * Extracts a plugin version from a string
 */
export const getPluginVersion = function (pluginName) {
    return pluginName.replace(/[^-]*-?([^.]*).*$/, '$1');
};
