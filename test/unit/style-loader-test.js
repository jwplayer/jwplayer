import styleLoader from 'simple-style-loader/addStyles';

describe('style-loader-test', function() {
    beforeEach(function() {
        this.playerIds = [];
        this.style = (list, playerId) => {
            this.playerIds.push(playerId);
            return styleLoader.style(list, playerId);
        };

        this.getStyle = (playerId) => document.querySelector(`[data-jwplayer-id="${playerId}"]`);
        this.clear = (playerId) => {
            const index = this.playerIds.indexOf(playerId);

            if (index !== -1) {
                this.playerIds.splice(index, 1);
            }

            return styleLoader.clear(playerId);
        };
    });
    afterEach(function() {
        this.playerIds.forEach((playerId) => {
            styleLoader.clear(playerId);
        });
    });

    it('cssUtils.css creates a new style tag if one for the playerId does not exist', function() {
        const countBeforeCall = document.getElementsByTagName('style').length;
        this.style([['#div1', '#div1{color: cyan;}']], 'style-loader-test-1');
        const countAfterCall = document.getElementsByTagName('style').length;
        expect(countBeforeCall + 1).to.equal(countAfterCall);
    });

    it('cssUtils.css adds player styles to style element unique to the playerId', function() {
        this.style([['#div1', '#div1{color: red;}']], 'style-loader-test-2');
        const actual = this.getStyle('style-loader-test-2');
        expect(actual.innerHTML.indexOf('#div1{color: red;}')).to.not.equal(-1);

        this.style([['#div2', '#div2{color: blue;}']], 'style-loader-test-2');
        expect(actual.innerHTML.indexOf('#div2{color: blue;}')).to.not.equal(-1, 'adds to existing style tag');
    });

    it('cssUtils.css replaces styles of the selector when it already exists', function() {
        this.style([['#div1', '#div1{color: green;}']], 'style-loader-test-3');

        const actual = this.getStyle('style-loader-test-3');
        expect(actual.innerHTML.indexOf('#div1{color: green;}')).to.not.equal(-1);

        this.style([['#div1', '#div1{color: rebeccapurple;}']], 'style-loader-test-3');

        expect(actual.innerHTML.indexOf('#div1{color: green;}')).to.equal(-1);
        expect(actual.innerHTML.indexOf('#div1{color: rebeccapurple;}')).to.not.equal(-1);
    });

    it('cssUtils.clear clears the style tag but does not remove it', function() {
        this.style([['#div1', '#div1{color: magenta;}']], 'style-loader-test-4');

        const actual = this.getStyle('style-loader-test-4');
        expect(actual.innerHTML.indexOf('#div1{color: magenta;}')).to.not.equal(-1);

        this.clear('style-loader-test-4');
        expect(actual.innerHTML.length).to.equal(0);
    });
});
