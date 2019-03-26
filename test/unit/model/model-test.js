import Model from 'controller/model';

describe('Model', function() {
    const config = {
        file: '//playertest.longtailvideo.com/adaptive/bbbfull/bbbfull.m3u8',
        image: 'http://d3el35u4qe4frz.cloudfront.net/bkaovAYt-480.jpg',
        preload: 'auto'
    };

    let model;

    before(function () {
        model = new Model();
        model.setup(config);
    });

    describe('Setup', function() {
        it('should return an object on setup', function() {
            expect(model).to.be.an('object');
        });

        it('should return an idle state', function() {
            expect(model.get('state')).to.equal('idle');
        });

        it('should attempt to normalize the config', () => {
            let tstModel = new Model();
            const spyFunc = sinon.spy();
            tstModel._normalizeConfig = spyFunc;

            const tstCfg = {test: 'config'};
            tstModel.setup(tstCfg);
            expect(spyFunc.calledWith(tstCfg)).to.be.true;
        });
    });

    describe('#_normalizeConfig', () => {
        it('should leave the floating block untouched when disabled is not true', () => {
            let startingCfg = {
                floating: { disabled: false }
            };
            model._normalizeConfig(startingCfg);
            expect(startingCfg.floating).to.deep.eq({ disabled: false });

            startingCfg = {
                floating: {}
            };
            model._normalizeConfig(startingCfg);
            expect(startingCfg.floating).to.deep.eq({});
        });
        it('should delete the floating block when disabled is true', () => {
            let startingCfg = {
                floating: {disabled: true}
            };
            model._normalizeConfig(startingCfg);
            expect(startingCfg).to.not.have.property('floating');
        });
        it('should not touch the floating block when it is not otherwise present', () => {
            let startingCfg = {};
            model._normalizeConfig(startingCfg);
            expect(startingCfg).to.not.have.property('floating');
        });
    });
});
