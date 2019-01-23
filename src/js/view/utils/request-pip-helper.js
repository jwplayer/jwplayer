import { Browser } from 'environment/environment';

export default function(_model) {
    // if (!_model || _model.getVideo() !== undefined) {
    //     return;
    // }

    const _video = _model.getVideo().video;

    const checkAvailability = function() {
        const pipIsSupported = document.pictureInPictureEnabled || (_video.webkitSupportsPresentationMode && typeof _video.webkitSetPresentationMode === 'function');

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
