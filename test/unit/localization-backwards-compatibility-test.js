import Config from 'api/config';
import en from 'assets/translations/en.js';

describe('Localization Backwards Support', function () {

    describe('Defaults', function () {

        it('should not override defaults if localization block isnt set', function () {
            const config = new Config({
                title: 'Agent 327',
                description: 'Operation Barbershop'
            });

            expect(config.localization).to.deep.equal(en);
        });
    });

    describe('Related', function () {

        it('should fallback to the appropriate properties when localization isnt set', function () {
            const config = new Config({
                related: {
                    client: 'related.js',
                    displayMode: 'shelfWidget',
                    autoplaymessage: 'Showing next video in xx'
                }
            });

            expect(config.localization.related.autoplaymessage).to.equal(config.related.autoplaymessage);
            expect(config.localization.related.heading).to.equal(en.related.heading);
        }); 

        it('should use properties from the localization block when set', function () {
            const config = new Config({
                localization: {
                    related: {
                        heading: 'Lots of Videos',
                        autoplaymessage: 'Showing next video in xx'
                    }
                }
            }); 

            expect(config.localization.related.autoplaymessage).to.not.equal(en.related.heading);
            expect(config.localization.related.heading).to.not.equal(en.related.heading);
            expect(config.localization.related.autoplaymessage).to.equal('Showing next video in xx');
            expect(config.localization.related.heading).to.equal('Lots of Videos');
        });

        it('should set the correct text if localization.related was originally a string', function () {
            const config = new Config({
                localization: {
                    related: 'Even more videos'
                }
            });

            expect(config.localization.related).to.be.an('object');
        });
    });
});

