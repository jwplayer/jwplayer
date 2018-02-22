import { MediaModel } from 'controller/model';

describe('mediaModel', function() {
    let mediaModel;
    beforeEach(function () {
        mediaModel = new MediaModel();
    });

    describe('srcReset', function () {
       it('resets certain mediaModel properties to their defaults', function () {
            mediaModel.srcReset();
            expect(mediaModel.attributes.setup).to.equal(false);
            expect(mediaModel.attributes.started).to.equal(false);
            expect(mediaModel.attributes.preloaded).to.equal(false);
            expect(mediaModel.attributes.visualQuality).to.equal(null);
            expect(mediaModel.attributes.buffer).to.equal(0);
            expect(mediaModel.attributes.currentTime).to.equal(0);
       });

       it('does not reset position or duration', function () {
           mediaModel.attributes.position = 10;
           mediaModel.attributes.duration = 30;
           mediaModel.srcReset();
           expect(mediaModel.attributes.position).to.equal(10);
           expect(mediaModel.attributes.duration).to.equal(30);
       });
    });
});
