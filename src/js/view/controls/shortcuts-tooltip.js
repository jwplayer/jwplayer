import shortcutTooltipTemplate from 'view/controls/templates/shortcuts-tooltip';
import { createElement, removeClass, addClass, prependChild } from 'utils/dom';
import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { STATE_PLAYING } from 'events/events';

const shortcuts = [
    {
        key: 'SPACE',
        description: 'play/pause'
    },
    {
        key: '↑',
        description: 'increase volume'
    },
    {
        key: '↓',
        description: 'decrease volume'
    },
    {
        key: '→',
        description: 'seek forwards'
    },
    {
        key: '←',
        description: 'seek backwards'
    },
    {
        key: 'c',
        description: 'toggle captions'
    },
    {
        key: 'f',
        description: 'toggle fullscreen',
    },
    {
        key: 'm',
        description: 'mute/unmute'
    }, {
        key: '0-9',
        description: 'seek to %'
    }
];

export default function (container, api, model) {
    let isOpen = false;
    let lastState = null;
    const template = createElement(shortcutTooltipTemplate(shortcuts));
    const settingsInteraction = { reason: 'settingsInteraction' };

    const open = () => {
        addClass(template, 'jw-open');
        lastState = model.get('state');
        template.querySelector('.jw-shortcuts-close').focus();
        document.addEventListener('click', documentClickHandler);
        isOpen = true;
        api.pause(settingsInteraction);
    };
    const close = () => {
        removeClass(template, 'jw-open');     
        document.removeEventListener('click', documentClickHandler);
        container.focus();
        isOpen = false;
        if (lastState === STATE_PLAYING) {
            api.play(settingsInteraction);
        }
    };
    const documentClickHandler = (e) => {
        if (!/jw-shortcuts/.test(e.target.className)) {
            close();
        }
    };
    const toggleVisibility = () => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    };
    const render = () => {
        const closeButton = button('jw-shortcuts-close', () => {
            close();
        }, model.get('localization').close, [cloneIcon('close')]);

        //  Append close button to modal.
        prependChild(template, closeButton.element());
        closeButton.show();
        
        //  Append modal to container
        container.appendChild(template);
    };

    render();

    return {
        el: template,
        close,
        open,
        toggleVisibility,
    };
}
