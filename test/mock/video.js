define([
    'test/underscore'
], function (_) {
    return {
        canPlayType: function(type) {
            return _.contains([
                'video/mp4',
                'video/mp3',
                'audio/mp4',
                'video/aac',
                'audio/mpeg',
                'video/ogg',
                'audio/ogg',
                'video/webm'
            ], type);
        }
    };
});