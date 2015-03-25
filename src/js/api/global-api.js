define([
    'utils/helpers',
    'api/api'
], function(utils, Api) {

    var _instances = [],
        _uniqueIndex = 0;


    var selectPlayer = function (identifier) {
        var _container;

        if (!utils.exists(identifier)) {
            identifier = 0;
        }

        if (identifier.nodeType) {
            // Handle DOM Element
            _container = identifier;
        } else if (typeof identifier === 'string') {
            // Find container by ID
            _container = document.getElementById(identifier);
        }

        if (_container) {
            var foundPlayer = playerById(_container.id);
            if (foundPlayer) {
                return foundPlayer;
            } else {
                return (new Api(_container));
            }
        } else if (typeof identifier === 'number') {
            return _instances[identifier];
        }

        return null;
    };


    var playerById = function (id) {
        for (var p = 0; p < _instances.length; p++) {
            if (_instances[p].id === id) {
                return _instances[p];
            }
        }

        return null;
    };

     var addPlayer = function (api) {
        for (var p = 0; p < _instances.length; p++) {
            if (_instances[p] === api) {
                return api; // Player is already in the list;
            }
        }

        _uniqueIndex++;
        api.uniqueId = _uniqueIndex;
        _instances.push(api);
        return api;
    };

    return {
        _instances : _instances,
        selectPlayer : selectPlayer,
        playerById : playerById,
        addPlayer : addPlayer
    };
});
