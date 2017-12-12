export default function AdMediaPool(adElement) {

    return {
        prime() {
            adElement.load();
        },
        getPrimedElement() {
            return adElement;
        },
        recycle() {},
        syncVolume: function (volume) {
            adElement.volume = volume / 100;
        },
        syncMute(mute) {
            adElement.muted = mute;
        }
    };
}
