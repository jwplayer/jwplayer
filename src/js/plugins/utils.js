// Extract a plugin name from a string
export const getPluginName = function(url) {
    // Regex locates the characters after the last slash, until it encounters a dash.
    return url.replace(/^(.*\/)?([^-]*)-?.*\.(js)$/, '$2');
};

export function mapPluginToCode(pluginUrl) {
    let code = 305000;
    if (!pluginUrl) {
        return code;
    }

    switch (getPluginName(pluginUrl)) {
        case 'jwpsrv':
            code = 305001;
            break;
        case 'googima':
            code = 305002;
            break;
        case 'vast':
            code = 305003;
            break;
        case 'freewheel':
            code = 305004;
            break;
        case 'dai':
            code = 305005;
            break;
        case 'gapro':
            code = 305006;
            break;
        default:
            break;
    }

    return code;
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

