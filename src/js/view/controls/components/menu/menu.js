import UI from 'utils/ui';
import Events from 'utils/backbone.events';
import { 
    createElement, 
    prependChild, 
    nextSibling, 
    previousSibling
} from 'utils/dom';
import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import { RadioMenuItem } from 'view/controls/components/menu/menu-item';
import { MenuTemplate } from 'view/controls/templates/menu/menu';
import { normalizeKey } from './utils';
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
        this.buttonContainer = this.el.querySelector(`.jw-${this.name}-topbar-buttons`);
        this.children = {};
        this.openMenus = [];
        this.items = [];
        this.visible = false;
        this.parentMenu = _parentMenu;
        this.mainMenu = !this.parentMenu ? this : this.parentMenu.mainMenu;
        this.categoryButton = null;
        this.closeButton = (this.parentMenu && this.parentMenu.closeButton) || this.createCloseButton(_localization);
        if (this.isSubmenu) {
            if (this.parentMenu.name === this.mainMenu.name) {
                this.categoryButton = this.createCategoryButton(_localization);
            }
            if (this.parentMenu.parentMenu && !this.mainMenu.backButton) {
                this.mainMenu.backButton = this.createBackButton(_localization);
            }
            this.itemsContainer = this.createItemsContainer();
            this.parentMenu.appendMenu(this);
        } else {
            this.ui = addMenuTopbarListener(this);
        }
    }
    get defaultChild() {
        const { quality, captions, audioTracks, sharing, playbackRates } = this.children;
        return quality || captions || audioTracks || sharing || playbackRates;
    }
    createItemsContainer() {
        const itemsContainerElement = this.el.querySelector('.jw-settings-submenu-items');
        const closeButtonElement = this.mainMenu.closeButton && this.mainMenu.closeButton.element();
        const backButtonElement = this.mainMenu.backButton && this.mainMenu.backButton.element();
        const categoryButtonElement = this.categoryButton && this.categoryButton.element();
        const getTopbar = () => this.topbar && this.topbar.firstChild;
        const onKeydown = (evt) => {
            if (event.target.parentNode !== itemsContainerElement) {
                return;
            }

            const { sourceEvent, target } = evt;
            const topbar = getTopbar();
            const settingsElement = document.getElementsByClassName('jw-icon-settings')[0];
            const rightItem = categoryButtonElement ? nextSibling(categoryButtonElement) : closeButtonElement;
            const leftItem = categoryButtonElement ? previousSibling(categoryButtonElement) : backButtonElement;
            const downItem = nextSibling(target) || topbar || itemsContainerElement.firstChild;
            const upItem = previousSibling(target) || topbar || itemsContainerElement.lastChild;
            const key = sourceEvent && normalizeKey(sourceEvent.key);
            let focusEl;

            switch (key) {
                case 'Tab':
                    focusEl = sourceEvent.shiftKey ? leftItem : rightItem;
                    break;
                case 'Left':
                    focusEl = (leftItem || this.close(evt) && settingsElement);
                    break;
                case 'Up':
                    focusEl = upItem;
                    break;
                case 'Right':
                    focusEl = rightItem;
                    break;
                case 'Down':
                    focusEl = downItem;
                    break;
                case 'Esc':
                    focusEl = settingsElement;
                    this.close(event);
                    break;
                default:
                    break;
            }
            if (focusEl) {
                focusEl.focus();
            }
            sourceEvent.preventDefault();
            if (key !== 'Esc') {
                // only bubble event if esc key was pressed
                sourceEvent.stopPropagation();
            }
            
        };
        const itemsContainer = new UI(itemsContainerElement);
        itemsContainer.on('keydown', onKeydown);

        return itemsContainer;
    }
    createCloseButton(localization) {
        const closeButton = button('jw-settings-close', this.close, localization.close, [cloneIcon('close')]);
        this.topbar.appendChild(closeButton.element());
        closeButton.show();
        closeButton.ui.on('keydown', (evt) => {
            const sourceEvent = evt.sourceEvent;
            const key = normalizeKey(sourceEvent.key);
            // Close settings menu when enter is pressed on the close button
            // or when tab or right arrow key is pressed since it is the last element in topbar
            if (key === 'Enter' || key === 'Right' || (key === 'Tab' && !sourceEvent.shiftKey)) {
                this.close(evt);
            }
        }, this);
        this.buttonContainer.appendChild(closeButton.element());
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
            (evt) => {
                if (backButtonTarget) {
                    backButtonTarget.open(evt);
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
        const itemsContainer = this.itemsContainer.el;
        const settingsMenu = this.mainMenu;
        const categoryButton = this.categoryButton;
        this.topbarUI = new UI(topbar).on('keydown', (evt) => {
            const sourceEvent = evt.sourceEvent;
            const key = normalizeKey(sourceEvent.key);
            const onLeft = () => {
                if (categoryButton) {
                    previousSibling(categoryButton.element()).focus();
                    sourceEvent.preventDefault();
                } else {
                    settingsMenu.backButton.element().focus();
                }
            };
            const onRight = () => {
                if (categoryButton) {
                    nextSibling(categoryButton.element()).focus();
                    sourceEvent.preventDefault();
                } else {
                    settingsMenu.closeButton.element().focus();
                }
            };
            switch (key) {
                case 'Up':
                    itemsContainer.lastChild.focus();
                    break;
                case 'Down':
                    itemsContainer.firstChild.focus();
                    break;
                case 'Left':
                    onLeft();
                    break;
                case 'Right':
                    onRight();
                    break;
                case 'Tab':
                    if (sourceEvent.shiftKey) {
                        onLeft();
                    } else {
                        onRight();
                    }
                    break;
                default:
                    break;
            }
        });
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
                if (menuItem.deactivate) {  
                    this.items.filter(sibling => sibling.active === true).forEach(activeItem => {
                        activeItem.deactivate();
                    });
                    if (backButtonTarget) {
                        backButtonTarget.open(evt);
                    } else {
                        this.mainMenu.close(evt);
                    }
                }
                if (menuItem.activate) {
                    menuItem.activate();
                }
                action(argument || index);
            };

            const menuItem = new Item(content, menuItemClick.bind(this));

            return menuItem;
        });

        return menuItems;
    }
    setMenuItems(menuItems, initialSelectionIndex) {
        if (!menuItems) {
            this.removeMenu();
        } else {
            this.destroyItems();
            menuItems.forEach(menuItem => {
                this.items.push(menuItem);
                this.itemsContainer.el.appendChild(menuItem.el);
            });
            if (initialSelectionIndex > -1) {
                this.items[initialSelectionIndex].activate();
            }
            if (this.categoryButton) {
                this.categoryButton.show();
            }
        }
    }
    appendMenu(childMenu) {
        if (!childMenu) {
            return;
        }

        const { el, name, categoryButton } = childMenu;

        this.children[name] = childMenu;
        if (categoryButton) {
            const buttonContainer = this.mainMenu.buttonContainer;
            const sharingButton = buttonContainer.querySelector('.jw-settings-sharing');
            const appendBefore = name === 'quality' ? 
                buttonContainer.firstChild : 
                sharingButton || this.closeButton.element();

            buttonContainer.insertBefore(
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

        const menu = this.children[name];
        if (!menu) {
            return;
        }
        delete this.children[name];
        menu.destroy();
    }
    open(evt) {
        const mainMenuVisible = this.mainMenu.visible;
        let focusEl;
        if (this.isSubmenu) {
            if (!this.items.length) {
                return;
            }
            const sourceEvent = evt && evt.sourceEvent;
            const firstItem = this.topbar ? this.topbar.firstChild : this.items[0].el;
            const lastItem = this.items[this.items.length - 1].el;
            const isKeydown = sourceEvent && sourceEvent.type === 'keydown';
            const key = isKeydown && normalizeKey(sourceEvent.key);
            const itemTarget = key === 'Up' ? lastItem : firstItem;
            if (this.visible && !this.openMenus.length) {
                if (this.items.length && isKeydown) {
                    itemTarget.focus();
                }
                return;
            }
            const { mainMenu, parentMenu, categoryButton } = this;
            parentMenu.openMenus.push(this.name);
            if (parentMenu.openMenus.length > 1) {
                parentMenu.closeChildren(this.name);
            }
            if (categoryButton) {
                categoryButton.element().setAttribute('aria-checked', 'true');
            }
            if (parentMenu.isSubmenu) {
                parentMenu.el.classList.remove('jw-settings-submenu-active');
                mainMenu.topbar.classList.add('jw-nested-menu-open');
                const menuTitle = mainMenu.topbar.querySelector('.jw-settings-topbar-text');
                menuTitle.setAttribute('name', this.name);
                menuTitle.innerText = this.title || this.name;
                mainMenu.backButton.show();
                backButtonTarget = this.parentMenu;
                focusEl = menuTitle;
            } else {
                mainMenu.topbar.classList.remove('jw-nested-menu-open');
                if (mainMenu.backButton) {
                    mainMenu.backButton.hide();
                }
            }
            this.el.classList.add('jw-settings-submenu-active');
            if (mainMenuVisible && isKeydown) {
                focusEl = itemTarget;
            } else if (!mainMenuVisible) {
                mainMenu.open(evt);
                focusEl = categoryButton.element();
                if (categoryButton && categoryButton.tooltip && !isKeydown) {
                    categoryButton.tooltip.suppress = true;
                        
                }
            }
            if (this.openMenus.length) {
                this.closeChildren();
            }
            if (focusEl) {
                focusEl.focus();
            }
            this.el.scrollTop = 0;
        } else {
            if (this.visible) {
                return;
            }
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
            if (this.categoryButton) {
                this.categoryButton.element().setAttribute('aria-checked', 'false');
            }
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
    closeChildren(keepOpenName) {
        this.openMenus.forEach(menuName => {
            if (menuName === keepOpenName) {
                return;
            }
            const menu = this.children[menuName];
            if (menu) {
                menu.close();
            }
        });
    }
    toggle(evt, isDefault) {
        if (isDefault && this.mainMenu.visible) {
            return this.mainMenu.close(evt);
        }
        if (this.visible) {
            this.close(evt);
        } else {
            this.open(evt);
        }
    }
    onDocumentClick(evt) {
        if (!/jw-(settings|video|nextup-close|sharing-link|share-item)/.test(evt.target.className)) {
            this.close();
        }
    }
    destroyItems() {
        this.items.forEach(item => {
            item.destroy();
        });
        this.items = [];
    }
    destroy() {
        document.removeEventListener('click', this.onDocumentClick);
        Object.keys(this.children).map(menuName => {
            this.children[menuName].destroy();
        });
        if (this.isSubmenu) {
            if (this.categoryButton) {
                this.parentMenu.buttonContainer.removeChild(this.categoryButton.element());
                this.categoryButton.ui.destroy();
            }
            if (this.topbarUI) {
                this.topbarUI.destroy();
            }
            this.destroyItems();
            this.itemsContainer.destroy();
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

const addMenuTopbarListener = (settingsMenu) => {
    const closeButton = settingsMenu.closeButton;
    const ui = new UI(settingsMenu.topbar).on('keydown', function(evt) {
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
                settingsMenu.close(evt);
            }
        };
        const onRight = () => {
            if (next && closeButton.element() && target !== closeButton.element()) {
                next.focus();
            }
        };
        const onOpen = () => {
            let targetMenu = settingsMenu.children[target.getAttribute('name')];
            if (!targetMenu && backButtonTarget) {
                targetMenu = backButtonTarget.children[backButtonTarget.openMenus[0]];
            }
            if (targetMenu && targetMenu.open) {
                targetMenu.open(evt);
            }
            return targetMenu;
        };
        
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
};
