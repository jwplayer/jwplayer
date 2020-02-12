import { MediaElementPoolInt, OptionalUndefVideo } from './media-element-pool';

export default function SharedMediaPool(sharedElement: HTMLVideoElement, mediaPool: MediaElementPoolInt): MediaElementPoolInt {
    return Object.assign({}, mediaPool, {
        prime(): void {
            if (!sharedElement.src) {
                sharedElement.load();
            }
        },
        getPrimedElement(): OptionalUndefVideo {
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
