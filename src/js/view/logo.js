define([
    'view/touch',
    'utils/helpers',
    'utils/css',
    'events/events',
    'events/states',
    'underscore'
], function(Touch, utils, cssUtils, events, states, _) {

    var _css = cssUtils.css,

        FREE = 'free',
        PRO = 'pro',
        PREMIUM = 'premium',
        ADS = 'ads',

        LINK_DEFAULT = 'http://www.longtailvideo.com/jwpabout/?a=l&v=',
        LOGO_CLASS = '.jwlogo';


    var Logo = function(api, _model) {
        var _api = api,
            _id = _api.getContainer().id + '_logo',
            _settings,
            _logo,
            _logoConfig = _.extend({}, _model.componentConfig('logo')),
            _defaults = Logo.defaults,
            _showing = false;

        function _setup() {
            _setupConfig();
            _setupDisplayElements();
        }

        function _setupConfig() {
            var linkFlag = 'o';
            if (_api.edition) { // TODO: Figure out how to determine edition from the model.
                linkFlag = _getLinkFlag(_api.edition());
            }

            if (linkFlag === 'o' || linkFlag === 'f') {
                _defaults.link = LINK_DEFAULT + jwplayer.version + '&m=h&e=' + linkFlag;
            }

            _settings = _.extend({}, _defaults, _logoConfig);
            _settings.hide = (_settings.hide.toString() === 'true');
        }

        function _setupDisplayElements() {
            _logo = document.createElement('img');
            _logo.className = 'jwlogo';
            _logo.id = _id;

            if (!_settings.file) {
                _logo.style.display = 'none';
                return;
            }

            var positions = (/(\w+)-(\w+)/).exec(_settings.position),
                style = {},
                margin = _settings.margin;

            if (positions.length === 3) {
                style[positions[1]] = margin;
                style[positions[2]] = margin;
            } else {
                style.top = style.right = margin;
            }

            _css(_internalSelector(), style);

            _logo.src = (_settings.prefix ? _settings.prefix : '') + _settings.file;
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
            _css(_internalSelector(), {
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

        function _internalSelector(selector) {
            return '#' + _id + ' ' + (selector ? selector : '');
        }

        this.hide = function(forced) {
            if (_settings.hide || forced) {
                _showing = false;
                _logo.style.visibility = 'hidden';
                _logo.style.opacity = 0;
            }
        };

        this.show = function() {
            _showing = true;
            _logo.style.visibility = 'visible';
            _logo.style.opacity = 1;
        };

        _setup();

        return this;
    };

    Logo.defaults = {
        prefix: utils.repo(),
        file: 'logo.png',
        linktarget: '_top',
        margin: 8,
        hide: false,
        position: 'top-right'
    };

    _css(LOGO_CLASS, {
        cursor: 'pointer',
        position: 'absolute'
    });

    return Logo;

});
