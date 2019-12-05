import Menu from 'view/controls/components/menu/menu';
import { MenuItem, RadioMenuItem } from 'view/controls/components/menu/menu-item';
import { itemMenuTemplate } from 'view/controls/templates/menu/menu-item';
import { _defaults as CaptionsDefaults } from 'view/captionsrenderer';

const SettingsMenu = (api, model, controlbar, localization) => {
    const settingsMenu = new Menu('settings', null, localization);
    const changeMenuItems = (menuName, items, onItemSelect, defaultItemIndex, itemOptions) => {
        const controlBarButton = controlbar.elements[`${menuName}Button`];
        if (!items || items.length <= 1) {
            settingsMenu.removeMenu(menuName);
            if (controlBarButton) {
                controlBarButton.hide();
            }
            return;
        }
        let menu = settingsMenu.children[menuName];
        if (!menu) {
            menu = new Menu(menuName, settingsMenu, localization);
        }
        menu.setMenuItems(
            menu.createItems(items, onItemSelect, itemOptions), 
            defaultItemIndex
        );
        if (controlBarButton) {
            controlBarButton.show();
        }
    };
    const setLevelsMenu = (levels) => {
        const menuItemOptions = { defaultText: localization.auto };
        changeMenuItems(
            'quality', 
            levels, 
            (index) => api.setCurrentQuality(index), 
            model.get('currentLevel') || 0, 
            menuItemOptions
        );
        const childMenus = settingsMenu.children;
        const shouldShowGear = !!childMenus.quality || Object.keys(childMenus).length > 1;
        controlbar.elements.settingsButton.toggle(shouldShowGear);
    };
    model.change('levels', (changedModel, levels) => {
        setLevelsMenu(levels);
    }, settingsMenu);
    const changeAutoLabel = function (qualityLevel, qualityMenu, currentIndex) {
        const levels = model.get('levels');
        // Return early if the label isn't "Auto" (html5 provider with multiple mp4 sources)
        if (!levels || levels[0].label !== 'Auto' || !(qualityMenu && qualityMenu.items.length)) {
            return;
        }
        const item = qualityMenu.items[0].el.querySelector('.jw-auto-label');
        const level = levels[qualityLevel.index] || { label: '' };

        item.textContent = currentIndex ? '' : level.label;
    };
    model.on('change:visualQuality', (changedModel, quality) => {
        const qualityMenu = settingsMenu.children.quality;
        if (quality && qualityMenu) {
            changeAutoLabel(quality.level, qualityMenu, model.get('currentLevel'));
        }
    });
    model.on('change:currentLevel', (changedModel, currentIndex) => {
        const qualityMenu = settingsMenu.children.quality;
        const visualQuality = model.get('visualQuality');
        if (visualQuality && qualityMenu) {
            changeAutoLabel(visualQuality.level, qualityMenu, currentIndex);
        }
    }, settingsMenu);
    model.change('captionsList', (changedModel, captionsList) => {
        const menuItemOptions = { defaultText: localization.off };
        const initialIndex = model.get('captionsIndex');
        changeMenuItems(
            'captions', 
            captionsList, 
            (index) => api.setCurrentCaptions(index), 
            initialIndex, 
            menuItemOptions
        );
        const captionsMenu = settingsMenu.children.captions;
        if (captionsMenu && !captionsMenu.children.captionsSettings) {
            captionsMenu.topbar = captionsMenu.topbar || captionsMenu.createTopbar();
            const captionsSettingsMenu = new Menu('captionsSettings', captionsMenu, localization);
            captionsSettingsMenu.title = 'Subtitle Settings';
            const captionsSettingsButton = new MenuItem('Settings', captionsSettingsMenu.open);
            captionsMenu.topbar.appendChild(captionsSettingsButton.el);
            const captionsSettingsItems = [];
            const setCaptionStyles = (captionsOption, index) => {
                const captionStyles = model.get('captions');
                const propertyName = captionsOption.propertyName;
                const value = captionsOption.options && captionsOption.options[index];
                const newValue = captionsOption.getTypedValue(value);
                const newStyles = Object.assign({}, captionStyles);
                newStyles[propertyName] = newValue;

                model.set('captions', newStyles);
            };
            const resetItem = new RadioMenuItem('Reset', () => {
                model.set('captions', CaptionsDefaults);
            });
            resetItem.el.classList.add('jw-settings-reset');
            const persistedOptions = model.get('captions');
            captionStyleItems.forEach(captionItem => {
                if (persistedOptions && persistedOptions[captionItem.propertyName]) {
                    captionItem.defaultVal = captionItem.getOption(persistedOptions[captionItem.propertyName]);
                }
                const itemMenu = new Menu(captionItem.name, captionsSettingsMenu, localization);
                const item = new MenuItem(
                    { label: captionItem.name, value: captionItem.defaultVal }, 
                    itemMenu.open, 
                    itemMenuTemplate
                );
                const items = itemMenu.createItems(
                    captionItem.options, (index) => {
                        setCaptionStyles(captionItem, index);
                        item.el.querySelector('.jw-settings-content-item-value').innerText = captionItem.options[index];
                    },
                    null
                );
                itemMenu.setMenuItems(
                    items,
                    captionItem.options.indexOf(captionItem.defaultVal) || 0
                );
                captionsSettingsItems.push(item);
            });
            captionsSettingsItems.push(resetItem);
            captionsSettingsMenu.setMenuItems(captionsSettingsItems);
        }
    });
    const onMenuItemSelected = (menu, itemIndex) => {
        if (menu && itemIndex > -1) {
            menu.items[itemIndex].activate();
        }
    };
    model.change('captionsIndex', (changedModel, index) => {
        const captionsSubmenu = settingsMenu.children.captions;
        if (captionsSubmenu) {
            onMenuItemSelected(captionsSubmenu, index);
        }
        controlbar.toggleCaptionsButtonState(!!index);
    }, settingsMenu);
    const setPlaybackRatesMenu = (playbackRates) => {
        const showPlaybackRateControls =
            model.get('supportsPlaybackRate') &&
            model.get('streamType') !== 'LIVE' &&
            model.get('playbackRateControls');

        if (!showPlaybackRateControls) {
            if (settingsMenu.children.playbackRates) {
                settingsMenu.removeMenu('playbackRates');
            }
            return;
        }
        const initialSelectionIndex = playbackRates.indexOf(model.get('playbackRate'));
        const menuItemOptions = { tooltipText: localization.playbackRates };
        changeMenuItems(
            'playbackRates', 
            playbackRates, 
            (playbackRate) => api.setPlaybackRate(playbackRate), 
            initialSelectionIndex, 
            menuItemOptions
        );
    };
    model.on('change:playbackRates', (changedModel, playbackRates) => {
        setPlaybackRatesMenu(playbackRates);
    }, settingsMenu);
    const setAudioTracksMenu = (audioTracks) => {
        changeMenuItems(
            'audioTracks', 
            audioTracks, 
            (index) => api.setCurrentAudioTrack(index), 
            model.get('currentAudioTrack')
        );
    };
    model.on('change:audioTracks', (changedModel, audioTracks) => {
        setAudioTracksMenu(audioTracks);
    }, settingsMenu);
    model.on('change:playbackRate', (changedModel, playbackRate) => {
        const rates = model.get('playbackRates');
        let index = -1;
        if (rates) {
            index = rates.indexOf(playbackRate);
        }
        onMenuItemSelected(settingsMenu.children.playbackRates, index);
    }, settingsMenu);
    model.on('change:currentAudioTrack', (changedModel, currentAudioTrack) => {
        settingsMenu.children.audioTracks.items[currentAudioTrack].activate();
    }, settingsMenu);
    model.on('change:playlistItem', () => {
        // captions.js silently clears captions when the playlist item changes. The reason it silently clear captions
        // instead of dispatching an event is because we don't want to emit 'captionsList' if the new list is empty.
        settingsMenu.removeMenu('captions');
        controlbar.elements.captionsButton.hide();

        // Settings menu should not be visible when switching playlist items via controls or .load()
        if (settingsMenu.visible) {
            settingsMenu.close();
        }
    }, settingsMenu);
    model.on('change:playbackRateControls', () => {
        setPlaybackRatesMenu(model.get('playbackRates'));
    });
    model.on('change:castActive', (changedModel, active, previousState) => {
        if (active === previousState) {
            return;
        }

        if (active) {
            settingsMenu.removeMenu('audioTracks');
            settingsMenu.removeMenu('quality');
            settingsMenu.removeMenu('playbackRates');
        } else {
            setAudioTracksMenu(model.get('audioTracks'));
            setLevelsMenu(model.get('levels'));
            setPlaybackRatesMenu(model.get('playbackRates'));
        }
    }, settingsMenu);
    model.on('change:streamType', () => {
        setPlaybackRatesMenu(model.get('playbackRates'));
    }, settingsMenu);
    window.settingsMenu = settingsMenu;
    return settingsMenu;
};

const getColorValue = (option) => colorTable[option];
const getColorOption = (value) => {
    const colors = Object.keys(colorTable);
    let option;
    for (let i = 0; i < colors.length; i++) {
        if (colorTable[colors[i]] === value) {
            option = colors[i];
            break;
        }
    }
    return option;
};
const getPercentOption = (value) => value + '%';
const getPercentValue = (option) => parseInt(option);
const captionStyleItems = [
    {
        name: 'Font Color',
        propertyName: 'color',
        options: ['White', 'Black', 'Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan'],
        defaultVal: 'White',
        getTypedValue: getColorValue,
        getOption: getColorOption
        
    },
    {
        name: 'Font Opacity',
        propertyName: 'fontOpacity',
        options: ['100%', '75%', '25%'],
        defaultVal: '100%',
        getTypedValue: getPercentValue,
        getOption: getPercentOption
        
    },
    {
        name: 'Font Size',
        propertyName: 'userFontScale',
        options: ['200%', '175%', '150%', '125%', '100%', '75%', '50%'],
        defaultVal: '100%',
        getTypedValue: (option) => parseInt(option) / 100,
        getOption: (value) => (value * 100) + '%'
    },
    {
        name: 'Font Family',
        propertyName: 'fontFamily',
        options: [
            'Arial', 
            'Courier', 
            'Georgia', 
            'Impact', 
            'Lucida Console', 
            'Tahoma', 
            'Times New Roman', 
            'Trebuchet MS', 
            'Verdana'
        ],
        defaultVal: 'Arial',
        getTypedValue: (option) => option,
        getOption: (value) => value
    },
    {
        name: 'Character Edge',
        propertyName: 'edgeStyle',
        options: [ 'None', 'Raised', 'Depressed', 'Uniform', 'Drop Shadow'
        ],
        defaultVal: 'None',
        getTypedValue: (option) => option.toLowerCase().replace(/ /g, ''),
        getOption: (value) => {
            const result = value.replace(/([A-Z])/g, ' $1');
            const finalResult = result.charAt(0).toUpperCase() + result.slice(1);
            return finalResult;
        }
    },
    {
        name: 'Background Color',
        propertyName: 'backgroundColor',
        options: [
            'White', 'Black', 'Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan'
        ],
        defaultVal: 'Black',
        getTypedValue: getColorValue,
        getOption: getColorOption
    },
    {
        name: 'Background Opacity',
        propertyName: 'backgroundOpacity',
        options: ['100%', '75%', '50%', '25%', '0%'],
        defaultVal: '50%',
        getTypedValue: getPercentValue,
        getOption: getPercentOption
    },
    {
        name: 'Window Color',
        propertyName: 'windowColor',
        options: [
            'White', 'Black', 'Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan'
        ],
        defaultVal: 'Black',
        getTypedValue: getColorValue,
        getOption: getColorOption
    },
    {
        name: 'Window Opacity',
        propertyName: 'windowOpacity',
        options: ['100%', '75%', '50%', '25%', '0%'],
        defaultVal: '0%',
        getTypedValue: getPercentValue,
        getOption: getPercentOption
    },
];

const colorTable = {
    White: '#ffffff',
    Black: '#000000',
    Red: '#ff0000',
    Green: '#00ff00',
    Blue: '#0000ff',
    Yellow: '#ffff00',
    Magenta: 'ff00ff',
    Cyan: '#00ffff'
};

export default SettingsMenu;
