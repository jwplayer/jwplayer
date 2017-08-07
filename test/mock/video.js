import _ from 'test/underscore';

// override/polyfill HTMLVideoElement methods and properties
// to keep results consistent across browsers in current tests
// when running unit tests this file is loaded in place of src/utils/video
const video = document.createElement('video');

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

export default video;
