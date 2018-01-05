export default function SharedMediaPool(sharedElement, mediaPool) {
    return {
        prime() {
            sharedElement.load();
        },
        getPrimedElement() {
            return sharedElement;
        },
        clean() {
            mediaPool.clean(sharedElement);
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
