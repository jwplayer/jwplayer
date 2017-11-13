import { getLabel, getCode } from 'utils/language';

describe('languageUtils', function() {

    describe('getLabel from unsupported codes', function() {

        it('should not change value if there is no matching language code', function() {
            expect(getLabel()).to.equal(undefined);
            expect(getLabel(null)).to.equal(undefined);
            expect(getLabel('po')).to.equal('po');
            expect(getLabel('pol')).to.equal('pol');
        });

        describe('getLabel from ISO 639-1 codes', function() {

            it('should be English for its codes', function() {
                var expected = 'English';

                expect(getLabel('en')).to.equal(expected);
            });

            it('should be Chinese for its codes', function() {
                var expected = 'Chinese';

                expect(getLabel('zh')).to.equal(expected);
            });

            it('should be Dutch for its codes', function() {
                var expected = 'Dutch';

                expect(getLabel('nl')).to.equal(expected);
            });

            it('should be French for its codes', function() {
                var expected = 'French';

                expect(getLabel('fr')).to.equal(expected);
            });

            it('should be German for its codes', function() {
                var expected = 'German';

                expect(getLabel('de')).to.equal(expected);
            });

            it('should be Japanese for its codes', function() {
                var expected = 'Japanese';

                expect(getLabel('ja')).to.equal(expected);
            });

            it('should be Portuguese for its codes', function() {
                var expected = 'Portuguese';

                expect(getLabel('pt')).to.equal(expected);
            });

            it('should be Italian for its codes', function() {
                var expected = 'Italian';

                expect(getLabel('it')).to.equal(expected);
            });

            it('should be Russian for its codes', function() {
                var expected = 'Russian';

                expect(getLabel('ru')).to.equal(expected);
            });

            it('should be Spanish for its codes', function() {
                var expected = 'Spanish';

                expect(getLabel('es')).to.equal(expected);
            });

            it('should map based only on the first two characters', function() {
                var expected = 'Portuguese';
                expect(getLabel('pt-br')).to.equal(expected);
            });
        });

        describe('getLabel from ISO 639-2 codes', function() {

            it('should not change for its English codes', function() {
                expect(getLabel('eng')).to.equal('eng');
            });

            it('should not change for its Chinese codes', function() {
                expect(getLabel('zho')).to.equal('zho');
                expect(getLabel('chi')).to.equal('chi');
            });

            it('should not change for its Dutch codes', function() {
                expect(getLabel('nld')).to.equal('nld');
                expect(getLabel('dut')).to.equal('dut');
            });

            it('should not change for its French codes', function() {
                expect(getLabel('fra')).to.equal('fra');
                expect(getLabel('fre')).to.equal('fre');
            });

            it('should not change for its Herman codes', function() {
                expect(getLabel('deu')).to.equal('deu');
                expect(getLabel('ger')).to.equal('ger');
            });

            it('should not change for its Japanese codes', function() {
                expect(getLabel('jpn')).to.equal('jpn');
            });

            it('should not change for its Portuguese codes', function() {
                expect(getLabel('por')).to.equal('por');
            });

            it('should not change for its Italian codes', function() {
                expect(getLabel('ita')).to.equal('ita');
            });

            it('should not change for its Russian codes', function() {
                expect(getLabel('rus')).to.equal('rus');
            });

            it('should not change for its Spanish codes', function() {
                expect(getLabel('esp')).to.equal('esp');
                expect(getLabel('spa')).to.equal('spa');
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

