import { addClass, removeClass, replaceInnerHtml } from 'utils/dom';

export function SimpleTooltip(attachToElement, name, text, openCallback, closeCallback) {
    const tooltipElement = document.createElement('div');
    tooltipElement.className = `jw-reset-text jw-tooltip jw-tooltip-${name}`;
    tooltipElement.setAttribute('dir', 'auto');

    const textElement = document.createElement('div');
    textElement.className = 'jw-text';

    tooltipElement.appendChild(textElement);
    attachToElement.appendChild(tooltipElement);

    const instance = {
        open() {
            if (instance.touchEvent) {
                return;
            }

            addClass(tooltipElement, 'jw-open');

            if (openCallback) {
                openCallback();
            }
        },
        close() {
            if (instance.touchEvent) {
                return;
            }

            removeClass(tooltipElement, 'jw-open');

            if (closeCallback) {
                closeCallback();
            }
        },
        setText(newText) {
            replaceInnerHtml(textElement, newText);
        }
    };

    instance.setText(text);

    attachToElement.addEventListener('mouseover', instance.open);
    attachToElement.addEventListener('focus', instance.open);
    attachToElement.addEventListener('blur', instance.close);
    attachToElement.addEventListener('mouseout', instance.close);
    attachToElement.addEventListener('touchstart', () => {
        instance.touchEvent = true;
    }, {
        passive: true
    });

    return instance;
}
