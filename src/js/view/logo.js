import logoTemplate from 'templates/logo';
import { LOGO_CLICK } from 'events/events';
import UI from 'utils/ui';
import { style } from 'utils/css';
import { createElement } from 'utils/dom';
import Events from 'utils/backbone.events';

const LogoDefaults = {
    linktarget: '_blank',
    margin: 8,
    hide: false,
    position: 'top-right'
};

export default function Logo(_model) {
    Object.assign(this, Events);

    let _logo;
    let _settings;
    const _img = new Image();

    this.setup = function() {
        _settings = Object.assign({}, LogoDefaults, _model.get('logo'));
        _settings.position = _settings.position || LogoDefaults.position;
        _settings.hide = (_settings.hide.toString() === 'true');

        // We should only create a logo in the display container when
        // it is not supposed to be in the control bar, as it will
        // handle the creation in that case
        if (!_settings.file || _settings.position === 'control-bar') {
            return;
        }

        if (!_logo) {
            _logo = createElement(logoTemplate(_settings.position, _settings.hide));
        }

        _model.set('logo', _settings);

        // apply styles onload when image width and height are known
        _img.onload = function () {
            // update logo style
            let height = this.height;
            let width = this.width;
            const styles = {
                backgroundImage: 'url("' + this.src + '")'
            };
            if (_settings.margin !== LogoDefaults.margin) {
                const positions = (/(\w+)-(\w+)/).exec(_settings.position);
                if (positions.length === 3) {
                    styles['margin-' + positions[1]] = _settings.margin;
                    styles['margin-' + positions[2]] = _settings.margin;
                }
            }

            // Constraint logo size to 15% of their respective player dimension
            const maxHeight = _model.get('containerHeight') * 0.15;
            const maxWidth = _model.get('containerWidth') * 0.15;

            if (height > maxHeight || width > maxWidth) {
                const logoAR = width / height;
                const videoAR = maxWidth / maxHeight;

                if (videoAR > logoAR) {
                    // height = max dimension
                    height = maxHeight;
                    width = maxHeight * logoAR;
                } else {
                    // width = max dimension
                    width = maxWidth;
                    height = maxWidth / logoAR;
                }
            }

            styles.width = Math.round(width);
            styles.height = Math.round(height);

            style(_logo, styles);

            // update title
            _model.set('logoWidth', styles.width);
        };

        _img.src = _settings.file;

        if (_settings.link) {
            _logo.setAttribute('tabindex', '0');
            _logo.setAttribute('aria-label', 'Logo');
        }

        this.ui = new UI(_logo).on('click tap enter', function (evt) {
            if (evt && evt.stopPropagation) {
                evt.stopPropagation();
            }

            this.trigger(LOGO_CLICK, {
                link: _settings.link,
                linktarget: _settings.linktarget
            });

        }, this);
    };

    this.setContainer = function(container) {
        if (_logo) {
            container.appendChild(_logo);
        }
    };

    this.element = function() {
        return _logo;
    };

    this.position = function() {
        return _settings.position;
    };

    this.destroy = function() {
        _img.onload = null;
    };
}
