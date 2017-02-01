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
            var currentPosition = this._model.get('position');
            var rewindPosition = currentPosition - 10;
            var startPosition = 0;
            var seekPos = 0;

            // duration is negative in DVR mode
            if (this._model.get('streamType') === 'DVR') {
                var seekableRange = this._model.get('seekableRange');
                seekPos = Math.min(seekableRange - rewindPosition, seekableRange);
            } else {
                seekPos = Math.max(rewindPosition, startPosition);
            }

            // Seek 10s back. Seek value should be >= 0 in VOD mode and >= (negative) duration in DVR mode
            this._api.seek(seekPos, { reason: 'interaction' });
        });
    };

    _.extend(RewindDisplayIcon.prototype, {
        element: function() {
            return this.el;
        }
    });

    return RewindDisplayIcon;
});
