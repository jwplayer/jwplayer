import sinon from 'sinon';
import ViewsManager from 'view/utils/views-manager';

describe('ViewsManager', function() {
    describe('#add', () => {
        it('sets the responsive sizing function of the passed in view', () => {
            let funcMock = sinon.spy();
            let view = {
                setResponsiveResizeCallback: funcMock
            };

            ViewsManager.add(view);
            expect(funcMock.called).to.be.true;
            expect(typeof funcMock.getCall(0).args[0]).to.eq('function');
            ViewsManager.remove(view);
        });
    });
});
