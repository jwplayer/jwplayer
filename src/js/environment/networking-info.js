function NetworkingInfo () {
    this.type = undefined;
    this.effectiveType = undefined;
    this.downlinkMax = 0;
    this.downlink = 0;
    this.rtt = 0;
    this.saveData = false;
    this.onLine = false;
}

Object.assign(NetworkingInfo.prototype, navigator.connection);

export default NetworkingInfo;