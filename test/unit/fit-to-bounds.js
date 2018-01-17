import { fitToBounds } from 'utils/video-fit';

describe(('fitToBounds'), function() {
    it('should return an object containing styles', function() {
        const styles = {
            objectFit: null,
            width: null,
            height: null
        };

        const videoTag = {
            videoWidth: 680,
            videoHeight: 1280
        };

        expect(fitToBounds(videoTag, 400, 600, 'none', styles)).to.have.property('objectFit').which.is.equal.to(null);
        expect(fitToBounds(videoTag, 400, 600, 'none', styles)).to.have.property('left').which.is.equal.to('50%');
        expect(fitToBounds(videoTag, 400, 600, 'none', styles)).to.have.property('top').which.is.equal.to('50%');


        expect(fitToBounds(videoTag, 400, 600, 'none', styles)).to.have.property('width').which.is.equal.to(680);
        expect(fitToBounds(videoTag, 400, 600, 'none', styles)).to.have.property('height').which.is.equal.to(1280);
    });
    });

});
