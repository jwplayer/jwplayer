import logoTemplate from 'templates/logo';

define([
    'utils/ui',
    'utils/helpers',
    'events/events',
    'utils/underscore',
    'utils/backbone.events',
], function(UI, utils, events, _, Events) {
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

            if (!_logo) {
                _logo = utils.createElement(logoTemplate(_settings.position, _settings.hide));
            }

            _model.set('logo', _settings);

            _model.change('dock', accommodateDock);
            _model.on('change:controls', accommodateDock);

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

                this.trigger(events.JWPLAYER_LOGO_CLICK, {
                    link: _settings.link,
                    linktarget: _settings.linktarget
                });

            }, this);
        };

        this.setContainer = function(container) {
            if (_logo) {
                const dock = container.querySelector('.jw-dock');

                // Dock must be a child of this container, to insert the logo before it when "controls" is true.
                if (dock && dock.parentNode === container) {
                    container.insertBefore(_logo, dock);
                } else {
                    container.appendChild(_logo);
                }
            }
        };

        this.element = function() {
            return _logo;
        };

        this.position = function() {
            return _settings.position;
        };

        this.destroy = function() {
            _model.off('change:dock', accommodateDock);
            _model.off('change:controls', accommodateDock);
            _img.onload = null;
        };

        function accommodateDock() {
            // When positioned in the top right, the logo needs to be shifted down to accommodate dock buttons
            var dockButtons = _model.get('dock');
            var belowDock = !!(dockButtons && dockButtons.length && _settings.position === 'top-right' && _model.get('controls'));
            utils.toggleClass(_logo, 'jw-below', belowDock);
        }

        return this;
    };
});
