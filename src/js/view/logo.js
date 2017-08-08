import logoTemplate from 'templates/logo';
import { LOGO_CLICK } from 'events/events';

define([
    'utils/ui',
    'utils/helpers',
    'utils/underscore',
    'utils/backbone.events',
], function(UI, utils, _, Events) {
    var _styles = utils.style;

    var LogoDefaults = {
        linktarget: '_blank',
        margin: 8,
        hide: false,
        position: 'top-right'
    };

    return function Logo(_model) {
        _.extend(this, Events);

        var _logo;
        var _settings;
        var _img = new Image();

        this.setup = function() {
            _settings = _.extend({}, LogoDefaults, _model.get('logo'));
            if (!_settings.file) {
                return;
            }

            _settings.position = _settings.position || LogoDefaults.position;
            _settings.hide = (_settings.hide.toString() === 'true');

            if (!_logo || _settings.position !== 'control-bar') {
                _logo = utils.createElement(logoTemplate(_settings.position, _settings.hide));
            }

            _model.set('logo', _settings);

            // apply styles onload when image width and height are known
            _img.onload = function () {
                // update logo style
                var style = {
                    backgroundImage: 'url("' + this.src + '")',
                    width: this.width,
                    height: this.height
                };
                if (_settings.margin !== LogoDefaults.margin) {
                    var positions = (/(\w+)-(\w+)/).exec(_settings.position);
                    if (positions.length === 3) {
                        style['margin-' + positions[1]] = _settings.margin;
                        style['margin-' + positions[2]] = _settings.margin;
                    }
                }
                _styles(_logo, style);

                // update title
                _model.set('logoWidth', style.width);
            };

            _img.src = _settings.file;

            var logoInteractHandler = new UI(_logo);
            logoInteractHandler.on('click tap', function (evt) {
                if (utils.exists(evt) && evt.stopPropagation) {
                    evt.stopPropagation();
                }

                this.trigger(LOGO_CLICK, {
                    link: _settings.link,
                    linktarget: _settings.linktarget
                });

            }, this);
        };

        this.setContainer = function(container) {
            if (_logo) {
                container.appendChild(_logo);
            }
        };

        this.element = function() {
            return _logo;
        };

        this.position = function() {
            return _settings.position;
        };

        this.destroy = function() {
            _img.onload = null;
        };

        return this;
    };
});
