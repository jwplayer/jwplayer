const _ = require('utils/underscore');

const supportedFields = [
    'repeat',
    'volume',
    'mute',
    'autostart'
];
let model;

function setVolume(mute, volume) {
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

function setAutoStart(controller, autoStart) {
    model.setAutoStart(autoStart);

    if (model.get('state') === 'idle' && autoStart === true) {
        controller._play({ reason: 'autostart' });
    }
}

export default (controller, newConfig = {}) => {
    model = controller._model;

    if (!_.size(newConfig)) {
        return;
    }

    let newValue;
    for (let field of supportedFields) {
        newValue = newConfig[field];

        if (_.isUndefined(newValue)) {
            continue;
        }

        switch (field) {
            case 'mute':
            case 'volume':
                setVolume(newConfig.mute, newConfig.volume);
                break;
            case 'autostart':
                setAutoStart(controller, newConfig.autostart);
                break;
            default:
                model.set(field, newValue);
        }
    }
};
