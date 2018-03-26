import { BANDWIDTH_ESTIMATE } from 'events/events';

export default function BandwidthMonitor(provider, initialEstimate) {
    let bandwidthMonitorInterval = null;
    let bandwidthEstimate = initialEstimate;
    return {
        start() {
            this.stop();
            setInterval(() => {
                const bwEstimate = provider.getBandwidthEstimate();
                if (!bwEstimate) {
                    return;
                }
                bandwidthEstimate = bwEstimate;
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
