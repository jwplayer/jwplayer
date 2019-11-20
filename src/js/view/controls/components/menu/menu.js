import UI from 'utils/ui';
import Events from 'utils/backbone.events';
import { 
    createElement, 
    emptyElement, 
    prependChild, 
    nextSibling, 
    previousSibling
} from 'utils/dom';
import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { MenuItem, RadioMenuItem } from 'view/controls/components/menu/menu-item';
import { MenuTemplate } from 'view/controls/templates/menu/menu';
import categoryButton from 'view/controls/components/menu/category-button';
import { isRtl } from 'utils/language';

export default class Menu extends Events {
    constructor(_name, _parentMenu, _localization, _template = MenuTemplate) {
        super();
        this.name = _name;
        this.isSubmenu = !!_parentMenu;
        this.el = createElement(_template(this.isSubmenu, _name));
        this.topbar = this.el.querySelector(`.jw-${this.name}-topbar`);
        this.children = {};
        this.openMenus = [];
        this.items = [];
        this.visible = false;
        this.parentMenu = _parentMenu;
        this.mainMenu = !this.parentMenu ? this : this.parentMenu.mainMenu;
        this.closeButton = (this.parentMenu && this.parentMenu.closeButton) || this.createCloseButton(_localization);
        this.categoryButton = null;
        if (this.isSubmenu) {
            if (this.parentMenu.name === 'settings') {
                this.createCategoryButton(_localization);
            }
            this.parentMenu.appendMenu(this);
        } else {
            this.ui = addGlobalMenuKeyListener(this);
        }
        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.toggle = this.toggle.bind(this);
    }
    createCloseButton(localization) {
        const closeButton = button('jw-settings-close', (e) => this.close(e), localization.close, [cloneIcon('close')]);
        this.topbar.appendChild(closeButton.element());
        closeButton.show();
        closeButton.ui.on('keydown', (e) => {
            const sourceEvent = e.sourceEvent;
            const key = sourceEvent.key.replace(/(Arrow|ape)/, '');
            // Close settings menu when enter is pressed on the close button
            // or when tab or right arrow key is pressed since it is the last element in topbar
            if (key === 'Enter' || key === 'Right' || (key === 'Tab' && !sourceEvent.shiftKey)) {
                this.close(e);
            }
        }, this);
        this.topbar.appendChild(closeButton.element());
        return closeButton;
    }
    createCategoryButton(localization) {
        const localizationKeys = {
            captions: 'cc',
            audioTracks: 'audioTracks',
            quality: 'hd',
            playbackRates: 'playbackRates',
        };
        let localizedName = localization[localizationKeys[this.name]];
        if (this.name === 'sharing') {
            localizedName = localization.sharing.heading;
        }
        this.categoryButton = categoryButton(this, localizedName);
        this.categoryButton.element().setAttribute('name', this.name);
    }
    createBackButton(localization) {
        const backButton = button('jw-settings-close', this.close, localization.close, [cloneIcon('close')]);
        return backButton;
    }
    createTopbar() {
        const topbar = createElement(`<div class="jw-submenu-topbar"></div>`);
        this.topbar = topbar;
        prependChild(topbar, this.el);
    }
    createItems(genericItems, action, options = {}, Item = RadioMenuItem) {
        const itemType = this.name;
        const categoryButtonElement = this.categoryButton.element();
        const menuItems = genericItems.map((item, index) => {
            let content;
            let argument;
            switch (itemType) {
                case 'quality':
                    if (item.label === 'Auto' && index === 0) {
                        content = `${options.defaultText}&nbsp;<span class="jw-reset jw-auto-label"></span>`;
                    } else {
                        content = item.label;
                    }
                    break;
                case 'captions':
                    if ((item.label === 'Off' || item.id === 'off') && index === 0) {
                        content = options.defaultText;
                    } else {
                        content = item.label;
                    }
                    break;
                case 'playbackRates':
                    // Normalize types before we go any further. 
                    argument = item;
                    content = isRtl(options.tooltipText) ? 'x' + item : item + 'x';
                    break;
                case 'audioTracks':
                    content = item.name;
                    break;
                default:
                    break;
            }
            const menuItem = new Item(content, (evt) => {
                if (this.active) {
                    return;
                }
                action(argument || index);
                this.items.filter(sibling => sibling.active === true).forEach(activeItem => {
                    activeItem.deactivate();
                });
                menuItem.activate();
                this.mainMenu.close(evt);
            });

            menuItem.ui.on('keydown', (event) => {
                const focusElement = (ele, i) => {
                    if (ele) {
                        ele.focus();
                    } else if (i !== undefined) {
                        menuItems[i].el.focus();
                    }
                };
                const evt = event.sourceEvent;
                const nextItem = nextSibling(categoryButtonElement);
                const prevItem = previousSibling(categoryButtonElement);
                const nextSubItem = nextSibling(evt.target);
                const prevSubItem = previousSibling(evt.target);
                const key = evt.key.replace(/(Arrow|ape)/, '');
        
                switch (key) {
                    case 'Tab':
                        focusElement(evt.shiftKey ? prevItem : nextItem);
                        break;
                    case 'Left':
                        focusElement(prevItem || 
                            previousSibling(document.getElementsByClassName('jw-icon-settings')[0]));
                        break;
                    case 'Up':
                        focusElement(prevSubItem, menuItems.length - 1);
                        break;
                    case 'Right':
                        focusElement(nextItem);
                        break;
                    case 'Down':
                        focusElement(nextSubItem, 0);
                        break;
                    default:
                        break;
                }
                evt.preventDefault();
                if (key !== 'Esc') {
                    // only bubble event if esc key was pressed
                    evt.stopPropagation();
                }
                
            });

            return menuItem;
        });

        return menuItems;
    }
    defaultChild() {
        return this.children.quality || this.children.captions || this.children.audioTracks || this.children.sharing;
    }
    setMenuItems(menuItems, initialSelectionIndex) {
        if (!menuItems) {
            this.removeMenu();
        } else {
            this.items = [];
            emptyElement(this.el);
            menuItems.forEach(menuItem => {
                this.items.push(menuItem);
                this.el.appendChild(menuItem.el);
            });
            if (initialSelectionIndex > -1) {
                menuItems[initialSelectionIndex].activate();
            }
            this.categoryButton.show();
        }
    }
    appendMenu(childMenu) {
        if (!childMenu) {
            return;
        }
        // eslint-disable-next-line no-shadow
        const { el, name, categoryButton } = childMenu;
        this.children[name] = childMenu;
        if (categoryButton) {
            const topbar = this.mainMenu.topbar;
            const sharingButton = topbar.querySelector('.jw-settings-sharing');
            const appendBefore = name === 'quality' ? topbar.firstChild : sharingButton || this.closeButton.element();

            topbar.insertBefore(
                categoryButton.element(),
                appendBefore
            );
        } else if (this.topbar) {
            const submenuItem = new MenuItem(name, childMenu.open);
            this.topbar.appendChild(submenuItem.el);
        } else {
            this.createTopBar();
        }
        this.el.appendChild(el);
    }
    removeMenu(name) {
        if (!name) {
            return this.parentMenu.removeMenu(this.name);
        }
        
        if (!this.children[name]) {
            return;
        }
        const menu = this.children[name];
        delete this.children[name];
        menu.destroy();
    }
    open(evt) {
        // if visible, return
        if (this.visible) {
            return;
        }
        if (this.isSubmenu) {
            if (this.mainMenu.openMenus.length) {
                this.mainMenu.closeAll();
            }
            if (this.items) {
                this.items[0].el.focus();
            }
            this.el.classList.add('jw-settings-submenu-active');
            this.categoryButton.element().setAttribute('aria-checked', 'true');
            this.mainMenu.openMenus.push(this.name);
            if (!this.mainMenu.visible) {
                this.mainMenu.open(evt);
                if (this.items && evt.type === 'enter') {
                    this.items[0].el.focus();
                } else {
                    // Don't show tooltip if auto-focusing for navigation's sake.
                    this.categoryButton.tooltip.suppress = true;
                    this.categoryButton.element().focus();
                }
            }
        } else {
            this.el.parentNode.classList.add('jw-settings-open');
            this.trigger('menuVisibility', { visible: true, evt });
            document.addEventListener('click', this.onDocumentClick);
        }
        this.visible = true;
        this.el.setAttribute('aria-expanded', 'true');        
    }
    close(evt) {
        // if visible, return
        if (!this.visible) {
            return;
        }
        if (this.isSubmenu) {
            this.el.classList.remove('jw-settings-submenu-active');
            this.categoryButton.element().setAttribute('aria-checked', 'false');
            this.mainMenu.openMenus = this.mainMenu.openMenus.filter(name => name !== this.name);
            if (!this.mainMenu.openMenus.length && this.mainMenu.visible) {
                this.mainMenu.close(evt);
            }
        } else {
            this.el.parentNode.classList.remove('jw-settings-open');
            this.trigger('menuVisibility', { visible: false, evt });
            document.removeEventListener('click', this.onDocumentClick);
            if (this.mainMenu.openMenus.length) {
                this.mainMenu.closeAll();
            }
        }
        this.visible = false;
        this.el.setAttribute('aria-expanded', 'false');  
    }
    closeAll() {
        this.openMenus.forEach(menuName => {
            this.children[menuName].close();
        });
    }
    toggle(evt) {
        if (this.visible) {
            this.close(evt);
        } else {
            this.open(evt);
        }
    }
    onDocumentClick(e) {
        if (!/jw-(settings|video|nextup-close|sharing-link|share-item)/.test(e.target.className)) {
            this.close();
        }
    }
    destroy() {
        document.removeEventListener('click', this.onDocumentClick);
        if (this.isSubmenu) {
            this.parentMenu.topbar.removeChild(this.categoryButton.element());
            this.categoryButton.ui.destroy();
        } else {
            this.ui.destroy();
        }
        this.visible = false;
        if (this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
        
        Object.keys(this.children).map(menuName => {
            this.children[menuName].destroy();
        });
    }
}

const addGlobalMenuKeyListener = (settingsMenu) => {
    const closeButton = settingsMenu.closeButton;
    const settingsMenuElement = settingsMenu.el;
    const ui = new UI(settingsMenuElement).on('keydown', function(evt) {
        const { sourceEvent, target } = evt;
        const next = nextSibling(target);
        const prev = previousSibling(target);
        const key = sourceEvent.key.replace(/(Arrow|ape)/, '');
        const onLeft = (isTab) => {
            if (prev) {
                if (!isTab) {
                    prev.focus();
                }
            } else {
                settingsMenu.close(evt);
            }
        };
        const onRight = () => {
            if (next && closeButton.element() && target !== closeButton.element()) {
                next.focus();
            }
        };
        let childMenu;
        switch (key) {
            case 'Esc':
                settingsMenu.close(evt);
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
                childMenu = settingsMenu.children[target.getAttribute('name')];
                if (childMenu) {
                    childMenu.open(evt);
                    if (childMenu.items && childMenu.items.length) {
                        childMenu.items[0].el.focus();
                    }
                }
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
};

export const SettingsMenu = (api, model, controlbar, localization) => {
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
    
    model.change('levels', (changedModel, levels) => {
        const menuItemOptions = { defaultText: localization.auto };
        changeMenuItems('quality', levels, api.setCurrentQuality, model.get('currentLevel'), menuItemOptions);
        const childMenus = settingsMenu.children;
        const shouldShowGear = !!childMenus.quality || !!childMenus.playbackRates || Object.keys(childMenus).length > 1;
        controlbar.elements.settingsButton.toggle(shouldShowGear);
    }, settingsMenu);
    model.change('captionsList', (changedModel, captionsList) => {
        const menuItemOptions = { defaultText: localization.off };
        const initialIndex = model.get('captionsIndex');
        changeMenuItems('captions', captionsList, api.setCurrentCaptions, initialIndex, menuItemOptions);
    });
    const setPlaybackRatesMenu = (playbackRates = model.get('playbackRates')) => {
        const showPlaybackRateControls =
            model.get('supportsPlaybackRate') &&
            model.get('streamType') !== 'LIVE' &&
            model.get('playbackRateControls');

        if (!showPlaybackRateControls && settingsMenu.children.playbackRates) {
            settingsMenu.removeMenu('playbackRates');
            return;
        }
        const initialSelectionIndex = playbackRates.indexOf(model.get('playbackRate'));
        const menuItemOptions = { tooltipText: localization.playbackRates };
        changeMenuItems('playbackRates', playbackRates, api.setPlaybackRate, initialSelectionIndex, menuItemOptions);
    };
    model.change('playbackRates', (changedModel, playbackRates) => {
        setPlaybackRatesMenu(playbackRates);
    }, settingsMenu);
    model.change('playbackRateControls', () => {
        setPlaybackRatesMenu();
    });
    model.change('audioTracks', (changedModel, audioTracks) => {
        changeMenuItems('audioTracks', audioTracks, api.setCurrentAudioTrack, model.get('currentAudioTrack'));
    }, settingsMenu);
    const onMenuItemSelected = (menu, itemIndex) => {
        if (menu && itemIndex > -1) {
            menu.items[itemIndex].activate();
        }
    };
    model.on('change:playbackRate', (changedModel, playbackRate) => {
        const rates = model.get('playbackRates');
        let index = -1;
        if (rates) {
            index = rates.indexOf(playbackRate);
        }
        onMenuItemSelected(settingsMenu.children.playbackRates, index);
    }, settingsMenu);
    model.on('change:captionsIndex', (changedModel, index) => {
        const captionsSubmenu = settingsMenu.children.captions;
        if (captionsSubmenu) {
            onMenuItemSelected(captionsSubmenu, index);
            controlbar.toggleCaptionsButtonState(!!index);
        }
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
    model.on('change:castActive', (changedModel, active, previousState) => {
        if (active === previousState) {
            return;
        }

        if (active) {
            settingsMenu.removeMenu('audioTracks');
            settingsMenu.removeMenu('quality');
            settingsMenu.removeMenu('playbackRates');
        } else {
            model.trigger('change:audioTracks', null, model.get('audioTracks'));
            model.trigger('change:levels', null, model.get('levels'));
            model.trigger('change:playbackRates', null, model.get('playbackRates'));
        }
    }, settingsMenu);
    model.on('change:streamType', () => {
        model.trigger('change:playbackRates', null, model.get('playbackRates'));
    }, settingsMenu);

    return settingsMenu;
};

