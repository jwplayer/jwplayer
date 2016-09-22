define([
    'plugins/utils',
    'utils/helpers',
    'events/events',
    'utils/backbone.events',
    'utils/underscore',
    'utils/scriptloader'
], function(pluginsUtils, utils, events, Events, _, scriptloader) {

    function _addToPlayerGenerator(_api, pluginInstance, div) {
        return function() {
            var overlaysElement = _api.getContainer().getElementsByClassName('jw-overlays')[0];

            // This should probably be an error
            if (!overlaysElement) {
                return;
            }

            overlaysElement.appendChild(div);
            div.left = overlaysElement.style.left;
            div.top = overlaysElement.style.top;

            pluginInstance.displayArea = overlaysElement;
        };
    }

    function _pluginResizeGenerator(pluginInstance) {
        function resize() {
            var displayarea = pluginInstance.displayArea;
            if (displayarea) {
                pluginInstance.resize(displayarea.clientWidth, displayarea.clientHeight);
            }
        }
        return function() {
            resize();
            // Sometimes a mobile device may trigger resize before the new sizes are finalized
            setTimeout(resize, 400);
        };
    }

    var PluginLoader = function (model, _config) {
        var _this = _.extend(this, Events),
            _status = scriptloader.loaderstatus.NEW,
            _iscomplete = false,
            _pluginCount = _.size(_config),
            _pluginLoaded,
            _destroyed = false;

        /*
         * Plugins can be loaded by multiple players on the page, but all of them use
         * the same plugin model singleton. This creates a race condition because
         * multiple players are creating and triggering loads, which could complete
         * at any time. We could have some really complicated logic that deals with
         * this by checking the status when it's created and / or having the loader
         * redispatch its current status on load(). Rather than do this, we just check
         * for completion after all of the plugins have been created. If all plugins
         * have been loaded by the time checkComplete is called, then the loader is
         * done and we fire the complete event. If there are new loads, they will
         * arrive later, retriggering the completeness check and triggering a complete
         * to fire, if necessary.
         */
        function _complete() {
            if (!_iscomplete) {
                _iscomplete = true;
                _status = scriptloader.loaderstatus.COMPLETE;
                _this.trigger(events.COMPLETE);
            }
        }

        // This is not entirely efficient, but it's simple
        function _checkComplete() {
            // Since we do not remove event listeners on pluginObj when destroying
            if (_destroyed) {
                return;
            }
            if (!_config || _.keys(_config).length === 0) {
                _complete();
            }
            if (!_iscomplete) {
                var plugins = model.getPlugins();
                _pluginLoaded = _.after(_pluginCount, _complete);
                _.each(_config, function (value, plugin) {
                    var pluginName = pluginsUtils.getPluginName(plugin),
                        pluginObj = plugins[pluginName],
                        js = pluginObj.getJS(),
                        target = pluginObj.getTarget(),
                        status = pluginObj.getStatus();

                    if (status === scriptloader.loaderstatus.LOADING || status === scriptloader.loaderstatus.NEW) {
                        return;
                    } else if (js && !utils.versionCheck(target)) {
                        _this.trigger(events.ERROR, {
                            message: 'Incompatible player version'
                        });
                    }
                    _pluginLoaded();
                });

            }
        }

        function _pluginError(e) {
            // Since we do not remove event listeners on pluginObj when destroying
            if (_destroyed) {
                return;
            }
            var message = 'File not found';
            if (e.url) {
                utils.log(message, e.url);
            }
            this.off();
            this.trigger(events.ERROR, {
                message: message
            });
            _checkComplete();
        }

        this.setupPlugins = function (api, playerModel) {
            var flashPlugins = [],
                plugins = model.getPlugins();

            var pluginsConfig = playerModel.get('plugins');
            _.each(pluginsConfig, function(pluginConfig, plugin) {
                var pluginName = pluginsUtils.getPluginName(plugin),
                    pluginObj = plugins[pluginName],
                    flashPath = pluginObj.getFlashPath(),
                    jsPlugin = pluginObj.getJS(),
                    pluginURL = pluginObj.getURL();

                if (flashPath) {
                    var flashPluginConfig = _.extend({
                        name: pluginName,
                        swf: flashPath,
                        pluginmode: pluginObj.getPluginmode()
                    }, pluginConfig);
                    flashPlugins.push(flashPluginConfig);
                }

                var status = utils.tryCatch(function() {
                    if (jsPlugin) {
                        var pluginConfig = pluginsConfig[pluginURL];

                        if (!pluginConfig) {
                            utils.log('JW Plugin already loaded', pluginName, pluginURL);
                            return;
                        }

                        var div = document.createElement('div');
                        div.id = api.id + '_' + pluginName;
                        div.className = 'jw-plugin jw-reset';

                        var pluginOptions = _.extend({}, pluginConfig);
                        var pluginInstance = pluginObj.getNewInstance(api, pluginOptions, div);

                        pluginInstance.addToPlayer   = _addToPlayerGenerator(api, pluginInstance, div);
                        pluginInstance.resizeHandler = _pluginResizeGenerator(pluginInstance);

                        api.addPlugin(pluginName, pluginInstance, div);
                    }

                });

                if (status instanceof utils.Error) {
                    utils.log('ERROR: Failed to load ' + pluginName + '.');
                }
            });

            playerModel.set('flashPlugins', flashPlugins);
        };

        this.load = function () {
            // Must be a hash map
            if (utils.exists(_config) && utils.typeOf(_config) !== 'object') {
                _checkComplete();
                return;
            }

            _status = scriptloader.loaderstatus.LOADING;

            /** First pass to create the plugins and add listeners **/
            _.each(_config, function(value, pluginUrl) {
                if (utils.exists(pluginUrl)) {
                    var pluginObj = model.addPlugin(pluginUrl);
                    pluginObj.on(events.COMPLETE, _checkComplete);
                    pluginObj.on(events.ERROR, _pluginError);
                }
            });

            var plugins = model.getPlugins();

            /** Second pass to actually load the plugins **/
            _.each(plugins, function(pluginObj) {
                // Plugin object ensures that it's only loaded once
                pluginObj.load();
            });

            // Make sure we're not hanging around waiting for plugins that already finished loading
            _checkComplete();
        };

        this.destroy = function () {
            _destroyed = true;
            this.off();
        };

        this.getStatus = function () {
            return _status;
        };

    };

    return PluginLoader;
});
