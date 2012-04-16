/**
 * jwplayer.html5.utils.animations
 * Class for creating and managing visual transitions and effects
 *
 * @author pablo
 * @version 6.0
 */
(function(utils) {
	utils.animations = function(element, property, from, to, duration, easing) {
		var _element, 
			_property,
			_from,
			_to,
			_duration,
			_ease,
			_units,
			_self;
		
		var _startMS, _currentMS, _lastMS, _currentMS, _interval;
		
		function _init() {
			_ease = easing ? easing : utils.animations.easing.quint.easeOut;
			_element = element;
			_property = property;
			
			if (_element.id && !utils.animations.active[_element.id]) {
				utils.animations.active[_element.id] = {};
			}
			
			if (isNaN(from)) {
				if (from.indexOf("%") > 0) {
					_units = "%";
				} else if (from.indexOf("px")) {
					_units = "px";
				}
				_from = parseFloat(from.replace(_units, ""));
				_to = parseFloat(to.replace(_units, ""));
			} else {
				_units = "";
				_from = parseFloat(from);
				_to = parseFloat(to);
			}
			
			_duration = parseFloat(duration);
			this.id = Math.random();
		}

		
		
		this.start = function() {
			if (_element.id) {
				if (utils.animations.active[_element.id][_property] && utils.animations.active[_element.id][_property] != _self) {
					utils.animations.active[_element.id][_property].stop();
					newFrom = parseFloat(_element.style[_property].toString().replace(_units, ""));
					_currentMS = _duration * (_from / newFrom);
				}
				utils.animations.active[_element.id][_property] = _self;
			}
			
			if (_interval) {
				clearInterval(_interval);
			}
			_lastMS = (new Date()).valueOf();
			_tick();
			_interval = setInterval(_tick, utils.animations.INTERVAL_SPEED);
		};
		
		this.stop = function() {
			clearInterval(_interval);
			if (_element.id) {
				utils.animations.active[_element.id][_property] = null;
			}
		}

		function _tick() {
			_currentMS = (new Date()).valueOf();
			if (_currentMS - _lastMS >= _duration) {
				_complete();
				return;
			}
			value = _ease((_currentMS - _lastMS) , 0, 1, _duration);
			_execute(value);
		}
		
		function _complete() {
			_execute(1);
			_self.stop();
		}
		
		function _execute(value) {
			var val = (_from + (_to - _from) * value);
			_element.style[_property] = val + _units;
		}
		
		_self = this;
		_init();
	};

	utils.animations.INTERVAL_SPEED = 10;
	
	utils.animations.easing = {};
	
	utils.animations.easing.quint = {
		easeIn: function(t, b, c, d) {
			return c*(t/=d)*t*t*t*t + b;
		},
		easeOut: function(t, b, c, d) {
			return c*((t=t/d-1)*t*t*t*t + 1) + b;
		},
		easeInOut: function(t, b, c, d) {
			if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
			return c/2*((t-=2)*t*t*t*t + 2) + b;
		}
	};

	utils.animations.easing.linear = {
		easeIn: function(t, b, c, d) {
			return c*t/d + b;
		},
		easeOut: function(t, b, c, d) {
			return c*t/d + b;
		},
		easeInOut: function(t, b, c, d) {
			return c*t/d + b;
		}
	};
	
	utils.animations.active = {};

	utils.animations.fadeIn = function(element, duration, easing) {
		var anim = new utils.animations(element, "opacity", 0, 1, duration, easing);
		anim.start();
	}

	utils.animations.fadeOut = function(element, duration, easing) {
		var anim = new utils.animations(element, "opacity", 1, 0, duration, easing);
		anim.start();
	}

	utils.animations.transform = function(element, fromX, fromY, toX, toY, duration, easing) {
		var horiz = new utils.animations(element, "left", fromX, toX, duration, easing);
		var vert = new utils.animations(element, "top", fromY, toY, duration, easing);
		horiz.start();
		vert.start();
	}
	
})(jwplayer.html5.utils);

