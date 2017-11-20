import Model from 'controller/model';
import video from 'mock/video';

const config = {
    volume: 10,
    mediaElement: video,
    mediaContainer: document.createElement('div'),
    mute: false,
    edition: 'enterprise',
};

const item = {
    sources: [
        {
            file: 'foo.mp4',
            type: 'mp4'
        }
    ],
    minDvrWindow: 120
};

const playlist = [item];

describe('Transient Model Properties', function () {
    let model;

    before(function () {
        model = new Model().setup(config);
        model.set('playlist', playlist);
    });

    it('should have the same properties as the config', function() {
        expect(model.get('volume')).to.equal(config.volume);
        expect(model.get('mute')).to.equal(config.mute);
        expect(model.get('edition')).to.equal(config.edition);
    });

    it('should properly load playlist', function() {
        return new Promise(function (resolve, reject) {
            model.setItemIndex(0)
                .then(function () {
                    expect(model.get('item')).to.equal(0, 'item');
                    expect(model.get('playlistItem')).to.equal(playlist[0], 'playlistItem');
                    expect(model.get('state')).to.equal('idle');
                    resolve();
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    });

    it('should set position and position on model and mediaModel', function() {
        expect(model.get('position')).to.equal(0);
        expect(model.get('duration')).to.equal(0);
        expect(model.mediaModel.get('position')).to.equal(0);
        expect(model.mediaModel.get('duration')).to.equal(0);
    });

    it('should set buffer on model and not mediaModel', function() {
        expect(model.get('buffer')).to.equal(0);
        expect(model.mediaModel.get('buffer')).to.be.undefined;
    }); 
});

