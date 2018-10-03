import Config from 'api/config';
import en from 'assets/translations/en.js';

describe('Localization Backwards Support', function () {
    const defaultConfig = {
        title: 'Agent 327',
        description: 'Operation Barbershop'
    };

    describe('Defaults', function () {

        it('should not override defaults if localization block isnt set', function () {
            const config = new Config(Object.assign({}, defaultConfig));

            expect(config.localization).to.deep.equal(en);
        });

        it('should not override defaults if plugin blocks dont have the appropriate properties', function() {
            const config = new Config(Object.assign({}, defaultConfig, {
                sharing: {}
            }));

            expect(config.localization).to.deep.equal(en);
        });
    });

    describe('Related', function () {
        it('should fallback to the appropriate properties when localization isnt set', function () {
            const relatedConfig = {
                related: {
                    client: 'related.js',
                    displayMode: 'shelfWidget',
                    autoplaymessage: 'Showing next video in xx'
                }
            };

            const config = new Config(Object.assign({}, defaultConfig, relatedConfig));

            expect(config.localization.related.autoplaymessage).to.equal(config.related.autoplaymessage);
            expect(config.localization.related.heading).to.equal(en.related.heading);
        }); 

        it('should set the correct text if localization.related was originally a string', function () {
            const relatedConfig = {
                related: {
                    client: 'related.js',
                    displayMode: 'shelfWidget',
                    autoplaymessage: 'Showing next video in xx'
                },
                localization: {
                    related: 'Even more videos'
                }
            };

            const config = new Config(Object.assign({}, defaultConfig, relatedConfig));

            expect(config.localization.related).to.be.an('object');
            expect(config.localization.related.heading).to.equal(relatedConfig.localization.related);
        });

        it('should always use properties in the localization block', function() {
            const relatedConfig = {
                related: {
                    client: 'related.js',
                    displayMode: 'shelfWidget',
                    autoplaymessage: 'This is the wrong message'
                },
                localization: {
                    related: {
                        heading: 'Lots of Videos',
                        autoplaymessage: 'This is the right message'
                    }
                }
            };

            const config = new Config(Object.assign({}, defaultConfig, relatedConfig));
            expect(config.localization.related.autoplaymessage).to.equal(relatedConfig.localization.related.autoplaymessage);
            expect(config.localization.related.heading).to.equal(relatedConfig.localization.related.heading);
        });
    });

    describe('Advertising', function () {
        it('should fallback to the appropriate properties when localization isnt set', function () {
            const advertisingConfig = {
                advertising: {
                    autoplayadsmuted: true,
                    client: 'googima.js',
                    admessage: 'Ending in xx',
                    cuetext: 'Ad',
                    loadingAd: 'Loading....',
                    podmessage: 'xx of yy',
                    skipmessage: 'Skiping in xx',
                    skiptext: 'Next ad'
                }
            };


            const config = new Config(Object.assign({}, defaultConfig, advertisingConfig));
            expect(config.localization.advertising.admessage).to.equal(config.advertising.admessage);
            expect(config.localization.advertising.cuetext).to.equal(config.advertising.cuetext);
            expect(config.localization.advertising.loadingAd).to.equal(config.advertising.loadingAd);
            expect(config.localization.advertising.podmessage).to.equal(config.advertising.podmessage);
            expect(config.localization.advertising.skipmessage).to.equal(config.advertising.skipmessage);
            expect(config.localization.advertising.skiptext).to.equal(config.advertising.skiptext);
        });

        it('should always use properties in the localization block', function () {
            const advertisingConfig = {
                advertising: {
                    autoplayadsmuted: true,
                    client: 'googima.js',
                    admessage: 'Ending in xx',
                    cuetext: 'wrong Message',
                },
                localization: {
                    advertising: {
                        cuetext: 'Right message',
                        loadingAd: 'Loading....',
                        podmessage: 'xx of yy',
                        skipmessage: 'Skiping in xx',
                        skiptext: 'Next ad'
                    }
                }
            };

            const config = new Config(Object.assign({}, defaultConfig, advertisingConfig));
            expect(config.localization.advertising.cuetext).to.equal(advertisingConfig.localization.advertising.cuetext);
            expect(config.localization.advertising.loadingad).to.equal(advertisingConfig.localization.advertising.loadingad);
            expect(config.localization.advertising.podmessage).to.equal(advertisingConfig.localization.advertising.podmessage);
            expect(config.localization.advertising.skipmessage).to.equal(advertisingConfig.localization.advertising.skipmessage);
            expect(config.localization.advertising.skiptext).to.equal(advertisingConfig.localization.advertising.skiptext);
        });
    });

    describe('Sharing', function () {
        it('should fallback to the appropriate properties when localization isnt set', function () {
            const sharingConfig = {
                sharing: {
                    link: 'http://example.com/page/MEDIAID/',
                    heading: 'Share Video',
                    copied: 'Copied',
                    sites: [
                        'email',
                        'twitter',
                        'facebook',
                        {
                            icon: 'assets/smiley.png',
                            src: 'http://www.google.com/sharer/sharer.php?u=',
                            label: 'smileyshare'
                        }
                    ]
                }
            };


            const config = new Config(Object.assign({}, defaultConfig, sharingConfig));
            expect(config.localization.sharing.copied).to.equal(config.sharing.copied);
            expect(config.localization.sharing.heading).to.equal(config.sharing.heading);
        });

        it('should always use properties in the localization block', function () {
            const sharingConfig = {
                sharing: {
                    link: 'http://example.com/page/MEDIAID/',
                    heading: 'Wrong Heading',
                    copied: 'Wrong copied Text',
                    sites: [
                        'email',
                        'twitter',
                        'facebook',
                        {
                            icon: 'assets/smiley.png',
                            src: 'http://www.google.com/sharer/sharer.php?u=',
                            label: 'smileyshare'
                        }
                    ]
                },
                localization: {
                    sharing: {
                        heading: 'Right heading',
                        link: 'http://example.com/page/CORRECTID/',
                        copied: 'Right copied text'
                    }
                }
            };

            const config = new Config(Object.assign({}, defaultConfig, sharingConfig));
            expect(config.localization.sharing.heading).to.equal(sharingConfig.localization.sharing.heading);
            expect(config.localization.sharing.link).to.equal(sharingConfig.localization.sharing.link);
            expect(config.localization.sharing.copied).to.equal(sharingConfig.localization.sharing.copied);

        });
    });

    describe('nextUpClose', function() {
        it('should set localization.close if localization.nextUpClose is set', function () {
            const localizationConfig = {
                localization: {
                    nextUpClose: 'Closing'
                }
            };

            const config = new Config(Object.assign({}, defaultConfig, localizationConfig));
            expect(config.localization.close).to.equal(localizationConfig.localization.nextUpClose);
        });
    });
});

