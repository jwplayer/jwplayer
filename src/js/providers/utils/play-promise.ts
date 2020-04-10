type Resolve = () => void;

type Reject = (reason: PlayPromiseError) => void;

type PlayPromiseError = Error & {
    code: number;
}

export default function createPlayPromise(video: HTMLVideoElement): Promise<void> {
    return new Promise(function(resolve: Resolve, reject: Reject): void {
        if (video.paused) {
            return reject(playPromiseError('NotAllowedError', 0, 'play() failed.'));
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
                    reject(playPromiseError('NotSupportedError', 9, message));
                } else {
                    reject(playPromiseError('AbortError', 20, message));
                }
            }
        };
        video.addEventListener('play', playListener);
    });
}

function playPromiseError(name: string, code: number, message: string): PlayPromiseError {
    const error = new Error(message) as PlayPromiseError;
    error.name = name;
    error.code = code;
    return error;
}
