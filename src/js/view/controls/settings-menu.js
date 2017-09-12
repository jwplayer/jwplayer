import { SettingsMenu } from 'view/controls/components/settings/menu';
import {
    addCaptionsSubmenu,
    removeCaptionsSubmenu,
    addQualitiesSubmenu,
    removeQualitiesSubmenu,
    addAudioTracksSubmenu,
    removeAudioTracksSubmenu,
    addPlaybackRatesSubmenu,
    removePlaybackRatesSubmenu
} from 'view/utils/submenu-factory';

export function createSettingsMenu(controlbar, onVisibility) {
    const settingsButton = controlbar.elements.settingsButton;
    const onSubmenuAdded = () => {
        settingsButton.show();
    };
    const onMenuEmpty = () => {
        settingsButton.hide();
    };

    const settingsMenu = SettingsMenu(onVisibility, onSubmenuAdded, onMenuEmpty);

    controlbar.on('settingsInteraction', (submenuName, isDefault) => {
        const submenu = settingsMenu.getSubmenu(submenuName);
        if (!submenu && !isDefault) {
            // Do nothing if activating an invalid submenu
            // An invalid submenu is one which does not exist
            // The default submenu may not exist, but this case has defined behavior
            return;
        }

        if (settingsMenu.visible) {
            if (isDefault || submenu.active) {
                // Close the submenu if clicking the default button (the gear) or if we're already at that submenu
                settingsMenu.close();
            } else {
                // Tab to the newly activated submenu
                settingsMenu.activateSubmenu(submenuName);
            }
        } else {
            if (submenu) {
                // Activate the selected submenu
                settingsMenu.activateSubmenu(submenuName);
            } else {
                // Activate the first submenu if clicking the default button
                settingsMenu.activateFirstSubmenu();
            }
            settingsMenu.open();
        }
    });

    return settingsMenu;
}


export function setupSubmenuListeners(settingsMenu, controlbar, model, api) {
    const activateSubmenuItem = (submenuName, itemIndex) => {
        const submenu = settingsMenu.getSubmenu(submenuName);
        if (submenu) {
            submenu.activateItem(itemIndex);
        }
    };

    model.change('mediaModel', (newModel, mediaModel) => {
        // Quality Levels
        mediaModel.change('levels', (changedModel, levels) => {
            if (!levels || levels.length <= 1) {
                removeQualitiesSubmenu(settingsMenu);
                return;
            }

            addQualitiesSubmenu(
                settingsMenu,
                levels,
                model.getVideo().setCurrentQuality.bind(model.getVideo()),
                changedModel.get('currentLevel')
            );
        }, this);

        mediaModel.on('change:currentLevel', (changedModel, currentQuality) => {
            activateSubmenuItem('quality', currentQuality);
        }, this);

        // Audio Tracks
        const onAudiotracksChange = (changedModel, audioTracks) => {
            if (!audioTracks || audioTracks.length <= 1) {
                removeAudioTracksSubmenu(settingsMenu);
                return;
            }

            addAudioTracksSubmenu(
                settingsMenu,
                audioTracks,
                model.getVideo().setCurrentAudioTrack.bind(model.getVideo()),
                mediaModel.get('currentAudioTrack')
            );
        };
        mediaModel.change('audioTracks', onAudiotracksChange, this);
        mediaModel.on('change:currentAudioTrack', (changedModel, currentAudioTrack) => {
            activateSubmenuItem('audioTracks', currentAudioTrack);
        }, this);
    }, this);

    // Captions
    model.change('captionsList', (changedModel, captionsList) => {
        const controlbarButton = controlbar.elements.captionsButton;
        if (!captionsList || captionsList.length <= 1) {
            removeCaptionsSubmenu(settingsMenu);
            controlbarButton.hide();
            return;
        }

        addCaptionsSubmenu(settingsMenu,
            captionsList,
            api.setCurrentCaptions.bind(this),
            model.get('captionsIndex')
        );
        controlbar.toggleCaptionsButtonState(!!model.get('captionsIndex'));
        controlbarButton.show();
    }, this);

    model.change('captionsIndex', (changedModel, index) => {
        const captionsSubmenu = settingsMenu.getSubmenu('captions');
        if (captionsSubmenu) {
            captionsSubmenu.activateItem(index);
            controlbar.toggleCaptionsButtonState(!!index);
        }
    }, this);

    // Playback Rates
    model.change('playbackRates', (changedModel, playbackRates) => {
        const provider = model.getVideo();
        const showPlaybackRateControls = provider &&
            provider.supportsPlaybackRate &&
            model.get('streamType') !== 'LIVE' &&
            model.get('playbackRateControls') &&
            playbackRates.length > 1;

        if (!showPlaybackRateControls) {
            removePlaybackRatesSubmenu(settingsMenu);
            return;
        }

        addPlaybackRatesSubmenu(
            settingsMenu,
            playbackRates,
            provider.setPlaybackRate.bind(model.getVideo()),
            model.get('playbackRate')
        );
    }, this);

    model.change('playbackRate', (changedModel, playbackRate) => {
        const rates = model.get('playbackRates');
        if (rates) {
            activateSubmenuItem('playbackRates', rates.indexOf(playbackRate));
        }
    }, this);
}
