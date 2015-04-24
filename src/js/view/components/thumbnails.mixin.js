define([
    'utils/underscore',
    'utils/helpers',
    'parsers/captions/parsers.srt',
], function(_, utils, SrtParser) {

    function Thumbnail(obj) {
        this.begin = obj.begin;
        this.end = obj.end;
        this.img = obj.text;
    }

    var ThumbnailsMixin = {

        loadThumbnails: function (file) {
            // hide
            // reset or cancel requests

            if (!file) {
                return;
            }
            this.vttPath = file.split('?')[0].split('/').slice(0, -1).join('/');
            utils.ajax(file, this.thumbnailsLoaded.bind(this), this.thumbnailsFailed.bind(this), true);
        },

        thumbnailsLoaded: function (evt) {
            var Srt = new SrtParser();
            var data = Srt.parse(evt.responseText, true);
            if (_.isArray(data)) {
                _.each(data, function(obj) {
                    this.thumbnails.push( new Thumbnail(obj) );
                }, this);
                this.drawCues();
            }
        },

        thumbnailsFailed: function () {
        },

        chooseThumbnail : function(seconds) {
            var idx = _.sortedIndex(this.thumbnails, {start : seconds}, _.property('start'));
            return this.thumbnails[idx].img;
        },

        resetThumbnails : function() {
            this.thumbnails = [];
        }


    };

    return ThumbnailsMixin;
});