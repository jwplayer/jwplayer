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
import { itemMenuTemplate } from 'view/controls/templates/menu/menu-item';
import menuCategoryButton from 'view/controls/components/menu/category-button';
import { isRtl } from 'utils/language';

let backButtonTarget;
export default class Menu extends Events {
    constructor(_name, _parentMenu, _localization, _template = MenuTemplate) {
        super();
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.toggle = this.toggle.bind(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);
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
        this.categoryButton = null;
        this.closeButton = (this.parentMenu && this.parentMenu.closeButton) || this.createCloseButton(_localization);
        if (this.isSubmenu) {
            this.categoryButton = this.parentMenu.categoryButton || this.createCategoryButton(_localization);
            this.itemsContainer = this.createItemsContainer();
            this.parentMenu.appendMenu(this);
            if (this.parentMenu.parentMenu && !this.mainMenu.backButton) {
                this.mainMenu.backButton = this.createBackButton(_localization);
            }
        } else {
            this.ui = addGlobalMenuKeyListener(this);
        }
    }
    createItemsContainer() {
        const itemsContainerElement = this.el.querySelector('.jw-settings-submenu-items');
        const onKeydown = function(event) {
            if (event.target.parentNode !== itemsContainerElement) {
                return;
            }
            const focusElement = (ele, i) => {
                if (ele) {
                    ele.focus();
                } else if (i !== undefined) {
                    itemsContainerElement.childNodes[i].focus();
                }
            };
            const evt = event.sourceEvent;
            const nextItem = nextSibling(topbarTarget);
            const prevItem = previousSibling(topbarTarget);
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
                    focusElement(prevSubItem, itemsContainerElement.childNodes.length - 1);
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
            
        };
        let topbarTarget = 
        this.categoryButton && this.categoryButton.element() || 
        this.parentMenu.categoryButton && this.parentMenu.categoryButton.element() ||
        this.mainMenu.topbar.firstChild;
        const itemsContainer = new UI(itemsContainerElement);
        itemsContainer.on('keydown', onKeydown);

        return itemsContainer;
    }
    createCloseButton(localization) {
        const closeButton = button('jw-settings-close', this.close, localization.close, [cloneIcon('close')]);
        this.topbar.appendChild(closeButton.element());
        closeButton.show();
        closeButton.ui.on('keydown', function(e) {
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
        const categoryButtonInstance = menuCategoryButton(this, localizedName);
        categoryButtonInstance.element().setAttribute('name', this.name);

        return categoryButtonInstance;
    }
    createBackButton(localization) {
        const backButton = button(
            'jw-settings-back', 
            (e) => {
                if (backButtonTarget) {
                    backButtonTarget.open(e);
                }
            }, 
            localization.close, 
            [cloneIcon('arrow-left')]
        );
        prependChild(this.mainMenu.topbar, backButton.element());
        return backButton;
    }
    createTopbar() {
        const topbar = createElement(`<div class="jw-submenu-topbar"></div>`);
        prependChild(this.el, topbar);
        return topbar;
    }
    createItems(genericItems, action, options = {}, Item = RadioMenuItem) {
        const itemType = this.name;
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

            // For custom items, allow options to pass through to template.
            if (!content) {
                content = item;
                if (typeof item === 'object') {
                    content.options = options;
                }
            }

            const menuItemClick = (evt) => {
                if (menuItem.active) {
                    return;
                }
                action(argument || index);
                if (menuItem.deactivate) {  
                    this.items.filter(sibling => sibling.active === true).forEach(activeItem => {
                        activeItem.deactivate();
                    });
                    this.mainMenu.close(evt);
                }
                if (menuItem.activate) {
                    menuItem.activate();
                }
            };

            const menuItem = new Item(content, menuItemClick.bind(this));

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
            emptyElement(this.itemsContainer.el);
            menuItems.forEach(menuItem => {
                this.items.push(menuItem);
                this.itemsContainer.el.appendChild(menuItem.el);
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
        }
        this.mainMenu.el.appendChild(el);
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
        if (this.visible && !this.openMenus) {
            return;
        }
        if (this.isSubmenu) {
            const { mainMenu, parentMenu, categoryButton } = this;
            if (parentMenu.openMenus.length) {
                parentMenu.closeChildren();
            }
            if (categoryButton) {
                categoryButton.element().setAttribute('aria-checked', 'true');
            }
            if (parentMenu.isSubmenu) {
                parentMenu.el.classList.remove('jw-settings-submenu-active');
                mainMenu.topbar.classList.add('jw-nested-menu-open');
                const topbarText = mainMenu.topbar.querySelector('.jw-settings-topbar-text');
                topbarText.innerText = this.title || this.name;
                mainMenu.backButton.show();
                backButtonTarget = this.parentMenu;
            } else {
                mainMenu.topbar.classList.remove('jw-nested-menu-open');
                if (mainMenu.backButton) {
                    mainMenu.backButton.hide();
                }
            }
            this.el.classList.add('jw-settings-submenu-active');
            parentMenu.openMenus.push(this.name);
            if (!mainMenu.visible) {
                mainMenu.open(evt);
                if (this.items && evt && evt.type === 'enter') {
                    this.items[0].el.focus();
                } else {
                    // Don't show tooltip if auto-focusing for navigation's sake.
                    categoryButton.tooltip.suppress = true;
                    categoryButton.element().focus();
                }
            }
            if (this.openMenus.length) {
                this.closeChildren();
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
        this.visible = false;
        this.el.setAttribute('aria-expanded', 'false'); 
        if (this.isSubmenu) {
            this.el.classList.remove('jw-settings-submenu-active');
            this.categoryButton.element().setAttribute('aria-checked', 'false');
            this.parentMenu.openMenus = this.parentMenu.openMenus.filter(name => name !== this.name);
            if (!this.mainMenu.openMenus.length && this.mainMenu.visible) {
                this.mainMenu.close(evt);
            }
        } else {
            this.el.parentNode.classList.remove('jw-settings-open');
            this.trigger('menuVisibility', { visible: false, evt });
            document.removeEventListener('click', this.onDocumentClick);
        }
        if (this.openMenus.length) {
            this.closeChildren();
        }
    }
    closeChildren() {
        this.openMenus.forEach(menuName => {
            const menu = this.children[menuName];
            if (menu) {
                menu.close();
            }
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
        Object.keys(this.children).map(menuName => {
            this.children[menuName].destroy();
        });
        if (this.isSubmenu) {
            if (this.parentMenu.name === 'settings' && this.categoryButton) {
                this.parentMenu.topbar.removeChild(this.categoryButton.element());
                this.categoryButton.ui.destroy();
            }
            if (this.itemsContainer) {
                this.itemsContainer.destroy();
            }
            const openMenus = this.parentMenu.openMenus;
            const openMenuIndex = openMenus.indexOf(this.name);
            if (openMenus.length && openMenuIndex > -1) {
                this.openMenus.splice(openMenuIndex, 1);
            }
            delete this.parentMenu;
        } else {
            this.ui.destroy();
        }
        this.visible = false;
        if (this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
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
        if (!levels || levels[0].label !== 'Auto') {
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
        qualityMenu.items[currentIndex].activate();
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
        if (captionsMenu) {
            captionsMenu.topbar = captionsMenu.topbar || captionsMenu.createTopbar();
            const captionsSettingsMenu = new Menu('captionsSettings', captionsMenu, localization);
            captionsSettingsMenu.title = 'Settings';
            const captionsSettingsButton = new MenuItem('Settings', captionsSettingsMenu.open);
            captionsMenu.topbar.appendChild(captionsSettingsButton.el);
            const captionsSettingsItems = [];
            captionsOptions.forEach(captionsOption => {
                const itemMenu = new Menu(captionsOption.name, captionsSettingsMenu, localization);
                const item = new MenuItem(
                    { label: captionsOption.name, value: captionsOption.defaultVal }, 
                    itemMenu.open, 
                    itemMenuTemplate
                );
                itemMenu.setMenuItems(
                    itemMenu.createItems(
                        captionsOption.options, (index) => {
                            item.el.querySelector('.jw-settings-content-item-value').innerText = captionsOption.options[index];
                        }, 
                        null
                    ), 
                    captionsOption.options.indexOf(captionsOption.defaultVal) || 0
                );
                captionsSettingsItems.push(item);
            });
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
            controlbar.toggleCaptionsButtonState(!!index);
        }
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


const captionsOptions = [
    {
        name: 'Font Color',
        options: ['White', 'Black', 'Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan'],
        defaultVal: 'White'
    },
    {
        name: 'Font Opacity',
        options: ['100%', '75%', '25%'],
        defaultVal: '100%'
    },
    {
        name: 'Font Size',
        options: ['200%', '175%', '150%', '125%', '100%', '75%', '50%'],
        defaultVal: '100%'
    },
    {
        name: 'Font Family',
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
        defaultVal: 'Arial'
    },
    {
        name: 'Character Edge',
        options: [ 'None', 'Raised', 'Depressed', 'Uniform', 'Drop Shadow'
        ],
        defaultVal: 'None'
    },
    {
        name: 'Background Color',
        options: [
            'White', 'Black', 'Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan'
        ],
        defaultVal: 'Black'
    },
    {
        name: 'Background Opacity',
        options: ['100%', '75%', '25%', '0%'],
        defaultVal: '100%'
    },
    {
        name: 'Window Color',
        options: [
            'White', 'Black', 'Red', 'Green', 'Blue', 'Yellow', 'Magenta', 'Cyan'
        ],
        defaultVal: 'Black'
    },
    {
        name: 'Window Opacity',
        options: ['100%', '75%', '25%', '0%'],
        defaultVal: '0%'
    },
];

