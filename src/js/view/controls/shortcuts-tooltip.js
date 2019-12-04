import shortcutTooltipTemplate from 'view/controls/templates/shortcuts-tooltip';
import { createElement, removeClass, addClass, prependChild } from 'utils/dom';
import UI from 'utils/ui';
import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { STATE_PLAYING } from 'events/events';


function getShortcuts(shortcuts) {
    const {
        playPause,
        volumeToggle,
        fullscreenToggle,
        seekPercent,
        increaseVolume,
        decreaseVolume,
        seekForward,
        seekBackward,
        spacebar,
        captionsToggle
    } = shortcuts;

    return [
        {
            key: spacebar,
            description: playPause
        },
        {
            key: '↑',
            description: increaseVolume
        },
        {
            key: '↓',
            description: decreaseVolume
        },
        {
            key: '→',
            description: seekForward
        },
        {
            key: '←',
            description: seekBackward
        },
        {
            key: 'c',
            description: captionsToggle
        },
        {
            key: 'f',
            description: fullscreenToggle
        },
        {
            key: 'm',
            description: volumeToggle
        }, {
            key: '0-9',
            description: seekPercent
        }
    ];
}


export default function (container, api, model) {
    let isOpen = false;
    let lastState = null;
    const shortcuts = model.get('localization').shortcuts;
    const template = createElement(
        shortcutTooltipTemplate(getShortcuts(shortcuts), shortcuts.keyboardShortcuts)
    );
    const settingsInteraction = { reason: 'settingsInteraction' };
    const shortcutToggleUi = new UI(template.querySelector('.jw-switch'));

    const open = () => {
        shortcutToggleUi.el.setAttribute('aria-checked', model.get('enableShortcuts'));

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

    const destroy = () => {
        close();
        shortcutToggleUi.destroy();
    };

    const documentClickHandler = (e) => {
        if (!/jw-shortcuts|jw-switch/.test(e.target.className)) {
            close();
        }
    };

    const toggleClickHandler = (e) => {
        const toggle = e.currentTarget;
        const isChecked = toggle.getAttribute('aria-checked') === 'true' ? false : true;
        toggle.setAttribute('aria-checked', isChecked);
        model.set('enableShortcuts', isChecked);
    };

    const toggleVisibility = () => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    };
    
    const render = () => {
        const closeButton = button('jw-shortcuts-close', close, model.get('localization').close, [cloneIcon('close')]);

        //  Append close button to modal.
        prependChild(template, closeButton.element());
        closeButton.show();

        //  Append modal to container
        container.appendChild(template);
        
        shortcutToggleUi.on('click tap enter', toggleClickHandler);
    };

    render();

    return {
        el: template,
        open,
        close,
        destroy,
        toggleVisibility
    };
}
