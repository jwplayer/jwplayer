define([
    'utils/language',
], function (langUtils, _) {

    QUnit.module('languageUtils');
    var test = QUnit.test.bind(QUnit);

    QUnit.module('getLabel');

    test('should be English for its codes', function (assert) {
        var expected = 'English';

        assert.equal(langUtils.getLabel('en'), expected);
        assert.equal(langUtils.getLabel('eng'), expected);
    });

    test('should be Chinese for its codes', function (assert) {
        var expected = 'Chinese';

        assert.equal(langUtils.getLabel('zh'), expected);
        assert.equal(langUtils.getLabel('zho'), expected);
        assert.equal(langUtils.getLabel('chi'), expected);
    });

    test('should be Dutch for its codes', function (assert) {
        var expected = 'Dutch';

        assert.equal(langUtils.getLabel('nl'), expected);
        assert.equal(langUtils.getLabel('nld'), expected);
        assert.equal(langUtils.getLabel('dut'), expected);
    });

    test('should be French for its codes', function (assert) {
        var expected = 'French';

        assert.equal(langUtils.getLabel('fr'), expected);
        assert.equal(langUtils.getLabel('fra'), expected);
        assert.equal(langUtils.getLabel('fre'), expected);
    });

    test('should be German for its codes', function (assert) {
        var expected = 'German';

        assert.equal(langUtils.getLabel('de'), expected);
        assert.equal(langUtils.getLabel('deu'), expected);
        assert.equal(langUtils.getLabel('ger'), expected);
    });

    test('should be Japanese for its codes', function (assert) {
        var expected = 'Japanese';

        assert.equal(langUtils.getLabel('ja'), expected);
        assert.equal(langUtils.getLabel('jpn'), expected);
    });

    test('should be Portuguese for its codes', function (assert) {
        var expected = 'Portuguese';

        assert.equal(langUtils.getLabel('pt'), expected);
        assert.equal(langUtils.getLabel('por'), expected);
    });

    test('should be Italian for its codes', function (assert) {
        var expected = 'Italian';

        assert.equal(langUtils.getLabel('it'), expected);
        assert.equal(langUtils.getLabel('ita'), expected);
    });

    test('should be Russian for its codes', function (assert) {
        var expected = 'Russian';

        assert.equal(langUtils.getLabel('ru'), expected);
        assert.equal(langUtils.getLabel('rus'), expected);
    });

    test('should be Spanish for its codes', function (assert) {
        var expected = 'Spanish';

        assert.equal(langUtils.getLabel('es'), expected);
        assert.equal(langUtils.getLabel('esp'), expected);
        assert.equal(langUtils.getLabel('spa'), expected);
    });

    test('should not change value if there is no matching language code', function (assert) {
        assert.equal(langUtils.getLabel(), undefined);
        assert.equal(langUtils.getLabel(null), null);
        assert.equal(langUtils.getLabel('pol'), 'pol');
    });
});
