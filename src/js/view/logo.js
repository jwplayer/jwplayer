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

    var _logo;
    var _settings;
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
            const height = this.height;
            const width = this.width;
            const styles = {
                backgroundImage: 'url("' + this.src + '")',
                width,
                height
            };
            if (_settings.margin !== LogoDefaults.margin) {
                const positions = (/(\w+)-(\w+)/).exec(_settings.position);
                if (positions.length === 3) {
                    styles['margin-' + positions[1]] = _settings.margin;
                    styles['margin-' + positions[2]] = _settings.margin;
                }
            }

            // Constraint logo size to 15% of their respective player dimension
            styles.width = Math.min(width, Math.round(_model.get('containerWidth') / 6.67));
            styles.height = Math.min(height, Math.round( _model.get('containerHeight') / 6.67));

            style(_logo, styles);

            // update title
            _model.set('logoWidth', styles.width);
        };

        _img.src = _settings.file;

        const logoInteractHandler = new UI(_logo);
        logoInteractHandler.on('click tap', function (evt) {
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
