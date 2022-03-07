import ViewModel from 'view/view-model';
import Model from 'controller/model';
import * as Browser from 'utils/browser';

describe('View', function() {
    it('switches orientation to landscape in fullscreen on android', function() {
        Browser.isAndroid.mock_ = true;
        const model = new Model();
        const viewModel = new ViewModel(model);

        viewModel.set('fullscreen', true);
        expect(viewModel.get('fullscreen')).to.equal(true);
        expect(screen.orientation.type).to.equal('landscape-primary');
        Browser.isAndroid.mock_ = null;
    });
});
