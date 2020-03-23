import button, { Button } from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import type { Menu, Localization } from 'types/generic.type';

export default (settingsMenu: Menu, localization: Localization): Button => {
    const closeButton: Button = button(
        'jw-settings-close',
        (e) => settingsMenu.close(e),
        localization.close,
        [cloneIcon('close')]
    );

    closeButton.ui.on('keydown', (e) => {
        const sourceEvent = e.sourceEvent;
        const key = sourceEvent.key.replace(/(Arrow|ape)/, '');
        // Close settings menu when enter is pressed on the close button
        // or when tab or right arrow key is pressed since it is the last element in topbar
        if (key === 'Enter' || key === 'Right' || (key === 'Tab' && !sourceEvent.shiftKey)) {
            settingsMenu.close(e);
        }
    });

    closeButton.show();
    settingsMenu.topbar.appendChild(closeButton.element());
    return closeButton;
};
