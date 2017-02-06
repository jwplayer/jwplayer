define([
    'utils/helpers',
    'utils/backbone.events',
    'utils/ui',
    'templates/display-icon.html',
    'utils/underscore',
    'utils/stream-time'
], function(utils, Events, UI, Template, _, streamTimeUtils) {
    var RewindDisplayIcon = function(model) {
        this.el = utils.createElement(Template({
            iconName: 'rewind',
            ariaLabel: model.get('localization').playback
        }));
        this.iconUI = new UI (this.el).on('click tap', function() {
            var seekPos = streamTimeUtils.rewindPosition(
                10,
                this._model.get('position'),
                this._model.get('seekableRange'),
                this._model.get('streamType')
            );
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
