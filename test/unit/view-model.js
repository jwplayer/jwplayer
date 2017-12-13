import sinon from 'sinon';
import ViewModel from 'view/view-model';
import Model from 'controller/model';

describe('ViewModel', function() {

    it('is a class', function() {
        const model = new Model();
        const viewModel = new ViewModel(model);

        expect(ViewModel).to.be.a('function');
        expect(viewModel.constructor).to.be.a('function');
    });

    it('forwards events from the player model', function() {
        const model = new Model();
        const viewModel = new ViewModel(model);

        const modelSpy = sinon.spy();

        viewModel.on('change:duration', modelSpy);
        model.set('duration', 30);

        assert(modelSpy.calledOnce, 'Player model event listener called');
        assert(modelSpy.firstCall.calledWith(viewModel, 30), 'Player model change event listener receives correct arguments');
    });

    it('forwards events from the media model', function() {
        const model = new Model();
        const mediaModel = model.get('mediaModel');
        const viewModel = new ViewModel(model);
        // Activate media-model in view-model
        model.attributes.mediaModel = null;
        model.setMediaModel(mediaModel);

        const modelSpy = sinon.spy();

        viewModel.on('change:duration', modelSpy);
        mediaModel.set('duration', 30);

        assert(modelSpy.calledOnce, 'Media model event listener called');
        assert(modelSpy.firstCall.calledWith(viewModel, 30), 'Media model change event listener receives correct arguments');
    });

    it('forwards events from the instream model', function() {
        const model = new Model();
        const viewModel = new ViewModel(model);
        const instream = {
            model: new Model()
        };

        const instreamChangeModeSpy = sinon.spy();
        const instreamModelSpy = sinon.spy();

        viewModel.on('instreamMode', instreamChangeModeSpy);
        viewModel.on('change:duration', instreamModelSpy);

        // Activate instream mode
        model.set('instream', instream);
        instream.model.set('duration', 30);

        assert(instreamChangeModeSpy.calledOnce, '"instreamMode" event listener called when instream is added');
        assert(instreamModelSpy.calledOnce, 'Instream-model event listener called');
        assert(instreamModelSpy.firstCall.calledWith(viewModel, 30), 'Instream-model change event listener receives correct arguments');

        // Deactivate instream mode
        model.set('instream', null);
        instream.model.set('duration', 60);

        assert(instreamChangeModeSpy.calledTwice, '"instreamMode" event listener called when instream is removed');
        assert(instreamModelSpy.calledOnce, 'Instream-model event listener not called after instream is removed');
    });

    it('forwards events from instream\'s media model', function() {
        const model = new Model();
        const viewModel = new ViewModel(model);
        const instream = {
            model: new Model()
        };

        const instreamModelSpy = sinon.spy();
        viewModel.on('change:duration', instreamModelSpy);

        // Activate instream mode
        model.set('instream', instream);
        instream.model.get('mediaModel').set('duration', 30);

        assert(instreamModelSpy.calledOnce, 'Instream media-model event listener called');
        assert(instreamModelSpy.firstCall.calledWith(viewModel, 30), 'Instream media-model change event listener receives correct arguments');

        // Deactivate instream mode
        model.set('instream', null);
        instream.model.get('mediaModel').set('duration', 60);

        assert(instreamModelSpy.calledOnce, 'Instream media-model event listener not called after instream is removed');
    });

    it('gets attributes from the most specific model', function() {
        const model = new Model();
        const mediaModel = model.get('mediaModel');
        const viewModel = new ViewModel(model);
        const instream = {
            model: new Model()
        };
        const instreamMediaModel = instream.model.get('mediaModel');

        model.set('attr', 'model');
        model.set('model-attr', 'model');
        mediaModel.set('attr', 'media-model');
        instream.model.set('attr', 'instream-model');
        instream.model.set('model-attr', 'instream-model');
        instreamMediaModel.set('attr', 'instream-media-model');

        expect(viewModel.get('attr'), 'Media-model is not active until it is changed on the model').to.equal('model');

        // Activate media-model in view-model
        model.attributes.mediaModel = null;
        model.setMediaModel(mediaModel);

        expect(viewModel.get('attr'), 'Media-model attribute is returned').to.equal('media-model');
        expect(viewModel.get('model-attr'), 'Attributes only on the model are returned').to.equal('model');

        // Activate instream mode
        model.set('instream', instream);

        expect(viewModel.get('attr'), 'Instream media-model attribute is returned').to.equal('instream-media-model');
        expect(viewModel.get('model-attr'), 'Attributes only on instream are returned').to.equal('instream-model');
    });

    it('set attributes on the player model only', function() {
        const model = new Model();
        const mediaModel = model.get('mediaModel');
        const viewModel = new ViewModel(model);
        const instream = {
            model: new Model()
        };
        const instreamMediaModel = instream.model.get('mediaModel');

        viewModel.set('attr', 100);

        expect(viewModel.get('attr'), 'Attributes set on the view-model can be retrieved from the view-model').to.equal(100);
        expect(model.get('attr'), 'Attributes set on the view-model are set on the model').to.equal(100);
        expect(mediaModel.get('attr'), 'Attributes set on the view-model are not set on the media-model').to.be.an('undefined');

        // Activate instream mode
        model.set('instream', instream);

        expect(viewModel.get('attr'), 'Attributes set on the view-model can be retrieved from the view-model in instream mode').to.equal(100);

        expect(instream.model.get('attr'), 'Attributes set on the view-model are not set on the instream-model').to.be.an('undefined');
        expect(instreamMediaModel.get('attr'), 'Attributes set on the view-model are not set on the instrean media-model').to.be.an('undefined');
    });

    it('has a player only sub view-model', function() {
        const model = new Model();
        const mediaModel = model.get('mediaModel');
        const instream = {
            model: new Model()
        };
        const instreamMediaModel = instream.model.get('mediaModel');
        const viewModel = new ViewModel(model);
        const playerViewModel = viewModel.player;

        const modelSpy = sinon.spy();
        const mediaModelSpy = sinon.spy();
        const instreamChangeModeSpy = sinon.spy();
        const instreamModelSpy = sinon.spy();
        const instreamMediaModelSpy = sinon.spy();
        const viewModelSpy = sinon.spy();

        playerViewModel.on('change:a', modelSpy);
        playerViewModel.on('change:b', mediaModelSpy);
        playerViewModel.on('change:c', instreamModelSpy);
        playerViewModel.on('change:d', instreamMediaModelSpy);
        playerViewModel.on('viewModelEvent', viewModelSpy);
        playerViewModel.on('instreamMode', instreamChangeModeSpy);

        // Activate media-model in view-model
        model.attributes.mediaModel = null;
        model.setMediaModel(mediaModel);

        model.set('a', 30);
        mediaModel.set('b', 30);

        // Activate instream mode
        model.set('instream', instream);

        instream.model.set('c', 30);
        instreamMediaModel.set('d', 30);

        viewModel.trigger('viewModelEvent');
        
        assert(modelSpy.calledOnce, 'Player-model listeners called');
        assert(mediaModelSpy.calledOnce, 'Player media-model listeners called');

        assert(viewModelSpy.notCalled, 'View-model listeners not called');
        assert(instreamChangeModeSpy.notCalled, '"instreamMode" view-model listener not called');
        assert(instreamModelSpy.notCalled, 'Instream-model listeners not called');
        assert(instreamMediaModelSpy.notCalled, 'Instream media-model listeners not called');
    });

    it('removes listeners when destroyed', function() {
        const model = new Model();
        const mediaModel = model.get('mediaModel');
        const viewModel = new ViewModel(model);
        const instream = {
            model: new Model()
        };
        const instreamMediaModel = instream.model.get('mediaModel');

        const modelSpy = sinon.spy();
        const mediaModelSpy = sinon.spy();
        const instreamChangeModeSpy = sinon.spy();
        const instreamModelSpy = sinon.spy();
        const instreamMediaModelSpy = sinon.spy();
        const viewModelSpy = sinon.spy();

        viewModel.on('test-model', modelSpy);
        viewModel.on('test-media', mediaModelSpy);
        viewModel.on('test-instream-model', instreamModelSpy);
        viewModel.on('test-instream-media-model', instreamMediaModelSpy);
        viewModel.on('test-view-model', viewModelSpy);
        viewModel.on('instreamMode', instreamChangeModeSpy);

        viewModel.destroy();

        model.trigger('test-model');
        mediaModel.trigger('test-media');
        viewModel.trigger('test-view-model');

        // Activate instream mode
        model.set('instream', instream);

        instream.model.trigger('test-instream-model');
        instreamMediaModel.trigger('test-instream-media-model');
        viewModel.trigger('test-view-model');

        assert(modelSpy.notCalled, 'Model listeners removed');
        assert(mediaModelSpy.notCalled, 'Media-model listeners removed');
        assert(instreamChangeModeSpy.notCalled, '"instreamMode" view-model listener removed');
        assert(instreamModelSpy.notCalled, 'Instream-model listeners removed');
        assert(instreamMediaModelSpy.notCalled, 'Instream media-model listeners removed');
        assert(viewModelSpy.notCalled, 'View-model listeners removed');
    });

    it('implements getVideo', function() {
        const model = new Model();
        const viewModel = new ViewModel(model);

        expect(viewModel.getVideo).to.be.a('function');
    });
});
