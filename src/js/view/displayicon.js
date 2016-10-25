define([
    'utils/helpers',
    'utils/backbone.events',
    'utils/ui',
    'templates/displayicon.html',
    'utils/underscore'
], function(utils, Events, UI, Template, _) {

    var DisplayIcon = function(_model) {
        _.extend(this, Events);

        this.model = _model;

        this.el = utils.createElement(Template({ariaLabel: this.model.get('localization').playback}));

        var _this = this;
        this.iconUI = new UI (this.el).on('click tap', function(evt){_this.trigger(evt.type);});

        this.model.on('change:state', function(model, newstate) {
            var iconDisplay = _this.el.getElementsByClassName('jw-icon-display');
            if (iconDisplay.length) {
                var localization = _this.model.get('localization');
                var newstateLabel = localization.playback;
                switch (newstate) {
                    case 'buffering':
                        newstateLabel = localization.buffer;
                        break;
                    case 'playing':
                        newstateLabel = localization.pause;
                        break;
                    case 'complete':
                        newstateLabel = localization.replay;
                        break;
                    case 'error':
                        newstateLabel = '';
                        break;
                }
                if (newstateLabel === '') {
                    iconDisplay[0].removeAttribute('aria-label');
                } else {
                    iconDisplay[0].setAttribute('aria-label', newstateLabel);
                }
            }
        });
    };

    _.extend(DisplayIcon.prototype, {
        element : function() { return this.el; }
    });

    return DisplayIcon;
});
