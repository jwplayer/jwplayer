import Model from 'controller/model';
import ProgramController from 'program/program-controller';
import AdProgramController from '../../src/js/program/ad-program-controller';
import sinon from 'sinon';

describe('AdProgramController', function () {
    const sandbox = sinon.createSandbox();
    let mockModel = null;
    let mockMediaPool;
    let mockAdProgramController = null;
    let mockProvider;
    let mockPlayerModel;

    beforeEach(() => {
        mockPlayerModel = {
            on: sandbox.spy(),
            get: sandbox.spy(),
            getMute: sandbox.spy(),
            getVideo: sandbox.spy()
        }
        mockProvider = {
            off: sandbox.spy(),
            on: sandbox.spy(),
            attachMedia: sandbox.spy(),
            volume: sandbox.spy(),
            mute: sandbox.spy()
        }
        mockModel = new Model().setup();
        mockMediaPool = {
            getPrimedElement: sandbox.stub().returns({
                src: 'mockSrc',
                addEventListener: sandbox.spy(),
                removeEventListener: sandbox.spy(),
                pause: sandbox.spy()
            }),
            clean: sandbox.spy()
        }
        mockAdProgramController = new AdProgramController(mockModel, mockMediaPool);
        mockAdProgramController.playerModel = mockPlayerModel;
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('setActiveItem properly sets adPlaying value', function() {
        let superSpy = sandbox.stub(ProgramController.prototype, 'setActiveItem').resolves(true);
        mockAdProgramController.stopVideo = sandbox.stub();
        mockAdProgramController.setActiveItem(0);

        expect(superSpy.calledWith(0)).to.equal(true);
        expect(mockAdProgramController.adPlaying).to.equal(true);
    });

    it('destroy sets adPlaying value to false and turns off model', function() {
        mockAdProgramController.model.off = sandbox.spy();
        mockAdProgramController.destroy();

        expect(mockAdProgramController.adPlaying).to.equal(false);
        expect(mockAdProgramController.provider).to.equal(null);
        expect(mockAdProgramController.model.off.called).to.equal(true);
    });

    it('_setProvider sets provider if called with a value', function() {
        mockAdProgramController._setProvider(mockProvider);

        expect(mockAdProgramController.provider).to.equal(mockProvider);
    });

    it('_setProvider sets event listeners on provider and playerModel', function() {
        mockAdProgramController._setProvider(mockProvider);

        expect(mockAdProgramController.provider.on.calledWith('all')).to.equal(true);
        expect(mockAdProgramController.provider.on.calledWith('state')).to.equal(true);
        expect(mockAdProgramController.provider.on.calledWith('fullscreenchange')).to.equal(true);
        expect(mockAdProgramController.playerModel.on.calledWith('change:volume')).to.equal(true);
        expect(mockAdProgramController.playerModel.on.calledWith('change:mute')).to.equal(true);
        expect(mockAdProgramController.playerModel.on.calledWith('change:autostartMuted')).to.equal(true);
    });

    it('seting mute calls super`s setMute', function() {
        let superSpy = sandbox.stub(ProgramController.prototype, 'setMute');
        // mock media controller value
        mockAdProgramController.mediaController = true;
        mockAdProgramController.mute = true;

        expect(superSpy.calledWith(true)).to.equal(true);
    });

    it('seting volume calls super`s setVolume', function() {
        let superSpy = sandbox.stub(ProgramController.prototype, 'setVolume');
        // mock media controller value
        mockAdProgramController.mediaController = true;
        mockAdProgramController.volume = 50;

        expect(superSpy.calledWith(50)).to.equal(true);
    });
});