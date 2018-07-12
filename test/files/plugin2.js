/* eslint no-var: 0 */
(function(global) {
    var registerPlugin = global.jwplayerPluginJsonp ||
        (global.jwplayer && global.jwplayer().registerPlugin) ||
        (function() {});

    var PluginClass = function() {};
    var noop = function() {};
    PluginClass.prototype.on = noop;
    PluginClass.prototype.once = noop;
    PluginClass.prototype.off = noop;
    PluginClass.prototype.trigger = noop;
    PluginClass.prototype.resize = noop;

    registerPlugin('plugin2', '8.0', PluginClass);
}(window));
