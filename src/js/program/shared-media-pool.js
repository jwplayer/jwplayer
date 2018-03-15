export default function SharedMediaPool(sharedElement, mediaPool) {
    return Object.assign({}, mediaPool, {
        prime() {
            if (!sharedElement.src) {
                sharedElement.load();
            }
        },
        getPrimedElement() {
            return sharedElement;
        },
        clean() {
            mediaPool.clean(sharedElement);
        },
        recycle() {
            mediaPool.clean(sharedElement);
        }
    });
}
