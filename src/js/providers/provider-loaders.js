import registerProvider from 'providers/providers-register';
import { chunkLoadErrorHandler } from '../api/core-loader';

export const Loaders = {
    html5: function() {
        return require.ensure(['providers/html5'], function(require) {
            const provider = require('providers/html5').default;
            registerProvider(provider);
            return provider;
        }, chunkLoadErrorHandler(152), 'provider.html5');
    }
};

