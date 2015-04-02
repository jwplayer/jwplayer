define([
    'controller/instream'
], function(Instream) {

    return function (_controller, _model, _view) {

        // add to controller
        _controller.initializeAPI = function() {
            _controller.resize = _view.resize;
            _controller.seekDrag = _model.seekDrag;
            _controller.getSafeRegion = _view.getSafeRegion;
            _controller.forceState = _view.forceState;
            _controller.releaseState = _view.releaseState;
            _controller.setCues = _view.addCues;
            _controller.dockAddButton = _view.addButton;
            _controller.dockRemoveButton = _view.removeButton;


            _controller.initInstream = function () {
                _controller.instreamDestroy();
                _controller._instreamPlayer = new Instream(_controller, _model, _view);
                _controller._instreamPlayer.init();
            };

            _controller.loadItemInstream = function (item, options) {
                if (!_controller._instreamPlayer) {
                    throw 'Instream player undefined';
                }
                _controller._instreamPlayer.load(item, options);
            };

            _controller.loadArrayInstream = function (item, options) {
                if (!_controller._instreamPlayer) {
                    throw 'Instream player undefined';
                }
                _controller._instreamPlayer.load(item, options);
            };

            _controller.setControls = function (mode) {
                _view.setControls(mode);
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.setControls(mode);
                }
            };

            _controller.instreamPlay = function () {
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.instreamPlay();
                }
            };

            _controller.instreamPause = function () {
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.instreamPause();
                }
            };

            _controller.instreamState = function () {
                if (_controller._instreamPlayer) {
                    return _controller._instreamPlayer.instreamState();
                }
                return '';
            };

            _controller.instreamDestroy = function (complete, _instreamInstance) {
                _instreamInstance = _instreamInstance || _controller._instreamPlayer;
                if (_instreamInstance) {
                    _instreamInstance.instreamDestroy(complete || false);
                    if (_instreamInstance === _controller._instreamPlayer) {
                        _controller._instreamPlayer = undefined;
                    }
                }
            };

            _controller.instreamAddEventListener = function (type, listener) {
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.addEventListener(type, listener);
                }
            };

            _controller.instreamRemoveEventListener = function (type, listener) {
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.removeEventListener(type, listener);
                }
            };

            _controller.playerDestroy = function () {

                if (_controller) {
                    _controller.stop();
                }
                if (_view) {
                    _view.destroy();
                }
                if (_model) {
                    _model.destroy();
                }
                if (_controller._setup) {
                    _controller._setup.resetEventListeners();
                    _controller._setup.destroy();
                }
            };

            _controller.instreamSetText = function (text) {
                if (_controller._instreamPlayer) {
                    _controller._instreamPlayer.instreamSetText(text);
                }
            };

            _controller.isBeforePlay = _controller.checkBeforePlay;

            _controller.isBeforeComplete = function () {
                return _model.getVideo().checkComplete();
            };
        };

        // Deprecate.
        _controller.jwInitInstream = _controller.initInstream;
        _controller.initializeAPI();
    };
});
