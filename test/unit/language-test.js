import { getLabel, getCode } from 'utils/language';

describe('languageUtils', function() {

    describe('getLabel from unsupported codes', function() {

        it('should not change value if there is no matching language code', function() {
            assert.equal(getLabel(), undefined);
            assert.equal(getLabel(null), null);
            assert.equal(getLabel('po'), 'po');
            assert.equal(getLabel('pol'), 'pol');
        });

        describe('getLabel from ISO 639-1 codes', function() {

            it('should be English for its codes', function() {
                var expected = 'English';

                assert.equal(getLabel('en'), expected);
            });

            it('should be Chinese for its codes', function() {
                var expected = 'Chinese';

                assert.equal(getLabel('zh'), expected);
            });

            it('should be Dutch for its codes', function() {
                var expected = 'Dutch';

                assert.equal(getLabel('nl'), expected);
            });

            it('should be French for its codes', function() {
                var expected = 'French';

                assert.equal(getLabel('fr'), expected);
            });

            it('should be German for its codes', function() {
                var expected = 'German';

                assert.equal(getLabel('de'), expected);
            });

            it('should be Japanese for its codes', function() {
                var expected = 'Japanese';

                assert.equal(getLabel('ja'), expected);
            });

            it('should be Portuguese for its codes', function() {
                var expected = 'Portuguese';

                assert.equal(getLabel('pt'), expected);
            });

            it('should be Italian for its codes', function() {
                var expected = 'Italian';

                assert.equal(getLabel('it'), expected);
            });

            it('should be Russian for its codes', function() {
                var expected = 'Russian';

                assert.equal(getLabel('ru'), expected);
            });

            it('should be Spanish for its codes', function() {
                var expected = 'Spanish';

                assert.equal(getLabel('es'), expected);
            });

            it('should map based only on the first two characters', function() {
                var expected = 'Portuguese';
                assert.equal(getLabel('pt-br'), expected);
            });
        });

        describe('getLabel from ISO 639-2 codes', function() {

            it('should not change for its English codes', function() {
                assert.equal(getLabel('eng'), 'eng');
            });

            it('should not change for its Chinese codes', function() {
                assert.equal(getLabel('zho'), 'zho');
                assert.equal(getLabel('chi'), 'chi');
            });

            it('should not change for its Dutch codes', function() {
                assert.equal(getLabel('nld'), 'nld');
                assert.equal(getLabel('dut'), 'dut');
            });

            it('should not change for its French codes', function() {
                assert.equal(getLabel('fra'), 'fra');
                assert.equal(getLabel('fre'), 'fre');
            });

            it('should not change for its Herman codes', function() {
                assert.equal(getLabel('deu'), 'deu');
                assert.equal(getLabel('ger'), 'ger');
            });

            it('should not change for its Japanese codes', function() {
                assert.equal(getLabel('jpn'), 'jpn');
            });

            it('should not change for its Portuguese codes', function() {
                assert.equal(getLabel('por'), 'por');
            });

            it('should not change for its Italian codes', function() {
                assert.equal(getLabel('ita'), 'ita');
            });

            it('should not change for its Russian codes', function() {
                assert.equal(getLabel('rus'), 'rus');
            });

            it('should not change for its Spanish codes', function() {
                assert.equal(getLabel('esp'), 'esp');
                assert.equal(getLabel('spa'), 'spa');
            });
        });

        describe('getCode from ISO 639-1 codes', function() {

            it('should be English for its codes', function() {
                expect(getCode('English')).to.equal('en');
            });

            it('should be Chinese for its codes', function() {
                expect(getCode('Chinese')).to.equal('zh');
            });

            it('should be Dutch for its codes', function() {
                expect(getCode('Dutch')).to.equal('nl');
            });

            it('should be French for its codes', function() {
                expect(getCode('French')).to.equal('fr');
            });

            it('should be German for its codes', function() {
                expect(getCode('German')).to.equal('de');
            });

            it('should be Japanese for its codes', function() {
                expect(getCode('Japanese')).to.equal('ja');
            });

            it('should be Portuguese for its codes', function() {
                expect(getCode('Portuguese')).to.equal('pt');
            });

            it('should be Italian for its codes', function() {
                expect(getCode('Italian')).to.equal('it');
            });

            it('should be Russian for its codes', function() {
                expect(getCode('Russian')).to.equal('ru');
            });

            it('should be Spanish for its codes', function() {
                expect(getCode('Spanish')).to.equal('es');
            });

            it('should be Greek for its codes', function() {
                expect(getCode('Greek')).to.equal('el');
            });
        });
    });
});

