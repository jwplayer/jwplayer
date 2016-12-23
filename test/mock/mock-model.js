define([
    'utils/simplemodel',
    'utils/backbone.events',
    'test/underscore'
], function(SimpleModel, Events, _) {
    var MockModel = function() {

    };

    _.extend(MockModel.prototype, SimpleModel, {
        setup : function() {
            this.mediaController = _.extend({}, Events);
            this.mediaModel = new MediaModel();
            this.attributes = _.extend({}, {
                id: '',
                // See api/config `Defaults`:
                state : 'idle',
                autostart: false,
                controls: true,
                displaytitle : true,
                displaydescription: true,
                mobilecontrols: false,
                repeat: false,
                castAvailable: false,
                skin: 'seven',
                stretching: 'uniform',
                mute: false,
                volume: 90,
                width: 480,
                height: 270,
                localization: {
                    play: 'Play',
                    playback: 'Start playback',
                    pause: 'Pause',
                    volume: 'Volume',
                    prev: 'Previous',
                    next: 'Next',
                    cast: 'Chromecast',
                    fullscreen: 'Fullscreen',
                    playlist: 'Playlist',
                    hd: 'Quality',
                    cc: 'Closed captions',
                    audioTracks: 'Audio tracks',
                    replay: 'Replay',
                    buffer: 'Loading',
                    more: 'More',
                    liveBroadcast: 'Live broadcast',
                    loadingAd: 'Loading ad',
                    rewind: 'Rewind 10s',
                    nextUp: 'Next Up',
                    nextUpClose: 'Next Up Close',
                    related: 'Related'
                },
                renderCaptionsNatively: false,
                // These are set elsewhere
                castActive: false,
                aspectratio : '',
                containerWidth: 480,
                containerHeight: 270,
                fullscreen: false,
                autostartFailed: false,
                flashBlocked: false,
                captionsList: [
                    { label: 'Off' },
                    { label: 'English' }
                ],
                captionsIndex: 1,
                captions: {
                    back: true,
                    fontSize: 14,
                    fontFamily: 'Arial,sans-serif',
                    fontOpacity: 100,
                    color: '#FFF',
                    backgroundColor: '#000',
                    backgroundOpacity: 100,
                    edgeStyle: null,
                    windowColor: '#FFF',
                    windowOpacity: 0
                },
                nextupoffset: -10,
                mediaModel: this.mediaModel,
                streamType: 'VOD', // 'DVR', 'Live'
                position: 15,
                buffer: 30,
                duration: 60,
                minDvrWindow: 60,
                scrubbing: false,
                provider: { name: 'flash' },
                sdkplatform: false,
                playlist : [{
                    file: '//content.bitsontherun.com/videos/bkaovAYt-52qL9xLP.mp4',
                    image: '//d3el35u4qe4frz.cloudfront.net/bkaovAYt-480.jpg',
                    title: 'Big Buck Bunny',
                    description: 'One caption track',
                    tracks: [
                        {
                            file: '//playertest.longtailvideo.com/assets/os/captions/bunny-en.srt',
                            label: 'English'
                        },
                        {
                            file: '//playertest.longtailvideo.com/assets/os/chapters/bunny-chapters.vtt',
                            kind: 'chapters'
                        }
                    ]
                }, {
                    file: 'http://content.bitsontherun.com/videos/q1fx20VZ-52qL9xLP.mp4',
                    image: 'http://content.bitsontherun.com/thumbs/3XnJSIm4-480.jpg'
                }],
                config: {},
                playlistItem: {
                    file: '//content.bitsontherun.com/videos/bkaovAYt-52qL9xLP.mp4',
                    image: '//d3el35u4qe4frz.cloudfront.net/bkaovAYt-480.jpg',
                    title: 'Big Buck Bunny',
                    description: 'One caption track',
                    tracks: [
                        {
                            file: '//playertest.longtailvideo.com/assets/os/captions/bunny-en.srt',
                            label: 'English'
                        },
                        {
                            file: '//playertest.longtailvideo.com/assets/os/chapters/bunny-chapters.vtt',
                            kind: 'chapters'
                        }
                    ]
                },
                logo: {
                    position: 'top-right',
                    margin: 2
                },
                logoWidth: 50,
                dock: [
                    {
                        id: 'abc',
                        img: 'css-skins/icons/both.png',
                        btnClass: 'jw-custom-btn-class',
                        tooltip: 'sample tooltip text'
                    }
                ],
                related: null,
                sharing: null
            });
        },

        getVideo: function() {
            return {
                setControls : function() {},
                setContainer : function(){},
                resize : function(){},
                setVisibility: function() {},
                isAudioFile : function() { return true; }
            };
        },

        autoStartOnMobile: function() {
            return false;
        }

    });

    // Represents the state of the provider/media element
    var MediaModel = MockModel.MediaModel = function() {
        _.extend(this, {
            state: 'idle',
            duration: 60,
            mediaType: 'video', // 'audio',
            levels: [ { label: 'Auto' } ],
            currentLevel: { label: 'Auto' },
            audioTracks: [],
            currentAudioTrack: {}
        });
    };
    _.extend(MediaModel.prototype, SimpleModel);

    return MockModel;
});
