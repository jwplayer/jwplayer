/* jshint maxparams:9, maxlen:9000 */
define([
    'utils/helpers',
    'utils/css',
    'view/touch',
    'events/events',
    'utils/backbone.events',
    'utils/underscore'
], function(utils, cssUtils, Touch, events, Events, _) {
    var Adskipbutton = function(_playerId, _bottom, _skipMessage, _skipText) {
        var _instreamSkipContainer,
            _instreamSkipText,
            _offsetTime = -1,
            _instreamSkipSet = false,
            _controls,
            _skipOffset = 0,
            _this = _.extend(this, Events);

        function _init() {
            _instreamSkipContainer = utils.createElement('<div class="jw-skip jw-hidden"></div>');
            _instreamSkipText = utils.createElement('<span class="jw-text"></span>');
            _instreamSkipContainer.appendChild(_instreamSkipText);
            _instreamSkipContainer.appendChild(
                    utils.createElement('<span class="jw-icon-inline jw-skip-icon"></span>'));
            cssUtils.style(_instreamSkipContainer, {
                'bottom': _bottom
            });

            if (utils.isMobile()) {
                var skipTouch = new Touch(_instreamSkipContainer);
                skipTouch.on(events.touchEvents.TAP, skipAd);
            } else {
                _instreamSkipContainer.addEventListener('click', skipAd);
            }
        }

        function _updateTime(currTime) {
            if(_offsetTime > 0 ){
                updateMessage(_skipMessage.replace(/xx/gi, Math.ceil(_offsetTime - currTime)));
            }
        }

        function _updateOffset(pos, duration) {
            if (utils.typeOf(_skipOffset) === 'number') {
                _offsetTime = _skipOffset;
            } else if (_skipOffset.slice(-1) === '%') {
                var percent = parseFloat(_skipOffset.slice(0, -1));
                if (duration && !isNaN(percent)) {
                    _offsetTime = duration * percent / 100;
                }
            } else if (utils.typeOf(_skipOffset) === 'string') {
                _offsetTime = utils.seconds(_skipOffset);
            } else if (!isNaN(_skipOffset)) {
                _offsetTime = _skipOffset;
            }
        }

        _this.updateSkipTime = function(time, duration) {
            _updateOffset(time, duration);
            if (_offsetTime >= 0) {
                utils.removeClass(_instreamSkipContainer, 'jw-hidden', _controls);
                if (_offsetTime - time > 0) {
                    _updateTime(time);
                    if (_instreamSkipSet) {
                        _instreamSkipSet = false;
                        utils.removeClass(_instreamSkipContainer, 'jw-skippable');
                    }
                } else if (!_instreamSkipSet) {
                    _instreamSkipSet = true;
                    updateMessage(_skipText);
                    utils.addClass(_instreamSkipContainer, 'jw-skippable');
                }
            }
        };

        function updateMessage(message) {
            _instreamSkipText.innerHTML = message;
        }

        function skipAd() {
            if (_instreamSkipSet) {
                _this.trigger(events.JWPLAYER_AD_SKIPPED);
            }
        }

        this.reset = function(offset) {
            utils.removeClass(_instreamSkipContainer, 'jw-skippable');
            _instreamSkipSet = false;
            _skipOffset = offset;
            _updateOffset(0, 0);
            _updateTime(0);
        };

        _this.show = function() {
            _controls = true;
            utils.toggleClass(_instreamSkipContainer, 'jw-hidden', _offsetTime < 0);
        };

        _this.hide = function() {
            _controls = false;
            utils.addClass(_instreamSkipContainer, 'jw-hidden');
        };

        this.element = function() {
            return _instreamSkipContainer;
        };

        _init();
    };

    return Adskipbutton;
});
