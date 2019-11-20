import { toggleClass, replaceInnerHtml } from 'utils/dom';

export function SimpleTooltip(attachToElement, name, text, openCallback, closeCallback) {
    const tooltipElement = document.createElement('div');
    tooltipElement.className = `jw-reset-text jw-tooltip jw-tooltip-${name}`;
    tooltipElement.setAttribute('dir', 'auto');

    const textElement = document.createElement('div');
    textElement.className = 'jw-text';

    tooltipElement.appendChild(textElement);
    attachToElement.appendChild(tooltipElement);

    const instance = {
        dirty: !!text,
        opened: false,
        text,
        open() {
            if (instance.touchEvent) {
                return;
            }
            if (instance.suppress) {
                instance.suppress = false;
                return;
            }

            redraw(true);

            if (openCallback) {
                openCallback();
            }
        },
        close() {
            if (instance.touchEvent) {
                return;
            }

            redraw(false);

            if (closeCallback) {
                closeCallback();
            }
        },
        setText(newText) {
            if (newText !== instance.text) {
                instance.text = newText;
                instance.dirty = true;
            }
            if (instance.opened) {
                redraw(true);
            }
        }
    };

    const redraw = (opened) => {
        if (opened && instance.dirty) {
            replaceInnerHtml(textElement, instance.text);
            instance.dirty = false;
        }

        instance.opened = opened;
        toggleClass(tooltipElement, 'jw-open', opened);
    };

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
