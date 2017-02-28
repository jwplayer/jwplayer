define([
    'api/api',
    'utils/underscore',
    'providers/providers',
    'providers/providers-supported',
    'plugins/plugins'
], function(Api, _, Providers, ProvidersSupported, plugins) {
    var _instances = [];
    var _uniqueIndex = 0;

    var selectPlayer = function (query) {
        var player;
        var domElement;

        // prioritize getting a player over querying an element
        if (!query) {
            player = _instances[0];
        } else if (typeof query === 'string') {
            player = _playerById(query);
            if (!player) {
                domElement = document.getElementById(query);
            }
        } else if (typeof query === 'number') {
            player = _instances[query];
        } else if (query.nodeType) {
            domElement = query;
            player = _playerById(domElement.id);
        }
        // found player
        if (player) {
            return player;
        }
        // create player
        if (domElement) {
            return _addPlayer(new Api(domElement, _removePlayer));
        }
        // invalid query
        return {
            registerPlugin: plugins.registerPlugin
        };
    };

    var _playerById = function (id) {
        for (var p = 0; p < _instances.length; p++) {
            if (_instances[p].id === id) {
                return _instances[p];
            }
        }

        return null;
    };

    var _addPlayer = function (api) {
        _uniqueIndex++;
        api.uniqueId = _uniqueIndex;
        _instances.push(api);
        return api;
    };

    var _removePlayer = function (api) {
        for (var i = _instances.length; i--;) {
            if (_instances[i].uniqueId === api.uniqueId) {
                _instances.splice(i, 1);
                break;
            }
        }
    };

    var api = {
        selectPlayer: selectPlayer,
        registerProvider: Providers.registerProvider,
        availableProviders: ProvidersSupported,
        registerPlugin: plugins.registerPlugin
    };

    selectPlayer.api = api;

    return api;
});
