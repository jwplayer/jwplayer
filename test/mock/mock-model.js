define([
    'utils/backbone.events',
    'test/underscore'
], function(Events, _) {
    var mockModel = {
        setup : function() {
            this.attrs = _.extend({}, this.default_attrs, {
                mediaModel : this.mediaModel
            });
        },
        default_attrs : {
            state : 'idle',
            mute : false,
            volume : 50,
            controls : true,
            stretching : 'uniform',
            skin:'seven',
            width : 400,
            height : 400,
            aspectratio : '75%',
            playlist : [{
                description : 'abc'
            }, {
                description : 'cde'
            }],
            config : {},
            playlistItem : {},
            provider : { name : 'Demo' },

            dock : [
                {
                    'id': 'abc',
                    img: 'css-skins/icons/both.png',
                    tooltip: 'sample tooltip text'
                }]
        },

        getVideo : function() {
            return {
                setControls : function() {},
                setContainer : function(){},
                resize : function(){},
                setVisibility: function() {},
                isAudioFile : function() { return true; }
            };
        },

        mediaController : _.extend({}, Events),
        mediaModel : _.extend({}, Events),

        // SimpleModel
        'get' : function(attr) {
            return this.attrs[attr];
        },
        'set' : function(attr, val) {
            var oldVal = this.attrs[attr];
            if (oldVal === val) { return; }
            this.attrs[attr] = val;
            this.trigger('change:' + attr, this, val, oldVal);
        }
    };

    _.extend(mockModel, Events);
    return mockModel;
});
