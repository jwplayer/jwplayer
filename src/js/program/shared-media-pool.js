export default function SharedMediaPool(mediaPool) {
    const sharedElement = mediaPool.getPrimedElement();
    return {
        prime() {
            sharedElement.load();
        },
        getPrimedElement() {
            return sharedElement;
        },
        recycle() {
            mediaPool.clean(sharedElement);
        },
        syncVolume() {
        },
        syncMute() {
        }
    };
}
