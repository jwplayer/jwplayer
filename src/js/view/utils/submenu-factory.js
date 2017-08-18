import SettingsSubmenu from 'view/controls/components/settings/submenu';
import SettingsContentItem from 'view/controls/components/settings/content-item';
import button from 'view/controls/components/button';
import CAPTIONS_OFF_ICON from 'assets/SVG/captions-off.svg';
import AUDIO_TRACKS_ICON from 'assets/SVG/audio-tracks.svg';

const AUDIO_TRACKS_SUBMENU = 'audioTracks';
const CAPTIONS_SUBMENU = 'captions';

const makeSubmenu = (settingsMenu, name, contentItems, icon) => {
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

        submenu = SettingsSubmenu(name, categoryButton);
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
