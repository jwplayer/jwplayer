import { addClass, removeClass } from 'utils/dom';

export function SimpleTooltip(attachToElement, name, text, openCallback) {
    const tooltipElement = document.createElement('div');
    tooltipElement.className = `jw-reset jw-tooltip jw-tooltip-${name}`;

    const textElement = document.createElement('div');
    textElement.className = 'jw-text';
    textElement.textContent = text;

    tooltipElement.appendChild(textElement);
    attachToElement.appendChild(tooltipElement);

    const instance = {
        open() {
            tooltipElement.setAttribute('aria-expanded', 'true');
            addClass(tooltipElement, 'jw-open');

            if (openCallback) {
                openCallback();
            }
        },
        close() {
            tooltipElement.setAttribute('aria-expanded', 'false');
            removeClass(tooltipElement, 'jw-open');
        },
        setText(newText) {
            tooltipElement.querySelector('.jw-text').textContent = newText;
        }
    };

    if ('PointerEvent' in window) {
        attachToElement.addEventListener('pointerover', instance.open);
        attachToElement.addEventListener('pointerout', instance.close);
    } else {
        attachToElement.addEventListener('mouseover', instance.open);
        attachToElement.addEventListener('mouseout', instance.close);
    }

    return instance;
}
