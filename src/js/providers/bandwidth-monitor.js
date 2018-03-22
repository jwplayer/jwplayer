import { BANDWIDTH_ESTIMATE } from 'events/events';
import { _isNumber } from 'utils/underscore';

export default function BandwidthMonitor(provider) {
    let bandwidthMonitorInterval = null;
    return {
        start() {
            setInterval(() => {
                const bandwidthEstimate = provider.getBandwidthEstimate();
                if (_isNumber(bandwidthEstimate)) {
                    provider.trigger(BANDWIDTH_ESTIMATE, {
                        bandwidthEstimate
                    });
                }
            }, 1000);
        },
        stop() {
            clearInterval(bandwidthMonitorInterval);
        }
    };
}
