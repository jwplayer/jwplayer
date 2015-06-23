define([
    'utils/helpers',
    'events/events',
    'utils/ui',
    'utils/backbone.events',
    'utils/underscore',
    'handlebars-loader!templates/adskipbutton.html'
], function(utils, events, UI, Events, _, AdSkipTemplate) {

    var AdSkipButton = function(skipMessageCountdown, skipMessage) {
        this.skipMessage = skipMessage;
        this.skipMessageCountdown = skipMessageCountdown;
        this.skipMessage = skipMessage;

        this.setup();
    };

    _.extend(AdSkipButton.prototype, Events, {
        setup : function() {
            this.destroy();

            var html = AdSkipTemplate();
            this.el = utils.createElement(html);
            this.skiptext = this.el.getElementsByClassName('jw-skiptext')[0];

            this.skipAdOnce = _.once(this.skipAd);
            new UI(this.el).on('click tap', _.bind(function() {
                if (this.skippable) {
                    this.skipAdOnce();
                }
            }, this));
        },

        updateMessage: function(message) {
            this.skiptext.innerHTML = message;
        },

        updateCountdown: function(currTime) {
            this.updateMessage(this.skipMessageCountdown.replace(/xx/gi, Math.ceil(this.waitTime - currTime)));
        },

        updateMediaTime : function(position, duration) {
            // If given a percentage, we want to set the waitTime before continuing
            if (this.waitPercentage) {
                if (duration) {
                    this.itemDuration = duration;
                    this.setWaitTime(this.waitPercentage);
                    delete this.waitPercentage;
                } else {
                    // Not ready to continue until a duration exists
                    return;
                }
            }

            utils.removeClass(this.el, 'jw-hidden');

            if (this.waitTime - position > 0) {
                this.updateCountdown(position);
            } else {
                this.updateMessage(this.skipMessage);
                this.skippable = true;
                utils.addClass(this.el, 'jw-skippable');
            }
        },

        element : function() {
            return this.el;
        },

        setWaitTime: function(offset) {

            // There is a special case of using a %, since it cannot be set until a duration exists
            //  It is not supported in our documentation.
            if (_.isString(offset) && offset.slice(-1) === '%') {
                var percent = parseFloat(offset);
                if (this.itemDuration && !isNaN(percent)) {
                    this.waitTime = this.itemDuration * percent / 100;
                } else {
                    this.waitPercentage = offset;
                }
                return;
            }

            if (_.isNumber(offset)) {
                this.waitTime = offset;
            } else if (utils.typeOf(offset) === 'string') {
                this.waitTime = utils.seconds(offset);
            } else if (!isNaN(Number(offset))) {
                this.waitTime = Number(offset);
            } else {
                this.waitTime = 0;
            }
        },

        skipAd : function() {
            this.trigger(events.JWPLAYER_AD_SKIPPED);
        },

        destroy : function() {
            if (this.el) {
                this.el.removeEventListener('click', this.skipAdOnce);
                if (this.el.parentElement) {
                    this.el.parentElement.removeChild(this.el);
                }
            }
            delete this.skippable;
            delete this.itemDuration;
            delete this.waitPercentage;
        }
    });

    return AdSkipButton;
});
