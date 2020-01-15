import Menu from 'view/controls/components/menu/menu';
import { MenuItem } from 'view/controls/components/menu/menu-item';
import { itemMenuTemplate } from 'view/controls/templates/menu/menu-item';
import { _defaults as CaptionsDefaults } from 'view/captionsrenderer';
import { captionStyleItems } from './utils';
import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { normalizeKey } from './utils';
import UI from 'utils/ui';
import { 
    nextSibling, 
    previousSibling,
    emptyElement
} from 'utils/dom';

class SettingsMenu extends Menu {
    constructor(api, model, controlbar, localization) {
        super('settings', localization.settings, null, localization);
        this.api = api;
        this.model = model;
        this.localization = localization;
        this.controlbar = controlbar;
        this.closeButton = createCloseButton(this.el.querySelector(`.jw-${this.name}-topbar-buttons`), this.close, localization);
        this.backButtonTarget = null;
        this.topbar = createTopbar(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.addEventListeners();
    }

    get defaultChild() {
        const { quality, captions, audioTracks, sharing, playbackRates } = this.children;
        return quality || captions || audioTracks || playbackRates || sharing;
    }

    setupMenu(menuName, menuTitle, items, onItemSelect, defaultItemIndex, itemOptions) {
        if (!items || items.length <= 1) {
            this.removeMenu(menuName);
            return;
        }
        let menu = this.children[menuName];
        if (!menu) {
            menu = new Menu(menuName, menuTitle, this, this.localization);
        }
        menu.setMenuItems(
            menu.createItems(items, onItemSelect, itemOptions), 
            defaultItemIndex
        );
    }

    onLevels(model, levels) {
        const menuItemOptions = { defaultText: this.localization.auto };
        this.setupMenu(
            'quality',
            this.localization.hd,
            levels, 
            (index) => this.api.setCurrentQuality(index), 
            model.get('currentLevel') || 0, 
            menuItemOptions
        );
    }

    onCurrentLevel(model, currentIndex) {
        const { children } = this;
        const qualityMenu = children.quality;
        const visualQuality = model.get('visualQuality');
        if (visualQuality && qualityMenu) {
            changeAutoLabel(model.get('levels'), visualQuality.level, qualityMenu, currentIndex);
        }
        if (!qualityMenu.items[currentIndex].active) {
            selectMenuItem(qualityMenu, currentIndex);
        }
    }

    onVisualQuality(model, quality) {
        const qualityMenu = this.children.quality;
        if (quality && qualityMenu) {
            changeAutoLabel(model.get('levels'), quality.level, qualityMenu, model.get('currentLevel'));
        }
    }

    onAudioTracks(model, audioTracks) {
        this.setupMenu(
            'audioTracks', 
            this.localization.audioTracks,
            audioTracks, 
            (index) => this.api.setCurrentAudioTrack(index), 
            model.get('currentAudioTrack')
        );
    }
    onAudioTrackIndex(model, trackIndex) {
        if (!this.children.audioTracks) {
            return;
        }
        this.children.audioTracks.items[trackIndex].activate();
    }

    onCaptionsList(model, captionsList) {
        const menuItemOptions = { defaultText: this.localization.off };
        const initialIndex = model.get('captionsIndex');

        this.setupMenu(
            'captions',
            this.localization.cc,
            captionsList, 
            (index) => this.api.setCurrentCaptions(index), 
            initialIndex, 
            menuItemOptions
        );

        const captionsMenu = this.children.captions;

        if (!captionsMenu || captionsMenu.children.captionsSettings) {
            return;
        }
        captionsMenu.topbar = captionsMenu.topbar || captionsMenu.createTopbar();
        emptyElement(captionsMenu.topbar);
        const captionsLocalization = this.localization.captionsStyles;
        const captionsSettingsMenu = new Menu(
            'captionsSettings', 
            captionsLocalization.subtitleSettings, 
            captionsMenu, 
            this.localization
        );
        const open = captionsSettingsMenu.open;
        captionsSettingsMenu.open = (e) => {
            const wasVisible = captionsSettingsMenu.visible;
            open.call(captionsSettingsMenu, e);
            if (!wasVisible) {
                this.trigger('captionStylesOpened');
            }
        };
        const destroy = captionsSettingsMenu.destroy;
        captionsSettingsMenu.destroy = (e) => {
            captionsMenu.topbar.parentNode.removeChild(captionsMenu.topbar);
            captionsMenu.topbar = null;
            captionsMenu.topbarUI.destroy();
            destroy.call(captionsSettingsMenu, e);
        };
        const captionsSettingsButton = new MenuItem(this.localization.settings, captionsSettingsMenu.open);
        captionsMenu.topbar.appendChild(captionsSettingsButton.el);
        const setCaptionStyles = (captionsOption, index) => {
            const captionStyles = model.get('captions');
            const propertyName = captionsOption.name;
            const newValue = captionsOption.values[index];
            const newStyles = Object.assign({}, captionStyles);

            newStyles[propertyName] = newValue;
            this.model.set('captions', newStyles);
        };
        const persistedOptions = model.get('captions');
        const renderCaptionsSettings = (isReset) => {
            const resetItem = new MenuItem(this.localization.reset, () => {
                this.model.set('captions', Object.assign({}, CaptionsDefaults));
                renderCaptionsSettings(true);
            });
            resetItem.el.classList.add('jw-settings-reset');
            const captionsSettingsItems = [];
            captionStyleItems(captionsLocalization).forEach(captionItem => {
                if (!isReset && persistedOptions && persistedOptions[captionItem.name]) {
                    captionItem.val = persistedOptions[captionItem.name];
                } else {
                    captionItem.val = captionItem.defaultVal;
                }
                const selectionIndex = captionItem.values.indexOf(captionItem.val);
                captionItem.currentSelection = captionItem.options[selectionIndex];
                const itemMenu = new Menu(captionItem.name, captionItem.label, captionsSettingsMenu, this.localization);
                const item = new MenuItem(
                    captionItem, 
                    itemMenu.open, 
                    itemMenuTemplate
                );
                const items = itemMenu.createItems(
                    captionItem.options, 
                    (index) => {
                        const el = item.el.querySelector('.jw-settings-content-item-value');
                        setCaptionStyles(captionItem, index);
                        el.innerText = captionItem.options[index];
                    },
                    null
                );
                itemMenu.setMenuItems(
                    items,
                    captionItem.values.indexOf(captionItem.val) || 0
                );
                captionsSettingsItems.push(item);
            });
            captionsSettingsItems.push(resetItem);
            captionsSettingsMenu.setMenuItems(captionsSettingsItems);
        };
        renderCaptionsSettings();
    
    }

    onPlaylistItem() {
        // captions.js silently clears captions when the playlist item changes. The reason it silently clear captions
        // instead of dispatching an event is because we don't want to emit 'captionsList' if the new list is empty.
        this.removeMenu('captions');
        this.controlbar.elements.captionsButton.hide();
    
        // Settings menu should not be visible when switching playlist items via controls or .load()
        if (this.visible) {
            this.close();
        }
    }

    onCaptionsIndex(model, index) {
        const captionsSubmenu = this.children.captions;
        if (captionsSubmenu) {
            selectMenuItem(captionsSubmenu, index);
        }
        this.controlbar.toggleCaptionsButtonState(!!index);
    }

    onPlaybackRates(model, playbackRates) {
        if (!playbackRates && model) {
            playbackRates = model.get('playbackRates');
        }

        const { localization, children } = this;
        const showPlaybackRateControls =
            model.get('supportsPlaybackRate') &&
            model.get('streamType') !== 'LIVE' &&
            model.get('playbackRateControls');

        if (!showPlaybackRateControls) {
            if (children.playbackRates) {
                this.removeMenu('playbackRates');
            }
            return;
        }
        const initialSelectionIndex = playbackRates.indexOf(model.get('playbackRate'));
        const menuItemOptions = { tooltipText: localization.playbackRates };

        this.setupMenu(
            'playbackRates',
            this.localization.playbackRates,
            playbackRates, 
            (playbackRate) => this.api.setPlaybackRate(playbackRate), 
            initialSelectionIndex, 
            menuItemOptions
        );
    }

    onPlaybackRate(model, playbackRate) {
        const rates = model.get('playbackRates');
        let index = -1;
        if (rates) {
            index = rates.indexOf(playbackRate);
        }
        selectMenuItem(this.children.playbackRates, index);
    }

    onPlaybackRateControls(model) {
        this.onPlaybackRates(model);
    }

    onCastActive(model, active, previousState) {
        if (active === previousState) {
            return;
        }
        if (active) {
            this.removeMenu('audioTracks');
            this.removeMenu('quality');
            this.removeMenu('playbackRates');
            if (this.children.captions) {
                this.children.captions.removeMenu('captionsSettings');
            }
        } else {
            this.onAudioTracks(model, model.get('audioTracks'));
            this.onLevels(model, model.get('levels'));
            this.onPlaybackRates(model, model.get('playbackRates'));
            this.onCaptionsList(model, model.get('captionsList'));
        }
    }

    onChangeStreamType() {
        this.onPlaybackRates(this.model);
    }

    onDocumentClick(evt) {
        if (!/jw-(settings|video|nextup-close|sharing-link|share-item)/.test(evt.target.className)) {
            this.close();
        }
    }

    addEventListeners() {
        const { updateControlbarButtons, model } = this;
        this.on('menuAppended menuRemoved', updateControlbarButtons, this);
        model.change('levels', this.onLevels, this);
        model.on('change:currentLevel', this.onCurrentLevel, this);
        model.on('change:visualQuality', this.onVisualQuality, this);
        model.change('audioTracks', this.onAudioTracks, this);
        model.on('change:currentAudioTrack', this.onAudioTrackIndex, this);
        model.change('captionsList', this.onCaptionsList, this);
        model.on('change:playlistItem', this.onPlaylistItem, this);
        model.change('captionsIndex', this.onCaptionsIndex, this);
        model.change('playbackRates', this.onPlaybackRates, this); 
        model.change('playbackRate', this.onPlaybackRate, this); 
        model.on('change:playbackRateControls', this.onPlaybackRateControls, this);
        model.on('change:castActive', this.onCastActive, this);
        model.on('change:streamType', this.onChangeStreamType, this);
    }

    open(evt) {
        if (this.visible) {
            return;
        }
        this.el.parentNode.classList.add('jw-settings-open');
        this.trigger('menuVisibility', { visible: true, evt });
        document.addEventListener('click', this.onDocumentClick);
        this.el.setAttribute('aria-expanded', 'true');
        this.visible = true;
    }

    close(evt) {
        this.el.parentNode.classList.remove('jw-settings-open');
        this.trigger('menuVisibility', { visible: false, evt });
        document.removeEventListener('click', this.onDocumentClick);
        this.visible = false;
        if (this.openMenus.length) {
            this.closeChildren();
        }

        // If closed by keypress, focus appropriate element.
        const key = normalizeKey(evt && evt.sourceEvent && evt.sourceEvent.key);
        const gearButton = this.controlbar.elements.settingsButton.element();
        let focusEl;

        switch (key) {
            case 'Right':
                focusEl = nextSibling(gearButton);
                break;
            case 'Left':
                focusEl = previousSibling(gearButton);
                break;
            case 'Tab':
                if (evt.shiftKey) {
                    focusEl = previousSibling(gearButton);
                    break;
                }
                focusEl = gearButton;
                break;
            default:
                break;
        }
        if (focusEl) {
            focusEl.focus();
        }
    }

    updateControlbarButtons(menuName) {
        const { children, controlbar, model } = this;
        const shouldShowGear = 
            !!children.quality || 
            !!children.playbackRates || 
            Object.keys(children).length > 1;

        controlbar.elements.settingsButton.toggle(shouldShowGear);
        if (children.captions) {
            controlbar.toggleCaptionsButtonState(!!model.get('captionsIndex'));
        }
        const controlBarButton = controlbar.elements[`${menuName}Button`];
        if (controlBarButton) {
            const isVisible = !!children[menuName];
            controlBarButton.toggle(isVisible);
        }
    }

    destroy() {
        Object.keys(this.children).map(menuName => {
            this.children[menuName].destroy();
        });
        document.removeEventListener('click', this.onDocumentClick);
        if (this.model) {
            this.model.off(null, null, this);
            this.model = null;
        }
        this.off();
    }
}

function changeAutoLabel(levels, qualityLevel, qualityMenu, currentIndex) {
    // Return early if the label isn't "Auto" (html5 provider with multiple mp4 sources)
    if (!levels || levels[0].label !== 'Auto' || !(qualityMenu && qualityMenu.items.length)) {
        return;
    }
    const item = qualityMenu.items[0].el.querySelector('.jw-auto-label');
    const level = levels[qualityLevel.index] || { label: '' };

    item.textContent = currentIndex ? '' : level.label;
}

function selectMenuItem (menu, itemIndex) {
    if (menu && itemIndex > -1) {
        menu.items.forEach(item => {
            item.deactivate();
        });
        menu.items[itemIndex].activate();
    }
}

function createCloseButton(topbarEl, closeFunction, localization) {
    const closeButton = button('jw-settings-close', closeFunction, localization.close, [cloneIcon('close')]);
    closeButton.show();
    closeButton.ui.on('keydown', (evt) => {
        const sourceEvent = evt.sourceEvent;
        const key = normalizeKey(sourceEvent.key);
        // Close settings menu when enter is pressed on the close button
        // or when tab or right arrow key is pressed since it is the last element in topbar
        if (key === 'Enter' || key === 'Right' || (key === 'Tab' && !sourceEvent.shiftKey)) {
            closeFunction(evt);
        }
    }, this);

    topbarEl.appendChild(closeButton.element());
    return closeButton;
}

function createTopbar (mainMenu) {
    const closeButton = mainMenu.closeButton;
    const topbarEl = mainMenu.el.querySelector(`.jw-settings-topbar`);
    const ui = new UI(topbarEl).on('keydown', function(evt) {
        const { sourceEvent, target } = evt;
        const next = nextSibling(target);
        const prev = previousSibling(target);
        const key = normalizeKey(sourceEvent.key);
        const onLeft = (isTab) => {
            if (prev) {
                if (!isTab) {
                    prev.focus();
                }
            } else {
                mainMenu.close(evt);
            }
        };
        const onRight = () => {
            if (next && closeButton.element() && target !== closeButton.element()) {
                next.focus();
            }
        };
        const onOpen = () => {
            const menuName = target.getAttribute('name');
            let targetMenu = mainMenu.children[menuName];
            if (!targetMenu && menuName && mainMenu.backButtonTarget) {
                targetMenu = mainMenu.backButtonTarget.children[menuName];
            }
            if (targetMenu && targetMenu.open) {
                targetMenu.open(evt);
            }
            return targetMenu;
        };
        
        switch (key) {
            case 'Esc':
                mainMenu.close(evt);
                break;
            case 'Left':
                onLeft();
                break;
            case 'Right':
                onRight();
                break;
            case 'Tab': 
                if (sourceEvent.shiftKey) {
                    onLeft(true);
                }
                break;
            case 'Up':
            case 'Down':
            case 'Enter':
                onOpen();
                break;
            default:
                break;
        }
        sourceEvent.stopPropagation();
        if (/13|32|37|38|39|40/.test(sourceEvent.keyCode)) {
            // Prevent keypresses from scrolling the screen
            sourceEvent.preventDefault();
            return false;
        }
    });
    return ui;
}

export default SettingsMenu;
