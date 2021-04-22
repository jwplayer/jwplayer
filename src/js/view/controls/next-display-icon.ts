import { addClickAction } from 'view/utils/add-click-action';
import type { PlayerAPI } from 'types/generic.type';
import type PlaylistItem from 'playlist/item';
import type Model from 'controller/model';
import type UI from 'utils/ui';

export default class NextDisplayIcon {
    el: HTMLElement;
    ui: UI;

    constructor(model: Model, api: PlayerAPI, element: HTMLElement) {
        const iconDisplay = element.querySelector('.jw-icon') as HTMLElement;

        this.ui = addClickAction(iconDisplay, function(): void {
            api.next({ reason: 'interaction' });
        });

        model.change('nextUp', function(nextUpChangeModel: Model, nextUp: PlaylistItem): void {
            element.style.visibility = nextUp ? '' : 'hidden';
        });

        this.el = element;
    }

    element(): HTMLElement {
        return this.el;
    }
}
