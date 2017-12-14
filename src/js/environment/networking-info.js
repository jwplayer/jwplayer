const networkingDefaults = {
    type: undefined,
    effectiveType: undefined,
    downlinkMax: 0,
    downlink: 0,
    rtt: 0,
    saveData: false,
    onLine: false
};

const networkingInfo = function (_, provider) {
    if (navigator && navigator.connection) {
        return _.extend({}, networkingDefaults, navigator.connection);
        // TODO: remove onchange, might not want to support on other browsers
    }

    if (provider && provider.name === 'hlsjs') {
        // TODO: obtain downlink from hls.js
    } else if (provider && provider.name === 'shaka') {
        // TODO: obtain downlink from shaka
    }

    return networkingDefaults;
};

export default networkingInfo;
