import SettingsSubmenu from 'view/controls/components/settings/submenu';
import SettingsContentItem from 'view/controls/components/settings/content-item';
import button from 'view/controls/components/button';
import CAPTIONS_OFF_ICON from 'assets/SVG/captions-off.svg';
import AUDIO_TRACKS_ICON from 'assets/SVG/audio-tracks.svg';
import QUALITY_ICON from 'assets/SVG/quality-100.svg';
import PLAYBACK_RATE_ICON from 'assets/SVG/playback-rate.svg';

const AUDIO_TRACKS_SUBMENU = 'audioTracks';
const CAPTIONS_SUBMENU = 'captions';
const QUALITIES_SUBMENU = 'quality';
const PLAYBACK_RATE_SUBMENU = 'playbackRates';
const DEFAULT_SUBMENU = QUALITIES_SUBMENU;

export const makeSubmenu = (settingsMenu, name, contentItems, icon) => {
    let submenu = settingsMenu.getSubmenu(name);
    if (submenu) {
        submenu.replaceContent(contentItems);
    } else {
        const categoryButton = button(`jw-settings-${name}`, () => {
            settingsMenu.activateSubmenu(name);
        }, name, [icon]);
        const categoryButtonElement = categoryButton.element();
        categoryButtonElement.setAttribute('role', 'menuitemradio');
        categoryButtonElement.setAttribute('aria-checked', 'false');

        // Qualities submenu is the default submenu
        submenu = SettingsSubmenu(name, categoryButton, name === DEFAULT_SUBMENU);
        submenu.addContent(contentItems);
        settingsMenu.addSubmenu(submenu);
    }

    return submenu;
};

export function addCaptionsSubmenu(settingsMenu, captionsList, action, initialSelectionIndex) {
    const captionsContentItems = captionsList.map((track, index) => {
        return SettingsContentItem(track.id, track.label, () => {
            action(index);
            settingsMenu.close();
        });
    });

    const captionsSubmenu = makeSubmenu(settingsMenu, CAPTIONS_SUBMENU, captionsContentItems, CAPTIONS_OFF_ICON);
    captionsSubmenu.activateItem(initialSelectionIndex);
}

export function removeCaptionsSubmenu(settingsMenu) {
    settingsMenu.removeSubmenu(CAPTIONS_SUBMENU);
}

export function addAudioTracksSubmenu(settingsMenu, audioTracksList, action, initialSelectionIndex) {
    const audioTracksItems = audioTracksList.map((track, index) => {
        return SettingsContentItem(track.name, track.name, () => {
            action(index);
            settingsMenu.close();
        });
    });

    const audioTracksSubmenu = makeSubmenu(settingsMenu, AUDIO_TRACKS_SUBMENU, audioTracksItems, AUDIO_TRACKS_ICON);
    audioTracksSubmenu.activateItem(initialSelectionIndex);
}

export function removeAudioTracksSubmenu(settingsMenu) {
    settingsMenu.removeSubmenu(AUDIO_TRACKS_SUBMENU);
}

export function addQualitiesSubmenu(settingsMenu, qualitiesList, action, initialSelectionIndex) {
    const qualitiesItems = qualitiesList.map((track, index) => {
        return SettingsContentItem(track.label, track.label, () => {
            action(index);
            settingsMenu.close();
        });
    });

    const qualitiesSubmenu = makeSubmenu(settingsMenu, QUALITIES_SUBMENU, qualitiesItems, QUALITY_ICON);
    qualitiesSubmenu.activateItem(initialSelectionIndex);
}

export function removeQualitiesSubmenu(settingsMenu) {
    settingsMenu.removeSubmenu(QUALITIES_SUBMENU);
}

export function addPlaybackRatesSubmenu(settingsMenu, rateList, action, initialSelectionIndex) {
    const rateItems = rateList.map((playbackRate) => {
        return SettingsContentItem(playbackRate, playbackRate + 'x', () => {
            action(playbackRate);
            settingsMenu.close();
        });
    });

    const playbackRatesSubmenu = makeSubmenu(settingsMenu, PLAYBACK_RATE_SUBMENU, rateItems, PLAYBACK_RATE_ICON);
    playbackRatesSubmenu.activateItem(initialSelectionIndex);
}

export function removePlaybackRatesSubmenu(settingsMenu) {
    settingsMenu.removeSubmenu(PLAYBACK_RATE_SUBMENU);
}
