import { toggleClass, replaceInnerHtml } from 'utils/dom';

export interface SimpleTooltipInterface {
    dirty: boolean;
    opened: boolean;
    text: string;
    open: Function;
    close: Function;
    setText: Function;
    touchEvent: boolean;
    suppress: boolean;
}

export function SimpleTooltip(attachToElement: HTMLElement, name: string,
    text: string, openCallback?: Function, closeCallback?: Function): SimpleTooltipInterface {
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
        touchEvent: false,
        suppress: false,
        open(): void {
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
        close(): void {
            if (instance.touchEvent) {
                return;
            }

            redraw(false);

            if (closeCallback) {
                closeCallback();
            }
        },
        setText(newText: string): void {
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
