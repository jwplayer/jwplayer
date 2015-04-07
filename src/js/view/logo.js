define([
    'view/touch',
    'utils/helpers',
    'utils/css',
    'events/events',
    'underscore',
    'version',
    'templates/logo.html'
], function(Touch, utils, cssUtils, events, _, version, logoTemplate) {
    var _styles = cssUtils.style,
        FREE = 'free',
        PRO = 'pro',
        PREMIUM = 'premium',
        ADS = 'ads',
        LINK_DEFAULT = 'http://www.longtailvideo.com/jwpabout/?a=l&v=';

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
            var linkFlag = 'o';
            if ( _model.edition && _model.edition() ) {
                linkFlag = _getLinkFlag(_model.edition());
            }

            if (linkFlag === 'o' || linkFlag === 'f') {
                _defaults.link = LINK_DEFAULT + version + '&m=h&e=' + linkFlag;
            }

            _settings = _.extend({}, _defaults, _logoConfig);
            _settings.hide = (_settings.hide.toString() === 'true');
        }

        function _setupDisplayElements() {
            _logo = utils.createElement(logoTemplate({
                file: (_settings.prefix ? _settings.prefix : '') + _settings.file
            }));

            if (!_settings.file) {
                _styles(_logo, {display: 'none'}, false);
                return;
            }

            var positions = (/(\w+)-(\w+)/).exec(_settings.position),
                style = {};

            if (positions.length === 3 && _settings.position !== 'top-right'){
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

        // TODO: Remove this via placing it in the DOM in a place that will make it posiition itself without needing the offset
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


        //TODO: Remove API by sending events instead
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

        function _getLinkFlag(edition) {
            if (edition === PRO) {
                return 'p';
            } else if (edition === PREMIUM) {
                return 'r';
            } else if (edition === ADS) {
                return 'a';
            } else if (edition === FREE) {
                return 'f';
            } else {
                return 'o';
            }
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
        prefix: utils.repo(),
        file: 'logo.png',
        linktarget: '_top',
        margin: '0.5em',
        hide: false,
        position: 'top-right'
    };

    return Logo;
});
