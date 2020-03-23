import UI from 'utils/ui';
import svgParse from 'utils/svgParser';
import helpers from 'utils/helpers';
import type { PlayerAPI } from 'types/generic.type';

export type Button = {
    ui: UI;
    element: () => HTMLElement;
    toggle: (condition: any) => void;
    show: () => void;
    hide: () => void;
}

export type ButtonName = string;

export default function (
    icon: string,
    apiAction: (value: unknown) => PlayerAPI,
    ariaText: string,
    svgIcons: Array<SVGElement|string>
): Button {
    const element = document.createElement('div');
    element.className = 'jw-icon jw-icon-inline jw-button-color jw-reset ' + icon;
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');

    if (ariaText) {
        element.setAttribute('aria-label', ariaText);
    }

    element.style.display = 'none';

    const ui: UI = new UI(element).on('click tap enter', apiAction || helpers.noop);

    if (svgIcons) {
        Array.prototype.forEach.call(svgIcons, svgIcon => {
            if (typeof svgIcon === 'string') {
                element.appendChild(svgParse(svgIcon));
            } else {
                element.appendChild(svgIcon);
            }
        });
    }

    return {
        ui,
        element: function(): HTMLElement {
            return element;
        },
        toggle: function(this: Button, m: any): void {
            if (m) {
                this.show();
            } else {
                this.hide();
            }
        },
        show: function(): void {
            element.style.display = '';
        },
        hide: function(): void {
            element.style.display = 'none';
        }
    };
}

