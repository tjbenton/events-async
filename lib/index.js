'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.AsyncEventEmitter = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AsyncEventEmitter = exports.AsyncEventEmitter = function (_EventEmitter) {
	_inherits(AsyncEventEmitter, _EventEmitter);

	function AsyncEventEmitter() {
		_classCallCheck(this, AsyncEventEmitter);

		return _possibleConstructorReturn(this, (AsyncEventEmitter.__proto__ || Object.getPrototypeOf(AsyncEventEmitter)).apply(this, arguments));
	}

	_createClass(AsyncEventEmitter, [{
		key: 'emit',
		value: function emit(type) {
			var _this2 = this;

			var options = {
				series: false,
				catch: false
			};
			var args = [].slice.call(arguments, 1);
			if ((typeof type === 'undefined' ? 'undefined' : _typeof(type)) === 'object') {
				options.series = type.series;
				options.catch = type.catch;
				type = args.shift();
			}

			var events = this._events; // eslint-disable-line

			// Throw for unhandled errors
			if (!options.catch && type === 'error' && (!events || !events.error)) {
				var err = args[0];
				if (err instanceof Error) {
					throw err;
				} else {
					var e = new Error('Uncaught, unspecified \'error\' event. (' + err + ')');
					e.context = err;
					throw e;
				}
			}

			return new Promise(function (resolve, reject) {
				// Throw for unhandled errors
				if (type === 'error' && (!events || !events.error)) {
					var _err = args[0];
					if (_err instanceof Error) {
						reject(_err);
					} else {
						var _e = new Error('Uncaught, unspecified \'error\' event. (' + _err + ')');
						_e.context = _err;
						reject(_e);
					}
				}

				var callbacks = events[type];
				if (!callbacks) {
					return resolve(false);
				}

				// helper function to reuse as much code as possible
				var run = function run(cb) {
					switch (args.length) {
						// fast cases
						case 0:
							cb = cb.call(_this2);
							break;
						case 1:
							cb = cb.call(_this2, args[0]);
							break;
						case 2:
							cb = cb.call(_this2, args[0], args[1]);
							break;
						case 3:
							cb = cb.call(_this2, args[0], args[1], args[2]);
							break;
						// slower
						default:
							cb = cb.apply(_this2, args);
					}

					if (cb && (cb instanceof Promise || typeof cb.then === 'function')) {
						return cb;
					}

					return Promise.resolve(true);
				};

				if (typeof callbacks === 'function') {
					run(callbacks).then(resolve);
				} else if ((typeof callbacks === 'undefined' ? 'undefined' : _typeof(callbacks)) === 'object') {
					callbacks = callbacks.slice().filter(Boolean);
					if (options.series) {
						callbacks.reduce(function (prev, next) {
							return prev.then(function (res) {
								return run(next).then(function (result) {
									return Promise.resolve(res.concat(result));
								});
							});
						}, Promise.resolve([])).then(resolve);
					} else {
						Promise.all(callbacks.map(run)).then(resolve);
					}
				}
			});
		}
	}]);

	return AsyncEventEmitter;
}(_events.EventEmitter);