import sinon from 'sinon';
import MockModel from 'mock/mock-model';
import MockApi from 'mock/mock-api';
import ShortcutsTooltip from 'view/controls/shortcuts-tooltip';
import { STATE_PLAYING } from 'events/events';

require('css/controls/imports/shortcuts-tooltip.less');

describe('Keyboard Shortcuts Modal Test', function() {
    function isHidden (el) {
        const style = window.getComputedStyle(el);
        return (style.display === 'none')
    }
    function isVisible (el) {
        return !isHidden(el);
    }
    const model = new MockModel();
    const api = new MockApi();
    let player;
    let shortcutsTooltip;
    beforeEach(function() {
        player = document.createElement('div');
        player.classList.add('jwplayer');
        model.setup({});
        api.play = sinon.spy();
        api.pause = sinon.spy();
        shortcutsTooltip = new ShortcutsTooltip(player, api, model);
        document.body.appendChild(player);
    });
    afterEach(function() {
        document.body.removeChild(player);
        shortcutsTooltip = null;
        player = null;
        api.play = null;
        api.pause = null;
    });
    it('should be hidden initially', function() {
        const isInitiallyHidden = isHidden(shortcutsTooltip.el);
        expect(isInitiallyHidden).to.equal(true)
    })
    it('should be visible when open', function() {
        shortcutsTooltip.open();
        const isVisibleAfterOpening = isVisible(shortcutsTooltip.el)
        expect(isVisibleAfterOpening).to.equal(true)
    });
    it('should be hidden when closed', function() {
        api.play();
        shortcutsTooltip.open();
        shortcutsTooltip.close();
        const isHiddenAfterClosing = isHidden(shortcutsTooltip.el);
        expect(isHiddenAfterClosing).to.equal(true);
    });
    it('should toggle visibility on toggleVisibility', function() {
        let isTogglingWorking;
        const isInitiallyHidden = isHidden(shortcutsTooltip.el);
        shortcutsTooltip.toggleVisibility();
        const isVisibleAfterFirstToggle = isVisible(shortcutsTooltip.el);
        shortcutsTooltip.toggleVisibility();
        const isHiddenAfterSecondToggle = isHidden(shortcutsTooltip.el);
        
        isTogglingWorking = isInitiallyHidden && isVisibleAfterFirstToggle && isHiddenAfterSecondToggle;
        expect(isTogglingWorking).to.equal(true);
    });
    it('should focus the closing button when opened', function() {
        const closeButton = player.querySelector('.jw-shortcuts-close');
        shortcutsTooltip.open();
        expect(document.activeElement.isSameNode(closeButton)).to.equal(true);
    });
    it('pauses video when openened', function() {
        shortcutsTooltip.open();
        expect(api.pause.calledOnce).to.equal(true)
    });
    it('plays video when closed', function() {
        model.set('state', STATE_PLAYING);
        shortcutsTooltip.open();
        shortcutsTooltip.close();
        expect(api.play.calledOnce).to.equal(true);
    });
});