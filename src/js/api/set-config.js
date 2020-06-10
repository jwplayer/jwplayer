import { normalizeAspectRatio, normalizeSize } from 'api/config-normalization';

const FLOAT_ENUM = ['notVisible', 'always', 'never'];

function setAutoStart(model, controller, autoStart) {
    model.setAutoStart(autoStart);

    if (model.get('state') === 'idle' && autoStart === true) {
        controller.play({ reason: 'autostart' });
    }
}

export default (controller, newConfig) => {
    const model = controller._model;
    const attributes = model.attributes;

    if (newConfig.height) {
        // Prepare width and height for view.resize()
        newConfig.height = normalizeSize(newConfig.height);
        newConfig.width = newConfig.width || attributes.width;
    }
    if (newConfig.width) {
        newConfig.width = normalizeSize(newConfig.width);
        if (newConfig.aspectratio) {
            // Silently set width on the model for aspectratio update
            attributes.width = newConfig.width;
            delete newConfig.width;
        } else {
            // Prepare width and height for view.resize()
            newConfig.height = attributes.height;
        }
    }
    // Call view.resize() for width and height when aspectratio is not defined
    if (newConfig.width && newConfig.height && !newConfig.aspectratio) {
        controller._view.resize(newConfig.width, newConfig.height);
    }

    if (newConfig.floating) {
        const currFloatCfg = model.get('floating') || {};
        const currFloatMode = currFloatCfg.mode;
        const newFloatCfg = Object.assign({}, currFloatCfg, newConfig.floating);
        if (currFloatMode === newFloatCfg.mode || FLOAT_ENUM.indexOf(newFloatCfg.mode) === -1) {
            delete newConfig.floating;
        } else {
            newConfig.floating = newFloatCfg;
            model.set('floating', newFloatCfg);
        }
    }

    Object.keys(newConfig).forEach((field) => {
        const newValue = newConfig[field];
        if (newValue === undefined) {
            return;
        }

        switch (field) {
            case 'aspectratio':
                model.set(field, normalizeAspectRatio(newValue, attributes.width));
                break;
            case 'autostart':
                setAutoStart(model, controller, newValue);
                break;
            case 'mute':
                controller.setMute(newValue);
                break;
            case 'volume':
                controller.setVolume(newValue);
                break;
            case 'playbackRateControls':
            case 'playbackRates':
            case 'repeat':
            case 'stretching':
            case 'floating':
                model.set(field, newValue);
                break;
            default:
        }
    });
};
