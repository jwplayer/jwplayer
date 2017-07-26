import langUtils from 'utils/language';

describe('languageUtils', () => {

    describe('getLabel from unsupported codes', () => {

        it('should not change value if there is no matching language code', () => {
            assert.equal(langUtils.getLabel(), undefined);
            assert.equal(langUtils.getLabel(null), null);
            assert.equal(langUtils.getLabel('po'), 'po');
            assert.equal(langUtils.getLabel('pol'), 'pol');
        });

        describe('getLabel from ISO 639-1 codes', () => {

            it('should be English for its codes', () => {
                var expected = 'English';

                assert.equal(langUtils.getLabel('en'), expected);
            });

            it('should be Chinese for its codes', () => {
                var expected = 'Chinese';

                assert.equal(langUtils.getLabel('zh'), expected);
            });

            it('should be Dutch for its codes', () => {
                var expected = 'Dutch';

                assert.equal(langUtils.getLabel('nl'), expected);
            });

            it('should be French for its codes', () => {
                var expected = 'French';

                assert.equal(langUtils.getLabel('fr'), expected);
            });

            it('should be German for its codes', () => {
                var expected = 'German';

                assert.equal(langUtils.getLabel('de'), expected);
            });

            it('should be Japanese for its codes', () => {
                var expected = 'Japanese';

                assert.equal(langUtils.getLabel('ja'), expected);
            });

            it('should be Portuguese for its codes', () => {
                var expected = 'Portuguese';

                assert.equal(langUtils.getLabel('pt'), expected);
            });

            it('should be Italian for its codes', () => {
                var expected = 'Italian';

                assert.equal(langUtils.getLabel('it'), expected);
            });

            it('should be Russian for its codes', () => {
                var expected = 'Russian';

                assert.equal(langUtils.getLabel('ru'), expected);
            });

            it('should be Spanish for its codes', () => {
                var expected = 'Spanish';

                assert.equal(langUtils.getLabel('es'), expected);
            });

            it('should map based only on the first two characters', () => {
                var expected = 'Portuguese';
                assert.equal(langUtils.getLabel('pt-br'), expected);
            });
        });

        describe('getLabel from ISO 639-2 codes', () => {

            it('should not change for its English codes', () => {
                assert.equal(langUtils.getLabel('eng'), 'eng');
            });

            it('should not change for its Chinese codes', () => {
                assert.equal(langUtils.getLabel('zho'), 'zho');
                assert.equal(langUtils.getLabel('chi'), 'chi');
            });

            it('should not change for its Dutch codes', () => {
                assert.equal(langUtils.getLabel('nld'), 'nld');
                assert.equal(langUtils.getLabel('dut'), 'dut');
            });

            it('should not change for its French codes', () => {
                assert.equal(langUtils.getLabel('fra'), 'fra');
                assert.equal(langUtils.getLabel('fre'), 'fre');
            });

            it('should not change for its Herman codes', () => {
                assert.equal(langUtils.getLabel('deu'), 'deu');
                assert.equal(langUtils.getLabel('ger'), 'ger');
            });

            it('should not change for its Japanese codes', () => {
                assert.equal(langUtils.getLabel('jpn'), 'jpn');
            });

            it('should not change for its Portuguese codes', () => {
                assert.equal(langUtils.getLabel('por'), 'por');
            });

            it('should not change for its Italian codes', () => {
                assert.equal(langUtils.getLabel('ita'), 'ita');
            });

            it('should not change for its Russian codes', () => {
                assert.equal(langUtils.getLabel('rus'), 'rus');
            });

            it('should not change for its Spanish codes', () => {
                assert.equal(langUtils.getLabel('esp'), 'esp');
                assert.equal(langUtils.getLabel('spa'), 'spa');
            });
        });

        describe('getCode from ISO 639-1 codes', () => {

            it('should be English for its codes', () => {
                expect(langUtils.getCode('English')).to.equal('en');
            });

            it('should be Chinese for its codes', () => {
                expect(langUtils.getCode('Chinese')).to.equal('zh');
            });

            it('should be Dutch for its codes', () => {
                expect(langUtils.getCode('Dutch')).to.equal('nl');
            });

            it('should be French for its codes', () => {
                expect(langUtils.getCode('French')).to.equal('fr');
            });

            it('should be German for its codes', () => {
                expect(langUtils.getCode('German')).to.equal('de');
            });

            it('should be Japanese for its codes', () => {
                expect(langUtils.getCode('Japanese')).to.equal('ja');
            });

            it('should be Portuguese for its codes', () => {
                expect(langUtils.getCode('Portuguese')).to.equal('pt');
            });

            it('should be Italian for its codes', () => {
                expect(langUtils.getCode('Italian')).to.equal('it');
            });

            it('should be Russian for its codes', () => {
                expect(langUtils.getCode('Russian')).to.equal('ru');
            });

            it('should be Spanish for its codes', () => {
                expect(langUtils.getCode('Spanish')).to.equal('es');
            });

            it('should be Greek for its codes', () => {
                expect(langUtils.getCode('Greek')).to.equal('el');
            });
        });
    });
});

