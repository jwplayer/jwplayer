import Model from 'controller/model';

describe('Model', function() {

    let model;

    beforeEach(function() {
        model = new Model();
    });

    describe('setMute', function() {

        it('should be mute when un-muted and toggled', function () {
            model.attributes.mute = false;

            model.setMute();
            expect(model.attributes.mute).to.be.true;
        });

        it('should be un-mute when muted and toggled', function () {
            model.attributes.mute = true;

            model.setMute();
            expect(model.attributes.mute).to.be.false;
        });

        it('should stay muted when muting but is already muted', function () {
            model.attributes.mute = true;

            model.setMute(true);
            expect(model.attributes.mute).to.be.true;
        });

        it('should mute when muting', function () {
            model.attributes.mute = false;

            model.setMute(true);
            expect(model.attributes.mute).to.be.true;
        });

        it('should stay un-muted when un-muting but is already un-muted', function () {
            model.attributes.mute = false;

            model.setMute(false);
            expect(model.attributes.mute).to.be.false;
        });

        it('should un-mute when un-muting', function () {
            model.attributes.mute = true;

            model.setMute(false);
            expect(model.attributes.mute).to.be.false;
        });

        it('should stay muted on autostart when muting', function () {
            model.attributes.autostartMuted = true;

            model.setMute(true);
            expect(model.attributes.autostartMuted).to.be.true;
        });

        it('should be un-muted on autostart when un-muting', function () {
            model.attributes.autostartMuted = true;

            model.setMute(false);
            expect(model.attributes.autostartMuted).to.be.false;
        });

        it('should reset volume un-muting and greater than 10', function () {
            model.attributes.volume = 50;

            model.setMute(false);
            expect(model.attributes.autostartMuted).to.be.false;
        });

        it('should volume to 10 when un-muting and less than 10', function () {
            model.attributes.volume = 50;

            model.setMute(false);
            expect(model.attributes.autostartMuted).to.be.false;
        });
    });

    describe('getMute', function() {

        it('should be muted when muted on autostart', function () {
            model.attributes.autostartMuted = true;
            model.attributes.mute = false;

            expect(model.getMute()).to.be.true;
        });

        it('should be muted when muted after autostart', function () {
            model.attributes.autostartMuted = false;
            model.attributes.mute = true;

            expect(model.getMute()).to.be.true;
        });

        it('should stay un-muted when un-muted on autostart', function () {
            model.attributes.autostartMuted = true;
            model.attributes.mute = true;

            expect(model.getMute()).to.be.true;
        });
    });
});
