import { parseID3 } from 'providers/utils/id3Parser';

function mockCue(value) {
    return {
        value
    }
}

describe('id3Parser', function() {
    describe('parseID3', function() {
        describe('friendly names', function() {
            it('converts TIT2 key to title', function() {
                let cue = mockCue({
                    key: 'TIT2'
                });
                const parsedCue = parseID3(cue);
                expect(parsedCue).to.contain.keys('title');
            });

            it('converts TT2 key to title', function() {
                let cue = mockCue({
                    key: 'TT2'
                });
                const parsedCue = parseID3(cue);
                expect(parsedCue).to.contain.keys('title');
            });

            it('converts WXXX key to url', function() {
                let cue = mockCue({
                    key: 'WXXX'
                });
                const parsedCue = parseID3(cue);
                expect(parsedCue).to.contain.keys('url');
            });

            it('converts TPE1 key to artist', function() {
                let cue = mockCue({
                    key: 'TPE1'
                });
                const parsedCue = parseID3(cue);
                expect(parsedCue).to.contain.keys('artist');
            });

            it('converts TP1 key to artist', function() {
                let cue = mockCue({
                    key: 'TP1'
                });
                const parsedCue = parseID3(cue);
                expect(parsedCue).to.contain.keys('artist');
            });

            it('converts TALB key to album', function() {
                let cue = mockCue({
                    key: 'TALB'
                });
                const parsedCue = parseID3(cue);
                expect(parsedCue).to.contain.keys('album');
            });

            it('converts TAL key to album', function() {
                let cue = mockCue({
                    key: 'TAL'
                });
                const parsedCue = parseID3(cue);
                expect(parsedCue).to.contain.keys('album');
            });
    
            it('keeps cue key if friendly name does not exist', function() {
                const key = 'foo';
                const cue = mockCue({
                    key
                });
    
                const parsedCue = parseID3(cue);
                expect(parsedCue).to.contain.keys(cue.value.key);
            });
        });

        it('sets the cue key to an object with the cue info as a key and the cue data as a value', function() {
            const key = 'foo';
            const data = 'bar';
            const cue = mockCue({
                key,
                data
            });

            const parsedCue = parseID3(cue);
            expect(parsedCue).to.contain.keys(cue.value.key);
            expect(parsedCue[key]).to.equal(cue.value.data);
        });

        it('sets the cue key to the cue data if no cue info exists', function() {
            const key = 'foo';
            const data = 'bar';
            const info = 'baz';
            const cue = mockCue({
                key,
                data,
                info
            });

            const parsedCue = parseID3(cue);
            expect(parsedCue).to.contain.keys(cue.value.key);
            expect(parsedCue[key]).to.contain.keys(cue.value.info);
            expect(parsedCue[key][info]).to.equal(cue.value.data);
        });
    });
});
