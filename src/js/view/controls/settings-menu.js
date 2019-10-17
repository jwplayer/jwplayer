import { debounce } from '../../utils/underscore';
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

export function createSettingsMenu(controlbar, onVisibility, localization) {
    const settingsButton = controlbar.elements.settingsButton;
    const settingsMenu = SettingsMenu(onVisibility, {
        hide: () => settingsButton.hide(),
        show: () => settingsButton.show()
    }, localization);

    controlbar.on('settingsInteraction', (submenuName, isDefault, event) => {
        const submenu = settingsMenu.getSubmenu(submenuName);
        const nonKeyboardInteraction = event && event.type !== 'enter';
        const delayedOpen = debounce(settingsMenu.open, 10);

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
                settingsMenu.activateSubmenu(submenuName, false, nonKeyboardInteraction);
            }
        } else {
            if (submenu) {
                // Activate the selected submenu
                settingsMenu.activateSubmenu(submenuName, false, nonKeyboardInteraction);
            } else {
                // Activate the first submenu if clicking the default button
                settingsMenu.activateFirstSubmenu(nonKeyboardInteraction);
            }

            delayedOpen(isDefault, event);
        }
    });

    return settingsMenu;
}

function showSettingsMenuIcon(settingsMenu, controlbar) {
    // Show or hide settings menu icon dependant on amount of submenus
    const submenuNames = settingsMenu.getSubmenuNames();
    const toggleIcon = submenuNames.length > 1 ||
                        submenuNames.some(name => (name === 'quality' || name === 'playbackRates'));

    controlbar.elements.settingsButton.toggle(toggleIcon);
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
        } else {
            const { hd, auto } = model.get('localization');

            addQualitiesSubmenu(
                settingsMenu,
                levels,
                (index) => api.setCurrentQuality(index),
                model.get('currentLevel'),
                hd,
                auto
            );
        }
        showSettingsMenuIcon(settingsMenu, controlbar);
    };

    const onCaptionsChanged = (changedModel, captionsList) => {
        const controlbarButton = controlbar.elements.captionsButton;
        if (!captionsList || captionsList.length <= 1) {
            removeCaptionsSubmenu(settingsMenu);
            controlbarButton.hide();
            return;
        }

        const { cc, off } = model.get('localization');

        addCaptionsSubmenu(settingsMenu,
            captionsList,
            (index) => api.setCurrentCaptions(index),
            model.get('captionsIndex'),
            cc,
            off
        );
        controlbar.toggleCaptionsButtonState(!!model.get('captionsIndex'));
        controlbarButton.show();
    };

    const setupPlaybackRatesMenu = (changedModel, playbackRates) => {
        const showPlaybackRateControls =
            model.get('supportsPlaybackRate') &&
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
            playbackRates.indexOf(model.get('playbackRate')),
            model.get('localization').playbackRates
        );
    };

    const changeAutoLabel = function (qualityLevel, qualitySubMenu, currentIndex) {
        const levels = model.get('levels');
        // Return early if the label isn't "Auto" (html5 provider with multiple mp4 sources)
        if (!levels || levels[0].label !== 'Auto') {
            return;
        }
        const items = qualitySubMenu.getItems();
        const item = items[0].element().querySelector('.jw-auto-label');
        const level = levels[qualityLevel.index] || { label: '' };

        item.textContent = currentIndex ? '' : level.label;
    };

    // Quality Levels
    model.change('levels', onQualitiesChanged, settingsMenu);
    model.on('change:currentLevel', (changedModel, currentIndex) => {
        const qualitySubMenu = settingsMenu.getSubmenu('quality');
        const visualQuality = model.get('visualQuality');
        if (visualQuality && qualitySubMenu) {
            changeAutoLabel(visualQuality.level, qualitySubMenu, currentIndex);
        }
        activateSubmenuItem('quality', currentIndex);
    }, settingsMenu);

    // Audio Tracks
    model.change('audioTracks', onAudiotracksChanged, settingsMenu);
    model.on('change:currentAudioTrack', (changedModel, currentAudioTrack) => {
        activateSubmenuItem('audioTracks', currentAudioTrack);
    }, settingsMenu);

    // Captions
    model.on('change:playlistItem', () => {
        // captions.js silently clears captions when the playlist item changes. The reason it silently clear captions
        // instead of dispatching an event is because we don't want to emit 'captionsList' if the new list is empty.
        removeCaptionsSubmenu(settingsMenu);
        controlbar.elements.captionsButton.hide();

        // Settings menu should not be visible when switching playlist items via controls or .load()
        if (settingsMenu.visible) {
            settingsMenu.close();
        }
    });
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

    model.on('change:playbackRateControls', () => {
        setupPlaybackRatesMenu(model, model.get('playbackRates'));
    });

    // Visual Quality
    model.on('change:visualQuality', (changedModel, quality) => {
        const qualitySubMenu = settingsMenu.getSubmenu('quality');
        if (quality && qualitySubMenu) {
            changeAutoLabel(quality.level, qualitySubMenu, model.get('currentLevel'));
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
