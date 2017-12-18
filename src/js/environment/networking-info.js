const navigator = window.navigator;

const networkingDefaults = {
    type: undefined,
    effectiveType: undefined,
    downlinkMax: 0,
    downlink: 0,
    rtt: 0,
    saveData: false,
};

export default function getNetworkInfo(model) {
    const networkingState = Object.assign({
        onLine: navigator.onLine,
        bandwidthEstimate: model.get('bandwidthEstimate')
    }, networkingDefaults);

    // navigator.connection properties are not enumerable, so copy over default keys
    const networkInfo = navigator.connection;

    if (networkInfo) {
        Object.keys(networkingDefaults).forEach(property => {
            networkingState[property] = networkInfo[property];
        });
    }

    return networkingState;
}
