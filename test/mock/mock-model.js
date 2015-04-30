define([
    'utils/underscore',
    'utils/backbone.events'
], function(_, Events) {
    var mockModel = {
        attrs : {
            state : 'idle',
            mute : false,
            volume : 50,
            controls : true,
            stretching : 'uniform',
            width : 400,
            height : 400,
            aspectratio : '75%',
            playlist : [],
            config : {},
            playlistItem : {},
            provider : { name : 'Demo' }
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

        mediaController : {
            on : function() {}
        },
        mediaModel : {
            on : function() {}
        },


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
