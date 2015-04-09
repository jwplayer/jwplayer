define([
    'view/touch',
    'utils/helpers',
    'utils/css',
    'events/events',
    'underscore',
    'version',
    'templates/logo.html'
], function(Touch, utils, cssUtils, events, _, version, logoTemplate) {
    var _styles = cssUtils.style;

    var Logo = function(_api, _model) {
        var _logo,
            _settings,
            _logoConfig = _.extend({}, _model.componentConfig('logo')),
            _defaults = Logo.defaults,
            _showing = false;

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

            var positions = (/(\w+)-(\w+)/).exec(_settings.position),
                style = {};

            if (positions.length === 3){
                style[positions[1]] = _settings.margin;
                style[positions[2]] = _settings.margin;

                _styles(_logo, style);
            } else {
                utils.addClass(_logo, 'jw-logo--top-right');
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

            if (!_showing || !_settings.link) {
                //_togglePlay();
                _api.play();
            }

            if (_showing && _settings.link) {
                _api.pause(true);
                _api.setFullscreen(false);
                window.open(_settings.link, _settings.linktarget);
            }

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
        linktarget: '_top',
        margin: '0.5em',
        hide: false,
        position: 'top-right'
    };

    return Logo;
});
