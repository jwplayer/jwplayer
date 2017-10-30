import rightclickTemplate from 'view/controls/templates/rightclick';
import { cloneIcon } from 'view/controls/icons';
import { version } from 'version';
import { flashVersion } from 'utils/browser';
import { createElement, emptyElement, addClass, removeClass, bounds } from 'utils/dom';
import UI from 'utils/ui';

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
        var playerBounds = bounds(this.playerElement);
        var x = evt.pageX - playerBounds.left;
        var y = evt.pageY - playerBounds.top;

        return { x: x, y: y };
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

    hideMenu() {
        this.elementUI.off('out', this.hideMenu, this);
        if (this.mouseOverContext) {
            // If mouse is over the menu, hide the menu when mouse moves out
            this.elementUI.on('out', this.hideMenu, this);
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
        this.elementUI = new UI(this.el, { useHover: true })
            .on('over', function() {
                this.mouseOverContext = true;
            }, this)
            .on('out', function() {
                this.mouseOverContext = false;
            }, this);
    }

    setup(_model, _playerElement, layer) {
        this.playerElement = _playerElement;
        this.model = _model;
        this.mouseOverContext = false;
        this.layer = layer;

        // Defer the rest of setup until the first click
        _playerElement.oncontextmenu = this.rightClick.bind(this);
    }

    addOffListener(element) {
        element.addEventListener('mousedown', this.hideMenuHandler);
        element.addEventListener('touchstart', this.hideMenuHandler);
        element.addEventListener('pointerdown', this.hideMenuHandler);
    }

    removeOffListener(element) {
        element.removeEventListener('mousedown', this.hideMenuHandler);
        element.removeEventListener('touchstart', this.hideMenuHandler);
        element.removeEventListener('pointerdown', this.hideMenuHandler);
    }

    destroy() {
        clearTimeout(this._menuTimeout);
        if (this.el) {
            this.hideMenu();
            this.elementUI.off();
            this.removeOffListener(this.playerElement);
            this.removeOffListener(document);
            this.hideMenuHandler = null;
            this.el = null;
        }

        if (this.playerElement) {
            this.playerElement.oncontextmenu = null;
            this.playerElement = null;
        }

        if (this.model) {
            this.model = null;
        }
    }
}
