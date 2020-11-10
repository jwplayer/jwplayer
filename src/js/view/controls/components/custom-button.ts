import { style } from 'utils/css';
import UI from 'utils/ui';
import svgParse from 'utils/svgParser';

let collection: Record<string, XMLDocument> = {};

export function getCachedIcon(svg: string): Node {
    if (!collection[svg]) {
        const icons = Object.keys(collection);
        if (icons.length > 10) {
            delete collection[icons[0]];
        }
        const element = svgParse(svg);
        collection[svg] = element;
    }
    return collection[svg].cloneNode(true);
}

class CustomButton {
    id: string;
    buttonElement: HTMLElement;

    constructor(img: string, ariaText: string, callback: Function, id: string, btnClass: string) {
        const buttonElement = document.createElement('div');
        buttonElement.className = `jw-icon jw-icon-inline jw-button-color jw-reset ${btnClass || ''}`;
        buttonElement.setAttribute('button', id);
        buttonElement.setAttribute('role', 'button');
        buttonElement.setAttribute('tabindex', '0');
        if (ariaText) {
            buttonElement.setAttribute('aria-label', ariaText);
        }

        let iconElement;
        if (img && img.substring(0, 4) === '<svg') {
            iconElement = getCachedIcon(img);
        } else {
            iconElement = document.createElement('div');
            iconElement.className = 'jw-icon jw-button-image jw-button-color jw-reset';
            if (img) {
                style(iconElement, {
                    backgroundImage: `url(${img})`
                });
            }
        }

        buttonElement.appendChild(iconElement);

        new UI(buttonElement).on('click tap enter', callback, this);

        // Prevent button from being focused on mousedown so that the tooltips don't remain visible until
        // the user interacts with another element on the page
        buttonElement.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });

        this.id = id;
        this.buttonElement = buttonElement;
    }

    element(): HTMLElement {
        return this.buttonElement;
    }

    toggle(show: boolean): void {
        if (show) {
            this.show();
        } else {
            this.hide();
        }
    }

    show(): void {
        this.buttonElement.style.display = '';
    }
    hide(): void {
        this.buttonElement.style.display = 'none';
    }
}

export default CustomButton;
