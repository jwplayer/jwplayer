define([
    'utils/helpers',
    'utils/backbone.events',
    'utils/ui',
    'templates/display-icon.html',
    'utils/underscore'
], function(utils, Events, UI, Template, _) {
    var RewindDisplayIcon = function(model, api) {
        this.el = utils.createElement(Template({
            iconName: 'rewind',
            ariaLabel: model.get('localization').playback
        }));
        this.iconUI = new UI (this.el).on('click tap', function() {
            var currentPosition = model.get('position'),
                duration = model.get('duration'),
                rewindPosition = currentPosition - 10,
                startPosition = 0;
            // duration is negative in DVR mode
            if (model.get('streamType') === 'DVR') {
                startPosition = duration;
            }
            // Seek 10s back. Seek value should be >= 0 in VOD mode and >= (negative) duration in DVR mode
            api.seek(Math.max(rewindPosition, startPosition));
        });
    };

    _.extend(RewindDisplayIcon.prototype, {
        element: function() {
            return this.el;
        }
    });

    return RewindDisplayIcon;
});
