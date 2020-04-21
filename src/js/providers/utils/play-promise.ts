export default function createPlayPromise(video: HTMLVideoElement): Promise<void> {
    return new Promise(function(resolve: () => void, reject: (reason: DOMException) => void): void {
        if (video.paused) {
            return reject(new DOMException('play() failed.', 'NotAllowedError'));
        }
        const removeEventListeners = function(): void {
            video.removeEventListener('play', playListener);
            video.removeEventListener('playing', listener);
            video.removeEventListener('pause', listener);
            video.removeEventListener('abort', listener);
            video.removeEventListener('error', listener);
        };
        const playListener = function(): void {
            video.addEventListener('playing', listener);
            video.addEventListener('abort', listener);
            video.addEventListener('error', listener);
            video.addEventListener('pause', listener);
        };
        const listener = function(e: Event): void {
            removeEventListeners();
            if (e.type === 'playing') {
                resolve();
            } else {
                const message = `The play() request was interrupted by a "${e.type}" event.`;
                if (e.type === 'error') {
                    reject(new DOMException(message, 'NotSupportedError'));
                } else {
                    reject(new DOMException(message, 'AbortError'));
                }
            }
        };
        video.addEventListener('play', playListener);
    });
}
