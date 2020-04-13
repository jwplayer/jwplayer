import { style } from 'utils/css';
import {
    replaceInnerHtml
} from 'utils/dom';
import { Browser } from 'environment/environment';
import type ViewModel from './view-model';
import type { PlayerViewModel } from './view-model';
import type Model from 'controller/model';
import type PlaylistItem from 'playlist/item';

class Title {
    model: PlayerViewModel;
    truncated: boolean;
    el?: HTMLElement;
    title?: HTMLElement;
    description?: HTMLElement;

    constructor(_model: ViewModel) {
        this.model = _model.player;
        this.truncated = _model.get('__ab_truncated') && !Browser.ie;
    }

    // This is normally shown/hidden by states
    //   these are only used for when no title exists
    hide(): void {
        style(this.el, { display: 'none' });
    }
    show(): void {
        style(this.el, { display: '' });
    }

    setup(titleEl: HTMLElement): void {
        this.el = titleEl;

        if (!this.el) {
            return;
        }

        // Perform the DOM search only once
        const arr = this.el.getElementsByTagName('div');
        this.title = arr[0];
        this.description = arr[1];
        if (this.truncated) {
            this.el.classList.add('jw-ab-truncated');
        }
        this.model.on('change:logoWidth', this.update, this);
        this.model.change('playlistItem', this.playlistItem, this);
    }

    update(model: Model): void {
        const titleStyle: {
            paddingLeft?: number;
            paddingRight?: number;
        } = {};
        const logo = model.get('logo');
        if (logo) {
            // Only use Numeric or pixel ("Npx") margin values
            const margin = 1 * parseInt(('' + logo.margin).replace('px', ''));
            const padding = model.get('logoWidth') + (isNaN(margin) ? 0 : margin + 10);
            if (logo.position === 'top-left') {
                titleStyle.paddingLeft = padding;
            } else if (logo.position === 'top-right') {
                titleStyle.paddingRight = padding;
            }
        }
        style(this.el, titleStyle);
    }

    playlistItem(model: PlayerViewModel, item: PlaylistItem): void {
        if (!item) {
            return;
        }
        if (model.get('displaytitle') || model.get('displaydescription')) {
            let title = '';
            let description = '';

            if (item.title && model.get('displaytitle')) {
                title = item.title;
            }
            if (item.description && model.get('displaydescription')) {
                description = item.description;
            }

            this.updateText(title, description);
        } else {
            this.hide();
        }
    }

    updateText(title: string, description: string): void {
        if (!this.title || !this.description) {
            return;
        }
        replaceInnerHtml(this.title, title);
        replaceInnerHtml(this.description, description);

        if (this.title.firstChild || this.description.firstChild) {
            this.show();
        } else {
            this.hide();
        }
    }

    element(): HTMLElement | undefined {
        return this.el;
    }
}

export default Title;
