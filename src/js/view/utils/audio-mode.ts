import type SimpleModel from 'model/simplemodel';

export const CONTROLBAR_ONLY_HEIGHT = 44;

export const isAudioMode = function(model: SimpleModel): boolean {
    const playerHeight = model.get('height');
    if (model.get('aspectratio')) {
        return false;
    }
    if (typeof playerHeight === 'string' && playerHeight.indexOf('%') > -1) {
        return false;
    }

    // Coerce into Number (don't parse out CSS units)
    let verticalPixels = (playerHeight * 1) || NaN;
    verticalPixels = (!isNaN(verticalPixels) ? verticalPixels : model.get('containerHeight'));
    if (!verticalPixels) {
        return false;
    }

    return !!(verticalPixels && verticalPixels <= CONTROLBAR_ONLY_HEIGHT);
};
