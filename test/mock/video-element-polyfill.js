import video from 'mock/video';

// PhantomJS throws an error when video.load() is called
// Installing this polyfill before tests makes all calls to
// document.create('video') return the video instance in mock/video
// which performs noop functions when load, play and pause are called

let createElementNative;

try {
    document.createElement('video').load();
} catch (error) {
    console.error('video element load() not supported.');
    createElementNative = document.createElement;
}

export function install() {
    if (createElementNative) {
        document.createElement = function(name) {
            if (name === 'video') {
                return video;
            }
            return createElementNative.call(this, name);
        };
    }
}

export function uninstall() {
    if (createElementNative) {
        document.createElement = createElementNative;
    }
}
