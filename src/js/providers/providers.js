define([
    'providers/providers-supported',
    'providers/providers-loaded',
    'utils/underscore'
    ], function(ProvidersSupported, ProvidersLoaded, _) {


    function Providers(config) {
        this.providers = ProvidersSupported.slice();
        this.config = config || {};

        if (this.config.primary === 'flash') {
            swap(this.providers, 'html5', 'flash');
        }
    }

    _.extend(Providers.prototype, {

        providerSupports : function(provider, source) {
            return provider.supports(source);
        },

        // Find the name of the first provider which can support the media source-type
        choose : function(source) {
            // prevent throw on missing source
            source = _.isObject(source) ? source : {};

            var count = this.providers.length;
            for (var i = 0; i < count; i++) {
                var provider = this.providers[i];
                if (this.providerSupports(provider, source)) {
                    // prefer earlier providers
                    var priority = count - i - 1;

                    return {
                        priority: priority,
                        name : provider.name,
                        type: source.type,
                        // If provider isn't loaded, this will be undefined
                        provider : ProvidersLoaded[provider.name]
                    };
                }
            }

            return null;
        }
    });

    function getIndex(arr, name) {
        for(var i =0; i < arr.length; i++) {
            if (arr[i].name === name) {
                return i;
            }
        }
        return -1;
    }

    function swap(arr, left, right) {
        var l = getIndex(arr, left);
        var r = getIndex(arr, right);

        var temp = arr[l];
        arr[l] = arr[r];
        arr[r] = temp;
    }

    return Providers;
});