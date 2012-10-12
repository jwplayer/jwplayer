/**
 * JW Player HTML5 overlay component
 * 
 * @author pablo
 * @version 6.0
 */
(function(jwplayer) {
	
	var html5 = jwplayer.html5,
		utils = jwplayer.utils,
		_css = utils.css,
		
		MENU_CLASS = 'jwmenu',
		OPTION_CLASS = 'jwoption',
		UNDEFINED = undefined,
		WHITE = '#ffffff',
		CCC = '#cccccc';
	
	/** HTML5 Overlay class **/
	html5.menu = function(name, id, skin, changeHandler) {
		var _skin = skin,
			_name = name,
			_id = id,
			_changeHandler = changeHandler,
			_overlay = new html5.overlay(_id+"_overlay", skin),
			_settings = utils.extend({
				fontcase: UNDEFINED,
				fontcolor: CCC,
				fontsize: 11,
				fontweight: UNDEFINED,
				activecolor: WHITE,
				overcolor: WHITE
			}, skin.getComponentSettings('tooltip')),
			_container,
			_options = [];
		
		function _init() {
			_container = _createElement(MENU_CLASS);
			_container.id = _id;
			
			var top = _getSkinElement('menuTop'+name),
				menuOption = _getSkinElement('menuOption'),
				menuOptionOver = _getSkinElement('menuOptionOver'),
				menuOptionActive = _getSkinElement('menuOptionActive');

			if (top) {
				_container.appendChild(top.image);
			}
			
			if (menuOption) {
				var selector = '#'+id+' .'+OPTION_CLASS;
				_css(selector, {
					'background-image': menuOption.src,
					height: menuOption.height,
					color: _settings.fontcolor,
					'padding-left': menuOption.width,
					font: _settings.fontweight + " " + _settings.fontsize + "px Arial,Helvetica,sans-serif",
					'line-height': menuOption.height,
					'text-transform': (_settings.fontcase == "upper") ? "uppercase" : UNDEFINED 
				});
				_css(selector+":hover", {
					'background-image': menuOptionOver.src ? menuOptionOver.src : UNDEFINED,
					color: _settings.overcolor
				});
				_css(selector+".active", {
					'background-image': menuOptionActive.src ? menuOptionActive.src : UNDEFINED,
					color: _settings.activecolor
				});
			}
			_overlay.setContents(_container);
		}
		
		this.element = function() {
			return _overlay.element();
		};
		
		this.addOption = function(label, value) {
			var option = _createElement(OPTION_CLASS, _container);
			option.id = _id+"_option_"+value;
			option.innerHTML = label;
			option.addEventListener('click', _clickHandler(_options.length, value));
			_options.push(option);
		}
		
		function _clickHandler(index, value) {
			return function() {
				_setActive(index);
				if (_changeHandler) _changeHandler(value);
			}
		}
		
		this.clearOptions = function() {
			while(_options.length > 0) {
				_container.removeChild(_options.pop());
			}
		}

		var _setActive = this.setActive = function(index) {
			for (var i = 0; i < _options.length; i++) {
				var option = _options[i];
				option.className = option.className.replace(" active", "");
				if (i == index) option.className += " active";
			}
		}
		

		function _createElement(className, parent) {
			var elem = document.createElement("div");
			if (className) elem.className = className;
			if (parent) parent.appendChild(elem);
			return elem;
		}
		
		function _getSkinElement(name) {
			var elem = skin.getSkinElement('tooltip', name);
			return elem ? elem : { width: 0, height: 0, src: UNDEFINED };
		}

		this.show = _overlay.show;
		this.hide = _overlay.hide;
		this.offsetX = _overlay.offsetX;
		
		_init();
	}
	
	function _class(className) {
		return "." + className.replace(/ /g, " .");
	}
	
	_css(_class(MENU_CLASS + ' ' + OPTION_CLASS), {
		'background-repeat': "no-repeat",
		cursor: "pointer",
		position: "relative"
	});
	

})(jwplayer);