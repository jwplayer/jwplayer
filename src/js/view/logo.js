define([
    'utils/ui',
    'utils/helpers',
    'events/events',
    'utils/underscore',
    'utils/backbone.events',
    'templates/logo.html'
], function(UI, utils, events, _, Events, logoTemplate) {
    var _styles = utils.style;

    var LogoDefaults = {
        linktarget: '_blank',
        margin: 8,
        hide: false,
        position: 'top-right'
    };

    var Logo = function(_model) {
        var _logo,
            _img = new Image(),
            _settings,
            _logoConfig = _.extend({}, _model.get('logo'));

        _.extend(this, Events);

        this.setup = function(container) {
            _settings = _.extend({}, LogoDefaults, _logoConfig);
            _settings.hide = (_settings.hide.toString() === 'true');

            _logo = utils.createElement(logoTemplate());

            if (!_settings.file) {
                return;
            }

            if (_settings.hide) {
                // This causes it to fade out when jw-flag-user-inactive
                utils.addClass(_logo, 'jw-hide');
            }

            utils.addClass(_logo, 'jw-logo-' + (_settings.position || LogoDefaults.position));

            // respond to dock/controls changes when top positioned
            if (_settings.position === 'top-right') {
                _model.on('change:dock', this.topRight, this);
                _model.on('change:controls', this.topRight, this);
                this.topRight(_model);
            }

            _model.set('logo', _settings);

            // apply styles onload when image width and height are known
            _img.onload = function() {
                // update logo style
                var style = {
                    backgroundImage: 'url("' + this.src +'")',
                    width: this.width,
                    height: this.height
                };
                if(_settings.margin !== LogoDefaults.margin) {
                    var positions = (/(\w+)-(\w+)/).exec(_settings.position);
                    if (positions.length === 3){
                        style['margin-'+positions[1]] = _settings.margin;
                        style['margin-'+positions[2]] = _settings.margin;
                    }
                }
                _styles(_logo, style);

                // update title
                _model.set('logoWidth', style.width);
            };

            _img.src = _settings.file;

            var logoInteractHandler = new UI(_logo);
            logoInteractHandler.on('click tap', function(evt) {
                if (utils.exists(evt) && evt.stopPropagation) {
                    evt.stopPropagation();
                }

                this.trigger(events.JWPLAYER_LOGO_CLICK, {
                    link: _settings.link,
                    linktarget: _settings.linktarget
                });

            }, this);

            container.appendChild(_logo);
        };

        this.topRight = function(model) {
            // move the logo down when dock buttons are displayed
            var controls = model.get('controls');
            var dockButtons = model.get('dock');
            var dockButtonsVisible = controls && (dockButtons && dockButtons.length ||
                model.get('sharing') || model.get('related'));
            _styles(_logo, {
                top: (dockButtonsVisible ? '3.5em' : 0)
            });
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

    return Logo;
});
