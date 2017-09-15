import viewsManager from 'view/utils/views-manager';
import sinon from 'sinon';

describe.skip('viewsManager', function() {

    let intersectionObserver;

    beforeEach(function() {
        intersectionObserver = viewsManager.getIntersectionObserver();
        intersectionObserver.observe = sinon.spy();
        intersectionObserver.unobserve = sinon.spy();
    });

    describe('intersectionObserver', function() {

        it('should observe & unobserve the same container', function() {
            const container = document.createElement('div');
            container.id = 'player-1';

            viewsManager.observe(container);
            viewsManager.unobserve(container);

            expect(intersectionObserver.observe.callCount).to.equal(1);
            expect(intersectionObserver.unobserve.callCount).to.equal(1);
        });

        it('should observe & unobserve the same container once on multiple calls', function() {
            const container = document.createElement('div');
            container.id = 'player-1';

            viewsManager.observe(container);
            viewsManager.observe(container);
            viewsManager.unobserve(container);
            viewsManager.unobserve(container);

            expect(intersectionObserver.observe.callCount).to.equal(1);
            expect(intersectionObserver.unobserve.callCount).to.equal(1);
        });

        it('should observe & unobserve multiple containers', function() {
            const container1 = document.createElement('div');
            container1.id = 'player-1';

            const container2 = document.createElement('div');
            container2.id = 'player-2';

            viewsManager.observe(container1);
            viewsManager.observe(container2);
            viewsManager.unobserve(container1);
            viewsManager.unobserve(container2);

            expect(intersectionObserver.observe.callCount).to.equal(2);
            expect(intersectionObserver.unobserve.callCount).to.equal(2);
        });
    });

    it('should do nothing when there is nothing to unobserve', function() {
        const container = document.createElement('div');
        container.id = 'player-1';

        viewsManager.unobserve(container);

        expect(intersectionObserver.unobserve.callCount).to.equal(0);
    });
});
