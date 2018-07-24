import { genId, FEED_SHOWN_ID_LENGTH } from 'utils/random-id-generator';

describe('Random id generation', () => {
    describe('feed shown id generation', () => {
        const ids = [];
        for (let i = 0; i < 10; i++) {
            ids.push(genId(FEED_SHOWN_ID_LENGTH));
        }

        it('should always be 12 characters long', () => {
            ids.forEach((id) => {
                expect(id.length).to.equal(FEED_SHOWN_ID_LENGTH);
            });
        });

        it('should always return a different id', () => {
            for (let i = 0; i < ids.length; i++) {
                for (let k = i + 1; k < ids.length; k++) {
                    expect(ids[i]).to.not.equal(ids[k]);
                }
            }
        });

        it('should be alpha numeric', () => {
            ids.forEach((id) => {
                expect(/^[a-z0-9]+$/i.test(id)).to.be.true;
            });
        });

    });
});