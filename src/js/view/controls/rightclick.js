import rightclickTemplate from 'view/controls/templates/rightclick';
import { cloneIcon } from 'view/controls/icons';
import { version } from 'version';
import { flashVersion } from 'utils/browser';
import { createElement, emptyElement, addClass, removeClass, bounds } from 'utils/dom';
import { OS } from 'environment/environment';

function createDomElement(html) {
    const element = createElement(html);
    const logoContainer = element.querySelector('.jw-rightclick-logo');
    if (logoContainer) {
        logoContainer.appendChild(cloneIcon('jwplayer-logo'));
    }
    return element;
}

export default class RightClick {

    buildArray() {
        var semverParts = version.split('+');
        var majorMinorPatchPre = semverParts[0];

        var menu = {
            items: [{
                title: 'Powered by <span class="jw-reset">JW Player ' + majorMinorPatchPre + '</span>',
                featured: true,
                showLogo: true,
                link: 'https://jwplayer.com/learn-more'
            }]
        };

        var provider = this.model.get('provider');
        if (provider && provider.name.indexOf('flash') >= 0) {
            var text = 'Flash Version ' + flashVersion();
            menu.items.push({
                title: text,
                link: 'http://www.adobe.com/software/flash/about/'
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

        return false;
    }

    getOffset(evt) {
        const playerBounds = bounds(this.playerElement);
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
        var off = this.getOffset(evt);

        this.el.style.left = off.x + 'px';
        this.el.style.top = off.y + 'px';

        addClass(this.playerElement, 'jw-flag-rightclick-open');
        addClass(this.el, 'jw-open');
        clearTimeout(this._menuTimeout);
        this._menuTimeout = setTimeout(() => this.hideMenu(), 3000);
        return false;
    }

    hideMenu(evt) {
        if (!this.model.get('touchMode')) {
            // If mouse is over the menu, hide the menu when mouse moves out
            this.el.removeEventListener('mouseout', this.hideMenuHandler);
            if (this.mouseOverContext) {
                this.el.addEventListener('mouseout', this.hideMenuHandler);
                return;
            }
        } else if (evt && this.el.contains(evt.target)) {
            // If menu is tapped, do not hide menu on elements
            return;
        }

        removeClass(this.playerElement, 'jw-flag-rightclick-open');
        removeClass(this.el, 'jw-open');
    }

    lazySetup() {
        const html = rightclickTemplate(this.buildArray());
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

        this.layer.appendChild(this.el);

        this.hideMenuHandler = this.hideMenu.bind(this);
        this.addOffListener(this.playerElement);
        this.addOffListener(document);

        // Track if the mouse is above the menu or not
        this.onMouseOverHandler = this.onMouseOver.bind(this);
        this.onMouseOutHandler = this.onMouseOut.bind(this);
        this.el.addEventListener('mouseover', this.onMouseOverHandler);
        this.el.addEventListener('mouseout', this.onMouseOutHandler);
    }

    setup(_model, _playerElement, layer) {
        this.playerElement = _playerElement;
        this.model = _model;
        this.mouseOverContext = false;
        this.layer = layer;

        if (!OS.iOS) {
            // Defer the rest of setup until the first click
            _playerElement.oncontextmenu = this.rightClick.bind(this);
        } else {
            // oncontextmenu is not supported on iOS
            this.startLongPressHandler = this.startLongPress.bind(this);
            this.cancelLongPressHandler = this.cancelLongPress.bind(this);

            _playerElement.addEventListener('touchstart', this.startLongPressHandler);
            _playerElement.addEventListener('touchmove', this.cancelLongPressHandler);
            _playerElement.addEventListener('touchend', this.cancelLongPressHandler);
            _playerElement.addEventListener('touchcancel', this.cancelLongPressHandler);
        }
    }

    onMouseOver() {
        this.mouseOverContext = true;
    }

    onMouseOut() {
        this.mouseOverContext = false;
    }

    startLongPress(evt) {
        this.cancelLongPress();
        this.longPressTimeout = setTimeout(() => {
            this.rightClick(evt);
            this.longPressTimeout = null;
        }, 500);
    }

    cancelLongPress() {
        clearTimeout(this.longPressTimeout);
    }

    addOffListener(element) {
        if (!OS.iOS) {
            element.addEventListener('mousedown', this.hideMenuHandler);
        }
        element.addEventListener('touchstart', this.hideMenuHandler);
        element.addEventListener('pointerdown', this.hideMenuHandler);
    }

    removeOffListener(element) {
        if (!OS.iOS) {
            element.removeEventListener('mousedown', this.hideMenuHandler);
        }
        element.removeEventListener('touchstart', this.hideMenuHandler);
        element.removeEventListener('pointerdown', this.hideMenuHandler);
    }

    destroy() {
        clearTimeout(this._menuTimeout);
        if (this.el) {
            this.hideMenu();
            this.removeOffListener(this.playerElement);
            this.removeOffListener(document);
            this.el.removeEventListener('mouseover', this.onMouseOverHandler);
            this.el.removeEventListener('mouseout', this.onMouseOutHandler);
            this.el.removeListener('mouseout', this.hideMenuHandler);
            this.hideMenuHandler = null;
            this.el = null;
        }

        if (this.playerElement) {
            this.playerElement.removeEventListener('touchstart', this.startLongPressHandler);
            this.playerElement.removeEventListener('touchmove', this.cancelLongPressHandler);
            this.playerElement.removeEventListener('touchend', this.cancelLongPressHandler);
            this.playerElement.removeEventListener('touchcancel', this.cancelLongPressHandler);
            this.playerElement = null;
        }

        if (this.model) {
            this.model = null;
        }
    }
}
