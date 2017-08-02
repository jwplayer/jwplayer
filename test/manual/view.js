/* jshint jquery: true */
window.requireBaseUrl = document.location.href.replace(/[^\/]+\/[^\/]+\/[^\/]*$/, '');
window.requireCallback = function(){
    require([
        'mock/mock-api',
        'mock/mock-model',
        'view/view',
        'templates/error',
        'utils/css',
        'less!css/jwplayer.less',
    ], function(MockApi, MockModel, View, ViewError, css) {

        // TODO: these (url params: width, height, aspectratio, stretching, provider (flash rightclick))
        //     'jw-flag-aspect-mode',
        //     'jw-flag-fullscreen',
        //
        //     'jw-stretch-none',
        //     'jw-stretch-exactfit',
        //     'jw-stretch-uniform',
        //     'jw-stretch-fill'

        // stretching (requires mock media)
        // aspectratio

        // provider: { name: 'html5' }

        // Any mouse movement counts as "user activity" on all views
        function clearInactivity() {
            $('.jwplayer').removeClass('jw-flag-user-inactive');
        }
        document.body.addEventListener('mousemove', clearInactivity);
        document.body.addEventListener('touchstart', clearInactivity);

        // Styles added by related plugin
        css.css('.jw-related-btn .jw-button-image', {
            backgroundSize: 20
        });

        // Create Player Views
        $('body').append('<h1>Base Skin</h1>');
        _.each([
            'idle',
            'complete',
            'buffering',
            'playing',
            'paused',
            'error',
            '*live-dvr*',
            '*audio-only*',
            '*ads*'
        ], function(state) {
            var id = state;
            let position;
            let duration;
            let bufferPercent;
            let mockApi;

            if (state === 'idle') {
                position = 0;
                duration = 0;
                bufferPercent = 0;
            } else if (state === 'complete') {
                position = 33;
                duration = 33;
                bufferPercent = 100;
            } else {
                position = 10;
                duration = 33;
                bufferPercent = 50;
            }



            if (state === 'error') {
                makeError({
                    id: id,
                    message: 'Error: This is an error message',
                });
            } else if (state === 'idle') {
                makePlayer({
                    id: id,
                    state: state,
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                });
                makePlayer({
                    id: id,
                    state: state,
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                    displaytitle : false,
                    displaydescription: false,
                });
                makePlayer({
                    id: id,
                    state: state,
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                    castAvailable: true,
                });

            } else if (state === 'playing') {
                makePlayer({
                    id: id,
                    state: state,
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                    skinColorActive: 'yellow',
                    skinColorBackground: 'black',
                    skinColorInactive: 'gray',
                });
                // muted
                makePlayer({
                    id: id,
                    state: state,
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                    playlistItem: {
                        levels: [],
                        audioTracks: [],
                        tracks: []
                    },
                    mute: true,
                });
                // Autostart Mobile muted
                makePlayer({
                    id: id,
                    state: state,
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                    autostartMobile: true,
                });
            } else if (state === '*live-dvr*') {
                $('body').append('<h2>Live/DVR</h2>');
                makePlayer({
                    id: id,
                    state: 'playing',
                    playlistItem: {
                        audioTracks: []
                    },
                    position: position,
                    duration: Infinity,
                    buffer: bufferPercent,
                    streamType: 'Live',
                });
                makePlayer({
                    id: id,
                    state: 'paused',
                    playlistItem: {
                        audioTracks: []
                    },
                    position: position,
                    duration: Infinity,
                    buffer: bufferPercent,
                    streamType: 'Live',
                });
                makePlayer({
                    id: id,
                    state: 'playing',
                    playlistItem: {
                        audioTracks: []
                    },
                    position: -300,
                    duration: -60 * 60,
                    buffer: bufferPercent,
                    streamType: 'DVR',
                });
                makePlayer({
                    id: id,
                    state: 'paused',
                    playlistItem: {
                        audioTracks: []
                    },
                    position: -300,
                    duration: -60 * 60,
                    buffer: bufferPercent,
                    streamType: 'DVR',
                });
            } else if (state === '*audio-only*') {
                $('body').append('<h2>audio-only/controlbar-only</h2>');
                makePlayer({
                    id: id,
                    state: 'playing',
                    playlistItem: {
                        file: '//playertest.longtailvideo.com/bunny-trailer-audio-aac.aac',
                        image: '//d3el35u4qe4frz.cloudfront.net/bkaovAYt-480.jpg',
                        mediaType: 'audio',
                        levels: [],
                        audioTracks: [],
                        tracks: [],
                    },
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                });
                makePlayer({
                    id: id,
                    state: 'playing',
                    playlistItem: {
                        file: '//playertest.longtailvideo.com/bunny-trailer-audio-aac.aac',
                        image: '//d3el35u4qe4frz.cloudfront.net/bkaovAYt-480.jpg',
                        mediaType: 'audio',
                        levels: [],
                        audioTracks: [],
                        tracks: [],
                    },
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                    height: 40,
                });

            } else if (state === '*ads*') {
                $('body').append('<h2>advertising</h2>');
                mockApi = makePlayer({
                    id: id,
                    state: 'buffering',
                    position: 0,
                    duration: 0,
                    buffer: bufferPercent
                });
                mockApi.view.setupInstream(mockApi.model);
                mockApi.view.setAltText('Loading ad');

                mockApi = makePlayer({
                    id: id,
                    state: 'playing',
                    position: position,
                    duration: duration,
                    buffer: bufferPercent
                });
                mockApi.view.setupInstream(mockApi.model);
                mockApi.view.setAltText('This ad will end in 10 seconds');

                mockApi = makePlayer({
                    id: id,
                    state: 'paused',
                    position: position,
                    duration: duration,
                    buffer: bufferPercent
                });
                mockApi.view.setupInstream(mockApi.model);
                mockApi.view.setAltText('This ad will end in 10 seconds');

            } else if (state === '*casting*') {
                $('body').append('<h2>casting</h2>');
                makePlayer({
                    id: id,
                    state:  'buffering',
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                    castActive: true,
                });
                makePlayer({
                    id: id,
                    state: 'playing',
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                    castActive: true,
                });
                makePlayer({
                    id: id,
                    state: 'paused',
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                    castActive: true,
                });
                makePlayer({
                    id: id,
                    state: 'complete',
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                    castActive: true,
                });
            } else {
                makePlayer({
                    id: id,
                    state: state,
                    position: position,
                    duration: duration,
                    buffer: bufferPercent,
                });
            }
        });

        function makePlayer(configuration) {
            var mockModel = new MockModel();
            mockModel.setup(configuration);
            var mockApi = new MockApi();
            var view = new View(mockApi, mockModel);
            view.setup();
            // force a "change:" event on all properties in configuration
            _.each(configuration, function(value, prop) {
                delete mockModel.attributes[prop];
                mockModel.set(prop, value);
            });
            // trigger API events that the view uses (why?)
            mockApi.trigger('ready');
            mockApi.trigger('playlistItem', mockModel.get('playlistItem'));
            // add video tag to the media element
            var provider = mockModel.getVideo();
            provider.setContainer(mockModel.get('mediaContainer'));
            // trigger media model changes
            var mediaModel = mockModel.mediaModel;
            mediaModel.trigger('change:levels', mockModel, mediaModel.get('levels'));
            mediaModel.trigger('change:audioTracks', mockModel, mediaModel.get('audioTracks'));

            var $wrapper = $('<div id="' + configuration.id+  '-wrapper" class="wrapper"></div>').append(view.element());
            $('body').append($wrapper);

            // init to update breakpoint css
            view.init();

            // show next up
            var playlist = mockModel.get('playlist');
            if (playlist.length > 1) {
                mockModel.set('nextUp', playlist[1]);
            }

            if (!configuration.castActive &&
                (configuration.state === 'playing'||  configuration.state === 'paused')) {
                // setTimeout(function() {
                //     provider.seek(11);
                // }, 10 * 1000 + Math.random() * 5000);
            }

            //view.setAltText(_model.get('localization').loadingAd);

            mockApi.model = mockModel;
            mockApi.view = view;
            return mockApi;
        }

        function makeError(configuration) {
            var mockModel = new MockModel();
            mockModel.setup(configuration);

            var $errorElement = $(ViewError(
                mockModel.get('id'),
                configuration.message
            ));
            var width = mockModel.get('width');
            var height = mockModel.get('height');
            $errorElement.css({
                width: width.toString().indexOf('%') > 0 ? width : (width+ 'px'),
                height: height.toString().indexOf('%') > 0 ? height : (height + 'px')
            });

            $('body').append($('<div id="' + configuration.id+  '-wrapper" class="wrapper"></div>').append($errorElement));
        }
    });
};
