import type { GenericObject } from 'types/generic.type';
import type Model from 'controller/model';
import { isNumber } from 'utils/underscore';
import { CONTROLBAR_ONLY_HEIGHT } from 'view/utils/audio-mode';

export function getPlayerSizeStyles(model: Model, playerWidth: string | number, playerHeight?: string | number, resetAspectMode?: boolean): GenericObject {
    const styles: GenericObject = {
        width: playerWidth
    };

    // when jwResize is called remove aspectMode and force layout
    if (resetAspectMode && playerHeight !== undefined) {
        model.set('aspectratio', null);
    }
    if (!model.get('aspectratio')) {
        // If the height is a pixel value (number) greater than 0, snap it to the minimum supported height
        // Allow zero to mean "hide the player"
        let height = playerHeight;
        if (isNumber(height) && height !== 0) {
            height = Math.max(height, CONTROLBAR_ONLY_HEIGHT);
        }
        styles.height = height;
    }

    return styles;
}
