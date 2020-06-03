import { ProvidersLoaded } from 'providers/providers-loaded';
import { SupportsMatrix } from 'providers/providers-supported';
import DefaultProvider from 'providers/default';
import type { ImplementedProvider } from 'providers/default';
import { find, matches, isFunction, defaults } from 'utils/underscore';
import Events from 'utils/backbone.events';

export default function registerProvider(provider: ImplementedProvider): void {
    const name = provider.getName().name;

    // Only register the provider if it isn't registered already.  This is an issue on pages with multiple embeds.
    if (ProvidersLoaded[name]) {
        return;
    }

    // If there isn't a "supports" val for this guy
    if (!find(SupportsMatrix, matches({ name: name }))) {
        if (!isFunction(provider.supports)) {
            throw new Error('Tried to register a provider with an invalid object');
        }

        // The most recent provider will be in the front of the array, and chosen first
        SupportsMatrix.unshift({
            name: name,
            supports: provider.supports
        });
    }

    if (__HEADLESS__) {
        defaults(provider.prototype, Events);
    }

    // Fill in any missing properties with the defaults - looks at the prototype chain
    defaults(provider.prototype, DefaultProvider);

    // After registration, it is loaded
    ProvidersLoaded[name] = provider;
}
