export default function AdMediaPool(mediaPool) {

    const adElement = mediaPool.getPrimedElement();

    return {
        prime() {
            adElement.load();
        },
        getPrimedElement() {
            return adElement;
        },
        recycle() {
            mediaPool.recycle(adElement);
        },
        syncVolume: function (volume) {
            adElement.volume = volume / 100;
        },
        syncMute(mute) {
            adElement.muted = mute;
        }
    };
}
