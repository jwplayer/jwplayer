import _ from 'utils/underscore';
import utils from 'utils/helpers';
import srt from 'parsers/captions/srt';

function Thumbnail(obj) {
    this.begin = obj.begin;
    this.end = obj.end;
    this.img = obj.text;
}

const ThumbnailsMixin = {
    loadThumbnails: function (file) {
        if (!file) {
            return;
        }
        this.vttPath = file.split('?')[0].split('/').slice(0, -1).join('/');
        // Only load the first individual image file so we can get its dimensions. All others are loaded when
        // they're set as background-images.
        this.individualImage = null;
        utils.ajax(file, this.thumbnailsLoaded.bind(this), this.thumbnailsFailed.bind(this), {
            plainText: true
        });
    },

    thumbnailsLoaded: function (evt) {
        var data = srt(evt.responseText);
        if (_.isArray(data)) {
            _.each(data, function(obj) {
                this.thumbnails.push(new Thumbnail(obj));
            }, this);
            this.drawCues();
        }
    },

    thumbnailsFailed: function () { },

    chooseThumbnail: function(seconds) {
        var idx = _.sortedIndex(this.thumbnails, { end: seconds }, _.property('end'));
        if (idx >= this.thumbnails.length) {
            idx = this.thumbnails.length - 1;
        }
        var url = this.thumbnails[idx].img;
        if (url.indexOf('://') < 0) {
            url = this.vttPath ? this.vttPath + '/' + url : url;
        }

        return url;
    },

    loadThumbnail: function(seconds) {
        var url = this.chooseThumbnail(seconds);
        var style = {
            margin: '0 auto',
            backgroundPosition: '0 0'
        };

        var hashIndex = url.indexOf('#xywh');
        if (hashIndex > 0) {
            try {
                var matched = (/(.+)#xywh=(\d+),(\d+),(\d+),(\d+)/).exec(url);
                url = matched[1];
                style.backgroundPosition = (matched[2] * -1) + 'px ' + (matched[3] * -1) + 'px';
                style.width = matched[4];
                this.timeTip.setWidth(+style.width);
                style.height = matched[5];
            } catch (e) {
                // this.vttFailed('Could not parse thumbnail');
                return;
            }
        } else if (!this.individualImage) {
            this.individualImage = new Image();
            this.individualImage.onload = _.bind(function () {
                this.individualImage.onload = null;
                this.timeTip.image({ width: this.individualImage.width, height: this.individualImage.height });
                this.timeTip.setWidth(this.individualImage.width);
            }, this);
            this.individualImage.src = url;
        }

        style.backgroundImage = 'url("' + url + '")';

        return style;
    },

    showThumbnail: function(seconds) {
        // Don't attempt to set thumbnail for small players or when a thumbnail doesn't exist
        if (this._model.get('containerWidth') <= 420 || this.thumbnails.length < 1) {
            return;
        }
        this.timeTip.image(this.loadThumbnail(seconds));
    },

    resetThumbnails: function() {
        this.timeTip.image({
            backgroundImage: '',
            width: 0,
            height: 0
        });
        this.thumbnails = [];
    }
};

export default ThumbnailsMixin;
