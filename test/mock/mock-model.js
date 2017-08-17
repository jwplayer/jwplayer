import SimpleModel from 'model/simplemodel';
import Events from 'utils/backbone.events';

const MockModel = function() {};

Object.assign(MockModel.prototype, SimpleModel, {
    setup: function(configuration) {
        const self = this;
        const playlistItem = Object.assign({
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

        /*
        const customCaptions = {
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
        */

        this.attributes = Object.assign({}, {
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
            preload: 'metadata'
        }, configuration);


        if (configuration.autostartMobile) {
            this.autoStartOnMobile = function() {
                return true;
            };
        }

        this.mediaController = Object.assign({}, Events);
        this.mediaModel = new MediaModel(this);
        this.attributes.mediaModel = this.mediaModel;

        const mediaElement = document.createElement('video');
        mediaElement.src = '//content.bitsontherun.com/videos/bkaovAYt-52qL9xLP.mp4';
        mediaElement.preload = 'none';

        this.attributes.provider = {
            name: 'html5',
            getName: function() {
                return {
                    name: 'html5'
                };
            },
            setContainer: function(/* element */) {
                // element.appendChild(mediaElement[0]);
            },
            setVisibility: function(state) {
                mediaElement.style.visibility = state ? 'visible' : '';
                mediaElement.style.opacity = state ? 1 : 0;
            },
            seek: function(/* time */) {
                // mediaElement[0].load();
                // mediaElement[0].currentTime = time;
                // mediaElement[0].pause();
            },
            resize: function(width, height, stretching) {
                if (!width || !height || !mediaElement.videoWidth || !mediaElement.videoHeight) {
                    return false;
                }
                const style = {
                    objectFit: '',
                    width: '',
                    height: ''
                };
                if (stretching === 'uniform') {
                    // snap video to edges when the difference in aspect ratio is less than 9%
                    const playerAspectRatio = width / height;
                    const videoAspectRatio = mediaElement.videoWidth / mediaElement.videoHeight;
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
const MediaModel = MockModel.MediaModel = function(parentModel) {
    this.attributes = Object.assign({}, {
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

Object.assign(MediaModel.prototype, SimpleModel);

export default MockModel;
