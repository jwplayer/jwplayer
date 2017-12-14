const navigator = window.navigator;

const networkingDefaults = {
    type: undefined,
    effectiveType: undefined,
    downlinkMax: 0,
    downlink: 0,
    rtt: 0,
    saveData: false,
};

export function getNetworkInfo(model) {

    const networkInfo = navigator.connection;

    const networkingState = Object.assign({
        onLine: navigator.onLine,
        bandwidthEstimate: model.get('bandwidthEstimate')
    }, networkingDefaults, networkInfo);

    delete networkingState.onchange;

    return networkingState;
}
