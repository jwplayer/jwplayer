define([
    'providers/html5',
    'providers/flash',
    'providers/youtube',
    'utils/underscore'
    ], function(html5, flash, youtube, _) {


    function Providers(config) {
        this.providers = Providers.defaultList.slice();
        this.config = config || {};

        if (this.config.primary === 'flash') {
            swap(this.providers, html5, flash);
        }
    }

    // When choosing a provider, go through this array
    //   and select the first that works for the source
    Providers.defaultList = [html5, flash, youtube];

    _.extend(Providers.prototype, {

        providerSupports : function(provider, source) {
            return provider.supports(source);
        },

        choose : function(source) {
            // prevent throw on missing source
            source = _.isObject(source) ? source : {};

            var chosen = _.find(this.providers, function (provider) {
                return this.providerSupports(provider, source);
            }, this);

            return chosen;
        },

        priority : function(p) {
            var idx = _.indexOf(this.providers, p);
            if (idx < 0) {
                // No provider matched
                return idx;
            }

            // prefer earlier providers
            return this.providers.length - idx -1;
        }
    });

    function swap(arr, left, right) {
        var l = _.indexOf(arr, left);
        var r = _.indexOf(arr, right);

        var temp = arr[l];
        arr[l] = arr[r];
        arr[r] = temp;
    }

    return Providers;
});