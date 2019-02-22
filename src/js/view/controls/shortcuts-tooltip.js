import shortcutTooltipTemplate from 'view/controls/templates/shortcuts-tooltip';
import { createElement, toggleClass, removeClass, addClass } from 'utils/dom';
import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';

export default function (container) {
    const template = createElement(shortcutTooltipTemplate());
    const header = template.querySelector('.jw-info-close');
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
    const toggleVisibility = () => toggleClass(template, 'jw-open');
    const open = () => {
        addClass(template, 'jw-open');
        container.appendChild(template);
        template.querySelector('.jw-info-close').focus();
    }
    const close = () => {
        removeClass(template, 'jw-open');
        template.parentElement.focus();
    };

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

    //  Create close button for header  
    const closeButton = button('jw-close', close);
    closeButton.element().appendChild(cloneIcon('close'));
    header.prepend(closeButton.element());
    closeButton.show();
    
    return {
        el: template,
        close: close,
        open: open,
        toggleVisibility: toggleVisibility,
    };
}