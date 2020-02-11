// Extract a plugin name from a string
export const getPluginName = function(url) {
    // Regex locates the characters after the last slash, until it encounters a dash.
    return url.replace(/^(.*\/)?([^-]*)-?.*\.(js)$/, '$2');
};

export function getPluginErrorCode(/* pluginUrl */) {
    return 305000;
}

export function configurePlugin(pluginObj, pluginConfig, api) {
    const pluginName = pluginObj.name;

    const div = document.createElement('div');
    div.id = api.id + '_' + pluginName;
    div.className = 'jw-plugin jw-reset';

    const pluginOptions = Object.assign({}, pluginConfig);
    const pluginInstance = pluginObj.getNewInstance(api, pluginOptions, div);

    api.addPlugin(pluginName, pluginInstance);
    return pluginInstance;
}

