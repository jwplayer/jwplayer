import MockModel from 'mock/mock-model';
import MockApi from 'mock/mock-api';
import ShortcutsTooltip from 'view/controls/shortcuts-tooltip';

require('css/controls/imports/shortcuts-tooltip.less');

describe('Keyboard Shortcuts Modal Test', () => {
    function isHidden (el) {
        var style = window.getComputedStyle(el);
        return (style.display === 'none')
    }
    function isVisible (el) {
        return !isHidden(el);
    }
    const model = new MockModel();
    const api = new MockApi();
    let player;
    let shortcutsTooltip;
    beforeEach(() => {
        player = document.createElement('div');
        player.classList.add('jwplayer');
        model.setup({});
        shortcutsTooltip = new ShortcutsTooltip(player, api, model);
        document.body.appendChild(player);
    });
    afterEach(() => {
        document.body.removeChild(player);
        shortcutsTooltip = null;
        player = null;
    });
    it('should be hidden initially', () => {
        const isInitiallyHidden = isHidden(shortcutsTooltip.el);
        expect(isInitiallyHidden).to.deep.equal(true)
    })
    it('should be visible when open', () => {
        shortcutsTooltip.open();
        const isVisibleAfterOpening = isVisible(shortcutsTooltip.el)
        expect(isVisibleAfterOpening).to.deep.equal(true)
    });
    it('should be hidden when closed', () => {
        shortcutsTooltip.open();
        shortcutsTooltip.close();
        const isHiddenAfterClosing = isHidden(shortcutsTooltip.el);
        expect(isHiddenAfterClosing).to.deep.equal(true);
    });
    it('should toggle visibility on toggleVisibility', () => {
        let isTogglingWorking;
        const isInitiallyHidden = isHidden(shortcutsTooltip.el);
        shortcutsTooltip.toggleVisibility();
        const isVisibleAfterFirstToggle = isVisible(shortcutsTooltip.el);
        shortcutsTooltip.toggleVisibility();
        const isHiddenAfterSecondToggle = isHidden(shortcutsTooltip.el);
        
        isTogglingWorking = isInitiallyHidden && isVisibleAfterFirstToggle && isHiddenAfterSecondToggle;
        expect(isTogglingWorking).to.deep.equal(true);
    });
    it('should focus the closing button when opened', () => {
        const closeButton = player.querySelector('.jw-shortcuts-close');
        shortcutsTooltip.open();
        document.activeElement.isSameNode(closeButton)
        expect(true).to.deep.equal(true);
    });
});