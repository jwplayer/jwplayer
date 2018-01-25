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
    });
});
