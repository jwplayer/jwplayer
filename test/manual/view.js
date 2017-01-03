/* jshint jquery: true */
window.requireBaseUrl = document.location.href.replace(/[^\/]+\/[^\/]+\/[^\/]*$/, '');
window.requireCallback = function(){
    require([
        'mock/mock-api',
        'mock/mock-model',
        'view/view',
        'view/error',
        'less!css/jwplayer.less',
        'less!css/skins/beelden.less',
        'less!css/skins/bekle.less',
        'less!css/skins/five.less',
        'less!css/skins/glow.less',
        'less!css/skins/roundster.less',
        'less!css/skins/six.less',
        'less!css/skins/stormtrooper.less',
        'less!css/skins/vapor.less'
    ], function(MockApi, MockModel, View, ViewError) {

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


        // Create Player Views
        _.each([
            'seven',
            // 'beelden',
            'bekle',
            // 'five',
            // 'glow',
            // 'roundster',
            // 'six',
            // 'stormtrooper',
            // 'vapor',
            // 'un-skinned',
        ], function(skin) {
            $('body').append('<h1>' + skin + '</h1>');
            _.each([
                'idle',
                'complete',
                'buffering',
                'playing',
                'paused',
                'error',
                '*live-dvr*',
                '*audio-only*',
                '*ads*',
                '*casting*',
            ], function(state) {
                var position, duration, bufferPercent;
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

                var id = skin + '-' + state;
                var mockApi;

                if (state === 'error') {
                    makeError({
                        id: id,
                        skin: skin,
                        message: 'Error: This is an error message',
                    });
                } else if (state === 'idle') {
                    makePlayer({
                        id: id,
                        skin: skin,
                        state: state,
                        position: position,
                        duration: duration,
                        buffer: bufferPercent,
                    });
                    makePlayer({
                        id: id,
                        skin: skin,
                        state: state,
                        position: position,
                        duration: duration,
                        buffer: bufferPercent,
                        displaytitle : false,
                        displaydescription: false,
                    });
                    makePlayer({
                        id: id,
                        skin: skin,
                        state: state,
                        position: position,
                        duration: duration,
                        buffer: bufferPercent,
                        castAvailable: true,
                    });

                } else if (state === 'playing') {
                    makePlayer({
                        id: id,
                        skin: skin,
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
                        skin: skin,
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
                        skin: skin,
                        state: state,
                        position: position,
                        duration: duration,
                        buffer: bufferPercent,
                        autostartMobile: true,
                    });
                } else if (state === '*live-dvr*') {
                    $('body').append('<h2>' + skin + ' Live/DVR</h2>');
                    makePlayer({
                        id: id,
                        skin: skin,
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
                        skin: skin,
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
                        skin: skin,
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
                        skin: skin,
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
                    $('body').append('<h2>' + skin + ' audio-only/controlbar-only</h2>');
                    makePlayer({
                        id: id,
                        skin: skin,
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
                        skin: skin,
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
                    $('body').append('<h2>' + skin + ' advertising</h2>');
                    mockApi = makePlayer({
                        id: id,
                        skin: skin,
                        state: 'buffering',
                        position: 0,
                        duration: 0,
                        buffer: bufferPercent
                    });
                    mockApi.view.setupInstream(mockApi.model);
                    mockApi.view.setAltText('Loading ad');

                    mockApi = makePlayer({
                        id: id,
                        skin: skin,
                        state: 'playing',
                        position: position,
                        duration: duration,
                        buffer: bufferPercent
                    });
                    mockApi.view.setupInstream(mockApi.model);
                    mockApi.view.setAltText('This ad will end in 10 seconds');

                    mockApi = makePlayer({
                        id: id,
                        skin: skin,
                        state: 'paused',
                        position: position,
                        duration: duration,
                        buffer: bufferPercent
                    });
                    mockApi.view.setupInstream(mockApi.model);
                    mockApi.view.setAltText('This ad will end in 10 seconds');

                } else if (state === '*casting*') {
                    $('body').append('<h2>' + skin + ' casting</h2>');
                    makePlayer({
                        id: id,
                        skin: skin,
                        state:  'buffering',
                        position: position,
                        duration: duration,
                        buffer: bufferPercent,
                        castActive: true,
                    });
                    makePlayer({
                        id: id,
                        skin: skin,
                        state: 'playing',
                        position: position,
                        duration: duration,
                        buffer: bufferPercent,
                        castActive: true,
                    });
                    makePlayer({
                        id: id,
                        skin: skin,
                        state: 'paused',
                        position: position,
                        duration: duration,
                        buffer: bufferPercent,
                        castActive: true,
                    });
                    makePlayer({
                        id: id,
                        skin: skin,
                        state: 'complete',
                        position: position,
                        duration: duration,
                        buffer: bufferPercent,
                        castActive: true,
                    });
                } else {
                    makePlayer({
                        id: id,
                        skin: skin,
                        state: state,
                        position: position,
                        duration: duration,
                        buffer: bufferPercent,
                    });
                }
            });
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

            // resize after layout to update breakpoint css
            setTimeout(function() {
                view.resize(mockModel.get('width'), mockModel.get('height'));
                // provider.seek(11);
            }, 100);

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
                mockModel.get('skin'),
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
