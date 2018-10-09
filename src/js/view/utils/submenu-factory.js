import { cloneIcon } from 'view/controls/icons';
import SettingsSubmenu from 'view/controls/components/settings/submenu';
import SettingsContentItem from 'view/controls/components/settings/content-item';
import button from 'view/controls/components/button';
import { SimpleTooltip } from 'view/controls/components/simple-tooltip';

const AUDIO_TRACKS_SUBMENU = 'audioTracks';
const CAPTIONS_SUBMENU = 'captions';
const QUALITIES_SUBMENU = 'quality';
const PLAYBACK_RATE_SUBMENU = 'playbackRates';
const DEFAULT_SUBMENU = QUALITIES_SUBMENU;

export const makeSubmenu = (settingsMenu, name, contentItems, icon, tooltipText) => {
    let submenu = settingsMenu.getSubmenu(name);
    if (submenu) {
        submenu.replaceContent(contentItems);
    } else {
        const categoryButton = button(`jw-settings-${name}`, () => {
            settingsMenu.activateSubmenu(name);
            submenu.element().children[0].focus();
        }, name, [icon]);
        const categoryButtonElement = categoryButton.element();
        categoryButtonElement.setAttribute('role', 'menuitemradio');
        categoryButtonElement.setAttribute('aria-checked', 'false');
        categoryButtonElement.setAttribute('aria-label', tooltipText);

        // Qualities submenu is the default submenu
        submenu = SettingsSubmenu(name, categoryButton, name === DEFAULT_SUBMENU);
        submenu.addContent(contentItems);
        if (!('ontouchstart' in window)) {
            SimpleTooltip(categoryButtonElement, name, tooltipText);
        }
        settingsMenu.addSubmenu(submenu);
    }

    return submenu;
};

export function addCaptionsSubmenu(settingsMenu, captionsList, action, initialSelectionIndex, tooltipText, offText) {
    const captionsContentItems = captionsList.map((track, index) => {
        let content = track.label;
        if ((content === 'Off' || track.id === 'off') && index === 0) {
            content = offText;
        }
        const contentItemElement = SettingsContentItem(track.id, content, (evt) => {
            action(index);
            settingsMenu.close(evt);
        });

        return contentItemElement;
    });

    const captionsSubmenu = makeSubmenu(settingsMenu, CAPTIONS_SUBMENU, captionsContentItems, cloneIcon('cc-off'), tooltipText);
    captionsSubmenu.activateItem(initialSelectionIndex);
}

export function removeCaptionsSubmenu(settingsMenu) {
    settingsMenu.removeSubmenu(CAPTIONS_SUBMENU);
}

export function addAudioTracksSubmenu(settingsMenu, audioTracksList, action, initialSelectionIndex, tooltipText) {
    const audioTracksItems = audioTracksList.map((track, index) => {
        return SettingsContentItem(track.name, track.name, (evt) => {
            action(index);
            settingsMenu.close(evt);
        });
    });

    const audioTracksSubmenu = makeSubmenu(settingsMenu, AUDIO_TRACKS_SUBMENU, audioTracksItems,
        cloneIcon('audio-tracks'), tooltipText);
    audioTracksSubmenu.activateItem(initialSelectionIndex);
}

export function removeAudioTracksSubmenu(settingsMenu) {
    settingsMenu.removeSubmenu(AUDIO_TRACKS_SUBMENU);
}

export function addQualitiesSubmenu(settingsMenu, qualitiesList, action, initialSelectionIndex, tooltipText, autoText) {
    const qualitiesItems = qualitiesList.map((track, index) => {
        let content = track.label;
        if (content === 'Auto' && index === 0) {
            content = `${autoText}&nbsp;<span class="jw-reset jw-auto-label"></span>`;
        }

        return SettingsContentItem(track.label, content, (evt) => {
            action(index);
            settingsMenu.close(evt);
        });
    });

    const qualitiesSubmenu = makeSubmenu(settingsMenu, QUALITIES_SUBMENU, qualitiesItems, cloneIcon('quality-100'), tooltipText);
    qualitiesSubmenu.activateItem(initialSelectionIndex);
}

export function removeQualitiesSubmenu(settingsMenu) {
    settingsMenu.removeSubmenu(QUALITIES_SUBMENU);
}

export function addPlaybackRatesSubmenu(settingsMenu, rateList, action, initialSelectionIndex, tooltipText) {
    const rateItems = rateList.map((playbackRate) => {
        return SettingsContentItem(playbackRate, playbackRate + 'x', (evt) => {
            action(playbackRate);
            settingsMenu.close(evt);
        });
    });

    const playbackRatesSubmenu = makeSubmenu(settingsMenu, PLAYBACK_RATE_SUBMENU, rateItems, cloneIcon('playback-rate'), tooltipText);
    playbackRatesSubmenu.activateItem(initialSelectionIndex);
}

export function removePlaybackRatesSubmenu(settingsMenu) {
    settingsMenu.removeSubmenu(PLAYBACK_RATE_SUBMENU);
}
