define([
    'playlist/source',
    'providers/providers',
    'utils/browser',
    'underscore/underscore'
], function (source, Providers, browser, _) {
    browser.flashVersion = function() {
        return 24.0;
    };

    const htmlSources = {
        mov: { file: 'http://playertest.longtailvideo.com/bunny.mov' },
        mp4: { file: 'http://content.bitsontherun.com/videos/q1fx20VZ-52qL9xLP.mp4' },
        f4v: { file: 'http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.f4v' },
        m4v: { file: 'http://content.bitsontherun.com/videos/3XnJSIm4-52qL9xLP.m4v' },
        m4a: { file: 'http://content.bitsontherun.com/videos/nPripu9l-Q2YqwWcp.m4a', type: 'aac' },
        mp3: { file: 'http://content.bitsontherun.com/videos/yj1shGJB-ywAKK1m8.mp3' },
        aac: { file: 'http://content.bitsontherun.com/videos/3XnJSIm4-I3ZmuSFT.aac' },
        ogg: { file: 'http://content.bitsontherun.com/videos/3XnJSIm4-364765.ogg' },
        oga: { file: 'http://content.bitsontherun.com/videos/3XnJSIm4-rjiewRbX.oga' },
        webm: { file: 'http://content.bitsontherun.com/videos/3XnJSIm4-27m5HpIu.webm' },
        mp4mp3: { file: 'http://content.bitsontherun.com/videos/nPripu9l-ywAKK1m8.mp4', type: 'mp3' },
    };

    const flashSources = {
        flv: { file: 'http://playertest.longtailvideo.com/flv-cuepoints/honda_accord.flv' },
        smil: { file: 'assets/os/edgecast.smil' }
    };

    const unsupportedSources = {
        hls: {
            file: 'http://playertest.longtailvideo.com/adaptive/bipbop/bipbopall.hls',
            type: 'm3u8'
        },
        androidhlsTrue: {
            file: 'http://playertest.longtailvideo.com/adaptive/bipbop/bipbopall.hls',
            type: 'm3u8',
            androidhls: true
        },
        androidhlsFalse: {
            file: 'http://playertest.longtailvideo.com/adaptive/bipbop/bipbopall.hls',
            type: 'm3u8',
            androidhls: false
        },
        dash: { file: 'http//storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd' }
    };

    const youtubeSource = { file: 'http://www.youtube.com/watch?v=YE7VzlLtp-4' };

    const getName = function getName(provider) {
        if (!provider) {
            return null;
        } else if (provider.name) {
            return provider.name;
        }

        return provider.toString().match(/^function\s*([^\s(]+)/)[1];
    };

    describe('Providers', function() {

        describe('should prioritize Youtube, HTML5 then Flash', function() {

            function providersOrder(primary) {
                const providerList = new Providers({ primary: primary }).providers;
                const providerMap = _.reduce(providerList, function(providers, provider, index) {
                    providers[getName(provider)] = index;
                    return providers;
                }, {});

                expect(providerMap.youtube).to.be.below(providerMap.html5);
                expect(providerMap.html5).to.be.below(providerMap.flash);
            }

            it('when primary is html5', function() {
                providersOrder('html5');
            });

            it('when primary is flash', function() {
                providersOrder('flash');
            });

            it('when no primary is defined', function() {
                providersOrder();
            });

            it('when primary is invalid', function() {
                providersOrder('hlsjs');
            });
        });

        describe('should choose provider', function() {

            function chooseProviders(primary) {
                const providers = new Providers({ edition: 'free', primary: primary });
                let provider;

                _.each(htmlSources, (src, type) => {
                    provider = providers.choose(source(src));
                    expect(getName(provider), type).to.equal('html5');
                });

                _.each(flashSources, (src, type) => {
                    provider = providers.choose(source(src));
                    expect(getName(provider), type).to.equal('flash');
                });

                _.each(unsupportedSources, (src, type) => {
                    provider = providers.choose(source(src));
                    expect(getName(provider), type).to.be.null;
                });

                provider = providers.choose(source(youtubeSource));
                expect(getName(provider)).to.equal('youtube');
            }

            it('when primary is html5', function() {
                chooseProviders('html5');
            });

            it('when primary is flash', function() {
                chooseProviders('flash');
            });

            it('when no primary is defined', function() {
                chooseProviders();
            });

            it('when primary is invalid', function() {
                chooseProviders('hlsjs');
            });
        });
    });
});
