import { SettingsMenu } from 'view/controls/components/settings/menu';

const noop = () => {};
const genTestElement = (name) => {
    let element = document.createElement('div');
    return {
        name: name,
        element: () => element,
        categoryButtonElement: document.createElement('div'),
        destroy: noop
    };
}

describe('SettingsMenu', () => {
    describe('#addSubmenu', () => {
        it('causes the settings button to show properly', () => {
            let showSpy = sinon.spy();
            let hideSpy = sinon.spy();
            let menu = SettingsMenu(noop, {
                show: showSpy,
                hide: hideSpy
            }, {});

            menu.addSubmenu(genTestElement('test'));

            expect(showSpy.called).to.be.true;
        });
    });
    describe('#removeSubmenu', () => {
        describe('with more than 1 menu left', () => {
            it('does not hide the settings menu', () => {
                let showSpy = sinon.spy();
                let hideSpy = sinon.spy();
                let menu = SettingsMenu(noop, {
                    show: showSpy,
                    hide: hideSpy
                }, {});

                menu.addSubmenu(genTestElement('testOne'));
                menu.addSubmenu(genTestElement('testTwo'));
                menu.addSubmenu(genTestElement('testThree'));

                showSpy.resetHistory();
                hideSpy.resetHistory();

                menu.removeSubmenu('testThree');
                expect(showSpy.called).to.be.false;
                expect(hideSpy.called).to.be.false;
            });
        });
        describe('with no menus left', () => {
            it('causes the settings button to hide properly', () => {
                let showSpy = sinon.spy();
                let hideSpy = sinon.spy();
                let menu = SettingsMenu(noop, {
                    show: showSpy,
                    hide: hideSpy
                }, {});

                menu.addSubmenu(genTestElement('testOne'));

                showSpy.resetHistory();
                hideSpy.resetHistory();

                menu.removeSubmenu('testOne');
                expect(showSpy.called).to.be.false;
                expect(hideSpy.called).to.be.true;
            });
        });
    });
});
