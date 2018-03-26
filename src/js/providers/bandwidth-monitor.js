import { BANDWIDTH_ESTIMATE } from 'events/events';

export default function BandwidthMonitor(provider, initialEstimate) {
    let bandwidthMonitorInterval = null;
    let bandwidthEstimate = initialEstimate;
    return {
        start() {
            this.stop();
            setInterval(() => {
                bandwidthEstimate = provider.getBandwidthEstimate();
                provider.trigger(BANDWIDTH_ESTIMATE, {
                    bandwidthEstimate
                });
            }, 1000);
        },
        stop() {
            clearInterval(bandwidthMonitorInterval);
        },
        getEstimate() {
            return bandwidthEstimate;
        }
    };
}
