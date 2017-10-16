define([
    'mock/video'
], function (video) {
    // PhantomJS throws an error when video.load() is called
    // Installing this polyfill before tests makes all calls to
    // document.create('video') return the video instance in mock/video
    // which performs noop functions when load, play and pause are called

    var createElementNative;

    try {
        document.createElement('video').load();
    } catch (error) {
        console.error('video element load() not supported.');
        createElementNative = document.createElement;
    }

    return {
        install: function() {
            if (createElementNative) {
                document.createElement = function(name) {
                    if (name === 'video') {
                        return video;
                    }
                    return createElementNative.call(this, name);
                };
            }
        },
        uninstall: function() {
            if (createElementNative) {
                document.createElement = createElementNative;
            }
        }
    };
});