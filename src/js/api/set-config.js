import { normalizeAspectRatio, normalizeSize } from 'api/config-normalization';

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
                model.set(field, newValue);
                break;
            case 'floating':
                const currFloatCfg = model.get('floating') || {};
                const currFloatMode = currFloatCfg.mode;
                const newFloatCfg = Object.assign(currFloatCfg, newValue);
                if (currFloatMode !== newFloatCfg.mode) {
                    model.set('floating', newFloatCfg);
                    switch(newFloatCfg.mode) {
                        case 'always':
                            controller._view.initFloatingBehavior();
                            break;
                        case 'notVisible':
                            controller._view.initFloatingBehavior();
                            controller._view.checkFloatIntersection();
                            break;
                        case 'never':
                            controller._view.stopFloating();
                            break;
                    }
                }
                break;
            default:
        }
    });
};
