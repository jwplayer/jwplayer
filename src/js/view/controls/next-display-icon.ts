import UI from 'utils/ui';
import type { PlayerAPI } from 'types/generic.type';
import type PlaylistItem from 'playlist/item';
import type ViewModel from 'view/view-model';

export default class NextDisplayIcon {
    el: HTMLElement;
    ui: UI;

    constructor(model: ViewModel, api: PlayerAPI, element: HTMLElement) {
        const iconDisplay = element.querySelector('.jw-icon');

        this.ui = new UI(iconDisplay).on('click tap enter', function(): void {
            api.next({ reason: 'interaction' });
        });

        model.change('nextUp', function(nextUpChangeModel: ViewModel, nextUp: PlaylistItem): void {
            element.style.visibility = nextUp ? '' : 'hidden';
        });

        this.el = element;
    }

    element(): HTMLElement {
        return this.el;
    }
}
