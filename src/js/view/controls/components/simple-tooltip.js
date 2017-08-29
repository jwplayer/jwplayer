import SimpleTooltipTemplate from 'view/controls/templates/simple-tooltip';
import { createElement, addClass, removeClass } from 'utils/dom';

export function SimpleTooltip(attachToElement, name, text) {
    const tooltipElement = createElement(SimpleTooltipTemplate(name, text));
    attachToElement.appendChild(tooltipElement);

    const instance = {
        open() {
            tooltipElement.setAttribute('aria-expanded', 'true');
            addClass(tooltipElement, 'jw-open');
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
