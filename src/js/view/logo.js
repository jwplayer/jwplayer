define([
    'view/touch',
    'utils/helpers',
    'events/events',
    'utils/underscore',
    'utils/backbone.events',
    'handlebars-loader!templates/logo.html'
], function(Touch, utils, events, _, Events, logoTemplate) {
    var _styles = utils.style;

    var Logo = function(_model) {
        var _this = this,
            _logo,
            _settings,
            _logoConfig = _.extend({}, _model.componentConfig('logo')),
            _defaults = Logo.defaults,
            _showing = false;

        _.extend(this, Events);

        function _setup() {
            _setupConfig();
            _setupDisplayElements();
        }

        function _setupConfig() {
            _settings = _.extend({}, _defaults, _logoConfig);
            _settings.hide = (_settings.hide.toString() === 'true');
        }

        function _setupDisplayElements() {
            _logo = utils.createElement(logoTemplate({
                file: _settings.file
            }));

            if (!_settings.file) {
                return;
            }


            if(_settings.position !== Logo.defaults.position || _settings.margin !== Logo.defaults.margin){
                var positions = (/(\w+)-(\w+)/).exec(_settings.position),
                    style = { top: 'auto', right: 'auto', bottom: 'auto', left: 'auto' };

                if (positions.length === 3){
                    style[positions[1]] = _settings.margin;
                    style[positions[2]] = _settings.margin;

                    _styles(_logo, style);
                }
            }

            if (!utils.isMobile()) {
                _logo.onclick = _clickHandler;
            } else {
                var logoTouch = new Touch(_logo);
                logoTouch.addEventListener(events.touchEvents.TAP, _clickHandler);
            }
        }

        this.resize = function() {};

        this.element = function() {
            return _logo;
        };

        this.offset = function(offset) {
            _styles(_logo, {
                'margin-bottom': offset
            });
        };

        this.position = function() {
            return _settings.position;
        };

        this.margin = function() {
            return parseInt(_settings.margin, 10);
        };

        function _clickHandler(evt) {
            if (utils.exists(evt) && evt.stopPropagation) {
                evt.stopPropagation();
            }

            _this.trigger(events.JWPLAYER_LOGO_CLICK, {
                showing: _showing,
                link: _settings.link,
                linktarget: _settings.linktarget
            });

            return;
        }

        this.hide = function(forced) {
            if (_settings.hide || forced) {
                _showing = false;
                utils.removeClass(_logo, 'jw-logo--visible');
            }
        };

        this.show = function() {
            _showing = true;
            utils.addClass(_logo, 'jw-logo--visible');
        };

        _setup();

        return this;
    };

    Logo.defaults = {
        linktarget: '_blank',
        margin: 8,
        hide: false,
        position: 'top-right'
    };

    return Logo;
});
