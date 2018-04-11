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

    controlbar.on('settingsInteraction', (submenuName, isDefault, event) => {
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
            settingsMenu.open(isDefault, event);
        }
    });

    return settingsMenu;
}


export function setupSubmenuListeners(settingsMenu, controlbar, viewModel, api) {
    const model = viewModel.player;

    const activateSubmenuItem = (submenuName, itemIndex) => {
        const submenu = settingsMenu.getSubmenu(submenuName);
        if (submenu) {
            submenu.activateItem(itemIndex);
        }
    };

    const onAudiotracksChanged = (changedModel, audioTracks) => {
        if (!audioTracks || audioTracks.length <= 1) {
            removeAudioTracksSubmenu(settingsMenu);
            return;
        }

        addAudioTracksSubmenu(
            settingsMenu,
            audioTracks,
            (index) => api.setCurrentAudioTrack(index),
            model.get('currentAudioTrack'),
            model.get('localization').audioTracks
        );
    };

    const onQualitiesChanged = (changedModel, levels) => {
        if (!levels || levels.length <= 1) {
            removeQualitiesSubmenu(settingsMenu);
            return;
        }

        addQualitiesSubmenu(
            settingsMenu,
            levels,
            (index) => api.setCurrentQuality(index),
            model.get('currentLevel'),
            model.get('localization').hd
        );
    };

    const onCaptionsChanged = (changedModel, captionsList) => {
        const controlbarButton = controlbar.elements.captionsButton;
        if (!captionsList || captionsList.length <= 1) {
            removeCaptionsSubmenu(settingsMenu);
            controlbarButton.hide();
            return;
        }

        addCaptionsSubmenu(settingsMenu,
            captionsList,
            (index) => api.setCurrentCaptions(index),
            model.get('captionsIndex'),
            model.get('localization').cc
        );
        controlbar.toggleCaptionsButtonState(!!model.get('captionsIndex'));
        controlbarButton.show();
    };

    const setupPlaybackRatesMenu = (changedModel, playbackRates) => {
        const showPlaybackRateControls =
            model.get('supportsPlaybackRate') &&
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
            (playbackRate) => api.setPlaybackRate(playbackRate),
            model.get('playbackRate'),
            model.get('localization').playbackRates
        );
    };

    // Quality Levels
    model.change('levels', onQualitiesChanged, settingsMenu);
    model.on('change:currentLevel', (changedModel, currentQuality) => {
        activateSubmenuItem('quality', currentQuality);
    }, settingsMenu);

    // Audio Tracks
    model.change('audioTracks', onAudiotracksChanged, settingsMenu);
    model.on('change:currentAudioTrack', (changedModel, currentAudioTrack) => {
        activateSubmenuItem('audioTracks', currentAudioTrack);
    }, settingsMenu);

    // Captions
    model.change('captionsList', onCaptionsChanged, settingsMenu);
    model.change('captionsIndex', (changedModel, index) => {
        const captionsSubmenu = settingsMenu.getSubmenu('captions');
        if (captionsSubmenu) {
            captionsSubmenu.activateItem(index);
            controlbar.toggleCaptionsButtonState(!!index);
        }
    }, settingsMenu);

    // Playback Rates
    model.change('playbackRates', setupPlaybackRatesMenu, settingsMenu);
    model.change('playbackRate', (changedModel, playbackRate) => {
        const rates = model.get('playbackRates');
        if (rates) {
            activateSubmenuItem('playbackRates', rates.indexOf(playbackRate));
        }
    }, settingsMenu);

    // Visual Quality
    model.on('change:visualQuality', (changedModel, quality) => {
        const qualitySubMenu = settingsMenu.getSubmenu('quality');
        if (qualitySubMenu) {
            const items = qualitySubMenu.getItems();
            const item = items[0].element().querySelector('.jw-auto-label');
            const levels = model.get('levels');
            const { mode, level } = quality;

            item.textContent = mode === 'auto' ? `${levels[level.index].label}` : ``;
        }
    });

    // Remove the audio tracks, qualities, and playback rates submenus when casting
    model.on('change:castActive', (changedModel, active, previousState) => {
        if (active === previousState) {
            return;
        }

        if (active) {
            removeAudioTracksSubmenu(settingsMenu);
            removeQualitiesSubmenu(settingsMenu);
            removePlaybackRatesSubmenu(settingsMenu);
        } else {
            onAudiotracksChanged(model, model.get('audioTracks'));
            onQualitiesChanged(model, model.get('levels'));
            setupPlaybackRatesMenu(model, model.get('playbackRates'));
        }
    }, settingsMenu);

    model.on('change:streamType', () => {  
        setupPlaybackRatesMenu(model, model.get('playbackRates'));
    }, settingsMenu);

}
