import loadPlugins, { registerPlugin } from 'plugins/plugins';
import PluginsModel from 'plugins/model';
import Plugin from 'plugins/plugin';
import SimpleModel from 'model/simplemodel';
import sinon from 'sinon';

// Any instance of PluginsModel provides access to registered plugins
const globalPluginsModel = new PluginsModel();

const mockApi = () => ({
    id: 'player',
    addPlugin: sinon.spy()
});

function MockModel(attributes) {
    Object.assign(this, SimpleModel);
    this.attributes = attributes || {};
}

function getFullyQualifiedUrl(path) {
    const a = document.createElement('a');
    a.href = path;
    return a.href;
}

function getDocumentHeadScripts() {
    return Array.prototype.slice.call(document.head.querySelectorAll('script'));
}
function getScriptForPlugin(path) {
    const url = getFullyQualifiedUrl(path);
    return getDocumentHeadScripts().filter((tag) => (tag.src === url))[0];
}

function removeAllPlugins() {
    const registeredPlugins = globalPluginsModel.getPlugins();
    Object.keys(registeredPlugins).map(property => {
        const plugin = registeredPlugins[property];
        delete registeredPlugins[property];
        return plugin;
    }).filter(plugin => (plugin.url !== plugin.name)).forEach(plugin => {
        const tag = getScriptForPlugin(plugin.url);
        if (tag) {
            document.head.removeChild(tag);
        }
    });
    // remove tags that errored on load
    getDocumentHeadScripts().forEach(tag => {
        if (/\/plugin1.js$/.test(tag.src)) {
            document.head.removeChild(tag);
        }
    });
}

describe('plugins', function() {

    describe('registerPlugin()', function() {
        this.timeout(5000);

        beforeEach(removeAllPlugins);

        afterEach(removeAllPlugins);

        it('adds plugin constructors to the registry', function () {
            const PluginClass = function () {};
            registerPlugin('plug', '8.0', PluginClass);

            const registeredPlugins = globalPluginsModel.getPlugins();

            expect(registeredPlugins).to.be.an('object');
            expect(registeredPlugins).to.have.property('plug');

            expect(registeredPlugins.plug).to.be.an('object');
            expect(registeredPlugins.plug).to.have.property('js').which.equals(PluginClass);
            expect(registeredPlugins.plug).to.have.property('name').which.equals('plug');
            expect(registeredPlugins.plug).to.have.property('target').which.equals('8.0');
            expect(registeredPlugins.plug).to.have.property('url').which.equals('plug');
        });

    });

    describe('loadPlugins()', function() {
        this.timeout(5000);

        beforeEach(removeAllPlugins);

        afterEach(removeAllPlugins);

        it('retrieves all plugins in the model and instantiates them', function() {
            const pluginList = [
                '/base/test/files/plugin1.js',
                '/base/test/files/plugin2.js'
            ];
            const api = mockApi();
            const model = new MockModel({
                plugins: pluginList.reduce((plugins, url) => (plugins[url] = {} && plugins), {})
            });
            const scripts = getDocumentHeadScripts();
            return loadPlugins(model, api).then(() => {
                const registeredPlugins = globalPluginsModel.getPlugins();

                expect(Object.keys(registeredPlugins), 'registered plugins').to.have.lengthOf(2);
                expect(registeredPlugins).to.have.property('plugin1')
                    .which.has.property('url').which.equals(pluginList[0]);
                expect(registeredPlugins).to.have.property('plugin2')
                    .which.has.property('url').which.equals(pluginList[1]);

                expect(getDocumentHeadScripts(), 'script tags').to.have.lengthOf(scripts.length + 2);

                const tag1 = getScriptForPlugin(registeredPlugins.plugin1.url);
                const tag2 = getScriptForPlugin(registeredPlugins.plugin2.url);
                expect(tag1).to.exist;
                expect(tag2).to.exist;

                expect(api.addPlugin).to.have.callCount(2);

                const calls = [ api.addPlugin.getCall(0), api.addPlugin.getCall(1) ]
                    .sort((a) => (a.args[0] === 'plugin1' ? -1 : 1));

                expect(calls[0].args[0]).to.equal('plugin1');
                expect(calls[1].args[0]).to.equal('plugin2');
                expect(calls[0].args[1]).to.be.an.instanceOf(registeredPlugins.plugin1.js);
                expect(calls[1].args[1]).to.be.an.instanceOf(registeredPlugins.plugin2.js);
            });
        });

        it('only loads the same plugin once', function() {
            const api = mockApi();
            const model = new MockModel({
                plugins: {
                    '/base/test/files/plugin1.js': {}
                }
            });
            const scripts = getDocumentHeadScripts();
            return loadPlugins(model, api).then(() => loadPlugins(model, api)).then(() => {
                const registeredPlugins = globalPluginsModel.getPlugins();
                expect(Object.keys(registeredPlugins), 'one plugin was registered').to.have.lengthOf(1);
                expect(registeredPlugins).to.have.property('plugin1');

                expect(getDocumentHeadScripts(), 'one script tag was appended').to.have.lengthOf(scripts.length + 1);

                const tag1 = getScriptForPlugin(registeredPlugins.plugin1.url);
                expect(tag1).to.exist;

                expect(api.addPlugin, 'two instances were added').to.have.callCount(2);
            });
        });

        it('only loads the same plugin once', function() {
            const api = mockApi();
            const model = new MockModel({
                plugins: {
                    '/base/test/files/plugin1.js': {}
                }
            });
            const scripts = getDocumentHeadScripts();
            return loadPlugins(model, api).then(() => loadPlugins(model, api)).then(() => {
                const registeredPlugins = globalPluginsModel.getPlugins();
                expect(Object.keys(registeredPlugins), 'one plugin was registered').to.have.lengthOf(1);
                expect(registeredPlugins).to.have.property('plugin1');

                expect(getDocumentHeadScripts(), 'one script tag was appended').to.have.lengthOf(scripts.length + 1);

                const tag1 = getScriptForPlugin(registeredPlugins.plugin1.url);
                expect(tag1).to.exist;

                expect(api.addPlugin, 'two instances were added').to.have.callCount(2);
            });
        });

        it('does not load plugins already registered', function() {
            const scripts = getDocumentHeadScripts();
            const FirstPluginClass = function () {};
            registerPlugin('plugin1', '8.0', FirstPluginClass);

            const registeredPlugins = globalPluginsModel.getPlugins();
            expect(Object.keys(registeredPlugins), 'one plugin was registered').to.have.lengthOf(1);
            expect(registeredPlugins).to.have.property('plugin1');

            const api = mockApi();
            const model = new MockModel({
                plugins: {
                    '/base/test/files/plugin1.js': {}
                }
            });
            return loadPlugins(model, api).then(() => {
                const secondRegisteredPlugins = globalPluginsModel.getPlugins();
                expect(Object.keys(secondRegisteredPlugins), 'no addtional plugins were registered').to.have.lengthOf(1);
                expect(secondRegisteredPlugins).to.have.property('plugin1');
                expect(secondRegisteredPlugins.plugin1).to.have.property('js').which.equals(FirstPluginClass);

                expect(getDocumentHeadScripts(), 'no scripts were appended').to.have.lengthOf(scripts.length);

                expect(api.addPlugin, 'once instance was added').to.have.callCount(1);
            });
        });

        it('loads one plugin with the same name, but instantiates both', function() {
            const api = mockApi();
            const model = new MockModel({
                plugins: {
                    '/base/test/files/plugin1.js': {},
                    '/base/404/plugin1.js': {}
                }
            });
            const scripts = getDocumentHeadScripts();
            return loadPlugins(model, api).then(() => {
                const registeredPlugins = globalPluginsModel.getPlugins();
                expect(Object.keys(registeredPlugins), 'one plugin was registered').to.have.lengthOf(1);
                expect(registeredPlugins).to.have.property('plugin1');

                expect(getDocumentHeadScripts(), 'one script tag was appended').to.have.lengthOf(scripts.length + 1);
                const tag1 = getScriptForPlugin(registeredPlugins.plugin1.url);
                expect(tag1).to.exist;

                expect(api.addPlugin,
                    'Since the config called for two plugin1 instances, two were be created').to.have.callCount(2);
            });
        });

        it('will reload the same plugin if previous attempts were unsuccessful', function() {
            const api = mockApi();
            const firstModel = new MockModel({
                plugins: {
                    '/base/404/plugin1.js': {}
                }
            });
            const scripts = getDocumentHeadScripts();
            return loadPlugins(firstModel, api).then(() => {
                const registeredPlugins = globalPluginsModel.getPlugins();
                expect(Object.keys(registeredPlugins), 'registeredPlugins').to.have.lengthOf(0);
                expect(getDocumentHeadScripts(), 'script loader does not remove tags that failed to load').to.have.lengthOf(scripts.length + 1);
                const secondModel = new MockModel({
                    plugins: {
                        '/base/test/files/plugin1.js': {}
                    }
                });
                return loadPlugins(secondModel, api);
            }).then(() => {
                const registeredPlugins = globalPluginsModel.getPlugins();

                expect(Object.keys(registeredPlugins), 'registered plugins').to.have.lengthOf(1);
                expect(registeredPlugins).to.have.property('plugin1');

                expect(getDocumentHeadScripts(), 'script tags').to.have.lengthOf(scripts.length + 2);

                const tag1 = getScriptForPlugin(registeredPlugins.plugin1.url);
                expect(tag1).to.exist;

                expect(api.addPlugin).to.have.callCount(1);
            });
        });

        it('handles single request failure', function() {
            const api = mockApi();
            const model = new MockModel({
                plugins: {
                    '/base/404/plugin1.js': {}
                }
            });
            return loadPlugins(model, api).then((results) => {
                const registeredPlugins = globalPluginsModel.getPlugins();
                expect(Object.keys(registeredPlugins), 'registeredPlugins').to.have.lengthOf(0);
                expect(api.addPlugin).to.have.callCount(0);

                expect(results[0]).to.be.an('error');
            });
        });

        it('handles request failure across multiple instances', function() {
            const api = mockApi();
            const model = new MockModel({
                plugins: {
                    '/base/404/plugin1.js': {}
                }
            });
            const scripts = getDocumentHeadScripts();
            return Promise.all([
                loadPlugins(model, api),
                loadPlugins(model, api),
                loadPlugins(model, api),
                loadPlugins(model, api),
                loadPlugins(model, api)
            ]).then(() => {
                const registeredPlugins = globalPluginsModel.getPlugins();
                expect(Object.keys(registeredPlugins), 'registeredPlugins').to.have.lengthOf(0);
                expect(getDocumentHeadScripts(), 'script loader does not remove tags that failed to load').to.have.lengthOf(scripts.length + 1);
                expect(api.addPlugin).to.have.callCount(0);
            });
        });

        it('registers loaded plugin, but does not instantiate them when player is destroyed', function() {
            const pluginList = [
                '/base/test/files/plugin1.js',
                '/base/test/files/plugin2.js'
            ];
            const api = mockApi();
            const model = new MockModel({
                plugins: pluginList.reduce((plugins, url) => (plugins[url] = {} && plugins), {})
            });
            const scripts = getDocumentHeadScripts();
            const promise = loadPlugins(model, api);
            model.attributes._destroyed = true;
            return promise.then(() => {
                const registeredPlugins = globalPluginsModel.getPlugins();

                expect(Object.keys(registeredPlugins), 'registered plugins').to.have.lengthOf(2);
                expect(registeredPlugins).to.have.property('plugin1')
                    .which.has.property('url').which.equals(pluginList[0]);
                expect(registeredPlugins).to.have.property('plugin2')
                    .which.has.property('url').which.equals(pluginList[1]);

                expect(getDocumentHeadScripts(), 'script tags').to.have.lengthOf(scripts.length + 2);

                const tag1 = getScriptForPlugin(registeredPlugins.plugin1.url);
                const tag2 = getScriptForPlugin(registeredPlugins.plugin2.url);
                expect(tag1).to.exist;
                expect(tag2).to.exist;

                expect(api.addPlugin).to.have.callCount(0);
            });
        });

        it('resolves immediately for inline plugin configs', function() {
            const PluginClassSpy = sinon.spy();
            registerPlugin('plugin1', '8.0', PluginClassSpy);

            const pluginConfig = { options: true };
            const api = mockApi();
            const model = new MockModel({
                plugins: {
                    plugin1: pluginConfig
                }
            });

            return loadPlugins(model, api).then((results) => {
                const registeredPlugins = globalPluginsModel.getPlugins();
                expect(Object.keys(registeredPlugins), 'one plugin was registered').to.have.lengthOf(1);
                expect(registeredPlugins).to.have.property('plugin1');

                expect(PluginClassSpy, 'plugin was instantiated').to.have.callCount(1).calledWith(api, pluginConfig);
                expect(results[0]).instanceof(PluginClassSpy);

                expect(api.addPlugin, 'one instance was added').to.have.callCount(1);
            });
        });

        it('resolves asynchronously for loaded JavaScript that does not call registerPlugin()', function() {
            const pluginConfig = { options: true };
            const api = mockApi();
            const model = new MockModel({
                plugins: {
                    '/base/test/files/noop.js': pluginConfig
                }
            });

            return loadPlugins(model, api).then((results) => {
                const registeredPlugins = globalPluginsModel.getPlugins();
                expect(Object.keys(registeredPlugins), 'The JavaScript did not call registerPlugin()').to.have.lengthOf(0);
                expect(api.addPlugin, 'No instance was added').to.have.callCount(0);
                expect(results[0]).to.be.an('error').which.has.property('message')
                    .which.contains('did not call registerPlugin');
            });
        });

        it('resolves immediately, removing unregistered inline plugin configs from the registry', function() {
            const api = mockApi();
            const model = new MockModel({
                plugins: {
                    plugin1: {}
                }
            });
            return loadPlugins(model, api).then((results) => {
                const registeredPlugins = globalPluginsModel.getPlugins();
                expect(Object.keys(registeredPlugins), 'registry is empty').to.have.lengthOf(0);
                expect(api.addPlugin, 'no instance was added').to.have.callCount(0);
                expect(results[0]).to.be.an('error');
            });
        });

    });

    describe('Plugin class', function() {

        it('returns a promise from load() that resolves on load of JavaScript', function() {
            const plugin = new Plugin('/base/test/files/noop.js');
            const loadResult = plugin.load();
            expect(loadResult).to.equal(plugin.promise);
            return loadResult.then(result => {
                expect(result).instanceof(Plugin).which.equals(plugin);
            });
        });

        it('returns a promise from load() that is rejected on error', function() {
            const plugin = new Plugin('/base/404/plugin1.js');
            const loadResult = plugin.load();
            expect(loadResult).to.equal(plugin.promise);
            return loadResult.catch(result => {
                expect(result).to.be.an('error');
            });
        });
    });

});
