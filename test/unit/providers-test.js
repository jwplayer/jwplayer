import Providers from 'providers/providers';
import ProvidersSupported from 'providers/providers-supported';
import Source from 'playlist/source';
import { Features } from 'environment/environment';
import _ from 'underscore/underscore';

const getName = function getName(provider) {
    if (!provider) {
        return null;
    } else if (provider.name) {
        return provider.name;
    }

    return provider.toString().match(/^function\s*([^\s(]+)/)[1];
};

describe('Providers', function() {

    it('should be prioritized', function() {
        const providerMap = ProvidersSupported.reduce(function(providers, provider, index) {
            providers[getName(provider)] = index;
            return providers;
        }, {});
        expect(providerMap.youtube).to.be.below(providerMap.html5);
    });

    it('should choose html5 by default', function() {
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
        const providers = new Providers();
        let provider;

        _.each(htmlSources, (src, type) => {
            provider = providers.choose(Source(src));
            expect(getName(provider), type).to.equal('html5');
        });
    });

    it('should not choose a provider for hls and dash streams', function() {
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
        const providers = new Providers();
        let provider;

        _.each(unsupportedSources, (src, type) => {
            provider = providers.choose(Source(src));
            expect(getName(provider), type).to.be.null;
        });
    });

    it('should choose youtube for youtube sources', function() {
        const youtubeSource = { file: 'http://www.youtube.com/watch?v=YE7VzlLtp-4' };
        const providers = new Providers();
        let provider = providers.choose(Source(youtubeSource));

        expect(getName(provider)).to.equal('youtube');
    });
});
