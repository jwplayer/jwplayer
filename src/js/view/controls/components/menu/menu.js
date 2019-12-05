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
import { RadioMenuItem } from 'view/controls/components/menu/menu-item';
import { MenuTemplate } from 'view/controls/templates/menu/menu';
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
            this.mainMenu.buttonContainer.firstChild;
        const itemsContainer = new UI(itemsContainerElement);
        itemsContainer.on('keydown', onKeydown);

        return itemsContainer;
    }
    createCloseButton(localization) {
        const closeButton = button('jw-settings-close', this.close, localization.close, [cloneIcon('close')]);
        this.topbar.appendChild(closeButton.element());
        closeButton.show();
        closeButton.ui.on('keydown', function(evt) {
            const sourceEvent = evt.sourceEvent;
            const key = sourceEvent.key.replace(/(Arrow|ape)/, '');
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
        let focusEl;
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
                    focusEl = this.items[0].el;
                } else {
                    // Don't show tooltip if auto-focusing for navigation's sake.
                    categoryButton.tooltip.suppress = true;
                    focusEl = categoryButton.element();
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
    onDocumentClick(evt) {
        if (!/jw-(settings|video|nextup-close|sharing-link|share-item)/.test(evt.target.className)) {
            this.close();
        }
    }
    destroy() {
        document.removeEventListener('click', this.onDocumentClick);
        Object.keys(this.children).map(menuName => {
            this.children[menuName].destroy();
        });
        if (this.isSubmenu) {
            if (this.parentMenu.name === this.mainMenu.name && this.categoryButton) {
                this.parentMenu.buttonContainer.removeChild(this.categoryButton.element());
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
