import ViewsManager from 'view/utils/views-manager';

describe('ViewsManager', function() {
    describe('#size', () => {
        it('returns the number of views added', () => {
            const view = {};
            expect(ViewsManager.size()).to.equal(0);
            ViewsManager.add(view);
            ViewsManager.add(view);
            expect(ViewsManager.size()).to.equal(2);
            ViewsManager.remove(view);
            expect(ViewsManager.size()).to.equal(1);
            ViewsManager.remove(view);
            expect(ViewsManager.size()).to.equal(0);
        });
    });
});
