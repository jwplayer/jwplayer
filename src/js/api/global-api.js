import ProviderRegister from 'providers/providers-register';
import ProvidersSupported from 'providers/providers-supported';
import plugins from 'plugins/plugins';

export const registerProvider = ProviderRegister;

export const availableProviders = ProvidersSupported;

export const registerPlugin = plugins.registerPlugin;
