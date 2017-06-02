define([
    'utils/simplemodel',
    'utils/backbone.events',
    'test/underscore'
], function(SimpleModel, Events, _) {
    var MockModel = function() {};

    _.extend(MockModel.prototype, SimpleModel, {
        setup: function(configuration) {
            var self = this;
            var playlistItem = _.extend({
                file: '//playertest.longtailvideo.com/bunny.mp4',
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
            }, configuration.playlistItem);

            var customCaptions = {
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
            };

            this.attributes = _.extend({}, {
                id: '',
                // See api/config `Defaults`:
                state: 'idle',
                autostart: false,
                controls: true,
                displaytitle: true,
                displaydescription: true,
                mobilecontrols: false,
                repeat: false,
                castAvailable: false,
                skin: 'seven',
                stretching: 'uniform',
                mute: false,
                volume: 90,
                width: '100%',
                height: 270,
                aspectratio: '56.25%',
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
                captions: {}, // customCaptions
                nextupoffset: -10,
                streamType: 'VOD', // 'DVR', 'Live'
                position: 0,
                buffer: 0,
                duration: 0,
                minDvrWindow: 60,
                scrubbing: false,
                playlistItem: playlistItem,
                logo: {
                    position: 'top-right',
                    margin: 2
                },
                logoWidth: 50,
                dock: [
                    {
                        id: 'related',
                        img: 'data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221024%22%20height%3D%221024%22%20viewBox%3D%220%200%201024%201024%22%3E%3Cpath%20fill%3D%22%23FFF%22%20d%3D%22M423.252%2068.266h532.48v88.748h-532.48V68.268zM423.252%20423.252h532.48V512h-532.48v-88.748zM423.252%20778.24h532.48v88.746h-532.48V778.24zM68.266%2068.266h177.492v177.492H68.266V68.266zM68.266%20423.252h177.492v177.492H68.266V423.252zM68.266%20778.24h177.492v177.492H68.266V778.24z%22%2F%3E%3C%2Fsvg%3E',
                        btnClass: 'jw-related-dock-btn',
                        tooltip: 'Related'
                    },
                    {
                        id: 'sharing',
                        img: 'data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2215%22%20height%3D%2212%22%20viewBox%3D%220%200%2015%2012%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ctitle%3Eshare%3C%2Ftitle%3E%3Cpath%20d%3D%22M12.5%205c-.9%200-1.6-.5-2.1-1.1l-4.9%202%203.2%201.9c.4-.5%201.1-.8%201.8-.8C11.9%207%2013%208.1%2013%209.5S11.9%2012%2010.5%2012C9.2%2012%208.2%2011%208%209.8L4%207.5c-.4.3-.9.5-1.5.5C1.1%208%200%206.9%200%205.5S1.1%203%202.5%203c.9%200%201.6.5%202.1%201.1l5.5-2.3c.3-1%201.3-1.8%202.4-1.8C13.9%200%2015%201.1%2015%202.5S13.9%205%2012.5%205z%22%20fill%3D%22%23FFF%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E',
                        tooltip: 'Share Video'
                    }
                ],
                related: null,
                sharing: null,
                playlist: [
                    playlistItem,
                    {
                        file: 'http://content.bitsontherun.com/videos/q1fx20VZ-52qL9xLP.mp4',
                        image: 'http://content.bitsontherun.com/thumbs/3XnJSIm4-480.jpg'
                    }
                ],
                config: {},
                sdkplatform: false,
            }, configuration);


            if (configuration.autostartMobile) {
                    this.autoStartOnMobile = function() {
                    return true;
                };
            }

            this.mediaController = _.extend({}, Events);
            this.mediaModel = new MediaModel(this);
            this.attributes.mediaModel = this.mediaModel;

            var mediaElement = document.createElement('video');
            mediaElement.src = '//content.bitsontherun.com/videos/bkaovAYt-52qL9xLP.mp4';
            mediaElement.preload = 'none';

            this.attributes.provider = {
                name: 'flash',
                getName: function() {
                    return {
                        name: 'flash'
                    };
                },
                setContainer: function(element) {
                    // element.appendChild(mediaElement[0]);
                },
                setVisibility: function(state) {
                    mediaElement.style.visibility = state ? 'visible' : '';
                    mediaElement.style.opacity = state ? 1 : 0;
                },
                seek: function(time) {
                    // mediaElement[0].load();
                    // mediaElement[0].currentTime = time;
                    // mediaElement[0].pause();
                },
                resize: function(width, height, stretching) {
                    if (!width || !height || !mediaElement.videoWidth || !mediaElement.videoHeight) {
                        return false;
                    }
                    var style = {
                        objectFit: '',
                        width: '',
                        height: ''
                    };
                    if (stretching === 'uniform') {
                        // snap video to edges when the difference in aspect ratio is less than 9%
                        var playerAspectRatio = width / height;
                        var videoAspectRatio = mediaElement.videoWidth / mediaElement.videoHeight;
                        if (Math.abs(playerAspectRatio - videoAspectRatio) < 0.09) {
                            style.objectFit = 'fill';
                        }
                    }

                    mediaElement.style.objectFit = style.objectFit;
                    mediaElement.style.width = style.width;
                    mediaElement.style.height = style.height;
                },
                setCurrentQuality: function(value) {
                    self.mediaModel.set('currentLevel', value);
                },
                setCurrentAudioTrack: function(value) {
                    self.mediaModel.set('currentAudioTrack', value);
                },
                setControls: function() {}
            };
        },

        getVideo: function() {
            return this.get('provider');
        },

        autoStartOnMobile: function() {
            return false;
        },

        setAutoStart: function() {
            return false;
        }
    });

    // Represents the state of the provider/media element
    var MediaModel = MockModel.MediaModel = function(parentModel) {
        this.attributes = _.extend({}, {
            state: parentModel.get('state'),
            duration: parentModel.get('duration'),
            mediaType: 'video', // 'audio',
            levels: [
                { label: 'Auto' },
                { label: '720p' },
                { label: '480p' },
            ],
            currentLevel: 0,
            audioTracks: [
                { name: 'English' },
                { name: 'Spanish' },
            ],
            currentAudioTrack: 0
        }, parentModel.get('playlistItem'));
    };
    _.extend(MediaModel.prototype, SimpleModel);

    return MockModel;
});
