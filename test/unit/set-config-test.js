import setConfig from 'api/set-config';

let controller = {};

function updateMockModel() {
    controller._model = {
        set: sinon.spy()
    }
}

describe('#setConfig', function () {
    beforeEach(() => {
        updateMockModel();
    });
    describe('with a supported key', () => {
        describe('when newConfig is empty', () => {
            it('does nothing', () => {
                setConfig(controller, {});
                expect(controller._model.set.called).to.be.false;
            });
        });
        describe('with playbackRates', () => {
            it('correctly updates playbackRates on the model', () => {
                setConfig(controller, {
                    'playbackRates': [0.5, 1]
                });
                expect(controller._model.set.calledWith('playbackRates', [0.5, 1])).to.be.true;
            });
        });
        describe('with playbackRateControls', () => {
            it('correctly updates playbackRateControls on the model', () => {
                setConfig(controller, {
                    'playbackRateControls': true
                });
                expect(controller._model.set.calledWith('playbackRateControls', true)).to.be.true;
            });
        });
    });
    describe('with an unsupported key', () => {
        it('does nothing', () => {
            setConfig(controller, {
                'notAKey': [0.5, 1]
            });
            expect(controller._model.set.called).to.be.false;
        });
    });
});
