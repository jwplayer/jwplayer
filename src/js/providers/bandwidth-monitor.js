import { BANDWIDTH_ESTIMATE } from 'events/events';
import { isValidNumber } from 'utils/underscore';

export default function BandwidthMonitor(provider, initialEstimate) {
    let bandwidthMonitorInterval = null;
    let bandwidthEstimate = initialEstimate;
    return {
        start() {
            this.stop();
            setInterval(() => {
                const bwEstimate = provider.getBandwidthEstimate();
                if (!isValidNumber(bwEstimate)) {
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
