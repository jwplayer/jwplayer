import { _size, _isUndefined } from 'utils/underscore';

const supportedFields = [
    'repeat',
    'volume',
    'mute',
    'autostart'
];

function setAutoStart(model, controller, autoStart) {
    model.setAutoStart(autoStart);

    if (model.get('state') === 'idle' && autoStart === true) {
        controller.play({ reason: 'autostart' });
    }
}

export default (controller, newConfig) => {
    const model = controller._model;

    if (!_size(newConfig)) {
        return;
    }

    supportedFields.forEach(field => {
        const newValue = newConfig[field];

        if (_isUndefined(newValue)) {
            return;
        }

        switch (field) {
            case 'mute':
                controller.setMute(newValue);
                break;
            case 'volume':
                controller.setVolume(newValue);
                break;
            case 'autostart':
                setAutoStart(model, controller, newValue);
                break;
            default:
                model.set(field, newValue);
        }
    });
};
