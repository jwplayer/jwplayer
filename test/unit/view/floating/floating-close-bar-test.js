import MockModel from 'mock/mock-model';
import Controls from 'view/controls/controls';
import MockApi from 'mock/mock-api'


describe('FloatingCloseBar', () => {
    describe('floating showTitle', () => {
        it('setup floating close button without title', () => {
            const mockModel = new MockModel();
            mockModel.set('floating', {});
            mockModel.set('localization', {close: 'close'});
            mockModel.set('playlistItem', {title: ''});
            mockModel.set('advertising', {});
            const mockApi = new MockApi();

            const parentDiv = document.createElement('div');
            const containerDiv = document.createElement('div');
            parentDiv.appendChild(containerDiv);
            containerDiv.classList.add('jw-wrapper');

            const controls = new Controls(document, parentDiv);
            controls.setupFloating(mockApi, mockModel);
            const floatIcon = containerDiv.querySelector('.jw-float-bar-icon');
            const title = containerDiv.querySelector('.jw-float-bar-title');
    
            expect(floatIcon).to.be.instanceof(HTMLButtonElement);
            expect(floatIcon.getAttribute('aria-label')).to.equal('close');
            expect(title).to.be.instanceof(HTMLDivElement);
            expect(title.innerHTML).to.equal(' ');
        });
        it('setup floating close button with title', () => {
            const mockModel = new MockModel();
            mockModel.set('floating', {showTitle: true});
            mockModel.set('localization', {close: 'close'});
            mockModel.set('playlistItem', {title: 'test title'});
            const mockApi = new MockApi();
    
            const parentDiv = document.createElement('div');
            const containerDiv = document.createElement('div');
            parentDiv.appendChild(containerDiv);
            containerDiv.classList.add('jw-wrapper');

            const controls = new Controls(document, parentDiv);
            controls.setupFloating(mockApi, mockModel);
            const floatIcon = containerDiv.querySelector('.jw-float-bar-icon');
            const title = containerDiv.querySelector('.jw-float-bar-title');
    
            expect(floatIcon.getAttribute('aria-label')).to.equal('close');
            expect(floatIcon).to.be.instanceof(HTMLButtonElement);
            expect(title).to.be.instanceof(HTMLDivElement);
            expect(title.innerHTML).to.equal('test title');
            expect(title.getAttribute('aria-label')).to.equal('test title');
        });
    });
});
