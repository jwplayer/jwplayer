import rightclickTemplate from 'view/controls/templates/rightclick';
import { cloneIcon } from 'view/controls/icons';
import { version } from 'version';
import { createElement, emptyElement, addClass, removeClass, bounds } from 'utils/dom';
import { Browser, OS } from 'environment/environment';
import { isTizen } from 'utils/browser';
import UI, { isRightClick } from 'utils/ui';
import { isRtl } from 'utils/language';

const EDITION_MAP = {
    free: 0,
    pro: 1,
    premium: 2,
    ads: 3,
    invalid: 4,
    enterprise: 6,
    trial: 7,
    platinum: 8,
    starter: 9,
    business: 10,
    developer: 11
};

function createDomElement(html) {
    const element = createElement(html);
    const logoContainer = element.querySelector('.jw-rightclick-logo');
    if (logoContainer) {
        logoContainer.appendChild(cloneIcon('jwplayer-logo'));
    }
    return element;
}

export default class RightClick {
    constructor(shortcutsTooltip) {
        this.shortcutsTooltip = shortcutsTooltip;
    }

    buildArray() {
        const semverParts = version.split('+');
        const majorMinorPatchPre = semverParts[0];
        const model = this.model;
        const edition = model.get('edition');
        const poweredBy = model.get('localization').poweredBy;
        const versionSpan = `<span class="jw-reset">JW Player ${majorMinorPatchPre}</span>`;

        const menu = {
            items: [{
                title: isRtl(poweredBy) ? `${versionSpan} ${poweredBy}` : `${poweredBy} ${versionSpan}`,
                type: 'link',
                featured: true,
                showLogo: true,
                link: `https://jwplayer.com/learn-more?e=${EDITION_MAP[edition]}`
            }]
        };

        const menuItems = menu.items;
        if (this.shortcutsTooltip) {
            menuItems.splice(menuItems.length - 1, 0, {
                type: 'keyboardShortcuts'
            });
        }
        this.pipMenu = !OS.mobile && model.get('pipIcon') !== 'disabled'
            && ((Browser.chrome &&!isTizen()) || Browser.edge || Browser.safari);
        if (this.pipMenu) {
            menuItems.splice(menuItems.length - 1, 0, {
                type: 'pip'
            });
        }

        return menu;
    }

    rightClick(evt) {
        this.lazySetup();

        if (this.mouseOverContext) {
            // right click on menu item should execute it
            return false;
        }

        this.hideMenu();
        this.showMenu(evt);
        this.addHideMenuHandlers();
    }

    getOffset(evt) {
        const playerBounds = bounds(this.wrapperElement);
        let x = evt.pageX - playerBounds.left;
        let y = evt.pageY - playerBounds.top;

        // move menu up on touch devices
        // so it is not be blocked by fingers
        if (this.model.get('touchMode')) {
            y -= 100;
        }

        return { x, y };
    }

    showMenu(evt) {
        // Offset relative to player element
        const off = this.getOffset(evt);

        this.el.style.left = off.x + 'px';
        this.el.style.top = off.y + 'px';
        this.outCount = 0;

        addClass(this.playerContainer, 'jw-flag-rightclick-open');
        addClass(this.el, 'jw-open');
        clearTimeout(this._menuTimeout);
        this._menuTimeout = setTimeout(() => this.hideMenu(), 3000);
        return false;
    }

    hideMenu(evt) {
        if (evt && this.el && this.el.contains(evt.target)) {
            // Do not hide menu when clicking inside menu
            return;
        }

        removeClass(this.playerContainer, 'jw-flag-rightclick-open');
        removeClass(this.el, 'jw-open');
    }

    lazySetup() {
        const html = rightclickTemplate(this.buildArray(), this.model.get('localization'));
        if (this.el) {
            if (this.html !== html) {
                this.html = html;
                const newEl = createDomElement(html);
                emptyElement(this.el);
                for (let i = newEl.childNodes.length; i--;) {
                    this.el.appendChild(newEl.firstChild);
                }
            }
            return;
        }

        this.html = html;
        this.el = createDomElement(this.html);
        this.wrapperElement.appendChild(this.el);

        this.hideMenuHandler = e => {
            if (isRightClick(e)) {
                return;
            }
            this.hideMenu(e);
        };
        this.overHandler = () => {
            this.mouseOverContext = true;
        };
        this.outHandler = (evt) => {
            this.mouseOverContext = false;
            if (evt.relatedTarget && !this.el.contains(evt.relatedTarget) && ++this.outCount > 1) {
                this.hideMenu();
            }
        };
        this.pipHandler = () => {
            this.model.set('pip', !this.model.get('pip'));
        };
        this.shortcutsTooltipHandler = () => {
            // Open the shortcuts tooltip if clicked, and hide the rightclick menu
            this.mouseOverContext = false;
            this.hideMenu();
            this.shortcutsTooltip.open();
        };
    }

    setup(_model, _playerContainer, _wrapperElement) {
        this.wrapperElement = _wrapperElement;
        this.model = _model;
        this.mouseOverContext = false;
        this.playerContainer = _playerContainer;
        this.ui = new UI(_wrapperElement).on('longPress', this.rightClick, this);
    }

    addHideMenuHandlers() {
        this.removeHideMenuHandlers();

        this.wrapperElement.addEventListener('touchstart', this.hideMenuHandler);
        document.addEventListener('touchstart', this.hideMenuHandler);

        if (!OS.mobile) {
            this.wrapperElement.addEventListener('click', this.hideMenuHandler);
            document.addEventListener('click', this.hideMenuHandler);
            // Track if the mouse is above the menu or not
            this.el.addEventListener('mouseover', this.overHandler);
            this.el.addEventListener('mouseout', this.outHandler);
        }

        if (this.pipMenu) {
            this.el.querySelector('.jw-pip-item').addEventListener('click', this.pipHandler);
        }

        if (this.shortcutsTooltip) {
            this.el.querySelector('.jw-shortcuts-item').addEventListener('click', this.shortcutsTooltipHandler);
        }
    }

    removeHideMenuHandlers() {
        if (this.wrapperElement) {
            this.wrapperElement.removeEventListener('click', this.hideMenuHandler);
            this.wrapperElement.removeEventListener('touchstart', this.hideMenuHandler);
        }
        if (this.el) {
            this.el.removeEventListener('mouseover', this.overHandler);
            this.el.removeEventListener('mouseout', this.outHandler);
            if (this.pipMenu) {
                this.el.querySelector('.jw-pip-item').removeEventListener('click', this.pipHandler);
            }
            if (this.shortcutsTooltip) {
                this.el.querySelector('.jw-shortcuts-item').removeEventListener('click', this.shortcutsTooltipHandler);
            }
        }
        document.removeEventListener('click', this.hideMenuHandler);
        document.removeEventListener('touchstart', this.hideMenuHandler);
    }

    destroy() {
        clearTimeout(this._menuTimeout);
        this.removeHideMenuHandlers();

        if (this.el) {
            this.hideMenu();
            this.hideMenuHandler = null;
            this.el = null;
        }

        if (this.wrapperElement) {
            this.wrapperElement.oncontextmenu = null;
            this.wrapperElement = null;
        }

        if (this.model) {
            this.model = null;
        }

        if (this.ui) {
            this.ui.destroy();
            this.ui = null;
        }
    }
}
