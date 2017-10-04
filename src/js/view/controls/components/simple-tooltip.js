import { addClass, removeClass } from 'utils/dom';
import { getPointerType } from 'utils/ui';

export function SimpleTooltip(attachToElement, name, text, openCallback) {
    const tooltipElement = document.createElement('div');
    tooltipElement.className = `jw-tooltip jw-tooltip-${name}`;

    const textElement = document.createElement('div');
    textElement.className = 'jw-text';
    textElement.textContent = text;

    tooltipElement.appendChild(textElement);
    attachToElement.appendChild(tooltipElement);

    const instance = {
        open() {
            if (instance.touchEvent) {
                delete instance.pointerType;
                return;
            }

            tooltipElement.setAttribute('aria-expanded', 'true');
            addClass(tooltipElement, 'jw-open');

            if (openCallback) {
                openCallback();
            }
        },
        close() {
            if (instance.touchEvent) {
                delete instance.pointerType;
                return;
            }

            tooltipElement.setAttribute('aria-expanded', 'false');
            removeClass(tooltipElement, 'jw-open');
        },
        setText(newText) {
            tooltipElement.querySelector('.jw-text').textContent = newText;
        }
    };

    attachToElement.addEventListener('mouseover', instance.open);
    attachToElement.addEventListener('mouseout', instance.close);
    attachToElement.addEventListener('touchstart', (evt) => {
        instance.touchEvent = getPointerType(evt) === 'touch';
    });

    return instance;
}
