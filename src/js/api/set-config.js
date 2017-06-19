const _ = require('utils/underscore');

const supportedFields = [
    'repeat',
    'volume',
    'mute',
    'autostart'
];

function setVolume(model, mute, volume) {
    const muteSet = !_.isUndefined(mute);
    const volumeSet = !_.isUndefined(volume);

    if (volumeSet) {
        model.setVolume(volume);
        if (!muteSet) {
            model.setMute(volume === 0);
        }
    }

    if (muteSet) {
        model.setMute(mute);
    }
}

function setAutoStart(model, controller, autoStart) {
    model.setAutoStart(autoStart);

    if (model.get('state') === 'idle' && autoStart === true) {
        controller._play({ reason: 'autostart' });
    }
}

export default (controller, newConfig = {}) => {
    const model = controller._model;

    if (!_.size(newConfig)) {
        return;
    }

    let newValue;
    supportedFields.forEach(field => {
        newValue = newConfig[field];

        if (_.isUndefined(newValue)) {
            return;
        }

        switch (field) {
            case 'mute':
            case 'volume':
                setVolume(model, newConfig.mute, newConfig.volume);
                break;
            case 'autostart':
                setAutoStart(model, controller, newConfig.autostart);
                break;
            default:
                model.set(field, newValue);
        }
    });
};
