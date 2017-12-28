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
        }
    };
}
