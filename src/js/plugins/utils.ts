import type { PluginObj, GenericObject, PlayerAPI } from 'types/generic.type';

// Extract a plugin name from a string
export const getPluginName = function(url: string): string {
    // Regex locates the characters after the last slash, until it encounters a dash.
    return url.replace(/^(.*\/)?([^-]*)-?.*\.(js)$/, '$2');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getPluginErrorCode(pluginURL: string): number {
    return 305000;
}

export function configurePlugin(pluginObj: PluginObj, pluginConfig: GenericObject, api: PlayerAPI): PluginObj {
    const pluginName = pluginObj.name;
    const pluginOptions = Object.assign({}, pluginConfig);

    if (__HEADLESS__) {
        const pluginInstance = pluginObj.getNewInstance(api, pluginOptions);
        api.addPlugin(pluginName, pluginInstance);
        return pluginInstance;
    }

    const div = document.createElement('div');
    div.id = api.id + '_' + pluginName;
    div.className = 'jw-plugin jw-reset';

    const pluginInstance = pluginObj.getNewInstance(api, pluginOptions, div);
    api.addPlugin(pluginName, pluginInstance);
    return pluginInstance;
}

