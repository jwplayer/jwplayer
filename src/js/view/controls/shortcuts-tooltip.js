import shortcutTooltipTemplate from 'view/controls/templates/shortcuts-tooltip';
import { createElement, removeClass, addClass } from 'utils/dom';
import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { STATE_PAUSED, STATE_PLAYING } from 'events/events';

export default function (container, api, model) {
    let isOpen = false;
    let lastState = null;
    const template = createElement(shortcutTooltipTemplate());
    const settingsInteraction = { reason: 'settingsInteraction' };
    const getState = () => model.get('state');
    const play = () => api.play(settingsInteraction);
    const pause = () => api.pause(settingsInteraction);
    const open = () => {
        addClass(template, 'jw-open');
        template.querySelector('.jw-shortcuts-close').focus();
        isOpen = true;
        if (getState() === STATE_PLAYING) {
            lastState = STATE_PLAYING;
            pause();
        }
        document.addEventListener('click', documentClickHandler);
    };
    const close = () => {
        removeClass(template, 'jw-open');
        template.parentElement.focus();      
        isOpen = false;
        if (getState() === STATE_PAUSED && lastState === STATE_PLAYING) {
            lastState = STATE_PAUSED;
            play();
        }
        document.removeEventListener('click', documentClickHandler);
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
        const header = template.querySelector('.jw-shortcuts-close');
        const keyList = template.querySelector('.jw-shortcuts-tooltip-keys');
        const descriptionList = template.querySelector('.jw-shortcuts-tooltip-descriptions');
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
        const closeButton = button('jw-close', close);
        
        //  Iterate all shortcuts to create list of them. 
        shortcuts.map(shortcut => {
            const keyWrapper = document.createElement('li');
            const key = document.createElement('span');
            const descriptionWrapper = document.createElement('li');
            const description = document.createElement('span');
            key.textContent = shortcut.key;
            key.classList.add('jw-hotkey');
            keyWrapper.appendChild(key);
            keyList.appendChild(keyWrapper);
            description.textContent = shortcut.description;
            description.classList.add('jw-hotkey-description');
            descriptionWrapper.appendChild(description);
            descriptionList.appendChild(descriptionWrapper);
        });

        //  Append close button to modal.
        closeButton.element().appendChild(cloneIcon('close'));
        header.prepend(closeButton.element());
        closeButton.show();
        
        //  Append modal to container
        container.appendChild(template);
    };

    render();

    return {
        el: template,
        isOpen,
        close,
        open,
        toggleVisibility,
    };
}
