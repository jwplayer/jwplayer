define([
    'utils/language',
], function (langUtils, _) {

    QUnit.module('languageUtils');
    var test = QUnit.test.bind(QUnit);

    QUnit.module('getLabel from unsupported codes');

    test('should not change value if there is no matching language code', function (assert) {
        assert.equal(langUtils.getLabel(), undefined);
        assert.equal(langUtils.getLabel(null), null);
        assert.equal(langUtils.getLabel('po'), 'po');
        assert.equal(langUtils.getLabel('pol'), 'pol');
    });

    QUnit.module('getLabel from ISO 639-1 codes');

    test('should be English for its codes', function (assert) {
        var expected = 'English';

        assert.equal(langUtils.getLabel('en'), expected);
    });

    test('should be Chinese for its codes', function (assert) {
        var expected = 'Chinese';

        assert.equal(langUtils.getLabel('zh'), expected);
    });

    test('should be Dutch for its codes', function (assert) {
        var expected = 'Dutch';

        assert.equal(langUtils.getLabel('nl'), expected);
    });

    test('should be French for its codes', function (assert) {
        var expected = 'French';

        assert.equal(langUtils.getLabel('fr'), expected);
    });

    test('should be German for its codes', function (assert) {
        var expected = 'German';

        assert.equal(langUtils.getLabel('de'), expected);
    });

    test('should be Japanese for its codes', function (assert) {
        var expected = 'Japanese';

        assert.equal(langUtils.getLabel('ja'), expected);
    });

    test('should be Portuguese for its codes', function (assert) {
        var expected = 'Portuguese';

        assert.equal(langUtils.getLabel('pt'), expected);
    });

    test('should be Italian for its codes', function (assert) {
        var expected = 'Italian';

        assert.equal(langUtils.getLabel('it'), expected);
    });

    test('should be Russian for its codes', function (assert) {
        var expected = 'Russian';

        assert.equal(langUtils.getLabel('ru'), expected);
    });

    test('should be Spanish for its codes', function (assert) {
        var expected = 'Spanish';

        assert.equal(langUtils.getLabel('es'), expected);
    });

    QUnit.module('getLabel from ISO 639-2 codes');

    test('should not change for its English codes', function (assert) {
        assert.equal(langUtils.getLabel('eng'), 'eng');
    });

    test('should not change for its Chinese codes', function (assert) {
        assert.equal(langUtils.getLabel('zho'), 'zho');
        assert.equal(langUtils.getLabel('chi'), 'chi');
    });

    test('should not change for its Dutch codes', function (assert) {
        assert.equal(langUtils.getLabel('nld'), 'nld');
        assert.equal(langUtils.getLabel('dut'), 'dut');
    });

    test('should not change for its French codes', function (assert) {
        assert.equal(langUtils.getLabel('fra'), 'fra');
        assert.equal(langUtils.getLabel('fre'), 'fre');
    });

    test('should not change for its Herman codes', function (assert) {
        assert.equal(langUtils.getLabel('deu'), 'deu');
        assert.equal(langUtils.getLabel('ger'), 'ger');
    });

    test('should not change for its Japanese codes', function (assert) {
        assert.equal(langUtils.getLabel('jpn'), 'jpn');
    });

    test('should not change for its Portuguese codes', function (assert) {
        assert.equal(langUtils.getLabel('por'), 'por');
    });

    test('should not change for its Italian codes', function (assert) {
        assert.equal(langUtils.getLabel('ita'), 'ita');
    });

    test('should not change for its Russion codes', function (assert) {
        assert.equal(langUtils.getLabel('rus'), 'rus');
    });

    test('should not change for its Spanish codes', function (assert) {
        assert.equal(langUtils.getLabel('esp'), 'esp');
        assert.equal(langUtils.getLabel('spa'), 'spa');
    });
});
