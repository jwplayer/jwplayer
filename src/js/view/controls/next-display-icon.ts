import UI from 'utils/ui';
import type { CoreModel, PlayerAPI, PlaylistItemType } from 'types/generic.type';

export default class NextDisplayIcon {
    el: HTMLElement;
    ui: UI;

    constructor(model: CoreModel, api: PlayerAPI, element: HTMLElement) {
        const iconDisplay = element.querySelector('.jw-icon');

        this.ui = new UI(iconDisplay).on('click tap enter', function(): void {
            api.next({ reason: 'interaction' });
        });

        model.change('nextUp', function(nextUpChangeModel: CoreModel, nextUp: PlaylistItemType): void {
            element.style.visibility = nextUp ? '' : 'hidden';
        });

        this.el = element;
    }

    element(): HTMLElement {
        return this.el;
    }
}
