define([
    'controller/instream'
], function(Instream) {

    // This adds in all the instream methods

    function addMethods(_controller, _model, _view) {

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

        _controller.instreamSetText = function (text) {
            if (_controller._instreamPlayer) {
                _controller._instreamPlayer.instreamSetText(text);
            }
        };
    }

    return addMethods;
});
