import { Browser } from 'environment/environment';

export default function(_model) {
    const _video = _model.getVideo().video;

    const checkAvailability = function() {
        const pipIsSupported = (Browser.chrome && document.pictureInPictureEnabled) ||
            (Browser.safari &&
            (_video.webkitSupportsPresentationMode && typeof _video.webkitSetPresentationMode === 'function'));

        _model.set('pipAvailable', pipIsSupported);
    };

    const enablePictureInPicture = function() {
        if (Browser.safari) {
            _video.webkitSetPresentationMode(_video.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
        } else {
            _video.requestPictureInPicture();
        }
    };

    _model.on('itemReady', checkAvailability);

    return {
        isAvailable: function() {
            return _model.get('pipAvailable');
        },
        checkAvailability,
        enablePictureInPicture
    };
}
