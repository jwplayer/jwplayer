define([
    'test/underscore'
], function (_) {

    var video = document.createElement('video');

    // PhantomJS throws an error when video.load() is called
    // Installing this polyfill before tests makes all calls to
    // document.create('video') return the video instance in mock/video
    // which performs noop functions when load, play and pause are called
    try {
        video.load();
    } catch (error) {
        console.error('video element load() not supported.');

        var createElementNative = document.createElement;
        document.createElement = function(name) {
            if (name === 'video') {
                return video;
            }
            return createElementNative.call(this, name);
        };
    }

    // override/polyfill HTMLVideoElement methods and properties
    // to keep results consistent across browsers in current tests
    // when running unit tests this file is loaded in place of src/utils/video
    video.load = _.noop;
    video.play = _.noop;
    video.pause = _.noop;
    video.canPlayType = function(type) {
        return _.contains([
            'video/mp4',
            'video/mp3',
            'audio/mp4',
            'video/aac',
            'audio/mpeg',
            'video/ogg',
            'audio/ogg',
            'video/webm'
        ], type);
    };

    return video;
});
