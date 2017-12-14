const networkingDefaults = {
    type: undefined,
    effectiveType: undefined,
    downlinkMax: 0,
    downlink: 0,
    rtt: 0,
    saveData: false,
    onLine: false
};

const networkingInfo = function (_) {
    if (navigator && navigator.connection) {
        return _.extend(networkingDefaults, navigator.connection);
        //TODO: remove onchange, might not want to support on other browsers
    }
    return networkingDefaults;
};

export default networkingInfo;