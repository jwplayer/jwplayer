define(['utils/helpers', 'view/skinloader'], function(utils, SkinLoader) {
    var Skin = function() {
        var _components = {};
        var _loaded = false;

        this.load = function(path, completeCallback, errorCallback) {
            new SkinLoader(path, function(skin) {
                _loaded = true;
                _components = skin;
                if (typeof completeCallback === 'function') {
                    completeCallback();
                }
            }, function(message) {
                if (typeof errorCallback === 'function') {
                    errorCallback(message);
                }
            });

        };

        this.getSkinElement = function(component, element) {
            component = _lowerCase(component);
            element = _lowerCase(element);
            if (_loaded) {
                try {
                    return _components[component].elements[element];
                } catch (err) {
                    utils.log('No such skin component / element: ', [component, element]);
                }
            }
            return null;
        };

        this.getComponentSettings = function(component) {
            component = _lowerCase(component);
            if (_loaded && _components && _components[component]) {
                return _components[component].settings;
            }
            return null;
        };

        this.getComponentLayout = function(component) {
            component = _lowerCase(component);
            if (_loaded) {
                var lo = _components[component].layout;
                if (lo && (lo.left || lo.right || lo.center)) {
                    return _components[component].layout;
                }
            }
            return null;
        };

        function _lowerCase(string) {
            return string.toLowerCase();
        }

    };

    return Skin;
});
