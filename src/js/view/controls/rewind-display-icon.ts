import { addClickAction } from 'view/utils/add-click-action';
import type UI from 'utils/ui';
import type ViewModel from 'view/view-model';
import type { PlayerAPI } from 'types/generic.type';
export default class RewindDisplayIcon {
    el: HTMLElement;
    ui: UI;

    constructor(model: ViewModel, api: PlayerAPI, element: HTMLElement) {
        const iconDisplay = element.querySelector('.jw-icon') as HTMLElement;

        this.el = element;
        this.ui = addClickAction(iconDisplay, function(): void {
            const currentPosition = model.get('position');
            const duration = model.get('duration');
            const rewindPosition = currentPosition - 10;
            let startPosition = 0;

            // duration is negative in DVR mode
            if (model.get('streamType') === 'DVR') {
                startPosition = duration;
            }
            // Seek 10s back. Seek value should be >= 0 in VOD mode and >= (negative) duration in DVR mode
            api.seek(Math.max(rewindPosition, startPosition));
        });
    }

    element(): HTMLElement {
        return this.el;
    }
}
