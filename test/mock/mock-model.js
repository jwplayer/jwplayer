import SimpleModel from 'model/simplemodel';
import Config from 'api/config';
import Events from 'utils/backbone.events';

const MockModel = function() {};

Object.assign(MockModel.prototype, SimpleModel, {
    setup(configuration) {
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

        const playerConfig = Config({
            width: '100%',
            height: 270,
            playlist: [
                playlistItem,
                {
                    file: 'http://content.bitsontherun.com/videos/q1fx20VZ-52qL9xLP.mp4',
                    image: 'http://content.bitsontherun.com/thumbs/3XnJSIm4-480.jpg'
                }
            ],
            playbackRateControls: true
        }, {});

        this.attributes = Object.assign({}, playerConfig, {
            id: '',
            // These are set elsewhere
            castActive: false,
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
            supportsPlaybackRate: true,
            position: 0,
            buffer: 0,
            duration: 0,
            minDvrWindow: 60,
            seekRange: { start: 0, end: 0 },
            scrubbing: false,
            playlistItem: playlistItem,
            logo: {
                position: 'top-right',
                margin: 2
            },
            logoWidth: 50,
            related: null,
            sharing: null,
            sdkplatform: false,
            preload: 'metadata'
        }, configuration);

        this.mediaController = Object.assign({}, Events);
        this.mediaModel = new MediaModel(this);
        this.attributes.mediaModel = this.mediaModel;

        const mediaElement = document.createElement('video');
        mediaElement.src = '//content.bitsontherun.com/videos/bkaovAYt-52qL9xLP.mp4';
        mediaElement.preload = 'none';

        this.attributes.provider = {
            name: 'html5',
            renderNatively: false,
            supportsPlaybackRate: true,
            getName() {
                return {
                    name: 'html5'
                };
            },
            setContainer(/* element */) {
                // element.appendChild(mediaElement[0]);
            },
            setVisibility(state) {
                mediaElement.style.visibility = state ? 'visible' : '';
                mediaElement.style.opacity = state ? 1 : 0;
            },
            seek(/* time */) {
                // mediaElement[0].load();
                // mediaElement[0].currentTime = time;
                // mediaElement[0].pause();
            },
            resize(width, height, stretching) {
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
            setCurrentQuality(value) {
                self.mediaModel.set('currentLevel', value);
            },
            setCurrentAudioTrack(value) {
                self.mediaModel.set('currentAudioTrack', value);
            },
            setControls() {},
        };
    },

    getVideo() {
        return this.get('provider');
    },

    setAutoStart() {
        return false;
    },

    setPlaybackRate(rate) {
        this.set('defaultPlaybackRate', rate);
        this.set('playbackRate', rate);
    },
    getProviders() {
    },
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
