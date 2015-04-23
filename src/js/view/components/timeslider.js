define([
    'utils/underscore',
    'view/components/slider',
    'utils/helpers',
    'view/components/chapters.mixin'
], function(_, Slider, utils, ChaptersMixin) {

    var TimeSlider = Slider.extend({
        constructor : function(_model, _api) {
            this._model = _model;
            this._api = _api;

            // Store the attempted seek, until the previous one completes
            this.seekThrottled = _.throttle(this.performSeek, 400);

            this.onPlaylistItem(this._model, this._model.get('playlistItem'));

            this._model
                .on('change:playlistItem', this.onPlaylistItem, this)
                .on('change:position', this.onPosition, this)
                .on('change:buffer', this.onBuffer, this);

            _api.on('seeked', this.onSeeked, this);

            Slider.call(this, 'jw-time', 'horizontal');
        },

        // These overwrite Slider methods
        update: function(pct) {
            if (this.activeCue) {
                this.seekTo = this.activeCue.pct;
            } else {
                this.seekTo = pct;
            }
            this.seekThrottled();
            Slider.prototype.update.apply(this, arguments);
        },
        dragStart : function() {
            this._model.set('scrubbing', true);
            Slider.prototype.dragStart.apply(this, arguments);
        },
        dragEnd : function() {
            this._model.set('scrubbing', false);
            Slider.prototype.dragEnd.apply(this, arguments);
        },

        // Event Listeners
        onSeeked : function () {
            // When we are done scrubbing there will be a final seeked event
            if (this._model.get('scrubbing')) {
                this.performSeek();
            }
        },
        onBuffer : function (model, pct) {
            this.updateBuffer(pct);
        },
        onPosition : function(model, pos) {
            var pct = pos / this._api.getDuration() * 100;
            this.render(pct);
        },
        onPlaylistItem : function (model, playlistItem) {
            this.reset();
            var tracks = playlistItem.tracks;
            _.each(tracks, function (track) {
                if (track && track.kind && track.kind.toLowerCase() === 'thumbnails') {
                    this.loadThumbnails(track.file);
                }
                else if (track && track.kind && track.kind.toLowerCase() === 'chapters') {
                    this.loadChapters(track.file);
                }
            }, this);
        },

        // These are new methods
        performSeek : function () {
            var duration = this._model.get('duration');
            if (duration <= 0) {
                this._api.play();
            } else {
                var position = this.seekTo / 100 * this._api.getDuration();
                this._api.seek(position);
            }
        }
    });

    _.extend(TimeSlider.prototype, ChaptersMixin);

    return TimeSlider;
});
