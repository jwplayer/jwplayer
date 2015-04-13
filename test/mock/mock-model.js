define([], function() {
    var mockModel = {
        attrs : {
            aspectratio : 1,
            mute : false,
            volume : 1
        },
        components : {
            logo : {},
            display : {},
            dock : {},
            controlbar : {}
        },
        events : {},

        componentConfig : function(a) {
            return this.components[a];
        },
        get : function(attr) {
            return this.attrs[attr];
        },
        on : function(ev, cb) {
            this.events[ev] = cb;
        },
        trigger : function(ev, a) {
            this.events[ev](this, a);
        },
        mediaController : {
            on : function() {}
        },
        playlist : [],
        getVideo : function() {
            return {
                setContainer : function(){},
                resize : function(){},
                setVisibility: function() {},
                isAudioFile : function() { return true; }
            };
        }
    };
    return mockModel;
});
