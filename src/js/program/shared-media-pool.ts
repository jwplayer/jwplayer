import { MediaElementPoolInt } from 'program/media-element-pool';

export default function SharedMediaPool(sharedElement: HTMLVideoElement, mediaPool: MediaElementPoolInt): MediaElementPoolInt {
    return Object.assign({}, mediaPool, {
        prime(): void {
            if (!sharedElement.src) {
                sharedElement.load();
            }
        },
        getPrimedElement(): HTMLVideoElement {
            return sharedElement;
        },
        clean(): void {
            mediaPool.clean(sharedElement);
        },
        recycle(): void {
            mediaPool.clean(sharedElement);
        }
    });
}
