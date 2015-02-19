(function(jwplayer) {
    /*jshint maxparams:5*/
    var utils = jwplayer.utils,
        events = jwplayer.events,
        storedFlashvars = {};

    var _flash = jwplayer.embed.flash = function(_container, _player, _options, _loader, _api) {
        var _eventDispatcher = new jwplayer.events.eventdispatcher(),
            _flashVersion = utils.flashVersion();
        utils.extend(this, _eventDispatcher);


        function appendAttribute(object, name, value) {
            var param = document.createElement('param');
            param.setAttribute('name', name);
            param.setAttribute('value', value);
            object.appendChild(param);
        }

        function _resizePlugin(plugin, div, onready) {
            return function() {
                try {
                    if (onready) {
                        document.getElementById(_api.id + '_wrapper').appendChild(div);
                    }
                    var display = document.getElementById(_api.id).getPluginConfig('display');
                    if (typeof plugin.resize === 'function') {
                        plugin.resize(display.width, display.height);
                    }
                    div.style.left = display.x;
                    div.style.top = display.h;
                } catch (e) {}
            };
        }

        function parsePlugins(pluginBlock) {
            if (!pluginBlock) {
                return {};
            }

            var flat = {},
                pluginKeys = [];

            utils.foreach(pluginBlock, function(plugin, pluginConfig) {
                var pluginName = utils.getPluginName(plugin);
                pluginKeys.push(plugin);
                utils.foreach(pluginConfig, function(param, val) {
                    flat[pluginName + '.' + param] = val;
                });
            });
            flat.plugins = pluginKeys.join(',');
            return flat;
        }

        this.embed = function() {
            // Make sure we're passing the correct ID into Flash for Linux API support
            _options.id = _api.id;

            // If Flash is installed, but the version is too low, display an error.
            if (_flashVersion < 10) {
                _eventDispatcher.sendEvent(events.ERROR, {
                    message: 'Flash version must be 10.0 or greater'
                });
                return false;
            }

            var _wrapper,
                _aspect,
                id = _container.id,
                lb = _api.config.listbar;

            var params = utils.extend({}, _options);

            // Put the new container into the page
            var replace = document.getElementById(_api.id);
            replace.parentNode.replaceChild(_container, replace);

            // Hack for when adding / removing happens too quickly
            if (id + '_wrapper' === _container.parentNode.id) {
                _wrapper = document.getElementById(id + '_wrapper');
            } else {
                _wrapper = document.createElement('div');
                _aspect = document.createElement('div');
                _aspect.style.display = 'none';
                _aspect.id = id + '_aspect';
                _wrapper.id = id + '_wrapper';
                _wrapper.style.position = 'relative';
                _wrapper.style.display = 'block';
                _wrapper.style.width = utils.styleDimension(params.width);
                _wrapper.style.height = utils.styleDimension(params.height);

                if (_api.config.aspectratio) {
                    var ar = parseFloat(_api.config.aspectratio);
                    _aspect.style.display = 'block';
                    _aspect.style.marginTop = _api.config.aspectratio;
                    _wrapper.style.height = 'auto';
                    _wrapper.style.display = 'inline-block';
                    if (lb) {
                        if (lb.position === 'bottom') {
                            _aspect.style.paddingBottom = lb.size + 'px';
                        } else if (lb.position === 'right') {
                            _aspect.style.marginBottom = (-1 * lb.size * (ar / 100)) + 'px';
                        }
                    }
                }

                _container.parentNode.replaceChild(_wrapper, _container);
                _wrapper.appendChild(_container);
                _wrapper.appendChild(_aspect);

            }

            var flashPlugins = _loader.setupPlugins(_api, params, _resizePlugin);

            if (flashPlugins.length > 0) {
                utils.extend(params, parsePlugins(flashPlugins.plugins));
            } else {
                delete params.plugins;
            }

            // Hack for the dock
            if (typeof params['dock.position'] !== 'undefined') {
                if (params['dock.position'].toString().toLowerCase() === 'false') {
                    params.dock = params['dock.position'];
                    delete params['dock.position'];
                }
            }

            var bgcolor = '#000000',
                flashPlayer, //flashvars,
                wmode = params.wmode || (params.height && params.height <= 40 ? 'transparent' : 'opaque'),
                toDelete = ['height', 'width', 'modes', 'events', 'primary', 'base', 'fallback', 'volume'];

            for (var i = 0; i < toDelete.length; i++) {
                delete params[toDelete[i]];
            }

            // If we've set any cookies in HTML5 mode, bring them into flash
            var cookies = utils.getCookies();
            utils.foreach(cookies, function(cookie, val) {
                if (typeof(params[cookie]) === 'undefined') {
                    params[cookie] = val;
                }
            });

            var base = window.location.href.split('/');
            base.splice(base.length - 1, 1);
            base = base.join('/');
            params.base = base + '/';

            storedFlashvars[id] = params;

            if (utils.isMSIE()) {

                _container.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' +
                    ' width="100%" height="100%" id="' + id +
                    '" name="' + id +
                    '" tabindex="0">' +
                    '<param name="movie" value="' + _player.src + '">' +
                    '<param name="allowfullscreen" value="true">' +
                    '<param name="allowscriptaccess" value="always">' +
                    '<param name="seamlesstabbing" value="true">' +
                    '<param name="wmode" value="' + wmode + '">' +
                    '<param name="bgcolor" value="' + bgcolor + '">' +
                    '</object>';

                flashPlayer = _wrapper.getElementsByTagName('object')[0];
                flashPlayer.style.outline = 'none';

            } else {
                flashPlayer = document.createElement('object');
                flashPlayer.setAttribute('type', 'application/x-shockwave-flash');
                flashPlayer.setAttribute('data', _player.src);
                flashPlayer.setAttribute('width', '100%');
                flashPlayer.setAttribute('height', '100%');
                flashPlayer.setAttribute('bgcolor', bgcolor);
                flashPlayer.setAttribute('id', id);
                flashPlayer.setAttribute('name', id);
                flashPlayer.className = 'jwswf';
                //obj.setAttribute('tabindex', 0);
                appendAttribute(flashPlayer, 'allowfullscreen', 'true');
                appendAttribute(flashPlayer, 'allowscriptaccess', 'always');
                appendAttribute(flashPlayer, 'seamlesstabbing', 'true');
                appendAttribute(flashPlayer, 'wmode', wmode);

                _container.parentNode.replaceChild(flashPlayer, _container);
            }

            if (_api.config.aspectratio) {
                flashPlayer.style.position = 'absolute';
                flashPlayer.style.left = '0';
            }
            _api.container = flashPlayer;
            _api.setPlayer(flashPlayer, 'flash');
        };

        /**
         * Detects whether Flash supports this configuration
         */
        this.supportsConfig = function() {
            if (_flashVersion) {
                if (_options) {
                    if (utils.typeOf(_options.playlist) === 'string') {
                        return true;
                    }

                    try {
                        var item = _options.playlist[0],
                            sources = item.sources;

                        if (typeof sources === 'undefined') {
                            return true;
                        } else {
                            for (var i = 0; i < sources.length; i++) {
                                if (sources[i].file && _flashCanPlay(sources[i].file, sources[i].type)) {
                                    return true;
                                }
                            }
                        }
                    } catch (e) {
                        return false;
                    }
                } else {
                    return true;
                }
            }
            return false;
        };

        // Removing the object from the page cleans everything up
        this.destroy = function() { };

    };

    _flash.getVars = function(id) {
        return storedFlashvars[id];
    };

    /**
     * Determines if a Flash can play a particular file, based on its extension
     */
    var _flashCanPlay = jwplayer.embed.flashCanPlay = function(file, type) {
        // TODO: Return false if isMobile

        if (utils.isYouTube(file, type)) { return true; }
        if (utils.isRtmp(file, type)) { return true; }
        if (type === 'hls') { return true; }

        var mappedType = utils.extensionmap[type ? type : utils.extension(file)];

        // If no type or unrecognized type, don't allow to play
        if (!mappedType) {
            return false;
        }

        return !!(mappedType.flash);
    };

})(jwplayer);
