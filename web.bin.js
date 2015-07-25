/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	/* eslint-env browser */
	/* global ace, Viz, jsyaml */
	
	var lib = __webpack_require__(1),
	    debounce = __webpack_require__(44);
	
	var editor = ace.edit("editor");
	editor.setTheme("ace/theme/monokai");
	editor.getSession().setMode("ace/mode/yaml");
	
	function redraw() {
	    console.log("redraw");
	    var json = {};
	    try {
	        json = jsyaml.safeLoad(editor.getValue());
	    } catch (e) {
	        console.log("Error reading YAML");
	    }
	    /* eslint new-cap: 0 */
	    document.getElementById("diagram").innerHTML = Viz(lib.getDotSrc(json).join("\n"), "svg");
	}
	
	redraw();
	
	editor.getSession().on('change', debounce(redraw, 200));

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var R = {
	    partial: __webpack_require__(9),
	    map: __webpack_require__(16),
	    sortBy: __webpack_require__(23),
	    keys: __webpack_require__(24),
	    mapObjIndexed: __webpack_require__(26),
	    concat: __webpack_require__(31),
	    values: __webpack_require__(33),
	    assocPath: __webpack_require__(2),
	    reduce: __webpack_require__(34),
	    slice: __webpack_require__(35),
	    path: __webpack_require__(37),
	    defaultTo: __webpack_require__(39),
	    join: __webpack_require__(40),
	    flatten: __webpack_require__(42)
	};
	
	function writeSubGraphField(tablename, fieldname) {
	    return "<" + tablename + "__" + fieldname + ">" + fieldname;
	}
	
	function writeTable(tabledata, tablename) {
	    var lines = ["subgraph cluster" + tablename + " {"];
	    var fields = R.join("|", R.map(R.partial(writeSubGraphField, tablename), R.sortBy(function (n) {
	        if (n == 'id') {
	            return 'a' + n;
	        }
	        return 'b' + n;
	    }, R.keys(tabledata))));
	    lines.push('  label = "' + tablename + '";');
	    lines.push('  struct' + tablename + ' [label="{' + fields + '}",shape=record];');
	    lines.push("}");
	    return lines;
	}
	
	function findLinks(struct) {
	    var r = [];
	    R.mapObjIndexed(function (table, tablename) {
	        return R.mapObjIndexed(function (field, fieldname) {
	            var l;
	            if (field && field.hasOwnProperty('link')) {
	                l = field.link.split(".");
	                if (l.length < 2) {
	                    l.push("id");
	                }
	                r.push(R.concat([tablename, fieldname], l));
	            }
	        }, table);
	    }, struct);
	    return r;
	}
	
	function addLinkFields(struct) {
	    var links = findLinks(struct);
	    return R.reduce(function (myStruct, link) {
	        return R.assocPath(R.slice(2, 4, link), R.defaultTo(null, R.path(R.slice(2, 4, link), myStruct)), myStruct);
	    }, struct, links);
	}
	
	function writeLink(linkSpec) {
	    return R.join(' -> ', [R.join(':', ['struct' + linkSpec[0], linkSpec[0] + '__' + linkSpec[1]]), R.join(':', ['struct' + linkSpec[2], linkSpec[2] + '__' + linkSpec[3]])]);
	}
	
	function getDotSrc(struct) {
	    var finalStruct = addLinkFields(struct);
	    // console.log(
	    // R.map(writeLink, findLinks(finalStruct))
	    // );
	    return R.flatten(['digraph db {', R.values(R.mapObjIndexed(writeTable, finalStruct)), R.map(writeLink, findLinks(finalStruct)), '}']);
	}
	
	module.exports = {
	    writeTable: writeTable,
	    addLinkFields: addLinkFields,
	    findLinks: findLinks,
	    writeLink: writeLink,
	    getDotSrc: getDotSrc
	};

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _assocPath = __webpack_require__(3);
	var _curry3 = __webpack_require__(6);
	
	/**
	 * Makes a shallow clone of an object, setting or overriding the nodes
	 * required to create the given path, and placing the specific value at the
	 * tail end of that path.  Note that this copies and flattens prototype
	 * properties onto the new object as well.  All non-primitive properties
	 * are copied by reference.
	 *
	 * @func
	 * @memberOf R
	 * @category Object
	 * @sig [String] -> a -> {k: v} -> {k: v}
	 * @param {Array} path the path to set
	 * @param {*} val the new value
	 * @param {Object} obj the object to clone
	 * @return {Object} a new object similar to the original except along the specified path.
	 * @example
	 *
	 *      R.assocPath(['a', 'b', 'c'], 42, {a: {b: {c: 0}}}); //=> {a: {b: {c: 42}}}
	 */
	module.exports = _curry3(_assocPath);

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _assoc = __webpack_require__(4);
	var _slice = __webpack_require__(5);
	
	module.exports = function _assocPath(path, val, obj) {
	  switch (path.length) {
	    case 0:
	      return obj;
	    case 1:
	      return _assoc(path[0], val, obj);
	    default:
	      return _assoc(path[0], _assocPath(_slice(path, 1), val, Object(obj[path[0]])), obj);
	  }
	};

/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function _assoc(prop, val, obj) {
	  var result = {};
	  for (var p in obj) {
	    result[p] = obj[p];
	  }
	  result[prop] = val;
	  return result;
	};

/***/ },
/* 5 */
/***/ function(module, exports) {

	/**
	 * An optimized, private array `slice` implementation.
	 *
	 * @private
	 * @param {Arguments|Array} args The array or arguments object to consider.
	 * @param {Number} [from=0] The array index to slice from, inclusive.
	 * @param {Number} [to=args.length] The array index to slice to, exclusive.
	 * @return {Array} A new, sliced array.
	 * @example
	 *
	 *      _slice([1, 2, 3, 4, 5], 1, 3); //=> [2, 3]
	 *
	 *      var firstThreeArgs = function(a, b, c, d) {
	 *        return _slice(arguments, 0, 3);
	 *      };
	 *      firstThreeArgs(1, 2, 3, 4); //=> [1, 2, 3]
	 */
	"use strict";
	
	module.exports = function _slice(_x, _x2, _x3) {
	  var _arguments = arguments;
	  var _again = true;
	
	  _function: while (_again) {
	    var args = _x,
	        from = _x2,
	        to = _x3;
	    list = idx = len = undefined;
	    _again = false;
	
	    switch (_arguments.length) {
	      case 1:
	        _arguments = [_x = args, _x2 = 0, _x3 = args.length];
	        _again = true;
	        continue _function;
	
	      case 2:
	        _arguments = [_x = args, _x2 = from, _x3 = args.length];
	        _again = true;
	        continue _function;
	
	      default:
	        var list = [];
	        var idx = 0;
	        var len = Math.max(0, Math.min(args.length, to) - from);
	        while (idx < len) {
	          list[idx] = args[from + idx];
	          idx += 1;
	        }
	        return list;
	    }
	  }
	};

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(7);
	var _curry2 = __webpack_require__(8);
	
	/**
	 * Optimized internal three-arity curry function.
	 *
	 * @private
	 * @category Function
	 * @param {Function} fn The function to curry.
	 * @return {Function} The curried function.
	 */
	module.exports = function _curry3(fn) {
	  return function f3(a, b, c) {
	    var n = arguments.length;
	    if (n === 0) {
	      return f3;
	    } else if (n === 1 && a != null && a['@@functional/placeholder'] === true) {
	      return f3;
	    } else if (n === 1) {
	      return _curry2(function (b, c) {
	        return fn(a, b, c);
	      });
	    } else if (n === 2 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
	      return f3;
	    } else if (n === 2 && a != null && a['@@functional/placeholder'] === true) {
	      return _curry2(function (a, c) {
	        return fn(a, b, c);
	      });
	    } else if (n === 2 && b != null && b['@@functional/placeholder'] === true) {
	      return _curry2(function (b, c) {
	        return fn(a, b, c);
	      });
	    } else if (n === 2) {
	      return _curry1(function (c) {
	        return fn(a, b, c);
	      });
	    } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
	      return f3;
	    } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
	      return _curry2(function (a, b) {
	        return fn(a, b, c);
	      });
	    } else if (n === 3 && a != null && a['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
	      return _curry2(function (a, c) {
	        return fn(a, b, c);
	      });
	    } else if (n === 3 && b != null && b['@@functional/placeholder'] === true && c != null && c['@@functional/placeholder'] === true) {
	      return _curry2(function (b, c) {
	        return fn(a, b, c);
	      });
	    } else if (n === 3 && a != null && a['@@functional/placeholder'] === true) {
	      return _curry1(function (a) {
	        return fn(a, b, c);
	      });
	    } else if (n === 3 && b != null && b['@@functional/placeholder'] === true) {
	      return _curry1(function (b) {
	        return fn(a, b, c);
	      });
	    } else if (n === 3 && c != null && c['@@functional/placeholder'] === true) {
	      return _curry1(function (c) {
	        return fn(a, b, c);
	      });
	    } else {
	      return fn(a, b, c);
	    }
	  };
	};

/***/ },
/* 7 */
/***/ function(module, exports) {

	/**
	 * Optimized internal two-arity curry function.
	 *
	 * @private
	 * @category Function
	 * @param {Function} fn The function to curry.
	 * @return {Function} The curried function.
	 */
	'use strict';
	
	module.exports = function _curry1(fn) {
	  return function f1(a) {
	    if (arguments.length === 0) {
	      return f1;
	    } else if (a != null && a['@@functional/placeholder'] === true) {
	      return f1;
	    } else {
	      return fn(a);
	    }
	  };
	};

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(7);
	
	/**
	 * Optimized internal two-arity curry function.
	 *
	 * @private
	 * @category Function
	 * @param {Function} fn The function to curry.
	 * @return {Function} The curried function.
	 */
	module.exports = function _curry2(fn) {
	  return function f2(a, b) {
	    var n = arguments.length;
	    if (n === 0) {
	      return f2;
	    } else if (n === 1 && a != null && a['@@functional/placeholder'] === true) {
	      return f2;
	    } else if (n === 1) {
	      return _curry1(function (b) {
	        return fn(a, b);
	      });
	    } else if (n === 2 && a != null && a['@@functional/placeholder'] === true && b != null && b['@@functional/placeholder'] === true) {
	      return f2;
	    } else if (n === 2 && a != null && a['@@functional/placeholder'] === true) {
	      return _curry1(function (a) {
	        return fn(a, b);
	      });
	    } else if (n === 2 && b != null && b['@@functional/placeholder'] === true) {
	      return _curry1(function (b) {
	        return fn(a, b);
	      });
	    } else {
	      return fn(a, b);
	    }
	  };
	};

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _concat = __webpack_require__(10);
	var _createPartialApplicator = __webpack_require__(11);
	var curry = __webpack_require__(13);
	
	/**
	 * Accepts as its arguments a function and any number of values and returns a function that,
	 * when invoked, calls the original function with all of the values prepended to the
	 * original function's arguments list. In some libraries this function is named `applyLeft`.
	 *
	 * @func
	 * @memberOf R
	 * @category Function
	 * @sig (a -> b -> ... -> i -> j -> ... -> m -> n) -> a -> b-> ... -> i -> (j -> ... -> m -> n)
	 * @param {Function} fn The function to invoke.
	 * @param {...*} [args] Arguments to prepend to `fn` when the returned function is invoked.
	 * @return {Function} A new function wrapping `fn`. When invoked, it will call `fn`
	 *         with `args` prepended to `fn`'s arguments list.
	 * @example
	 *
	 *      var multiply = function(a, b) { return a * b; };
	 *      var double = R.partial(multiply, 2);
	 *      double(2); //=> 4
	 *
	 *      var greet = function(salutation, title, firstName, lastName) {
	 *        return salutation + ', ' + title + ' ' + firstName + ' ' + lastName + '!';
	 *      };
	 *      var sayHello = R.partial(greet, 'Hello');
	 *      var sayHelloToMs = R.partial(sayHello, 'Ms.');
	 *      sayHelloToMs('Jane', 'Jones'); //=> 'Hello, Ms. Jane Jones!'
	 */
	module.exports = curry(_createPartialApplicator(_concat));

/***/ },
/* 10 */
/***/ function(module, exports) {

	/**
	 * Private `concat` function to merge two array-like objects.
	 *
	 * @private
	 * @param {Array|Arguments} [set1=[]] An array-like object.
	 * @param {Array|Arguments} [set2=[]] An array-like object.
	 * @return {Array} A new, merged array.
	 * @example
	 *
	 *      _concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
	 */
	"use strict";
	
	module.exports = function _concat(set1, set2) {
	  set1 = set1 || [];
	  set2 = set2 || [];
	  var idx;
	  var len1 = set1.length;
	  var len2 = set2.length;
	  var result = [];
	
	  idx = 0;
	  while (idx < len1) {
	    result[result.length] = set1[idx];
	    idx += 1;
	  }
	  idx = 0;
	  while (idx < len2) {
	    result[result.length] = set2[idx];
	    idx += 1;
	  }
	  return result;
	};

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _slice = __webpack_require__(5);
	var arity = __webpack_require__(12);
	
	module.exports = function _createPartialApplicator(concat) {
	  return function (fn) {
	    var args = _slice(arguments, 1);
	    return arity(Math.max(0, fn.length - args.length), function () {
	      return fn.apply(this, concat(args, arguments));
	    });
	  };
	};

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(8);
	
	/**
	 * Wraps a function of any arity (including nullary) in a function that accepts exactly `n`
	 * parameters. Unlike `nAry`, which passes only `n` arguments to the wrapped function,
	 * functions produced by `arity` will pass all provided arguments to the wrapped function.
	 *
	 * @func
	 * @memberOf R
	 * @sig (Number, (* -> *)) -> (* -> *)
	 * @category Function
	 * @param {Number} n The desired arity of the returned function.
	 * @param {Function} fn The function to wrap.
	 * @return {Function} A new function wrapping `fn`. The new function is
	 *         guaranteed to be of arity `n`.
	 * @deprecated since v0.15.0
	 * @example
	 *
	 *      var takesTwoArgs = function(a, b) {
	 *        return [a, b];
	 *      };
	 *      takesTwoArgs.length; //=> 2
	 *      takesTwoArgs(1, 2); //=> [1, 2]
	 *
	 *      var takesOneArg = R.arity(1, takesTwoArgs);
	 *      takesOneArg.length; //=> 1
	 *      // All arguments are passed through to the wrapped function
	 *      takesOneArg(1, 2); //=> [1, 2]
	 */
	module.exports = _curry2(function (n, fn) {
	  // jshint unused:vars
	  switch (n) {
	    case 0:
	      return function () {
	        return fn.apply(this, arguments);
	      };
	    case 1:
	      return function (a0) {
	        return fn.apply(this, arguments);
	      };
	    case 2:
	      return function (a0, a1) {
	        return fn.apply(this, arguments);
	      };
	    case 3:
	      return function (a0, a1, a2) {
	        return fn.apply(this, arguments);
	      };
	    case 4:
	      return function (a0, a1, a2, a3) {
	        return fn.apply(this, arguments);
	      };
	    case 5:
	      return function (a0, a1, a2, a3, a4) {
	        return fn.apply(this, arguments);
	      };
	    case 6:
	      return function (a0, a1, a2, a3, a4, a5) {
	        return fn.apply(this, arguments);
	      };
	    case 7:
	      return function (a0, a1, a2, a3, a4, a5, a6) {
	        return fn.apply(this, arguments);
	      };
	    case 8:
	      return function (a0, a1, a2, a3, a4, a5, a6, a7) {
	        return fn.apply(this, arguments);
	      };
	    case 9:
	      return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
	        return fn.apply(this, arguments);
	      };
	    case 10:
	      return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
	        return fn.apply(this, arguments);
	      };
	    default:
	      throw new Error('First argument to arity must be a non-negative integer no greater than ten');
	  }
	});

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(7);
	var curryN = __webpack_require__(14);
	
	/**
	 * Returns a curried equivalent of the provided function. The curried
	 * function has two unusual capabilities. First, its arguments needn't
	 * be provided one at a time. If `f` is a ternary function and `g` is
	 * `R.curry(f)`, the following are equivalent:
	 *
	 *   - `g(1)(2)(3)`
	 *   - `g(1)(2, 3)`
	 *   - `g(1, 2)(3)`
	 *   - `g(1, 2, 3)`
	 *
	 * Secondly, the special placeholder value `R.__` may be used to specify
	 * "gaps", allowing partial application of any combination of arguments,
	 * regardless of their positions. If `g` is as above and `_` is `R.__`,
	 * the following are equivalent:
	 *
	 *   - `g(1, 2, 3)`
	 *   - `g(_, 2, 3)(1)`
	 *   - `g(_, _, 3)(1)(2)`
	 *   - `g(_, _, 3)(1, 2)`
	 *   - `g(_, 2)(1)(3)`
	 *   - `g(_, 2)(1, 3)`
	 *   - `g(_, 2)(_, 3)(1)`
	 *
	 * @func
	 * @memberOf R
	 * @category Function
	 * @sig (* -> a) -> (* -> a)
	 * @param {Function} fn The function to curry.
	 * @return {Function} A new, curried function.
	 * @see R.curryN
	 * @example
	 *
	 *      var addFourNumbers = function(a, b, c, d) {
	 *        return a + b + c + d;
	 *      };
	 *
	 *      var curriedAddFourNumbers = R.curry(addFourNumbers);
	 *      var f = curriedAddFourNumbers(1, 2);
	 *      var g = f(3);
	 *      g(4); //=> 10
	 */
	module.exports = _curry1(function curry(fn) {
	  return curryN(fn.length, fn);
	});

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(8);
	var _curryN = __webpack_require__(15);
	var arity = __webpack_require__(12);
	
	/**
	 * Returns a curried equivalent of the provided function, with the
	 * specified arity. The curried function has two unusual capabilities.
	 * First, its arguments needn't be provided one at a time. If `g` is
	 * `R.curryN(3, f)`, the following are equivalent:
	 *
	 *   - `g(1)(2)(3)`
	 *   - `g(1)(2, 3)`
	 *   - `g(1, 2)(3)`
	 *   - `g(1, 2, 3)`
	 *
	 * Secondly, the special placeholder value `R.__` may be used to specify
	 * "gaps", allowing partial application of any combination of arguments,
	 * regardless of their positions. If `g` is as above and `_` is `R.__`,
	 * the following are equivalent:
	 *
	 *   - `g(1, 2, 3)`
	 *   - `g(_, 2, 3)(1)`
	 *   - `g(_, _, 3)(1)(2)`
	 *   - `g(_, _, 3)(1, 2)`
	 *   - `g(_, 2)(1)(3)`
	 *   - `g(_, 2)(1, 3)`
	 *   - `g(_, 2)(_, 3)(1)`
	 *
	 * @func
	 * @memberOf R
	 * @category Function
	 * @sig Number -> (* -> a) -> (* -> a)
	 * @param {Number} length The arity for the returned function.
	 * @param {Function} fn The function to curry.
	 * @return {Function} A new, curried function.
	 * @see R.curry
	 * @example
	 *
	 *      var addFourNumbers = function() {
	 *        return R.sum([].slice.call(arguments, 0, 4));
	 *      };
	 *
	 *      var curriedAddFourNumbers = R.curryN(4, addFourNumbers);
	 *      var f = curriedAddFourNumbers(1, 2);
	 *      var g = f(3);
	 *      g(4); //=> 10
	 */
	module.exports = _curry2(function curryN(length, fn) {
	  return arity(length, _curryN(length, [], fn));
	});

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var arity = __webpack_require__(12);
	
	/**
	 * Internal curryN function.
	 *
	 * @private
	 * @category Function
	 * @param {Number} length The arity of the curried function.
	 * @return {array} An array of arguments received thus far.
	 * @param {Function} fn The function to curry.
	 */
	module.exports = function _curryN(length, received, fn) {
	  return function () {
	    var combined = [];
	    var argsIdx = 0;
	    var left = length;
	    var combinedIdx = 0;
	    while (combinedIdx < received.length || argsIdx < arguments.length) {
	      var result;
	      if (combinedIdx < received.length && (received[combinedIdx] == null || received[combinedIdx]['@@functional/placeholder'] !== true || argsIdx >= arguments.length)) {
	        result = received[combinedIdx];
	      } else {
	        result = arguments[argsIdx];
	        argsIdx += 1;
	      }
	      combined[combinedIdx] = result;
	      if (result == null || result['@@functional/placeholder'] !== true) {
	        left -= 1;
	      }
	      combinedIdx += 1;
	    }
	    return left <= 0 ? fn.apply(this, combined) : arity(left, _curryN(length, combined, fn));
	  };
	};

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(8);
	var _dispatchable = __webpack_require__(17);
	var _map = __webpack_require__(20);
	var _xmap = __webpack_require__(21);
	
	/**
	 * Returns a new list, constructed by applying the supplied function to every element of the
	 * supplied list.
	 *
	 * Note: `R.map` does not skip deleted or unassigned indices (sparse arrays), unlike the
	 * native `Array.prototype.map` method. For more details on this behavior, see:
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map#Description
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 * @see R.transduce
	 *
	 * @func
	 * @memberOf R
	 * @category List
	 * @sig (a -> b) -> [a] -> [b]
	 * @param {Function} fn The function to be called on every element of the input `list`.
	 * @param {Array} list The list to be iterated over.
	 * @return {Array} The new list.
	 * @example
	 *
	 *      var double = function(x) {
	 *        return x * 2;
	 *      };
	 *
	 *      R.map(double, [1, 2, 3]); //=> [2, 4, 6]
	 */
	module.exports = _curry2(_dispatchable('map', _xmap, _map));

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _isArray = __webpack_require__(18);
	var _isTransformer = __webpack_require__(19);
	var _slice = __webpack_require__(5);
	
	/**
	 * Returns a function that dispatches with different strategies based on the
	 * object in list position (last argument). If it is an array, executes [fn].
	 * Otherwise, if it has a  function with [methodname], it will execute that
	 * function (functor case). Otherwise, if it is a transformer, uses transducer
	 * [xf] to return a new transformer (transducer case). Otherwise, it will
	 * default to executing [fn].
	 *
	 * @private
	 * @param {String} methodname property to check for a custom implementation
	 * @param {Function} xf transducer to initialize if object is transformer
	 * @param {Function} fn default ramda implementation
	 * @return {Function} A function that dispatches on object in list position
	 */
	module.exports = function _dispatchable(methodname, xf, fn) {
	  return function () {
	    var length = arguments.length;
	    if (length === 0) {
	      return fn();
	    }
	    var obj = arguments[length - 1];
	    if (!_isArray(obj)) {
	      var args = _slice(arguments, 0, length - 1);
	      if (typeof obj[methodname] === 'function') {
	        return obj[methodname].apply(obj, args);
	      }
	      if (_isTransformer(obj)) {
	        var transducer = xf.apply(null, args);
	        return transducer(obj);
	      }
	    }
	    return fn.apply(this, arguments);
	  };
	};

/***/ },
/* 18 */
/***/ function(module, exports) {

	/**
	 * Tests whether or not an object is an array.
	 *
	 * @private
	 * @param {*} val The object to test.
	 * @return {Boolean} `true` if `val` is an array, `false` otherwise.
	 * @example
	 *
	 *      _isArray([]); //=> true
	 *      _isArray(null); //=> false
	 *      _isArray({}); //=> false
	 */
	'use strict';
	
	module.exports = Array.isArray || function _isArray(val) {
	  return val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]';
	};

/***/ },
/* 19 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = function _isTransformer(obj) {
	  return typeof obj['@@transducer/step'] === 'function';
	};

/***/ },
/* 20 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function _map(fn, list) {
	  var idx = 0,
	      len = list.length,
	      result = [];
	  while (idx < len) {
	    result[idx] = fn(list[idx]);
	    idx += 1;
	  }
	  return result;
	};

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(8);
	var _xfBase = __webpack_require__(22);
	
	module.exports = (function () {
	  function XMap(f, xf) {
	    this.xf = xf;
	    this.f = f;
	  }
	  XMap.prototype['@@transducer/init'] = _xfBase.init;
	  XMap.prototype['@@transducer/result'] = _xfBase.result;
	  XMap.prototype['@@transducer/step'] = function (result, input) {
	    return this.xf['@@transducer/step'](result, this.f(input));
	  };
	
	  return _curry2(function _xmap(f, xf) {
	    return new XMap(f, xf);
	  });
	})();

/***/ },
/* 22 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = {
	  init: function init() {
	    return this.xf['@@transducer/init']();
	  },
	  result: function result(_result) {
	    return this.xf['@@transducer/result'](_result);
	  }
	};

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(8);
	var _slice = __webpack_require__(5);
	
	/**
	 * Sorts the list according to the supplied function.
	 *
	 * @func
	 * @memberOf R
	 * @category Relation
	 * @sig Ord b => (a -> b) -> [a] -> [a]
	 * @param {Function} fn
	 * @param {Array} list The list to sort.
	 * @return {Array} A new list sorted by the keys generated by `fn`.
	 * @example
	 *
	 *      var sortByFirstItem = R.sortBy(prop(0));
	 *      var sortByNameCaseInsensitive = R.sortBy(compose(R.toLower, prop('name')));
	 *      var pairs = [[-1, 1], [-2, 2], [-3, 3]];
	 *      sortByFirstItem(pairs); //=> [[-3, 3], [-2, 2], [-1, 1]]
	 *      var alice = {
	 *        name: 'ALICE',
	 *        age: 101
	 *      };
	 *      var bob = {
	 *        name: 'Bob',
	 *        age: -10
	 *      };
	 *      var clara = {
	 *        name: 'clara',
	 *        age: 314.159
	 *      };
	 *      var people = [clara, bob, alice];
	 *      sortByNameCaseInsensitive(people); //=> [alice, bob, clara]
	 */
	module.exports = _curry2(function sortBy(fn, list) {
	  return _slice(list).sort(function (a, b) {
	    var aa = fn(a);
	    var bb = fn(b);
	    return aa < bb ? -1 : aa > bb ? 1 : 0;
	  });
	});

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(7);
	var _has = __webpack_require__(25);
	
	/**
	 * Returns a list containing the names of all the enumerable own
	 * properties of the supplied object.
	 * Note that the order of the output array is not guaranteed to be
	 * consistent across different JS platforms.
	 *
	 * @func
	 * @memberOf R
	 * @category Object
	 * @sig {k: v} -> [k]
	 * @param {Object} obj The object to extract properties from
	 * @return {Array} An array of the object's own properties.
	 * @example
	 *
	 *      R.keys({a: 1, b: 2, c: 3}); //=> ['a', 'b', 'c']
	 */
	module.exports = (function () {
	  // cover IE < 9 keys issues
	  var hasEnumBug = !({ toString: null }).propertyIsEnumerable('toString');
	  var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString', 'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];
	
	  var contains = function contains(list, item) {
	    var idx = 0;
	    while (idx < list.length) {
	      if (list[idx] === item) {
	        return true;
	      }
	      idx += 1;
	    }
	    return false;
	  };
	
	  return typeof Object.keys === 'function' ? _curry1(function keys(obj) {
	    return Object(obj) !== obj ? [] : Object.keys(obj);
	  }) : _curry1(function keys(obj) {
	    if (Object(obj) !== obj) {
	      return [];
	    }
	    var prop,
	        ks = [],
	        nIdx;
	    for (prop in obj) {
	      if (_has(prop, obj)) {
	        ks[ks.length] = prop;
	      }
	    }
	    if (hasEnumBug) {
	      nIdx = nonEnumerableProps.length - 1;
	      while (nIdx >= 0) {
	        prop = nonEnumerableProps[nIdx];
	        if (_has(prop, obj) && !contains(ks, prop)) {
	          ks[ks.length] = prop;
	        }
	        nIdx -= 1;
	      }
	    }
	    return ks;
	  });
	})();

/***/ },
/* 25 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function _has(prop, obj) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	};

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(8);
	var _reduce = __webpack_require__(27);
	var keys = __webpack_require__(24);
	
	/**
	 * Like `mapObj`, but but passes additional arguments to the predicate function. The
	 * predicate function is passed three arguments: *(value, key, obj)*.
	 *
	 * @func
	 * @memberOf R
	 * @category Object
	 * @sig (v, k, {k: v} -> v) -> {k: v} -> {k: v}
	 * @param {Function} fn A function called for each property in `obj`. Its return value will
	 *        become a new property on the return object.
	 * @param {Object} obj The object to iterate over.
	 * @return {Object} A new object with the same keys as `obj` and values that are the result
	 *         of running each property through `fn`.
	 * @example
	 *
	 *      var values = { x: 1, y: 2, z: 3 };
	 *      var prependKeyAndDouble = function(num, key, obj) {
	 *        return key + (num * 2);
	 *      };
	 *
	 *      R.mapObjIndexed(prependKeyAndDouble, values); //=> { x: 'x2', y: 'y4', z: 'z6' }
	 */
	module.exports = _curry2(function mapObjectIndexed(fn, obj) {
	  return _reduce(function (acc, key) {
	    acc[key] = fn(obj[key], key, obj);
	    return acc;
	  }, {}, keys(obj));
	});

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _xwrap = __webpack_require__(28);
	var bind = __webpack_require__(29);
	var isArrayLike = __webpack_require__(30);
	
	module.exports = (function () {
	  function _arrayReduce(xf, acc, list) {
	    var idx = 0,
	        len = list.length;
	    while (idx < len) {
	      acc = xf['@@transducer/step'](acc, list[idx]);
	      if (acc && acc['@@transducer/reduced']) {
	        acc = acc['@@transducer/value'];
	        break;
	      }
	      idx += 1;
	    }
	    return xf['@@transducer/result'](acc);
	  }
	
	  function _iterableReduce(xf, acc, iter) {
	    var step = iter.next();
	    while (!step.done) {
	      acc = xf['@@transducer/step'](acc, step.value);
	      if (acc && acc['@@transducer/reduced']) {
	        acc = acc['@@transducer/value'];
	        break;
	      }
	      step = iter.next();
	    }
	    return xf['@@transducer/result'](acc);
	  }
	
	  function _methodReduce(xf, acc, obj) {
	    return xf['@@transducer/result'](obj.reduce(bind(xf['@@transducer/step'], xf), acc));
	  }
	
	  var symIterator = typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator';
	  return function _reduce(fn, acc, list) {
	    if (typeof fn === 'function') {
	      fn = _xwrap(fn);
	    }
	    if (isArrayLike(list)) {
	      return _arrayReduce(fn, acc, list);
	    }
	    if (typeof list.reduce === 'function') {
	      return _methodReduce(fn, acc, list);
	    }
	    if (list[symIterator] != null) {
	      return _iterableReduce(fn, acc, list[symIterator]());
	    }
	    if (typeof list.next === 'function') {
	      return _iterableReduce(fn, acc, list);
	    }
	    throw new TypeError('reduce: list must be array or iterable');
	  };
	})();

/***/ },
/* 28 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = (function () {
	  function XWrap(fn) {
	    this.f = fn;
	  }
	  XWrap.prototype['@@transducer/init'] = function () {
	    throw new Error('init not implemented on XWrap');
	  };
	  XWrap.prototype['@@transducer/result'] = function (acc) {
	    return acc;
	  };
	  XWrap.prototype['@@transducer/step'] = function (acc, x) {
	    return this.f(acc, x);
	  };
	
	  return function _xwrap(fn) {
	    return new XWrap(fn);
	  };
	})();

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(8);
	var arity = __webpack_require__(12);
	
	/**
	 * Creates a function that is bound to a context.
	 * Note: `R.bind` does not provide the additional argument-binding capabilities of
	 * [Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
	 *
	 * @func
	 * @memberOf R
	 * @category Function
	 * @category Object
	 * @see R.partial
	 * @sig (* -> *) -> {*} -> (* -> *)
	 * @param {Function} fn The function to bind to context
	 * @param {Object} thisObj The context to bind `fn` to
	 * @return {Function} A function that will execute in the context of `thisObj`.
	 */
	module.exports = _curry2(function bind(fn, thisObj) {
	  return arity(fn.length, function () {
	    return fn.apply(thisObj, arguments);
	  });
	});

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(7);
	var _isArray = __webpack_require__(18);
	
	/**
	 * Tests whether or not an object is similar to an array.
	 *
	 * @func
	 * @memberOf R
	 * @category Type
	 * @category List
	 * @sig * -> Boolean
	 * @param {*} x The object to test.
	 * @return {Boolean} `true` if `x` has a numeric length property and extreme indices defined; `false` otherwise.
	 * @example
	 *
	 *      R.isArrayLike([]); //=> true
	 *      R.isArrayLike(true); //=> false
	 *      R.isArrayLike({}); //=> false
	 *      R.isArrayLike({length: 10}); //=> false
	 *      R.isArrayLike({0: 'zero', 9: 'nine', length: 10}); //=> true
	 */
	module.exports = _curry1(function isArrayLike(x) {
	  if (_isArray(x)) {
	    return true;
	  }
	  if (!x) {
	    return false;
	  }
	  if (typeof x !== 'object') {
	    return false;
	  }
	  if (x instanceof String) {
	    return false;
	  }
	  if (x.nodeType === 1) {
	    return !!x.length;
	  }
	  if (x.length === 0) {
	    return true;
	  }
	  if (x.length > 0) {
	    return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
	  }
	  return false;
	});

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _concat = __webpack_require__(10);
	var _curry2 = __webpack_require__(8);
	var _hasMethod = __webpack_require__(32);
	var _isArray = __webpack_require__(18);
	
	/**
	 * Returns a new list consisting of the elements of the first list followed by the elements
	 * of the second.
	 *
	 * @func
	 * @memberOf R
	 * @category List
	 * @sig [a] -> [a] -> [a]
	 * @param {Array} list1 The first list to merge.
	 * @param {Array} list2 The second set to merge.
	 * @return {Array} A new array consisting of the contents of `list1` followed by the
	 *         contents of `list2`. If, instead of an Array for `list1`, you pass an
	 *         object with a `concat` method on it, `concat` will call `list1.concat`
	 *         and pass it the value of `list2`.
	 *
	 * @example
	 *
	 *      R.concat([], []); //=> []
	 *      R.concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
	 *      R.concat('ABC', 'DEF'); // 'ABCDEF'
	 */
	module.exports = _curry2(function (set1, set2) {
	  if (_isArray(set2)) {
	    return _concat(set1, set2);
	  } else if (_hasMethod('concat', set1)) {
	    return set1.concat(set2);
	  } else {
	    throw new TypeError("can't concat " + typeof set1);
	  }
	});

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _isArray = __webpack_require__(18);
	
	/**
	 * Private function that determines whether or not a provided object has a given method.
	 * Does not ignore methods stored on the object's prototype chain. Used for dynamically
	 * dispatching Ramda methods to non-Array objects.
	 *
	 * @private
	 * @param {String} methodName The name of the method to check for.
	 * @param {Object} obj The object to test.
	 * @return {Boolean} `true` has a given method, `false` otherwise.
	 * @example
	 *
	 *      var person = { name: 'John' };
	 *      person.shout = function() { alert(this.name); };
	 *
	 *      _hasMethod('shout', person); //=> true
	 *      _hasMethod('foo', person); //=> false
	 */
	module.exports = function _hasMethod(methodName, obj) {
	  return obj != null && !_isArray(obj) && typeof obj[methodName] === 'function';
	};

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(7);
	var keys = __webpack_require__(24);
	
	/**
	 * Returns a list of all the enumerable own properties of the supplied object.
	 * Note that the order of the output array is not guaranteed across
	 * different JS platforms.
	 *
	 * @func
	 * @memberOf R
	 * @category Object
	 * @sig {k: v} -> [v]
	 * @param {Object} obj The object to extract values from
	 * @return {Array} An array of the values of the object's own properties.
	 * @example
	 *
	 *      R.values({a: 1, b: 2, c: 3}); //=> [1, 2, 3]
	 */
	module.exports = _curry1(function values(obj) {
	  var props = keys(obj);
	  var len = props.length;
	  var vals = [];
	  var idx = 0;
	  while (idx < len) {
	    vals[idx] = obj[props[idx]];
	    idx += 1;
	  }
	  return vals;
	});

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry3 = __webpack_require__(6);
	var _reduce = __webpack_require__(27);
	
	/**
	 * Returns a single item by iterating through the list, successively calling the iterator
	 * function and passing it an accumulator value and the current value from the array, and
	 * then passing the result to the next call.
	 *
	 * The iterator function receives two values: *(acc, value)*.  It may use `R.reduced` to
	 * shortcut the iteration.
	 *
	 * Note: `R.reduce` does not skip deleted or unassigned indices (sparse arrays), unlike
	 * the native `Array.prototype.reduce` method. For more details on this behavior, see:
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce#Description
	 * @see R.reduced
	 *
	 * @func
	 * @memberOf R
	 * @category List
	 * @sig (a,b -> a) -> a -> [b] -> a
	 * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	 *        current element from the array.
	 * @param {*} acc The accumulator value.
	 * @param {Array} list The list to iterate over.
	 * @return {*} The final, accumulated value.
	 * @example
	 *
	 *      var numbers = [1, 2, 3];
	 *      var add = function(a, b) {
	 *        return a + b;
	 *      };
	 *
	 *      R.reduce(add, 10, numbers); //=> 16
	 */
	module.exports = _curry3(_reduce);

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _checkForMethod = __webpack_require__(36);
	var _curry3 = __webpack_require__(6);
	
	/**
	 * Returns a list containing the elements of `xs` from `fromIndex` (inclusive)
	 * to `toIndex` (exclusive).
	 *
	 * Dispatches to its third argument's `slice` method if present. As a
	 * result, one may replace `[a]` with `String` in the type signature.
	 *
	 * @func
	 * @memberOf R
	 * @category List
	 * @sig Number -> Number -> [a] -> [a]
	 * @param {Number} fromIndex The start index (inclusive).
	 * @param {Number} toIndex The end index (exclusive).
	 * @param {Array} xs The list to take elements from.
	 * @return {Array} The slice of `xs` from `fromIndex` to `toIndex`.
	 * @example
	 *
	 *      R.slice(1, 3, ['a', 'b', 'c', 'd']);        //=> ['b', 'c']
	 *      R.slice(1, Infinity, ['a', 'b', 'c', 'd']); //=> ['b', 'c', 'd']
	 *      R.slice(0, -1, ['a', 'b', 'c', 'd']);       //=> ['a', 'b', 'c']
	 *      R.slice(-3, -1, ['a', 'b', 'c', 'd']);      //=> ['b', 'c']
	 *      R.slice(0, 3, 'ramda');                     //=> 'ram'
	 */
	module.exports = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, xs) {
	  return Array.prototype.slice.call(xs, fromIndex, toIndex);
	}));

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _isArray = __webpack_require__(18);
	var _slice = __webpack_require__(5);
	
	/**
	 * Similar to hasMethod, this checks whether a function has a [methodname]
	 * function. If it isn't an array it will execute that function otherwise it will
	 * default to the ramda implementation.
	 *
	 * @private
	 * @param {Function} fn ramda implemtation
	 * @param {String} methodname property to check for a custom implementation
	 * @return {Object} Whatever the return value of the method is.
	 */
	module.exports = function _checkForMethod(methodname, fn) {
	  return function () {
	    var length = arguments.length;
	    if (length === 0) {
	      return fn();
	    }
	    var obj = arguments[length - 1];
	    return _isArray(obj) || typeof obj[methodname] !== 'function' ? fn.apply(this, arguments) : obj[methodname].apply(obj, _slice(arguments, 0, length - 1));
	  };
	};

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(8);
	var _path = __webpack_require__(38);
	
	/**
	 * Retrieve the value at a given path.
	 *
	 * @func
	 * @memberOf R
	 * @category Object
	 * @sig [String] -> {*} -> *
	 * @param {Array} path The path to use.
	 * @return {*} The data at `path`.
	 * @example
	 *
	 *      R.path(['a', 'b'], {a: {b: 2}}); //=> 2
	 */
	module.exports = _curry2(_path);

/***/ },
/* 38 */
/***/ function(module, exports) {

	/**
	 * internal path function
	 * Takes an array, paths, indicating the deep set of keys
	 * to find.
	 *
	 * @private
	 * @memberOf R
	 * @category Object
	 * @param {Array} paths An array of strings to map to object properties
	 * @param {Object} obj The object to find the path in
	 * @return {Array} The value at the end of the path or `undefined`.
	 * @example
	 *
	 *      _path(['a', 'b'], {a: {b: 2}}); //=> 2
	 */
	"use strict";
	
	module.exports = function _path(paths, obj) {
	  if (obj == null) {
	    return;
	  } else {
	    var val = obj;
	    for (var idx = 0, len = paths.length; idx < len && val != null; idx += 1) {
	      val = val[paths[idx]];
	    }
	    return val;
	  }
	};

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(8);
	
	/**
	 * Returns the second argument if it is not null or undefined. If it is null
	 * or undefined, the first (default) argument is returned.
	 *
	 * @func
	 * @memberOf R
	 * @category Logic
	 * @sig a -> b -> a | b
	 * @param {a} val The default value.
	 * @param {b} val The value to return if it is not null or undefined
	 * @return {*} The the second value or the default value
	 * @example
	 *
	 *      var defaultTo42 = defaultTo(42);
	 *
	 *      defaultTo42(null);  //=> 42
	 *      defaultTo42(undefined);  //=> 42
	 *      defaultTo42('Ramda');  //=> 'Ramda'
	 */
	module.exports = _curry2(function defaultTo(d, v) {
	  return v == null ? d : v;
	});

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var invoker = __webpack_require__(41);
	
	/**
	 * Returns a string made by inserting the `separator` between each
	 * element and concatenating all the elements into a single string.
	 *
	 * @func
	 * @memberOf R
	 * @category List
	 * @sig String -> [a] -> String
	 * @param {Number|String} separator The string used to separate the elements.
	 * @param {Array} xs The elements to join into a string.
	 * @return {String} str The string made by concatenating `xs` with `separator`.
	 * @example
	 *
	 *      var spacer = R.join(' ');
	 *      spacer(['a', 2, 3.4]);   //=> 'a 2 3.4'
	 *      R.join('|', [1, 2, 3]);    //=> '1|2|3'
	 */
	module.exports = invoker(1, 'join');

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(8);
	var _slice = __webpack_require__(5);
	var curryN = __webpack_require__(14);
	
	/**
	 * Turns a named method with a specified arity into a function
	 * that can be called directly supplied with arguments and a target object.
	 *
	 * The returned function is curried and accepts `arity + 1` parameters where
	 * the final parameter is the target object.
	 *
	 * @func
	 * @memberOf R
	 * @category Function
	 * @sig Number -> String -> (a -> b -> ... -> n -> Object -> *)
	 * @param {Number} arity Number of arguments the returned function should take
	 *        before the target object.
	 * @param {Function} method Name of the method to call.
	 * @return {Function} A new curried function.
	 * @example
	 *
	 *      var sliceFrom = R.invoker(1, 'slice');
	 *      sliceFrom(6, 'abcdefghijklm'); //=> 'ghijklm'
	 *      var sliceFrom6 = R.invoker(2, 'slice')(6);
	 *      sliceFrom6(8, 'abcdefghijklm'); //=> 'gh'
	 */
	module.exports = _curry2(function invoker(arity, method) {
	  return curryN(arity + 1, function () {
	    var target = arguments[arity];
	    return target[method].apply(target, _slice(arguments, 0, arity));
	  });
	});

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(7);
	var _makeFlat = __webpack_require__(43);
	
	/**
	 * Returns a new list by pulling every item out of it (and all its sub-arrays) and putting
	 * them in a new array, depth-first.
	 *
	 * @func
	 * @memberOf R
	 * @category List
	 * @sig [a] -> [b]
	 * @param {Array} list The array to consider.
	 * @return {Array} The flattened list.
	 * @example
	 *
	 *      R.flatten([1, 2, [3, 4], 5, [6, [7, 8, [9, [10, 11], 12]]]]);
	 *      //=> [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
	 */
	module.exports = _curry1(_makeFlat(true));

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var isArrayLike = __webpack_require__(30);
	
	/**
	 * `_makeFlat` is a helper function that returns a one-level or fully recursive function
	 * based on the flag passed in.
	 *
	 * @private
	 */
	module.exports = function _makeFlat(recursive) {
	  return function flatt(list) {
	    var value,
	        result = [],
	        idx = 0,
	        j,
	        ilen = list.length,
	        jlen;
	    while (idx < ilen) {
	      if (isArrayLike(list[idx])) {
	        value = recursive ? flatt(list[idx]) : list[idx];
	        j = 0;
	        jlen = value.length;
	        while (j < jlen) {
	          result[result.length] = value[j];
	          j += 1;
	        }
	      } else {
	        result[result.length] = list[idx];
	      }
	      idx += 1;
	    }
	    return result;
	  };
	};

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */
	
	'use strict';
	
	var now = __webpack_require__(45);
	
	/**
	 * Returns a function, that, as long as it continues to be invoked, will not
	 * be triggered. The function will be called after it stops being called for
	 * N milliseconds. If `immediate` is passed, trigger the function on the
	 * leading edge, instead of the trailing.
	 *
	 * @source underscore.js
	 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
	 * @param {Function} function to wrap
	 * @param {Number} timeout in ms (`100`)
	 * @param {Boolean} whether to execute at the beginning (`false`)
	 * @api public
	 */
	
	module.exports = function debounce(func, wait, immediate) {
	  var timeout, args, context, timestamp, result;
	  if (null == wait) wait = 100;
	
	  function later() {
	    var last = now() - timestamp;
	
	    if (last < wait && last > 0) {
	      timeout = setTimeout(later, wait - last);
	    } else {
	      timeout = null;
	      if (!immediate) {
	        result = func.apply(context, args);
	        if (!timeout) context = args = null;
	      }
	    }
	  };
	
	  return function debounced() {
	    context = this;
	    args = arguments;
	    timestamp = now();
	    var callNow = immediate && !timeout;
	    if (!timeout) timeout = setTimeout(later, wait);
	    if (callNow) {
	      result = func.apply(context, args);
	      context = args = null;
	    }
	
	    return result;
	  };
	};

/***/ },
/* 45 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = Date.now || now;
	
	function now() {
	    return new Date().getTime();
	}

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYTc3NjRmZDg4OTI4NTZkMjg5MmMiLCJ3ZWJwYWNrOi8vLy4vd2ViLmpzIiwid2VicGFjazovLy8uL2xpYi5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9hc3NvY1BhdGguanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2Fzc29jUGF0aC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fYXNzb2MuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX3NsaWNlLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19jdXJyeTMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2N1cnJ5MS5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fY3VycnkyLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL3BhcnRpYWwuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2NvbmNhdC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fY3JlYXRlUGFydGlhbEFwcGxpY2F0b3IuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvYXJpdHkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvY3VycnkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvY3VycnlOLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19jdXJyeU4uanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvbWFwLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19kaXNwYXRjaGFibGUuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2lzQXJyYXkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2lzVHJhbnNmb3JtZXIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX21hcC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9feG1hcC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9feGZCYXNlLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL3NvcnRCeS5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9rZXlzLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19oYXMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvbWFwT2JqSW5kZXhlZC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fcmVkdWNlLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL194d3JhcC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9iaW5kLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2lzQXJyYXlMaWtlLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2NvbmNhdC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9faGFzTWV0aG9kLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL3ZhbHVlcy5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9yZWR1Y2UuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvc2xpY2UuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2NoZWNrRm9yTWV0aG9kLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL3BhdGguanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX3BhdGguanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvZGVmYXVsdFRvLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2pvaW4uanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW52b2tlci5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9mbGF0dGVuLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19tYWtlRmxhdC5qcyIsIndlYnBhY2s6Ly8vLi9+L2RlYm91bmNlL2luZGV4LmpzIiwid2VicGFjazovLy8uL34vZGVib3VuY2Uvfi9kYXRlLW5vdy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7OztBQ3RDQSxhQUFZLENBQUM7Ozs7O0FBS2IsS0FBSSxHQUFHLEdBQUcsbUJBQU8sQ0FBQyxDQUFVLENBQUM7S0FDekIsUUFBUSxHQUFHLG1CQUFPLENBQUMsRUFBVSxDQUFDLENBQUM7O0FBRW5DLEtBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDaEMsT0FBTSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3JDLE9BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7O0FBRTdDLFVBQVMsTUFBTSxHQUFHO0FBQ2QsWUFBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN0QixTQUFJLElBQUksR0FBRyxFQUFFLENBQUM7QUFDZCxTQUFJO0FBQ0EsYUFBSSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7TUFDN0MsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNSLGdCQUFPLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUM7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QU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFBQyxDQUFDO0FBQ3hFLFVBQUssQ0FBQztBQUFFLGNBQU8sVUFBUyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7QUFBQyxnQkFBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUFDLENBQUM7QUFDNUUsVUFBSyxDQUFDO0FBQUUsY0FBTyxVQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7QUFBQyxnQkFBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUFDLENBQUM7QUFDaEYsVUFBSyxDQUFDO0FBQUUsY0FBTyxVQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0FBQUMsZ0JBQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFBQyxDQUFDO0FBQ3BGLFVBQUssQ0FBQztBQUFFLGNBQU8sVUFBUyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7QUFBQyxnQkFBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUFDLENBQUM7QUFDeEYsVUFBSyxDQUFDO0FBQUUsY0FBTyxVQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7QUFBQyxnQkFBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUFDLENBQUM7QUFDNUYsVUFBSyxDQUFDO0FBQUUsY0FBTyxVQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxF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QUNGO0lBQ0YsQ0FBQzs7QUFFRixVQUFPLFNBQVMsU0FBUyxHQUFHO0FBQzFCLFlBQU8sR0FBRyxJQUFJLENBQUM7QUFDZixTQUFJLEdBQUcsU0FBUyxDQUFDO0FBQ2pCLGNBQVMsR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUNsQixTQUFJLE9BQU8sR0FBRyxTQUFTLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDcEMsU0FBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLEdBQUcsVUFBVSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNoRCxTQUFJLE9BQU8sRUFBRTtBQUNYLGFBQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNuQyxjQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztNQUN2Qjs7QUFFRCxZQUFPLE1BQU0sQ0FBQztJQUNmLENBQUM7RUFDSCxDOzs7Ozs7OztBQ3BERCxPQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRzs7QUFFaEMsVUFBUyxHQUFHLEdBQUc7QUFDWCxZQUFPLElBQUksSUFBSSxFQUFFLENBQUMsT0FBTyxFQUFFIiwiZmlsZSI6IndlYi5iaW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIGE3NzY0ZmQ4ODkyODU2ZDI4OTJjXG4gKiovIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuLyogZ2xvYmFsIGFjZSwgVml6LCBqc3lhbWwgKi9cblxudmFyIGxpYiA9IHJlcXVpcmUoJy4vbGliLmpzJyksXG4gICAgZGVib3VuY2UgPSByZXF1aXJlKCdkZWJvdW5jZScpO1xuXG52YXIgZWRpdG9yID0gYWNlLmVkaXQoXCJlZGl0b3JcIik7XG5lZGl0b3Iuc2V0VGhlbWUoXCJhY2UvdGhlbWUvbW9ub2thaVwiKTtcbmVkaXRvci5nZXRTZXNzaW9uKCkuc2V0TW9kZShcImFjZS9tb2RlL3lhbWxcIik7XG5cbmZ1bmN0aW9uIHJlZHJhdygpIHtcbiAgICBjb25zb2xlLmxvZyhcInJlZHJhd1wiKTtcbiAgICB2YXIganNvbiA9IHt9O1xuICAgIHRyeSB7XG4gICAgICAgIGpzb24gPSBqc3lhbWwuc2FmZUxvYWQoZWRpdG9yLmdldFZhbHVlKCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJFcnJvciByZWFkaW5nIFlBTUxcIik7XG4gICAgfVxuICAgIC8qIGVzbGludCBuZXctY2FwOiAwICovXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkaWFncmFtXCIpLmlubmVySFRNTCA9IFZpeihcbiAgICAgICAgbGliLmdldERvdFNyYyhqc29uKS5qb2luKFwiXFxuXCIpLFxuICAgICAgICBcInN2Z1wiXG4gICAgKTtcbn1cblxucmVkcmF3KCk7XG5cblxuZWRpdG9yLmdldFNlc3Npb24oKS5vbignY2hhbmdlJywgZGVib3VuY2UocmVkcmF3LCAyMDApKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vd2ViLmpzXG4gKiovIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBSID0gcmVxdWlyZSgncmVxdWlyZS1wYXJ0cycpKCdyYW1kYScsICdzcmMnLCBbXCJwYXJ0aWFsXCIsIFwibWFwXCIsIFwic29ydEJ5XCIsIFwia2V5c1wiLCBcIm1hcE9iakluZGV4ZWRcIiwgXCJjb25jYXRcIiwgXCJ2YWx1ZXNcIiwgXCJhc3NvY1BhdGhcIiwgXCJyZWR1Y2VcIiwgXCJzbGljZVwiLCBcInBhdGhcIiwgXCJkZWZhdWx0VG9cIiwgXCJqb2luXCIsIFwiZmxhdHRlblwiXSk7XG5cbmZ1bmN0aW9uIHdyaXRlU3ViR3JhcGhGaWVsZCh0YWJsZW5hbWUsIGZpZWxkbmFtZSkge1xuICAgIHJldHVybiBcIjxcIiArIHRhYmxlbmFtZSArIFwiX19cIiArIGZpZWxkbmFtZSArIFwiPlwiICsgZmllbGRuYW1lO1xufVxuXG5mdW5jdGlvbiB3cml0ZVRhYmxlKHRhYmxlZGF0YSwgdGFibGVuYW1lKSB7XG4gICAgdmFyIGxpbmVzID0gW1wic3ViZ3JhcGggY2x1c3RlclwiICsgdGFibGVuYW1lICsgXCIge1wiXTtcbiAgICB2YXIgZmllbGRzID0gUi5qb2luKFxuICAgICAgICBcInxcIixcbiAgICAgICAgUi5tYXAoXG4gICAgICAgICAgICBSLnBhcnRpYWwod3JpdGVTdWJHcmFwaEZpZWxkLCB0YWJsZW5hbWUpLFxuICAgICAgICAgICAgUi5zb3J0QnkoXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24obikge1xuICAgICAgICAgICAgICAgICAgICBpZiAobiA9PSAnaWQnKSB7IHJldHVybiAnYScgKyBuOyB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnYicgKyBuO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgUi5rZXlzKHRhYmxlZGF0YSlcbiAgICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICk7XG4gICAgbGluZXMucHVzaCgnICBsYWJlbCA9IFwiJyArIHRhYmxlbmFtZSArICdcIjsnKTtcbiAgICBsaW5lcy5wdXNoKCcgIHN0cnVjdCcgKyB0YWJsZW5hbWUgKyAnIFtsYWJlbD1cInsnICsgZmllbGRzICsgJ31cIixzaGFwZT1yZWNvcmRdOycpO1xuICAgIGxpbmVzLnB1c2goXCJ9XCIpO1xuICAgIHJldHVybiBsaW5lcztcbn1cblxuZnVuY3Rpb24gZmluZExpbmtzKHN0cnVjdCkge1xuICAgIHZhciByID0gW107XG4gICAgUi5tYXBPYmpJbmRleGVkKGZ1bmN0aW9uKHRhYmxlLCB0YWJsZW5hbWUpIHtcbiAgICAgICAgcmV0dXJuIFIubWFwT2JqSW5kZXhlZChmdW5jdGlvbihmaWVsZCwgZmllbGRuYW1lKSB7XG4gICAgICAgICAgICB2YXIgbDtcbiAgICAgICAgICAgIGlmIChmaWVsZCAmJiBmaWVsZC5oYXNPd25Qcm9wZXJ0eSgnbGluaycpKSB7XG4gICAgICAgICAgICAgICAgbCA9IGZpZWxkLmxpbmsuc3BsaXQoXCIuXCIpO1xuICAgICAgICAgICAgICAgIGlmIChsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgbC5wdXNoKFwiaWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHIucHVzaChSLmNvbmNhdChbdGFibGVuYW1lLCBmaWVsZG5hbWVdLCBsKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRhYmxlKTtcbiAgICB9LCBzdHJ1Y3QpO1xuICAgIHJldHVybiByO1xufVxuXG5mdW5jdGlvbiBhZGRMaW5rRmllbGRzKHN0cnVjdCkge1xuICAgIHZhciBsaW5rcyA9IGZpbmRMaW5rcyhzdHJ1Y3QpO1xuICAgIHJldHVybiBSLnJlZHVjZShmdW5jdGlvbihteVN0cnVjdCwgbGluaykge1xuICAgICAgICByZXR1cm4gUi5hc3NvY1BhdGgoXG4gICAgICAgICAgICBSLnNsaWNlKDIsIDQsIGxpbmspLFxuICAgICAgICAgICAgUi5kZWZhdWx0VG8obnVsbCwgUi5wYXRoKFIuc2xpY2UoMiwgNCwgbGluayksIG15U3RydWN0KSksXG4gICAgICAgICAgICBteVN0cnVjdFxuICAgICAgICApO1xuICAgIH0sIHN0cnVjdCwgbGlua3MpO1xufVxuXG5mdW5jdGlvbiB3cml0ZUxpbmsobGlua1NwZWMpIHtcbiAgICByZXR1cm4gUi5qb2luKCcgLT4gJywgW1xuICAgICAgICBSLmpvaW4oJzonLCBbJ3N0cnVjdCcgKyBsaW5rU3BlY1swXSwgbGlua1NwZWNbMF0gKyAnX18nICsgbGlua1NwZWNbMV1dKSxcbiAgICAgICAgUi5qb2luKCc6JywgWydzdHJ1Y3QnICsgbGlua1NwZWNbMl0sIGxpbmtTcGVjWzJdICsgJ19fJyArIGxpbmtTcGVjWzNdXSlcbiAgICBdKTtcbn1cblxuZnVuY3Rpb24gZ2V0RG90U3JjKHN0cnVjdCkge1xuICAgIHZhciBmaW5hbFN0cnVjdCA9IGFkZExpbmtGaWVsZHMoc3RydWN0KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coXG4gICAgICAgIC8vIFIubWFwKHdyaXRlTGluaywgZmluZExpbmtzKGZpbmFsU3RydWN0KSlcbiAgICAgICAgLy8gKTtcbiAgICByZXR1cm4gUi5mbGF0dGVuKFtcbiAgICAgICAgJ2RpZ3JhcGggZGIgeycsXG4gICAgICAgIFIudmFsdWVzKFIubWFwT2JqSW5kZXhlZCh3cml0ZVRhYmxlLCBmaW5hbFN0cnVjdCkpLFxuICAgICAgICBSLm1hcCh3cml0ZUxpbmssIGZpbmRMaW5rcyhmaW5hbFN0cnVjdCkpLFxuICAgICAgICAnfSdcbiAgICBdKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgd3JpdGVUYWJsZTogd3JpdGVUYWJsZSxcbiAgICBhZGRMaW5rRmllbGRzOiBhZGRMaW5rRmllbGRzLFxuICAgIGZpbmRMaW5rczogZmluZExpbmtzLFxuICAgIHdyaXRlTGluazogd3JpdGVMaW5rLFxuICAgIGdldERvdFNyYzogZ2V0RG90U3JjXG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9saWIuanNcbiAqKi8iLCJ2YXIgX2Fzc29jUGF0aCA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2Fzc29jUGF0aCcpO1xudmFyIF9jdXJyeTMgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTMnKTtcblxuXG4vKipcbiAqIE1ha2VzIGEgc2hhbGxvdyBjbG9uZSBvZiBhbiBvYmplY3QsIHNldHRpbmcgb3Igb3ZlcnJpZGluZyB0aGUgbm9kZXNcbiAqIHJlcXVpcmVkIHRvIGNyZWF0ZSB0aGUgZ2l2ZW4gcGF0aCwgYW5kIHBsYWNpbmcgdGhlIHNwZWNpZmljIHZhbHVlIGF0IHRoZVxuICogdGFpbCBlbmQgb2YgdGhhdCBwYXRoLiAgTm90ZSB0aGF0IHRoaXMgY29waWVzIGFuZCBmbGF0dGVucyBwcm90b3R5cGVcbiAqIHByb3BlcnRpZXMgb250byB0aGUgbmV3IG9iamVjdCBhcyB3ZWxsLiAgQWxsIG5vbi1wcmltaXRpdmUgcHJvcGVydGllc1xuICogYXJlIGNvcGllZCBieSByZWZlcmVuY2UuXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAc2lnIFtTdHJpbmddIC0+IGEgLT4ge2s6IHZ9IC0+IHtrOiB2fVxuICogQHBhcmFtIHtBcnJheX0gcGF0aCB0aGUgcGF0aCB0byBzZXRcbiAqIEBwYXJhbSB7Kn0gdmFsIHRoZSBuZXcgdmFsdWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogdGhlIG9iamVjdCB0byBjbG9uZVxuICogQHJldHVybiB7T2JqZWN0fSBhIG5ldyBvYmplY3Qgc2ltaWxhciB0byB0aGUgb3JpZ2luYWwgZXhjZXB0IGFsb25nIHRoZSBzcGVjaWZpZWQgcGF0aC5cbiAqIEBleGFtcGxlXG4gKlxuICogICAgICBSLmFzc29jUGF0aChbJ2EnLCAnYicsICdjJ10sIDQyLCB7YToge2I6IHtjOiAwfX19KTsgLy89PiB7YToge2I6IHtjOiA0Mn19fVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IF9jdXJyeTMoX2Fzc29jUGF0aCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2Fzc29jUGF0aC5qc1xuICoqLyIsInZhciBfYXNzb2MgPSByZXF1aXJlKCcuL19hc3NvYycpO1xudmFyIF9zbGljZSA9IHJlcXVpcmUoJy4vX3NsaWNlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfYXNzb2NQYXRoKHBhdGgsIHZhbCwgb2JqKSB7XG4gIHN3aXRjaCAocGF0aC5sZW5ndGgpIHtcbiAgICBjYXNlIDA6XG4gICAgICByZXR1cm4gb2JqO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBfYXNzb2MocGF0aFswXSwgdmFsLCBvYmopO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gX2Fzc29jKHBhdGhbMF0sIF9hc3NvY1BhdGgoX3NsaWNlKHBhdGgsIDEpLCB2YWwsIE9iamVjdChvYmpbcGF0aFswXV0pKSwgb2JqKTtcbiAgfVxufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2Fzc29jUGF0aC5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX2Fzc29jKHByb3AsIHZhbCwgb2JqKSB7XG4gIHZhciByZXN1bHQgPSB7fTtcbiAgZm9yICh2YXIgcCBpbiBvYmopIHtcbiAgICByZXN1bHRbcF0gPSBvYmpbcF07XG4gIH1cbiAgcmVzdWx0W3Byb3BdID0gdmFsO1xuICByZXR1cm4gcmVzdWx0O1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2Fzc29jLmpzXG4gKiovIiwiLyoqXG4gKiBBbiBvcHRpbWl6ZWQsIHByaXZhdGUgYXJyYXkgYHNsaWNlYCBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcmd1bWVudHN8QXJyYXl9IGFyZ3MgVGhlIGFycmF5IG9yIGFyZ3VtZW50cyBvYmplY3QgdG8gY29uc2lkZXIuXG4gKiBAcGFyYW0ge051bWJlcn0gW2Zyb209MF0gVGhlIGFycmF5IGluZGV4IHRvIHNsaWNlIGZyb20sIGluY2x1c2l2ZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBbdG89YXJncy5sZW5ndGhdIFRoZSBhcnJheSBpbmRleCB0byBzbGljZSB0bywgZXhjbHVzaXZlLlxuICogQHJldHVybiB7QXJyYXl9IEEgbmV3LCBzbGljZWQgYXJyYXkuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgX3NsaWNlKFsxLCAyLCAzLCA0LCA1XSwgMSwgMyk7IC8vPT4gWzIsIDNdXG4gKlxuICogICAgICB2YXIgZmlyc3RUaHJlZUFyZ3MgPSBmdW5jdGlvbihhLCBiLCBjLCBkKSB7XG4gKiAgICAgICAgcmV0dXJuIF9zbGljZShhcmd1bWVudHMsIDAsIDMpO1xuICogICAgICB9O1xuICogICAgICBmaXJzdFRocmVlQXJncygxLCAyLCAzLCA0KTsgLy89PiBbMSwgMiwgM11cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfc2xpY2UoYXJncywgZnJvbSwgdG8pIHtcbiAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgY2FzZSAxOiByZXR1cm4gX3NsaWNlKGFyZ3MsIDAsIGFyZ3MubGVuZ3RoKTtcbiAgICBjYXNlIDI6IHJldHVybiBfc2xpY2UoYXJncywgZnJvbSwgYXJncy5sZW5ndGgpO1xuICAgIGRlZmF1bHQ6XG4gICAgICB2YXIgbGlzdCA9IFtdO1xuICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICB2YXIgbGVuID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oYXJncy5sZW5ndGgsIHRvKSAtIGZyb20pO1xuICAgICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgICBsaXN0W2lkeF0gPSBhcmdzW2Zyb20gKyBpZHhdO1xuICAgICAgICBpZHggKz0gMTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsaXN0O1xuICB9XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fc2xpY2UuanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MSA9IHJlcXVpcmUoJy4vX2N1cnJ5MScpO1xudmFyIF9jdXJyeTIgPSByZXF1aXJlKCcuL19jdXJyeTInKTtcblxuXG4vKipcbiAqIE9wdGltaXplZCBpbnRlcm5hbCB0aHJlZS1hcml0eSBjdXJyeSBmdW5jdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gY3VycnkuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGN1cnJpZWQgZnVuY3Rpb24uXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX2N1cnJ5Myhmbikge1xuICByZXR1cm4gZnVuY3Rpb24gZjMoYSwgYiwgYykge1xuICAgIHZhciBuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBpZiAobiA9PT0gMCkge1xuICAgICAgcmV0dXJuIGYzO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMSAmJiBhICE9IG51bGwgJiYgYVsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBmMztcbiAgICB9IGVsc2UgaWYgKG4gPT09IDEpIHtcbiAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uKGIsIGMpIHsgcmV0dXJuIGZuKGEsIGIsIGMpOyB9KTtcbiAgICB9IGVsc2UgaWYgKG4gPT09IDIgJiYgYSAhPSBudWxsICYmIGFbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGIgIT0gbnVsbCAmJiBiWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGYzO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMiAmJiBhICE9IG51bGwgJiYgYVsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uKGEsIGMpIHsgcmV0dXJuIGZuKGEsIGIsIGMpOyB9KTtcbiAgICB9IGVsc2UgaWYgKG4gPT09IDIgJiYgYiAhPSBudWxsICYmIGJbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbihiLCBjKSB7IHJldHVybiBmbihhLCBiLCBjKTsgfSk7XG4gICAgfSBlbHNlIGlmIChuID09PSAyKSB7XG4gICAgICByZXR1cm4gX2N1cnJ5MShmdW5jdGlvbihjKSB7IHJldHVybiBmbihhLCBiLCBjKTsgfSk7XG4gICAgfSBlbHNlIGlmIChuID09PSAzICYmIGEgIT0gbnVsbCAmJiBhWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICBiICE9IG51bGwgJiYgYlsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYyAhPSBudWxsICYmIGNbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gZjM7XG4gICAgfSBlbHNlIGlmIChuID09PSAzICYmIGEgIT0gbnVsbCAmJiBhWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICBiICE9IG51bGwgJiYgYlsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGZuKGEsIGIsIGMpOyB9KTtcbiAgICB9IGVsc2UgaWYgKG4gPT09IDMgJiYgYSAhPSBudWxsICYmIGFbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGMgIT0gbnVsbCAmJiBjWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24oYSwgYykgeyByZXR1cm4gZm4oYSwgYiwgYyk7IH0pO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMyAmJiBiICE9IG51bGwgJiYgYlsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYyAhPSBudWxsICYmIGNbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbihiLCBjKSB7IHJldHVybiBmbihhLCBiLCBjKTsgfSk7XG4gICAgfSBlbHNlIGlmIChuID09PSAzICYmIGEgIT0gbnVsbCAmJiBhWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIF9jdXJyeTEoZnVuY3Rpb24oYSkgeyByZXR1cm4gZm4oYSwgYiwgYyk7IH0pO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMyAmJiBiICE9IG51bGwgJiYgYlsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBfY3VycnkxKGZ1bmN0aW9uKGIpIHsgcmV0dXJuIGZuKGEsIGIsIGMpOyB9KTtcbiAgICB9IGVsc2UgaWYgKG4gPT09IDMgJiYgYyAhPSBudWxsICYmIGNbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gX2N1cnJ5MShmdW5jdGlvbihjKSB7IHJldHVybiBmbihhLCBiLCBjKTsgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmbihhLCBiLCBjKTtcbiAgICB9XG4gIH07XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fY3VycnkzLmpzXG4gKiovIiwiLyoqXG4gKiBPcHRpbWl6ZWQgaW50ZXJuYWwgdHdvLWFyaXR5IGN1cnJ5IGZ1bmN0aW9uLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBjdXJyeS5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgY3VycmllZCBmdW5jdGlvbi5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfY3VycnkxKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBmMShhKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBmMTtcbiAgICB9IGVsc2UgaWYgKGEgIT0gbnVsbCAmJiBhWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGYxO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZm4oYSk7XG4gICAgfVxuICB9O1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2N1cnJ5MS5qc1xuICoqLyIsInZhciBfY3VycnkxID0gcmVxdWlyZSgnLi9fY3VycnkxJyk7XG5cblxuLyoqXG4gKiBPcHRpbWl6ZWQgaW50ZXJuYWwgdHdvLWFyaXR5IGN1cnJ5IGZ1bmN0aW9uLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBjdXJyeS5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgY3VycmllZCBmdW5jdGlvbi5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfY3VycnkyKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBmMihhLCBiKSB7XG4gICAgdmFyIG4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGlmIChuID09PSAwKSB7XG4gICAgICByZXR1cm4gZjI7XG4gICAgfSBlbHNlIGlmIChuID09PSAxICYmIGEgIT0gbnVsbCAmJiBhWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGYyO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMSkge1xuICAgICAgcmV0dXJuIF9jdXJyeTEoZnVuY3Rpb24oYikgeyByZXR1cm4gZm4oYSwgYik7IH0pO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMiAmJiBhICE9IG51bGwgJiYgYVsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYiAhPSBudWxsICYmIGJbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gZjI7XG4gICAgfSBlbHNlIGlmIChuID09PSAyICYmIGEgIT0gbnVsbCAmJiBhWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIF9jdXJyeTEoZnVuY3Rpb24oYSkgeyByZXR1cm4gZm4oYSwgYik7IH0pO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMiAmJiBiICE9IG51bGwgJiYgYlsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBfY3VycnkxKGZ1bmN0aW9uKGIpIHsgcmV0dXJuIGZuKGEsIGIpOyB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZuKGEsIGIpO1xuICAgIH1cbiAgfTtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19jdXJyeTIuanNcbiAqKi8iLCJ2YXIgX2NvbmNhdCA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2NvbmNhdCcpO1xudmFyIF9jcmVhdGVQYXJ0aWFsQXBwbGljYXRvciA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2NyZWF0ZVBhcnRpYWxBcHBsaWNhdG9yJyk7XG52YXIgY3VycnkgPSByZXF1aXJlKCcuL2N1cnJ5Jyk7XG5cblxuLyoqXG4gKiBBY2NlcHRzIGFzIGl0cyBhcmd1bWVudHMgYSBmdW5jdGlvbiBhbmQgYW55IG51bWJlciBvZiB2YWx1ZXMgYW5kIHJldHVybnMgYSBmdW5jdGlvbiB0aGF0LFxuICogd2hlbiBpbnZva2VkLCBjYWxscyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gd2l0aCBhbGwgb2YgdGhlIHZhbHVlcyBwcmVwZW5kZWQgdG8gdGhlXG4gKiBvcmlnaW5hbCBmdW5jdGlvbidzIGFyZ3VtZW50cyBsaXN0LiBJbiBzb21lIGxpYnJhcmllcyB0aGlzIGZ1bmN0aW9uIGlzIG5hbWVkIGBhcHBseUxlZnRgLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAc2lnIChhIC0+IGIgLT4gLi4uIC0+IGkgLT4gaiAtPiAuLi4gLT4gbSAtPiBuKSAtPiBhIC0+IGItPiAuLi4gLT4gaSAtPiAoaiAtPiAuLi4gLT4gbSAtPiBuKVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGludm9rZS5cbiAqIEBwYXJhbSB7Li4uKn0gW2FyZ3NdIEFyZ3VtZW50cyB0byBwcmVwZW5kIHRvIGBmbmAgd2hlbiB0aGUgcmV0dXJuZWQgZnVuY3Rpb24gaXMgaW52b2tlZC5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldyBmdW5jdGlvbiB3cmFwcGluZyBgZm5gLiBXaGVuIGludm9rZWQsIGl0IHdpbGwgY2FsbCBgZm5gXG4gKiAgICAgICAgIHdpdGggYGFyZ3NgIHByZXBlbmRlZCB0byBgZm5gJ3MgYXJndW1lbnRzIGxpc3QuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIG11bHRpcGx5ID0gZnVuY3Rpb24oYSwgYikgeyByZXR1cm4gYSAqIGI7IH07XG4gKiAgICAgIHZhciBkb3VibGUgPSBSLnBhcnRpYWwobXVsdGlwbHksIDIpO1xuICogICAgICBkb3VibGUoMik7IC8vPT4gNFxuICpcbiAqICAgICAgdmFyIGdyZWV0ID0gZnVuY3Rpb24oc2FsdXRhdGlvbiwgdGl0bGUsIGZpcnN0TmFtZSwgbGFzdE5hbWUpIHtcbiAqICAgICAgICByZXR1cm4gc2FsdXRhdGlvbiArICcsICcgKyB0aXRsZSArICcgJyArIGZpcnN0TmFtZSArICcgJyArIGxhc3ROYW1lICsgJyEnO1xuICogICAgICB9O1xuICogICAgICB2YXIgc2F5SGVsbG8gPSBSLnBhcnRpYWwoZ3JlZXQsICdIZWxsbycpO1xuICogICAgICB2YXIgc2F5SGVsbG9Ub01zID0gUi5wYXJ0aWFsKHNheUhlbGxvLCAnTXMuJyk7XG4gKiAgICAgIHNheUhlbGxvVG9NcygnSmFuZScsICdKb25lcycpOyAvLz0+ICdIZWxsbywgTXMuIEphbmUgSm9uZXMhJ1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IGN1cnJ5KF9jcmVhdGVQYXJ0aWFsQXBwbGljYXRvcihfY29uY2F0KSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL3BhcnRpYWwuanNcbiAqKi8iLCIvKipcbiAqIFByaXZhdGUgYGNvbmNhdGAgZnVuY3Rpb24gdG8gbWVyZ2UgdHdvIGFycmF5LWxpa2Ugb2JqZWN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheXxBcmd1bWVudHN9IFtzZXQxPVtdXSBBbiBhcnJheS1saWtlIG9iamVjdC5cbiAqIEBwYXJhbSB7QXJyYXl8QXJndW1lbnRzfSBbc2V0Mj1bXV0gQW4gYXJyYXktbGlrZSBvYmplY3QuXG4gKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcsIG1lcmdlZCBhcnJheS5cbiAqIEBleGFtcGxlXG4gKlxuICogICAgICBfY29uY2F0KFs0LCA1LCA2XSwgWzEsIDIsIDNdKTsgLy89PiBbNCwgNSwgNiwgMSwgMiwgM11cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfY29uY2F0KHNldDEsIHNldDIpIHtcbiAgc2V0MSA9IHNldDEgfHwgW107XG4gIHNldDIgPSBzZXQyIHx8IFtdO1xuICB2YXIgaWR4O1xuICB2YXIgbGVuMSA9IHNldDEubGVuZ3RoO1xuICB2YXIgbGVuMiA9IHNldDIubGVuZ3RoO1xuICB2YXIgcmVzdWx0ID0gW107XG5cbiAgaWR4ID0gMDtcbiAgd2hpbGUgKGlkeCA8IGxlbjEpIHtcbiAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSBzZXQxW2lkeF07XG4gICAgaWR4ICs9IDE7XG4gIH1cbiAgaWR4ID0gMDtcbiAgd2hpbGUgKGlkeCA8IGxlbjIpIHtcbiAgICByZXN1bHRbcmVzdWx0Lmxlbmd0aF0gPSBzZXQyW2lkeF07XG4gICAgaWR4ICs9IDE7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19jb25jYXQuanNcbiAqKi8iLCJ2YXIgX3NsaWNlID0gcmVxdWlyZSgnLi9fc2xpY2UnKTtcbnZhciBhcml0eSA9IHJlcXVpcmUoJy4uL2FyaXR5Jyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfY3JlYXRlUGFydGlhbEFwcGxpY2F0b3IoY29uY2F0KSB7XG4gIHJldHVybiBmdW5jdGlvbihmbikge1xuICAgIHZhciBhcmdzID0gX3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGFyaXR5KE1hdGgubWF4KDAsIGZuLmxlbmd0aCAtIGFyZ3MubGVuZ3RoKSwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgY29uY2F0KGFyZ3MsIGFyZ3VtZW50cykpO1xuICAgIH0pO1xuICB9O1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2NyZWF0ZVBhcnRpYWxBcHBsaWNhdG9yLmpzXG4gKiovIiwidmFyIF9jdXJyeTIgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTInKTtcblxuXG4vKipcbiAqIFdyYXBzIGEgZnVuY3Rpb24gb2YgYW55IGFyaXR5IChpbmNsdWRpbmcgbnVsbGFyeSkgaW4gYSBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgZXhhY3RseSBgbmBcbiAqIHBhcmFtZXRlcnMuIFVubGlrZSBgbkFyeWAsIHdoaWNoIHBhc3NlcyBvbmx5IGBuYCBhcmd1bWVudHMgdG8gdGhlIHdyYXBwZWQgZnVuY3Rpb24sXG4gKiBmdW5jdGlvbnMgcHJvZHVjZWQgYnkgYGFyaXR5YCB3aWxsIHBhc3MgYWxsIHByb3ZpZGVkIGFyZ3VtZW50cyB0byB0aGUgd3JhcHBlZCBmdW5jdGlvbi5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBzaWcgKE51bWJlciwgKCogLT4gKikpIC0+ICgqIC0+ICopXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBuIFRoZSBkZXNpcmVkIGFyaXR5IG9mIHRoZSByZXR1cm5lZCBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byB3cmFwLlxuICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGZ1bmN0aW9uIHdyYXBwaW5nIGBmbmAuIFRoZSBuZXcgZnVuY3Rpb24gaXNcbiAqICAgICAgICAgZ3VhcmFudGVlZCB0byBiZSBvZiBhcml0eSBgbmAuXG4gKiBAZGVwcmVjYXRlZCBzaW5jZSB2MC4xNS4wXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIHRha2VzVHdvQXJncyA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAqICAgICAgICByZXR1cm4gW2EsIGJdO1xuICogICAgICB9O1xuICogICAgICB0YWtlc1R3b0FyZ3MubGVuZ3RoOyAvLz0+IDJcbiAqICAgICAgdGFrZXNUd29BcmdzKDEsIDIpOyAvLz0+IFsxLCAyXVxuICpcbiAqICAgICAgdmFyIHRha2VzT25lQXJnID0gUi5hcml0eSgxLCB0YWtlc1R3b0FyZ3MpO1xuICogICAgICB0YWtlc09uZUFyZy5sZW5ndGg7IC8vPT4gMVxuICogICAgICAvLyBBbGwgYXJndW1lbnRzIGFyZSBwYXNzZWQgdGhyb3VnaCB0byB0aGUgd3JhcHBlZCBmdW5jdGlvblxuICogICAgICB0YWtlc09uZUFyZygxLCAyKTsgLy89PiBbMSwgMl1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkyKGZ1bmN0aW9uKG4sIGZuKSB7XG4gIC8vIGpzaGludCB1bnVzZWQ6dmFyc1xuICBzd2l0Y2ggKG4pIHtcbiAgICBjYXNlIDA6IHJldHVybiBmdW5jdGlvbigpIHtyZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTt9O1xuICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uKGEwKSB7cmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7fTtcbiAgICBjYXNlIDI6IHJldHVybiBmdW5jdGlvbihhMCwgYTEpIHtyZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTt9O1xuICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uKGEwLCBhMSwgYTIpIHtyZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTt9O1xuICAgIGNhc2UgNDogcmV0dXJuIGZ1bmN0aW9uKGEwLCBhMSwgYTIsIGEzKSB7cmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7fTtcbiAgICBjYXNlIDU6IHJldHVybiBmdW5jdGlvbihhMCwgYTEsIGEyLCBhMywgYTQpIHtyZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTt9O1xuICAgIGNhc2UgNjogcmV0dXJuIGZ1bmN0aW9uKGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUpIHtyZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTt9O1xuICAgIGNhc2UgNzogcmV0dXJuIGZ1bmN0aW9uKGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2KSB7cmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7fTtcbiAgICBjYXNlIDg6IHJldHVybiBmdW5jdGlvbihhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcpIHtyZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTt9O1xuICAgIGNhc2UgOTogcmV0dXJuIGZ1bmN0aW9uKGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2LCBhNywgYTgpIHtyZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTt9O1xuICAgIGNhc2UgMTA6IHJldHVybiBmdW5jdGlvbihhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcsIGE4LCBhOSkge3JldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO307XG4gICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byBhcml0eSBtdXN0IGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXIgbm8gZ3JlYXRlciB0aGFuIHRlbicpO1xuICB9XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvYXJpdHkuanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MScpO1xudmFyIGN1cnJ5TiA9IHJlcXVpcmUoJy4vY3VycnlOJyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgY3VycmllZCBlcXVpdmFsZW50IG9mIHRoZSBwcm92aWRlZCBmdW5jdGlvbi4gVGhlIGN1cnJpZWRcbiAqIGZ1bmN0aW9uIGhhcyB0d28gdW51c3VhbCBjYXBhYmlsaXRpZXMuIEZpcnN0LCBpdHMgYXJndW1lbnRzIG5lZWRuJ3RcbiAqIGJlIHByb3ZpZGVkIG9uZSBhdCBhIHRpbWUuIElmIGBmYCBpcyBhIHRlcm5hcnkgZnVuY3Rpb24gYW5kIGBnYCBpc1xuICogYFIuY3VycnkoZilgLCB0aGUgZm9sbG93aW5nIGFyZSBlcXVpdmFsZW50OlxuICpcbiAqICAgLSBgZygxKSgyKSgzKWBcbiAqICAgLSBgZygxKSgyLCAzKWBcbiAqICAgLSBgZygxLCAyKSgzKWBcbiAqICAgLSBgZygxLCAyLCAzKWBcbiAqXG4gKiBTZWNvbmRseSwgdGhlIHNwZWNpYWwgcGxhY2Vob2xkZXIgdmFsdWUgYFIuX19gIG1heSBiZSB1c2VkIHRvIHNwZWNpZnlcbiAqIFwiZ2Fwc1wiLCBhbGxvd2luZyBwYXJ0aWFsIGFwcGxpY2F0aW9uIG9mIGFueSBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMsXG4gKiByZWdhcmRsZXNzIG9mIHRoZWlyIHBvc2l0aW9ucy4gSWYgYGdgIGlzIGFzIGFib3ZlIGFuZCBgX2AgaXMgYFIuX19gLFxuICogdGhlIGZvbGxvd2luZyBhcmUgZXF1aXZhbGVudDpcbiAqXG4gKiAgIC0gYGcoMSwgMiwgMylgXG4gKiAgIC0gYGcoXywgMiwgMykoMSlgXG4gKiAgIC0gYGcoXywgXywgMykoMSkoMilgXG4gKiAgIC0gYGcoXywgXywgMykoMSwgMilgXG4gKiAgIC0gYGcoXywgMikoMSkoMylgXG4gKiAgIC0gYGcoXywgMikoMSwgMylgXG4gKiAgIC0gYGcoXywgMikoXywgMykoMSlgXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBzaWcgKCogLT4gYSkgLT4gKCogLT4gYSlcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBjdXJyeS5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIG5ldywgY3VycmllZCBmdW5jdGlvbi5cbiAqIEBzZWUgUi5jdXJyeU5cbiAqIEBleGFtcGxlXG4gKlxuICogICAgICB2YXIgYWRkRm91ck51bWJlcnMgPSBmdW5jdGlvbihhLCBiLCBjLCBkKSB7XG4gKiAgICAgICAgcmV0dXJuIGEgKyBiICsgYyArIGQ7XG4gKiAgICAgIH07XG4gKlxuICogICAgICB2YXIgY3VycmllZEFkZEZvdXJOdW1iZXJzID0gUi5jdXJyeShhZGRGb3VyTnVtYmVycyk7XG4gKiAgICAgIHZhciBmID0gY3VycmllZEFkZEZvdXJOdW1iZXJzKDEsIDIpO1xuICogICAgICB2YXIgZyA9IGYoMyk7XG4gKiAgICAgIGcoNCk7IC8vPT4gMTBcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkxKGZ1bmN0aW9uIGN1cnJ5KGZuKSB7XG4gIHJldHVybiBjdXJyeU4oZm4ubGVuZ3RoLCBmbik7XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvY3VycnkuanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MiA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MicpO1xudmFyIF9jdXJyeU4gPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeU4nKTtcbnZhciBhcml0eSA9IHJlcXVpcmUoJy4vYXJpdHknKTtcblxuXG4vKipcbiAqIFJldHVybnMgYSBjdXJyaWVkIGVxdWl2YWxlbnQgb2YgdGhlIHByb3ZpZGVkIGZ1bmN0aW9uLCB3aXRoIHRoZVxuICogc3BlY2lmaWVkIGFyaXR5LiBUaGUgY3VycmllZCBmdW5jdGlvbiBoYXMgdHdvIHVudXN1YWwgY2FwYWJpbGl0aWVzLlxuICogRmlyc3QsIGl0cyBhcmd1bWVudHMgbmVlZG4ndCBiZSBwcm92aWRlZCBvbmUgYXQgYSB0aW1lLiBJZiBgZ2AgaXNcbiAqIGBSLmN1cnJ5TigzLCBmKWAsIHRoZSBmb2xsb3dpbmcgYXJlIGVxdWl2YWxlbnQ6XG4gKlxuICogICAtIGBnKDEpKDIpKDMpYFxuICogICAtIGBnKDEpKDIsIDMpYFxuICogICAtIGBnKDEsIDIpKDMpYFxuICogICAtIGBnKDEsIDIsIDMpYFxuICpcbiAqIFNlY29uZGx5LCB0aGUgc3BlY2lhbCBwbGFjZWhvbGRlciB2YWx1ZSBgUi5fX2AgbWF5IGJlIHVzZWQgdG8gc3BlY2lmeVxuICogXCJnYXBzXCIsIGFsbG93aW5nIHBhcnRpYWwgYXBwbGljYXRpb24gb2YgYW55IGNvbWJpbmF0aW9uIG9mIGFyZ3VtZW50cyxcbiAqIHJlZ2FyZGxlc3Mgb2YgdGhlaXIgcG9zaXRpb25zLiBJZiBgZ2AgaXMgYXMgYWJvdmUgYW5kIGBfYCBpcyBgUi5fX2AsXG4gKiB0aGUgZm9sbG93aW5nIGFyZSBlcXVpdmFsZW50OlxuICpcbiAqICAgLSBgZygxLCAyLCAzKWBcbiAqICAgLSBgZyhfLCAyLCAzKSgxKWBcbiAqICAgLSBgZyhfLCBfLCAzKSgxKSgyKWBcbiAqICAgLSBgZyhfLCBfLCAzKSgxLCAyKWBcbiAqICAgLSBgZyhfLCAyKSgxKSgzKWBcbiAqICAgLSBgZyhfLCAyKSgxLCAzKWBcbiAqICAgLSBgZyhfLCAyKShfLCAzKSgxKWBcbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHNpZyBOdW1iZXIgLT4gKCogLT4gYSkgLT4gKCogLT4gYSlcbiAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggVGhlIGFyaXR5IGZvciB0aGUgcmV0dXJuZWQgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gY3VycnkuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcsIGN1cnJpZWQgZnVuY3Rpb24uXG4gKiBAc2VlIFIuY3VycnlcbiAqIEBleGFtcGxlXG4gKlxuICogICAgICB2YXIgYWRkRm91ck51bWJlcnMgPSBmdW5jdGlvbigpIHtcbiAqICAgICAgICByZXR1cm4gUi5zdW0oW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIDQpKTtcbiAqICAgICAgfTtcbiAqXG4gKiAgICAgIHZhciBjdXJyaWVkQWRkRm91ck51bWJlcnMgPSBSLmN1cnJ5Tig0LCBhZGRGb3VyTnVtYmVycyk7XG4gKiAgICAgIHZhciBmID0gY3VycmllZEFkZEZvdXJOdW1iZXJzKDEsIDIpO1xuICogICAgICB2YXIgZyA9IGYoMyk7XG4gKiAgICAgIGcoNCk7IC8vPT4gMTBcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkyKGZ1bmN0aW9uIGN1cnJ5TihsZW5ndGgsIGZuKSB7XG4gIHJldHVybiBhcml0eShsZW5ndGgsIF9jdXJyeU4obGVuZ3RoLCBbXSwgZm4pKTtcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9jdXJyeU4uanNcbiAqKi8iLCJ2YXIgYXJpdHkgPSByZXF1aXJlKCcuLi9hcml0eScpO1xuXG5cbi8qKlxuICogSW50ZXJuYWwgY3VycnlOIGZ1bmN0aW9uLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBsZW5ndGggVGhlIGFyaXR5IG9mIHRoZSBjdXJyaWVkIGZ1bmN0aW9uLlxuICogQHJldHVybiB7YXJyYXl9IEFuIGFycmF5IG9mIGFyZ3VtZW50cyByZWNlaXZlZCB0aHVzIGZhci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBjdXJyeS5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfY3VycnlOKGxlbmd0aCwgcmVjZWl2ZWQsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY29tYmluZWQgPSBbXTtcbiAgICB2YXIgYXJnc0lkeCA9IDA7XG4gICAgdmFyIGxlZnQgPSBsZW5ndGg7XG4gICAgdmFyIGNvbWJpbmVkSWR4ID0gMDtcbiAgICB3aGlsZSAoY29tYmluZWRJZHggPCByZWNlaXZlZC5sZW5ndGggfHwgYXJnc0lkeCA8IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIHZhciByZXN1bHQ7XG4gICAgICBpZiAoY29tYmluZWRJZHggPCByZWNlaXZlZC5sZW5ndGggJiZcbiAgICAgICAgICAocmVjZWl2ZWRbY29tYmluZWRJZHhdID09IG51bGwgfHxcbiAgICAgICAgICAgcmVjZWl2ZWRbY29tYmluZWRJZHhdWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSAhPT0gdHJ1ZSB8fFxuICAgICAgICAgICBhcmdzSWR4ID49IGFyZ3VtZW50cy5sZW5ndGgpKSB7XG4gICAgICAgIHJlc3VsdCA9IHJlY2VpdmVkW2NvbWJpbmVkSWR4XTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGFyZ3VtZW50c1thcmdzSWR4XTtcbiAgICAgICAgYXJnc0lkeCArPSAxO1xuICAgICAgfVxuICAgICAgY29tYmluZWRbY29tYmluZWRJZHhdID0gcmVzdWx0O1xuICAgICAgaWYgKHJlc3VsdCA9PSBudWxsIHx8IHJlc3VsdFsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gIT09IHRydWUpIHtcbiAgICAgICAgbGVmdCAtPSAxO1xuICAgICAgfVxuICAgICAgY29tYmluZWRJZHggKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIGxlZnQgPD0gMCA/IGZuLmFwcGx5KHRoaXMsIGNvbWJpbmVkKSA6IGFyaXR5KGxlZnQsIF9jdXJyeU4obGVuZ3RoLCBjb21iaW5lZCwgZm4pKTtcbiAgfTtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19jdXJyeU4uanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MiA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MicpO1xudmFyIF9kaXNwYXRjaGFibGUgPSByZXF1aXJlKCcuL2ludGVybmFsL19kaXNwYXRjaGFibGUnKTtcbnZhciBfbWFwID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fbWFwJyk7XG52YXIgX3htYXAgPSByZXF1aXJlKCcuL2ludGVybmFsL194bWFwJyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IGxpc3QsIGNvbnN0cnVjdGVkIGJ5IGFwcGx5aW5nIHRoZSBzdXBwbGllZCBmdW5jdGlvbiB0byBldmVyeSBlbGVtZW50IG9mIHRoZVxuICogc3VwcGxpZWQgbGlzdC5cbiAqXG4gKiBOb3RlOiBgUi5tYXBgIGRvZXMgbm90IHNraXAgZGVsZXRlZCBvciB1bmFzc2lnbmVkIGluZGljZXMgKHNwYXJzZSBhcnJheXMpLCB1bmxpa2UgdGhlXG4gKiBuYXRpdmUgYEFycmF5LnByb3RvdHlwZS5tYXBgIG1ldGhvZC4gRm9yIG1vcmUgZGV0YWlscyBvbiB0aGlzIGJlaGF2aW9yLCBzZWU6XG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9tYXAjRGVzY3JpcHRpb25cbiAqXG4gKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gKiBAc2VlIFIudHJhbnNkdWNlXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgTGlzdFxuICogQHNpZyAoYSAtPiBiKSAtPiBbYV0gLT4gW2JdXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGV2ZXJ5IGVsZW1lbnQgb2YgdGhlIGlucHV0IGBsaXN0YC5cbiAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gYmUgaXRlcmF0ZWQgb3Zlci5cbiAqIEByZXR1cm4ge0FycmF5fSBUaGUgbmV3IGxpc3QuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIGRvdWJsZSA9IGZ1bmN0aW9uKHgpIHtcbiAqICAgICAgICByZXR1cm4geCAqIDI7XG4gKiAgICAgIH07XG4gKlxuICogICAgICBSLm1hcChkb3VibGUsIFsxLCAyLCAzXSk7IC8vPT4gWzIsIDQsIDZdXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdtYXAnLCBfeG1hcCwgX21hcCkpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9tYXAuanNcbiAqKi8iLCJ2YXIgX2lzQXJyYXkgPSByZXF1aXJlKCcuL19pc0FycmF5Jyk7XG52YXIgX2lzVHJhbnNmb3JtZXIgPSByZXF1aXJlKCcuL19pc1RyYW5zZm9ybWVyJyk7XG52YXIgX3NsaWNlID0gcmVxdWlyZSgnLi9fc2xpY2UnKTtcblxuXG4vKipcbiAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGRpc3BhdGNoZXMgd2l0aCBkaWZmZXJlbnQgc3RyYXRlZ2llcyBiYXNlZCBvbiB0aGVcbiAqIG9iamVjdCBpbiBsaXN0IHBvc2l0aW9uIChsYXN0IGFyZ3VtZW50KS4gSWYgaXQgaXMgYW4gYXJyYXksIGV4ZWN1dGVzIFtmbl0uXG4gKiBPdGhlcndpc2UsIGlmIGl0IGhhcyBhICBmdW5jdGlvbiB3aXRoIFttZXRob2RuYW1lXSwgaXQgd2lsbCBleGVjdXRlIHRoYXRcbiAqIGZ1bmN0aW9uIChmdW5jdG9yIGNhc2UpLiBPdGhlcndpc2UsIGlmIGl0IGlzIGEgdHJhbnNmb3JtZXIsIHVzZXMgdHJhbnNkdWNlclxuICogW3hmXSB0byByZXR1cm4gYSBuZXcgdHJhbnNmb3JtZXIgKHRyYW5zZHVjZXIgY2FzZSkuIE90aGVyd2lzZSwgaXQgd2lsbFxuICogZGVmYXVsdCB0byBleGVjdXRpbmcgW2ZuXS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZG5hbWUgcHJvcGVydHkgdG8gY2hlY2sgZm9yIGEgY3VzdG9tIGltcGxlbWVudGF0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB4ZiB0cmFuc2R1Y2VyIHRvIGluaXRpYWxpemUgaWYgb2JqZWN0IGlzIHRyYW5zZm9ybWVyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBkZWZhdWx0IHJhbWRhIGltcGxlbWVudGF0aW9uXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBmdW5jdGlvbiB0aGF0IGRpc3BhdGNoZXMgb24gb2JqZWN0IGluIGxpc3QgcG9zaXRpb25cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfZGlzcGF0Y2hhYmxlKG1ldGhvZG5hbWUsIHhmLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZuKCk7XG4gICAgfVxuICAgIHZhciBvYmogPSBhcmd1bWVudHNbbGVuZ3RoIC0gMV07XG4gICAgaWYgKCFfaXNBcnJheShvYmopKSB7XG4gICAgICB2YXIgYXJncyA9IF9zbGljZShhcmd1bWVudHMsIDAsIGxlbmd0aCAtIDEpO1xuICAgICAgaWYgKHR5cGVvZiBvYmpbbWV0aG9kbmFtZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG9ialttZXRob2RuYW1lXS5hcHBseShvYmosIGFyZ3MpO1xuICAgICAgfVxuICAgICAgaWYgKF9pc1RyYW5zZm9ybWVyKG9iaikpIHtcbiAgICAgICAgdmFyIHRyYW5zZHVjZXIgPSB4Zi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZHVjZXIob2JqKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fZGlzcGF0Y2hhYmxlLmpzXG4gKiovIiwiLyoqXG4gKiBUZXN0cyB3aGV0aGVyIG9yIG5vdCBhbiBvYmplY3QgaXMgYW4gYXJyYXkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsIFRoZSBvYmplY3QgdG8gdGVzdC5cbiAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiBgdmFsYCBpcyBhbiBhcnJheSwgYGZhbHNlYCBvdGhlcndpc2UuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgX2lzQXJyYXkoW10pOyAvLz0+IHRydWVcbiAqICAgICAgX2lzQXJyYXkobnVsbCk7IC8vPT4gZmFsc2VcbiAqICAgICAgX2lzQXJyYXkoe30pOyAvLz0+IGZhbHNlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiBfaXNBcnJheSh2YWwpIHtcbiAgcmV0dXJuICh2YWwgIT0gbnVsbCAmJlxuICAgICAgICAgIHZhbC5sZW5ndGggPj0gMCAmJlxuICAgICAgICAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWwpID09PSAnW29iamVjdCBBcnJheV0nKTtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19pc0FycmF5LmpzXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfaXNUcmFuc2Zvcm1lcihvYmopIHtcbiAgcmV0dXJuIHR5cGVvZiBvYmpbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPT09ICdmdW5jdGlvbic7XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9faXNUcmFuc2Zvcm1lci5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX21hcChmbiwgbGlzdCkge1xuICB2YXIgaWR4ID0gMCwgbGVuID0gbGlzdC5sZW5ndGgsIHJlc3VsdCA9IFtdO1xuICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgcmVzdWx0W2lkeF0gPSBmbihsaXN0W2lkeF0pO1xuICAgIGlkeCArPSAxO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fbWFwLmpzXG4gKiovIiwidmFyIF9jdXJyeTIgPSByZXF1aXJlKCcuL19jdXJyeTInKTtcbnZhciBfeGZCYXNlID0gcmVxdWlyZSgnLi9feGZCYXNlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFhNYXAoZiwgeGYpIHtcbiAgICB0aGlzLnhmID0geGY7XG4gICAgdGhpcy5mID0gZjtcbiAgfVxuICBYTWFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IF94ZkJhc2UuaW5pdDtcbiAgWE1hcC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IF94ZkJhc2UucmVzdWx0O1xuICBYTWFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IGZ1bmN0aW9uKHJlc3VsdCwgaW5wdXQpIHtcbiAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIHRoaXMuZihpbnB1dCkpO1xuICB9O1xuXG4gIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uIF94bWFwKGYsIHhmKSB7IHJldHVybiBuZXcgWE1hcChmLCB4Zik7IH0pO1xufSkoKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX3htYXAuanNcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMueGZbJ0BAdHJhbnNkdWNlci9pbml0J10oKTtcbiAgfSxcbiAgcmVzdWx0OiBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKHJlc3VsdCk7XG4gIH1cbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL194ZkJhc2UuanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MiA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MicpO1xudmFyIF9zbGljZSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX3NsaWNlJyk7XG5cblxuLyoqXG4gKiBTb3J0cyB0aGUgbGlzdCBhY2NvcmRpbmcgdG8gdGhlIHN1cHBsaWVkIGZ1bmN0aW9uLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IFJlbGF0aW9uXG4gKiBAc2lnIE9yZCBiID0+IChhIC0+IGIpIC0+IFthXSAtPiBbYV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIHNvcnQuXG4gKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcgbGlzdCBzb3J0ZWQgYnkgdGhlIGtleXMgZ2VuZXJhdGVkIGJ5IGBmbmAuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIHNvcnRCeUZpcnN0SXRlbSA9IFIuc29ydEJ5KHByb3AoMCkpO1xuICogICAgICB2YXIgc29ydEJ5TmFtZUNhc2VJbnNlbnNpdGl2ZSA9IFIuc29ydEJ5KGNvbXBvc2UoUi50b0xvd2VyLCBwcm9wKCduYW1lJykpKTtcbiAqICAgICAgdmFyIHBhaXJzID0gW1stMSwgMV0sIFstMiwgMl0sIFstMywgM11dO1xuICogICAgICBzb3J0QnlGaXJzdEl0ZW0ocGFpcnMpOyAvLz0+IFtbLTMsIDNdLCBbLTIsIDJdLCBbLTEsIDFdXVxuICogICAgICB2YXIgYWxpY2UgPSB7XG4gKiAgICAgICAgbmFtZTogJ0FMSUNFJyxcbiAqICAgICAgICBhZ2U6IDEwMVxuICogICAgICB9O1xuICogICAgICB2YXIgYm9iID0ge1xuICogICAgICAgIG5hbWU6ICdCb2InLFxuICogICAgICAgIGFnZTogLTEwXG4gKiAgICAgIH07XG4gKiAgICAgIHZhciBjbGFyYSA9IHtcbiAqICAgICAgICBuYW1lOiAnY2xhcmEnLFxuICogICAgICAgIGFnZTogMzE0LjE1OVxuICogICAgICB9O1xuICogICAgICB2YXIgcGVvcGxlID0gW2NsYXJhLCBib2IsIGFsaWNlXTtcbiAqICAgICAgc29ydEJ5TmFtZUNhc2VJbnNlbnNpdGl2ZShwZW9wbGUpOyAvLz0+IFthbGljZSwgYm9iLCBjbGFyYV1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkyKGZ1bmN0aW9uIHNvcnRCeShmbiwgbGlzdCkge1xuICByZXR1cm4gX3NsaWNlKGxpc3QpLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIHZhciBhYSA9IGZuKGEpO1xuICAgIHZhciBiYiA9IGZuKGIpO1xuICAgIHJldHVybiBhYSA8IGJiID8gLTEgOiBhYSA+IGJiID8gMSA6IDA7XG4gIH0pO1xufSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL3NvcnRCeS5qc1xuICoqLyIsInZhciBfY3VycnkxID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkxJyk7XG52YXIgX2hhcyA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2hhcycpO1xuXG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3QgY29udGFpbmluZyB0aGUgbmFtZXMgb2YgYWxsIHRoZSBlbnVtZXJhYmxlIG93blxuICogcHJvcGVydGllcyBvZiB0aGUgc3VwcGxpZWQgb2JqZWN0LlxuICogTm90ZSB0aGF0IHRoZSBvcmRlciBvZiB0aGUgb3V0cHV0IGFycmF5IGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlXG4gKiBjb25zaXN0ZW50IGFjcm9zcyBkaWZmZXJlbnQgSlMgcGxhdGZvcm1zLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHNpZyB7azogdn0gLT4gW2tdXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gZXh0cmFjdCBwcm9wZXJ0aWVzIGZyb21cbiAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSBvZiB0aGUgb2JqZWN0J3Mgb3duIHByb3BlcnRpZXMuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgUi5rZXlzKHthOiAxLCBiOiAyLCBjOiAzfSk7IC8vPT4gWydhJywgJ2InLCAnYyddXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICAvLyBjb3ZlciBJRSA8IDkga2V5cyBpc3N1ZXNcbiAgdmFyIGhhc0VudW1CdWcgPSAhKHt0b1N0cmluZzogbnVsbH0pLnByb3BlcnR5SXNFbnVtZXJhYmxlKCd0b1N0cmluZycpO1xuICB2YXIgbm9uRW51bWVyYWJsZVByb3BzID0gWydjb25zdHJ1Y3RvcicsICd2YWx1ZU9mJywgJ2lzUHJvdG90eXBlT2YnLCAndG9TdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsICdoYXNPd25Qcm9wZXJ0eScsICd0b0xvY2FsZVN0cmluZyddO1xuXG4gIHZhciBjb250YWlucyA9IGZ1bmN0aW9uIGNvbnRhaW5zKGxpc3QsIGl0ZW0pIHtcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB3aGlsZSAoaWR4IDwgbGlzdC5sZW5ndGgpIHtcbiAgICAgIGlmIChsaXN0W2lkeF0gPT09IGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBpZHggKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIHJldHVybiB0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbicgP1xuICAgIF9jdXJyeTEoZnVuY3Rpb24ga2V5cyhvYmopIHtcbiAgICAgIHJldHVybiBPYmplY3Qob2JqKSAhPT0gb2JqID8gW10gOiBPYmplY3Qua2V5cyhvYmopO1xuICAgIH0pIDpcbiAgICBfY3VycnkxKGZ1bmN0aW9uIGtleXMob2JqKSB7XG4gICAgICBpZiAoT2JqZWN0KG9iaikgIT09IG9iaikge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG4gICAgICB2YXIgcHJvcCwga3MgPSBbXSwgbklkeDtcbiAgICAgIGZvciAocHJvcCBpbiBvYmopIHtcbiAgICAgICAgaWYgKF9oYXMocHJvcCwgb2JqKSkge1xuICAgICAgICAgIGtzW2tzLmxlbmd0aF0gPSBwcm9wO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaGFzRW51bUJ1Zykge1xuICAgICAgICBuSWR4ID0gbm9uRW51bWVyYWJsZVByb3BzLmxlbmd0aCAtIDE7XG4gICAgICAgIHdoaWxlIChuSWR4ID49IDApIHtcbiAgICAgICAgICBwcm9wID0gbm9uRW51bWVyYWJsZVByb3BzW25JZHhdO1xuICAgICAgICAgIGlmIChfaGFzKHByb3AsIG9iaikgJiYgIWNvbnRhaW5zKGtzLCBwcm9wKSkge1xuICAgICAgICAgICAga3Nba3MubGVuZ3RoXSA9IHByb3A7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5JZHggLT0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGtzO1xuICAgIH0pO1xufSgpKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMva2V5cy5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX2hhcyhwcm9wLCBvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2hhcy5qc1xuICoqLyIsInZhciBfY3VycnkyID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkyJyk7XG52YXIgX3JlZHVjZSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX3JlZHVjZScpO1xudmFyIGtleXMgPSByZXF1aXJlKCcuL2tleXMnKTtcblxuXG4vKipcbiAqIExpa2UgYG1hcE9iamAsIGJ1dCBidXQgcGFzc2VzIGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIHRoZSBwcmVkaWNhdGUgZnVuY3Rpb24uIFRoZVxuICogcHJlZGljYXRlIGZ1bmN0aW9uIGlzIHBhc3NlZCB0aHJlZSBhcmd1bWVudHM6ICoodmFsdWUsIGtleSwgb2JqKSouXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAc2lnICh2LCBrLCB7azogdn0gLT4gdikgLT4ge2s6IHZ9IC0+IHtrOiB2fVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQSBmdW5jdGlvbiBjYWxsZWQgZm9yIGVhY2ggcHJvcGVydHkgaW4gYG9iamAuIEl0cyByZXR1cm4gdmFsdWUgd2lsbFxuICogICAgICAgIGJlY29tZSBhIG5ldyBwcm9wZXJ0eSBvbiB0aGUgcmV0dXJuIG9iamVjdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcmV0dXJuIHtPYmplY3R9IEEgbmV3IG9iamVjdCB3aXRoIHRoZSBzYW1lIGtleXMgYXMgYG9iamAgYW5kIHZhbHVlcyB0aGF0IGFyZSB0aGUgcmVzdWx0XG4gKiAgICAgICAgIG9mIHJ1bm5pbmcgZWFjaCBwcm9wZXJ0eSB0aHJvdWdoIGBmbmAuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIHZhbHVlcyA9IHsgeDogMSwgeTogMiwgejogMyB9O1xuICogICAgICB2YXIgcHJlcGVuZEtleUFuZERvdWJsZSA9IGZ1bmN0aW9uKG51bSwga2V5LCBvYmopIHtcbiAqICAgICAgICByZXR1cm4ga2V5ICsgKG51bSAqIDIpO1xuICogICAgICB9O1xuICpcbiAqICAgICAgUi5tYXBPYmpJbmRleGVkKHByZXBlbmRLZXlBbmREb3VibGUsIHZhbHVlcyk7IC8vPT4geyB4OiAneDInLCB5OiAneTQnLCB6OiAnejYnIH1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkyKGZ1bmN0aW9uIG1hcE9iamVjdEluZGV4ZWQoZm4sIG9iaikge1xuICByZXR1cm4gX3JlZHVjZShmdW5jdGlvbihhY2MsIGtleSkge1xuICAgIGFjY1trZXldID0gZm4ob2JqW2tleV0sIGtleSwgb2JqKTtcbiAgICByZXR1cm4gYWNjO1xuICB9LCB7fSwga2V5cyhvYmopKTtcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9tYXBPYmpJbmRleGVkLmpzXG4gKiovIiwidmFyIF94d3JhcCA9IHJlcXVpcmUoJy4vX3h3cmFwJyk7XG52YXIgYmluZCA9IHJlcXVpcmUoJy4uL2JpbmQnKTtcbnZhciBpc0FycmF5TGlrZSA9IHJlcXVpcmUoJy4uL2lzQXJyYXlMaWtlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIF9hcnJheVJlZHVjZSh4ZiwgYWNjLCBsaXN0KSB7XG4gICAgdmFyIGlkeCA9IDAsIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgIGFjYyA9IHhmWydAQHRyYW5zZHVjZXIvc3RlcCddKGFjYywgbGlzdFtpZHhdKTtcbiAgICAgIGlmIChhY2MgJiYgYWNjWydAQHRyYW5zZHVjZXIvcmVkdWNlZCddKSB7XG4gICAgICAgIGFjYyA9IGFjY1snQEB0cmFuc2R1Y2VyL3ZhbHVlJ107XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWR4ICs9IDE7XG4gICAgfVxuICAgIHJldHVybiB4ZlsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddKGFjYyk7XG4gIH1cblxuICBmdW5jdGlvbiBfaXRlcmFibGVSZWR1Y2UoeGYsIGFjYywgaXRlcikge1xuICAgIHZhciBzdGVwID0gaXRlci5uZXh0KCk7XG4gICAgd2hpbGUgKCFzdGVwLmRvbmUpIHtcbiAgICAgIGFjYyA9IHhmWydAQHRyYW5zZHVjZXIvc3RlcCddKGFjYywgc3RlcC52YWx1ZSk7XG4gICAgICBpZiAoYWNjICYmIGFjY1snQEB0cmFuc2R1Y2VyL3JlZHVjZWQnXSkge1xuICAgICAgICBhY2MgPSBhY2NbJ0BAdHJhbnNkdWNlci92YWx1ZSddO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHN0ZXAgPSBpdGVyLm5leHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10oYWNjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9tZXRob2RSZWR1Y2UoeGYsIGFjYywgb2JqKSB7XG4gICAgcmV0dXJuIHhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ob2JqLnJlZHVjZShiaW5kKHhmWydAQHRyYW5zZHVjZXIvc3RlcCddLCB4ZiksIGFjYykpO1xuICB9XG5cbiAgdmFyIHN5bUl0ZXJhdG9yID0gKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnKSA/IFN5bWJvbC5pdGVyYXRvciA6ICdAQGl0ZXJhdG9yJztcbiAgcmV0dXJuIGZ1bmN0aW9uIF9yZWR1Y2UoZm4sIGFjYywgbGlzdCkge1xuICAgIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGZuID0gX3h3cmFwKGZuKTtcbiAgICB9XG4gICAgaWYgKGlzQXJyYXlMaWtlKGxpc3QpKSB7XG4gICAgICByZXR1cm4gX2FycmF5UmVkdWNlKGZuLCBhY2MsIGxpc3QpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGxpc3QucmVkdWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gX21ldGhvZFJlZHVjZShmbiwgYWNjLCBsaXN0KTtcbiAgICB9XG4gICAgaWYgKGxpc3Rbc3ltSXRlcmF0b3JdICE9IG51bGwpIHtcbiAgICAgIHJldHVybiBfaXRlcmFibGVSZWR1Y2UoZm4sIGFjYywgbGlzdFtzeW1JdGVyYXRvcl0oKSk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbGlzdC5uZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gX2l0ZXJhYmxlUmVkdWNlKGZuLCBhY2MsIGxpc3QpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdyZWR1Y2U6IGxpc3QgbXVzdCBiZSBhcnJheSBvciBpdGVyYWJsZScpO1xuICB9O1xufSkoKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX3JlZHVjZS5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICBmdW5jdGlvbiBYV3JhcChmbikge1xuICAgIHRoaXMuZiA9IGZuO1xuICB9XG4gIFhXcmFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IGZ1bmN0aW9uKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignaW5pdCBub3QgaW1wbGVtZW50ZWQgb24gWFdyYXAnKTtcbiAgfTtcbiAgWFdyYXAucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBmdW5jdGlvbihhY2MpIHsgcmV0dXJuIGFjYzsgfTtcbiAgWFdyYXAucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24oYWNjLCB4KSB7XG4gICAgcmV0dXJuIHRoaXMuZihhY2MsIHgpO1xuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiBfeHdyYXAoZm4pIHsgcmV0dXJuIG5ldyBYV3JhcChmbik7IH07XG59KCkpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9feHdyYXAuanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MiA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MicpO1xudmFyIGFyaXR5ID0gcmVxdWlyZSgnLi9hcml0eScpO1xuXG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgaXMgYm91bmQgdG8gYSBjb250ZXh0LlxuICogTm90ZTogYFIuYmluZGAgZG9lcyBub3QgcHJvdmlkZSB0aGUgYWRkaXRpb25hbCBhcmd1bWVudC1iaW5kaW5nIGNhcGFiaWxpdGllcyBvZlxuICogW0Z1bmN0aW9uLnByb3RvdHlwZS5iaW5kXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9GdW5jdGlvbi9iaW5kKS5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHNlZSBSLnBhcnRpYWxcbiAqIEBzaWcgKCogLT4gKikgLT4geyp9IC0+ICgqIC0+ICopXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gYmluZCB0byBjb250ZXh0XG4gKiBAcGFyYW0ge09iamVjdH0gdGhpc09iaiBUaGUgY29udGV4dCB0byBiaW5kIGBmbmAgdG9cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBBIGZ1bmN0aW9uIHRoYXQgd2lsbCBleGVjdXRlIGluIHRoZSBjb250ZXh0IG9mIGB0aGlzT2JqYC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkyKGZ1bmN0aW9uIGJpbmQoZm4sIHRoaXNPYmopIHtcbiAgcmV0dXJuIGFyaXR5KGZuLmxlbmd0aCwgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXNPYmosIGFyZ3VtZW50cyk7XG4gIH0pO1xufSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2JpbmQuanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MScpO1xudmFyIF9pc0FycmF5ID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9faXNBcnJheScpO1xuXG5cbi8qKlxuICogVGVzdHMgd2hldGhlciBvciBub3QgYW4gb2JqZWN0IGlzIHNpbWlsYXIgdG8gYW4gYXJyYXkuXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgVHlwZVxuICogQGNhdGVnb3J5IExpc3RcbiAqIEBzaWcgKiAtPiBCb29sZWFuXG4gKiBAcGFyYW0geyp9IHggVGhlIG9iamVjdCB0byB0ZXN0LlxuICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIGB4YCBoYXMgYSBudW1lcmljIGxlbmd0aCBwcm9wZXJ0eSBhbmQgZXh0cmVtZSBpbmRpY2VzIGRlZmluZWQ7IGBmYWxzZWAgb3RoZXJ3aXNlLlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIFIuaXNBcnJheUxpa2UoW10pOyAvLz0+IHRydWVcbiAqICAgICAgUi5pc0FycmF5TGlrZSh0cnVlKTsgLy89PiBmYWxzZVxuICogICAgICBSLmlzQXJyYXlMaWtlKHt9KTsgLy89PiBmYWxzZVxuICogICAgICBSLmlzQXJyYXlMaWtlKHtsZW5ndGg6IDEwfSk7IC8vPT4gZmFsc2VcbiAqICAgICAgUi5pc0FycmF5TGlrZSh7MDogJ3plcm8nLCA5OiAnbmluZScsIGxlbmd0aDogMTB9KTsgLy89PiB0cnVlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MShmdW5jdGlvbiBpc0FycmF5TGlrZSh4KSB7XG4gIGlmIChfaXNBcnJheSh4KSkgeyByZXR1cm4gdHJ1ZTsgfVxuICBpZiAoIXgpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmICh0eXBlb2YgeCAhPT0gJ29iamVjdCcpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmICh4IGluc3RhbmNlb2YgU3RyaW5nKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoeC5ub2RlVHlwZSA9PT0gMSkgeyByZXR1cm4gISF4Lmxlbmd0aDsgfVxuICBpZiAoeC5sZW5ndGggPT09IDApIHsgcmV0dXJuIHRydWU7IH1cbiAgaWYgKHgubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiB4Lmhhc093blByb3BlcnR5KDApICYmIHguaGFzT3duUHJvcGVydHkoeC5sZW5ndGggLSAxKTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaXNBcnJheUxpa2UuanNcbiAqKi8iLCJ2YXIgX2NvbmNhdCA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2NvbmNhdCcpO1xudmFyIF9jdXJyeTIgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTInKTtcbnZhciBfaGFzTWV0aG9kID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9faGFzTWV0aG9kJyk7XG52YXIgX2lzQXJyYXkgPSByZXF1aXJlKCcuL2ludGVybmFsL19pc0FycmF5Jyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IGxpc3QgY29uc2lzdGluZyBvZiB0aGUgZWxlbWVudHMgb2YgdGhlIGZpcnN0IGxpc3QgZm9sbG93ZWQgYnkgdGhlIGVsZW1lbnRzXG4gKiBvZiB0aGUgc2Vjb25kLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IExpc3RcbiAqIEBzaWcgW2FdIC0+IFthXSAtPiBbYV1cbiAqIEBwYXJhbSB7QXJyYXl9IGxpc3QxIFRoZSBmaXJzdCBsaXN0IHRvIG1lcmdlLlxuICogQHBhcmFtIHtBcnJheX0gbGlzdDIgVGhlIHNlY29uZCBzZXQgdG8gbWVyZ2UuXG4gKiBAcmV0dXJuIHtBcnJheX0gQSBuZXcgYXJyYXkgY29uc2lzdGluZyBvZiB0aGUgY29udGVudHMgb2YgYGxpc3QxYCBmb2xsb3dlZCBieSB0aGVcbiAqICAgICAgICAgY29udGVudHMgb2YgYGxpc3QyYC4gSWYsIGluc3RlYWQgb2YgYW4gQXJyYXkgZm9yIGBsaXN0MWAsIHlvdSBwYXNzIGFuXG4gKiAgICAgICAgIG9iamVjdCB3aXRoIGEgYGNvbmNhdGAgbWV0aG9kIG9uIGl0LCBgY29uY2F0YCB3aWxsIGNhbGwgYGxpc3QxLmNvbmNhdGBcbiAqICAgICAgICAgYW5kIHBhc3MgaXQgdGhlIHZhbHVlIG9mIGBsaXN0MmAuXG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIFIuY29uY2F0KFtdLCBbXSk7IC8vPT4gW11cbiAqICAgICAgUi5jb25jYXQoWzQsIDUsIDZdLCBbMSwgMiwgM10pOyAvLz0+IFs0LCA1LCA2LCAxLCAyLCAzXVxuICogICAgICBSLmNvbmNhdCgnQUJDJywgJ0RFRicpOyAvLyAnQUJDREVGJ1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IF9jdXJyeTIoZnVuY3Rpb24oc2V0MSwgc2V0Mikge1xuICBpZiAoX2lzQXJyYXkoc2V0MikpIHtcbiAgICByZXR1cm4gX2NvbmNhdChzZXQxLCBzZXQyKTtcbiAgfSBlbHNlIGlmIChfaGFzTWV0aG9kKCdjb25jYXQnLCBzZXQxKSkge1xuICAgIHJldHVybiBzZXQxLmNvbmNhdChzZXQyKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiY2FuJ3QgY29uY2F0IFwiICsgdHlwZW9mIHNldDEpO1xuICB9XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvY29uY2F0LmpzXG4gKiovIiwidmFyIF9pc0FycmF5ID0gcmVxdWlyZSgnLi9faXNBcnJheScpO1xuXG5cbi8qKlxuICogUHJpdmF0ZSBmdW5jdGlvbiB0aGF0IGRldGVybWluZXMgd2hldGhlciBvciBub3QgYSBwcm92aWRlZCBvYmplY3QgaGFzIGEgZ2l2ZW4gbWV0aG9kLlxuICogRG9lcyBub3QgaWdub3JlIG1ldGhvZHMgc3RvcmVkIG9uIHRoZSBvYmplY3QncyBwcm90b3R5cGUgY2hhaW4uIFVzZWQgZm9yIGR5bmFtaWNhbGx5XG4gKiBkaXNwYXRjaGluZyBSYW1kYSBtZXRob2RzIHRvIG5vbi1BcnJheSBvYmplY3RzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kTmFtZSBUaGUgbmFtZSBvZiB0aGUgbWV0aG9kIHRvIGNoZWNrIGZvci5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byB0ZXN0LlxuICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGhhcyBhIGdpdmVuIG1ldGhvZCwgYGZhbHNlYCBvdGhlcndpc2UuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIHBlcnNvbiA9IHsgbmFtZTogJ0pvaG4nIH07XG4gKiAgICAgIHBlcnNvbi5zaG91dCA9IGZ1bmN0aW9uKCkgeyBhbGVydCh0aGlzLm5hbWUpOyB9O1xuICpcbiAqICAgICAgX2hhc01ldGhvZCgnc2hvdXQnLCBwZXJzb24pOyAvLz0+IHRydWVcbiAqICAgICAgX2hhc01ldGhvZCgnZm9vJywgcGVyc29uKTsgLy89PiBmYWxzZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9oYXNNZXRob2QobWV0aG9kTmFtZSwgb2JqKSB7XG4gIHJldHVybiBvYmogIT0gbnVsbCAmJiAhX2lzQXJyYXkob2JqKSAmJiB0eXBlb2Ygb2JqW21ldGhvZE5hbWVdID09PSAnZnVuY3Rpb24nO1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2hhc01ldGhvZC5qc1xuICoqLyIsInZhciBfY3VycnkxID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkxJyk7XG52YXIga2V5cyA9IHJlcXVpcmUoJy4va2V5cycpO1xuXG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3Qgb2YgYWxsIHRoZSBlbnVtZXJhYmxlIG93biBwcm9wZXJ0aWVzIG9mIHRoZSBzdXBwbGllZCBvYmplY3QuXG4gKiBOb3RlIHRoYXQgdGhlIG9yZGVyIG9mIHRoZSBvdXRwdXQgYXJyYXkgaXMgbm90IGd1YXJhbnRlZWQgYWNyb3NzXG4gKiBkaWZmZXJlbnQgSlMgcGxhdGZvcm1zLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHNpZyB7azogdn0gLT4gW3ZdXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gZXh0cmFjdCB2YWx1ZXMgZnJvbVxuICogQHJldHVybiB7QXJyYXl9IEFuIGFycmF5IG9mIHRoZSB2YWx1ZXMgb2YgdGhlIG9iamVjdCdzIG93biBwcm9wZXJ0aWVzLlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIFIudmFsdWVzKHthOiAxLCBiOiAyLCBjOiAzfSk7IC8vPT4gWzEsIDIsIDNdXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MShmdW5jdGlvbiB2YWx1ZXMob2JqKSB7XG4gIHZhciBwcm9wcyA9IGtleXMob2JqKTtcbiAgdmFyIGxlbiA9IHByb3BzLmxlbmd0aDtcbiAgdmFyIHZhbHMgPSBbXTtcbiAgdmFyIGlkeCA9IDA7XG4gIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICB2YWxzW2lkeF0gPSBvYmpbcHJvcHNbaWR4XV07XG4gICAgaWR4ICs9IDE7XG4gIH1cbiAgcmV0dXJuIHZhbHM7XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvdmFsdWVzLmpzXG4gKiovIiwidmFyIF9jdXJyeTMgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTMnKTtcbnZhciBfcmVkdWNlID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fcmVkdWNlJyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgc2luZ2xlIGl0ZW0gYnkgaXRlcmF0aW5nIHRocm91Z2ggdGhlIGxpc3QsIHN1Y2Nlc3NpdmVseSBjYWxsaW5nIHRoZSBpdGVyYXRvclxuICogZnVuY3Rpb24gYW5kIHBhc3NpbmcgaXQgYW4gYWNjdW11bGF0b3IgdmFsdWUgYW5kIHRoZSBjdXJyZW50IHZhbHVlIGZyb20gdGhlIGFycmF5LCBhbmRcbiAqIHRoZW4gcGFzc2luZyB0aGUgcmVzdWx0IHRvIHRoZSBuZXh0IGNhbGwuXG4gKlxuICogVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIHJlY2VpdmVzIHR3byB2YWx1ZXM6ICooYWNjLCB2YWx1ZSkqLiAgSXQgbWF5IHVzZSBgUi5yZWR1Y2VkYCB0b1xuICogc2hvcnRjdXQgdGhlIGl0ZXJhdGlvbi5cbiAqXG4gKiBOb3RlOiBgUi5yZWR1Y2VgIGRvZXMgbm90IHNraXAgZGVsZXRlZCBvciB1bmFzc2lnbmVkIGluZGljZXMgKHNwYXJzZSBhcnJheXMpLCB1bmxpa2VcbiAqIHRoZSBuYXRpdmUgYEFycmF5LnByb3RvdHlwZS5yZWR1Y2VgIG1ldGhvZC4gRm9yIG1vcmUgZGV0YWlscyBvbiB0aGlzIGJlaGF2aW9yLCBzZWU6XG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9yZWR1Y2UjRGVzY3JpcHRpb25cbiAqIEBzZWUgUi5yZWR1Y2VkXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgTGlzdFxuICogQHNpZyAoYSxiIC0+IGEpIC0+IGEgLT4gW2JdIC0+IGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBpdGVyYXRvciBmdW5jdGlvbi4gUmVjZWl2ZXMgdHdvIHZhbHVlcywgdGhlIGFjY3VtdWxhdG9yIGFuZCB0aGVcbiAqICAgICAgICBjdXJyZW50IGVsZW1lbnQgZnJvbSB0aGUgYXJyYXkuXG4gKiBAcGFyYW0geyp9IGFjYyBUaGUgYWNjdW11bGF0b3IgdmFsdWUuXG4gKiBAcGFyYW0ge0FycmF5fSBsaXN0IFRoZSBsaXN0IHRvIGl0ZXJhdGUgb3Zlci5cbiAqIEByZXR1cm4geyp9IFRoZSBmaW5hbCwgYWNjdW11bGF0ZWQgdmFsdWUuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIG51bWJlcnMgPSBbMSwgMiwgM107XG4gKiAgICAgIHZhciBhZGQgPSBmdW5jdGlvbihhLCBiKSB7XG4gKiAgICAgICAgcmV0dXJuIGEgKyBiO1xuICogICAgICB9O1xuICpcbiAqICAgICAgUi5yZWR1Y2UoYWRkLCAxMCwgbnVtYmVycyk7IC8vPT4gMTZcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkzKF9yZWR1Y2UpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9yZWR1Y2UuanNcbiAqKi8iLCJ2YXIgX2NoZWNrRm9yTWV0aG9kID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY2hlY2tGb3JNZXRob2QnKTtcbnZhciBfY3VycnkzID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkzJyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBjb250YWluaW5nIHRoZSBlbGVtZW50cyBvZiBgeHNgIGZyb20gYGZyb21JbmRleGAgKGluY2x1c2l2ZSlcbiAqIHRvIGB0b0luZGV4YCAoZXhjbHVzaXZlKS5cbiAqXG4gKiBEaXNwYXRjaGVzIHRvIGl0cyB0aGlyZCBhcmd1bWVudCdzIGBzbGljZWAgbWV0aG9kIGlmIHByZXNlbnQuIEFzIGFcbiAqIHJlc3VsdCwgb25lIG1heSByZXBsYWNlIGBbYV1gIHdpdGggYFN0cmluZ2AgaW4gdGhlIHR5cGUgc2lnbmF0dXJlLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IExpc3RcbiAqIEBzaWcgTnVtYmVyIC0+IE51bWJlciAtPiBbYV0gLT4gW2FdXG4gKiBAcGFyYW0ge051bWJlcn0gZnJvbUluZGV4IFRoZSBzdGFydCBpbmRleCAoaW5jbHVzaXZlKS5cbiAqIEBwYXJhbSB7TnVtYmVyfSB0b0luZGV4IFRoZSBlbmQgaW5kZXggKGV4Y2x1c2l2ZSkuXG4gKiBAcGFyYW0ge0FycmF5fSB4cyBUaGUgbGlzdCB0byB0YWtlIGVsZW1lbnRzIGZyb20uXG4gKiBAcmV0dXJuIHtBcnJheX0gVGhlIHNsaWNlIG9mIGB4c2AgZnJvbSBgZnJvbUluZGV4YCB0byBgdG9JbmRleGAuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgUi5zbGljZSgxLCAzLCBbJ2EnLCAnYicsICdjJywgJ2QnXSk7ICAgICAgICAvLz0+IFsnYicsICdjJ11cbiAqICAgICAgUi5zbGljZSgxLCBJbmZpbml0eSwgWydhJywgJ2InLCAnYycsICdkJ10pOyAvLz0+IFsnYicsICdjJywgJ2QnXVxuICogICAgICBSLnNsaWNlKDAsIC0xLCBbJ2EnLCAnYicsICdjJywgJ2QnXSk7ICAgICAgIC8vPT4gWydhJywgJ2InLCAnYyddXG4gKiAgICAgIFIuc2xpY2UoLTMsIC0xLCBbJ2EnLCAnYicsICdjJywgJ2QnXSk7ICAgICAgLy89PiBbJ2InLCAnYyddXG4gKiAgICAgIFIuc2xpY2UoMCwgMywgJ3JhbWRhJyk7ICAgICAgICAgICAgICAgICAgICAgLy89PiAncmFtJ1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IF9jdXJyeTMoX2NoZWNrRm9yTWV0aG9kKCdzbGljZScsIGZ1bmN0aW9uIHNsaWNlKGZyb21JbmRleCwgdG9JbmRleCwgeHMpIHtcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHhzLCBmcm9tSW5kZXgsIHRvSW5kZXgpO1xufSkpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9zbGljZS5qc1xuICoqLyIsInZhciBfaXNBcnJheSA9IHJlcXVpcmUoJy4vX2lzQXJyYXknKTtcbnZhciBfc2xpY2UgPSByZXF1aXJlKCcuL19zbGljZScpO1xuXG5cbi8qKlxuICogU2ltaWxhciB0byBoYXNNZXRob2QsIHRoaXMgY2hlY2tzIHdoZXRoZXIgYSBmdW5jdGlvbiBoYXMgYSBbbWV0aG9kbmFtZV1cbiAqIGZ1bmN0aW9uLiBJZiBpdCBpc24ndCBhbiBhcnJheSBpdCB3aWxsIGV4ZWN1dGUgdGhhdCBmdW5jdGlvbiBvdGhlcndpc2UgaXQgd2lsbFxuICogZGVmYXVsdCB0byB0aGUgcmFtZGEgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIHJhbWRhIGltcGxlbXRhdGlvblxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZG5hbWUgcHJvcGVydHkgdG8gY2hlY2sgZm9yIGEgY3VzdG9tIGltcGxlbWVudGF0aW9uXG4gKiBAcmV0dXJuIHtPYmplY3R9IFdoYXRldmVyIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIG1ldGhvZCBpcy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfY2hlY2tGb3JNZXRob2QobWV0aG9kbmFtZSwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBmbigpO1xuICAgIH1cbiAgICB2YXIgb2JqID0gYXJndW1lbnRzW2xlbmd0aCAtIDFdO1xuICAgIHJldHVybiAoX2lzQXJyYXkob2JqKSB8fCB0eXBlb2Ygb2JqW21ldGhvZG5hbWVdICE9PSAnZnVuY3Rpb24nKSA/XG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDpcbiAgICAgIG9ialttZXRob2RuYW1lXS5hcHBseShvYmosIF9zbGljZShhcmd1bWVudHMsIDAsIGxlbmd0aCAtIDEpKTtcbiAgfTtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19jaGVja0Zvck1ldGhvZC5qc1xuICoqLyIsInZhciBfY3VycnkyID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkyJyk7XG52YXIgX3BhdGggPSByZXF1aXJlKCcuL2ludGVybmFsL19wYXRoJyk7XG5cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgdmFsdWUgYXQgYSBnaXZlbiBwYXRoLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHNpZyBbU3RyaW5nXSAtPiB7Kn0gLT4gKlxuICogQHBhcmFtIHtBcnJheX0gcGF0aCBUaGUgcGF0aCB0byB1c2UuXG4gKiBAcmV0dXJuIHsqfSBUaGUgZGF0YSBhdCBgcGF0aGAuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgUi5wYXRoKFsnYScsICdiJ10sIHthOiB7YjogMn19KTsgLy89PiAyXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MihfcGF0aCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL3BhdGguanNcbiAqKi8iLCIvKipcbiAqIGludGVybmFsIHBhdGggZnVuY3Rpb25cbiAqIFRha2VzIGFuIGFycmF5LCBwYXRocywgaW5kaWNhdGluZyB0aGUgZGVlcCBzZXQgb2Yga2V5c1xuICogdG8gZmluZC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBwYXJhbSB7QXJyYXl9IHBhdGhzIEFuIGFycmF5IG9mIHN0cmluZ3MgdG8gbWFwIHRvIG9iamVjdCBwcm9wZXJ0aWVzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gZmluZCB0aGUgcGF0aCBpblxuICogQHJldHVybiB7QXJyYXl9IFRoZSB2YWx1ZSBhdCB0aGUgZW5kIG9mIHRoZSBwYXRoIG9yIGB1bmRlZmluZWRgLlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIF9wYXRoKFsnYScsICdiJ10sIHthOiB7YjogMn19KTsgLy89PiAyXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX3BhdGgocGF0aHMsIG9iaikge1xuICBpZiAob2JqID09IG51bGwpIHtcbiAgICByZXR1cm47XG4gIH0gZWxzZSB7XG4gICAgdmFyIHZhbCA9IG9iajtcbiAgICBmb3IgKHZhciBpZHggPSAwLCBsZW4gPSBwYXRocy5sZW5ndGg7IGlkeCA8IGxlbiAmJiB2YWwgIT0gbnVsbDsgaWR4ICs9IDEpIHtcbiAgICAgIHZhbCA9IHZhbFtwYXRoc1tpZHhdXTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX3BhdGguanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MiA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MicpO1xuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgc2Vjb25kIGFyZ3VtZW50IGlmIGl0IGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZC4gSWYgaXQgaXMgbnVsbFxuICogb3IgdW5kZWZpbmVkLCB0aGUgZmlyc3QgKGRlZmF1bHQpIGFyZ3VtZW50IGlzIHJldHVybmVkLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IExvZ2ljXG4gKiBAc2lnIGEgLT4gYiAtPiBhIHwgYlxuICogQHBhcmFtIHthfSB2YWwgVGhlIGRlZmF1bHQgdmFsdWUuXG4gKiBAcGFyYW0ge2J9IHZhbCBUaGUgdmFsdWUgdG8gcmV0dXJuIGlmIGl0IGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZFxuICogQHJldHVybiB7Kn0gVGhlIHRoZSBzZWNvbmQgdmFsdWUgb3IgdGhlIGRlZmF1bHQgdmFsdWVcbiAqIEBleGFtcGxlXG4gKlxuICogICAgICB2YXIgZGVmYXVsdFRvNDIgPSBkZWZhdWx0VG8oNDIpO1xuICpcbiAqICAgICAgZGVmYXVsdFRvNDIobnVsbCk7ICAvLz0+IDQyXG4gKiAgICAgIGRlZmF1bHRUbzQyKHVuZGVmaW5lZCk7ICAvLz0+IDQyXG4gKiAgICAgIGRlZmF1bHRUbzQyKCdSYW1kYScpOyAgLy89PiAnUmFtZGEnXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MihmdW5jdGlvbiBkZWZhdWx0VG8oZCwgdikge1xuICByZXR1cm4gdiA9PSBudWxsID8gZCA6IHY7XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvZGVmYXVsdFRvLmpzXG4gKiovIiwidmFyIGludm9rZXIgPSByZXF1aXJlKCcuL2ludm9rZXInKTtcblxuXG4vKipcbiAqIFJldHVybnMgYSBzdHJpbmcgbWFkZSBieSBpbnNlcnRpbmcgdGhlIGBzZXBhcmF0b3JgIGJldHdlZW4gZWFjaFxuICogZWxlbWVudCBhbmQgY29uY2F0ZW5hdGluZyBhbGwgdGhlIGVsZW1lbnRzIGludG8gYSBzaW5nbGUgc3RyaW5nLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IExpc3RcbiAqIEBzaWcgU3RyaW5nIC0+IFthXSAtPiBTdHJpbmdcbiAqIEBwYXJhbSB7TnVtYmVyfFN0cmluZ30gc2VwYXJhdG9yIFRoZSBzdHJpbmcgdXNlZCB0byBzZXBhcmF0ZSB0aGUgZWxlbWVudHMuXG4gKiBAcGFyYW0ge0FycmF5fSB4cyBUaGUgZWxlbWVudHMgdG8gam9pbiBpbnRvIGEgc3RyaW5nLlxuICogQHJldHVybiB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyBtYWRlIGJ5IGNvbmNhdGVuYXRpbmcgYHhzYCB3aXRoIGBzZXBhcmF0b3JgLlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIHZhciBzcGFjZXIgPSBSLmpvaW4oJyAnKTtcbiAqICAgICAgc3BhY2VyKFsnYScsIDIsIDMuNF0pOyAgIC8vPT4gJ2EgMiAzLjQnXG4gKiAgICAgIFIuam9pbignfCcsIFsxLCAyLCAzXSk7ICAgIC8vPT4gJzF8MnwzJ1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IGludm9rZXIoMSwgJ2pvaW4nKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvam9pbi5qc1xuICoqLyIsInZhciBfY3VycnkyID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkyJyk7XG52YXIgX3NsaWNlID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fc2xpY2UnKTtcbnZhciBjdXJyeU4gPSByZXF1aXJlKCcuL2N1cnJ5TicpO1xuXG5cbi8qKlxuICogVHVybnMgYSBuYW1lZCBtZXRob2Qgd2l0aCBhIHNwZWNpZmllZCBhcml0eSBpbnRvIGEgZnVuY3Rpb25cbiAqIHRoYXQgY2FuIGJlIGNhbGxlZCBkaXJlY3RseSBzdXBwbGllZCB3aXRoIGFyZ3VtZW50cyBhbmQgYSB0YXJnZXQgb2JqZWN0LlxuICpcbiAqIFRoZSByZXR1cm5lZCBmdW5jdGlvbiBpcyBjdXJyaWVkIGFuZCBhY2NlcHRzIGBhcml0eSArIDFgIHBhcmFtZXRlcnMgd2hlcmVcbiAqIHRoZSBmaW5hbCBwYXJhbWV0ZXIgaXMgdGhlIHRhcmdldCBvYmplY3QuXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBzaWcgTnVtYmVyIC0+IFN0cmluZyAtPiAoYSAtPiBiIC0+IC4uLiAtPiBuIC0+IE9iamVjdCAtPiAqKVxuICogQHBhcmFtIHtOdW1iZXJ9IGFyaXR5IE51bWJlciBvZiBhcmd1bWVudHMgdGhlIHJldHVybmVkIGZ1bmN0aW9uIHNob3VsZCB0YWtlXG4gKiAgICAgICAgYmVmb3JlIHRoZSB0YXJnZXQgb2JqZWN0LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWV0aG9kIE5hbWUgb2YgdGhlIG1ldGhvZCB0byBjYWxsLlxuICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGN1cnJpZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIHNsaWNlRnJvbSA9IFIuaW52b2tlcigxLCAnc2xpY2UnKTtcbiAqICAgICAgc2xpY2VGcm9tKDYsICdhYmNkZWZnaGlqa2xtJyk7IC8vPT4gJ2doaWprbG0nXG4gKiAgICAgIHZhciBzbGljZUZyb202ID0gUi5pbnZva2VyKDIsICdzbGljZScpKDYpO1xuICogICAgICBzbGljZUZyb202KDgsICdhYmNkZWZnaGlqa2xtJyk7IC8vPT4gJ2doJ1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IF9jdXJyeTIoZnVuY3Rpb24gaW52b2tlcihhcml0eSwgbWV0aG9kKSB7XG4gIHJldHVybiBjdXJyeU4oYXJpdHkgKyAxLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGFyZ2V0ID0gYXJndW1lbnRzW2FyaXR5XTtcbiAgICByZXR1cm4gdGFyZ2V0W21ldGhvZF0uYXBwbHkodGFyZ2V0LCBfc2xpY2UoYXJndW1lbnRzLCAwLCBhcml0eSkpO1xuICB9KTtcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnZva2VyLmpzXG4gKiovIiwidmFyIF9jdXJyeTEgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTEnKTtcbnZhciBfbWFrZUZsYXQgPSByZXF1aXJlKCcuL2ludGVybmFsL19tYWtlRmxhdCcpO1xuXG5cbi8qKlxuICogUmV0dXJucyBhIG5ldyBsaXN0IGJ5IHB1bGxpbmcgZXZlcnkgaXRlbSBvdXQgb2YgaXQgKGFuZCBhbGwgaXRzIHN1Yi1hcnJheXMpIGFuZCBwdXR0aW5nXG4gKiB0aGVtIGluIGEgbmV3IGFycmF5LCBkZXB0aC1maXJzdC5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBMaXN0XG4gKiBAc2lnIFthXSAtPiBbYl1cbiAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICogQHJldHVybiB7QXJyYXl9IFRoZSBmbGF0dGVuZWQgbGlzdC5cbiAqIEBleGFtcGxlXG4gKlxuICogICAgICBSLmZsYXR0ZW4oWzEsIDIsIFszLCA0XSwgNSwgWzYsIFs3LCA4LCBbOSwgWzEwLCAxMV0sIDEyXV1dXSk7XG4gKiAgICAgIC8vPT4gWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCAxMSwgMTJdXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MShfbWFrZUZsYXQodHJ1ZSkpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9mbGF0dGVuLmpzXG4gKiovIiwidmFyIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi4vaXNBcnJheUxpa2UnKTtcblxuXG4vKipcbiAqIGBfbWFrZUZsYXRgIGlzIGEgaGVscGVyIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIG9uZS1sZXZlbCBvciBmdWxseSByZWN1cnNpdmUgZnVuY3Rpb25cbiAqIGJhc2VkIG9uIHRoZSBmbGFnIHBhc3NlZCBpbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9tYWtlRmxhdChyZWN1cnNpdmUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGZsYXR0KGxpc3QpIHtcbiAgICB2YXIgdmFsdWUsIHJlc3VsdCA9IFtdLCBpZHggPSAwLCBqLCBpbGVuID0gbGlzdC5sZW5ndGgsIGpsZW47XG4gICAgd2hpbGUgKGlkeCA8IGlsZW4pIHtcbiAgICAgIGlmIChpc0FycmF5TGlrZShsaXN0W2lkeF0pKSB7XG4gICAgICAgIHZhbHVlID0gcmVjdXJzaXZlID8gZmxhdHQobGlzdFtpZHhdKSA6IGxpc3RbaWR4XTtcbiAgICAgICAgaiA9IDA7XG4gICAgICAgIGpsZW4gPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChqIDwgamxlbikge1xuICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IHZhbHVlW2pdO1xuICAgICAgICAgIGogKz0gMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gbGlzdFtpZHhdO1xuICAgICAgfVxuICAgICAgaWR4ICs9IDE7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fbWFrZUZsYXQuanNcbiAqKi8iLCJcbi8qKlxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAqL1xuXG52YXIgbm93ID0gcmVxdWlyZSgnZGF0ZS1ub3cnKTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgZnVuY3Rpb24sIHRoYXQsIGFzIGxvbmcgYXMgaXQgY29udGludWVzIHRvIGJlIGludm9rZWQsIHdpbGwgbm90XG4gKiBiZSB0cmlnZ2VyZWQuIFRoZSBmdW5jdGlvbiB3aWxsIGJlIGNhbGxlZCBhZnRlciBpdCBzdG9wcyBiZWluZyBjYWxsZWQgZm9yXG4gKiBOIG1pbGxpc2Vjb25kcy4gSWYgYGltbWVkaWF0ZWAgaXMgcGFzc2VkLCB0cmlnZ2VyIHRoZSBmdW5jdGlvbiBvbiB0aGVcbiAqIGxlYWRpbmcgZWRnZSwgaW5zdGVhZCBvZiB0aGUgdHJhaWxpbmcuXG4gKlxuICogQHNvdXJjZSB1bmRlcnNjb3JlLmpzXG4gKiBAc2VlIGh0dHA6Ly91bnNjcmlwdGFibGUuY29tLzIwMDkvMDMvMjAvZGVib3VuY2luZy1qYXZhc2NyaXB0LW1ldGhvZHMvXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jdGlvbiB0byB3cmFwXG4gKiBAcGFyYW0ge051bWJlcn0gdGltZW91dCBpbiBtcyAoYDEwMGApXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHdoZXRoZXIgdG8gZXhlY3V0ZSBhdCB0aGUgYmVnaW5uaW5nIChgZmFsc2VgKVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGRlYm91bmNlKGZ1bmMsIHdhaXQsIGltbWVkaWF0ZSl7XG4gIHZhciB0aW1lb3V0LCBhcmdzLCBjb250ZXh0LCB0aW1lc3RhbXAsIHJlc3VsdDtcbiAgaWYgKG51bGwgPT0gd2FpdCkgd2FpdCA9IDEwMDtcblxuICBmdW5jdGlvbiBsYXRlcigpIHtcbiAgICB2YXIgbGFzdCA9IG5vdygpIC0gdGltZXN0YW1wO1xuXG4gICAgaWYgKGxhc3QgPCB3YWl0ICYmIGxhc3QgPiAwKSB7XG4gICAgICB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCAtIGxhc3QpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aW1lb3V0ID0gbnVsbDtcbiAgICAgIGlmICghaW1tZWRpYXRlKSB7XG4gICAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICAgIGlmICghdGltZW91dCkgY29udGV4dCA9IGFyZ3MgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICByZXR1cm4gZnVuY3Rpb24gZGVib3VuY2VkKCkge1xuICAgIGNvbnRleHQgPSB0aGlzO1xuICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgdGltZXN0YW1wID0gbm93KCk7XG4gICAgdmFyIGNhbGxOb3cgPSBpbW1lZGlhdGUgJiYgIXRpbWVvdXQ7XG4gICAgaWYgKCF0aW1lb3V0KSB0aW1lb3V0ID0gc2V0VGltZW91dChsYXRlciwgd2FpdCk7XG4gICAgaWYgKGNhbGxOb3cpIHtcbiAgICAgIHJlc3VsdCA9IGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gICAgICBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vZGVib3VuY2UvaW5kZXguanNcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IERhdGUubm93IHx8IG5vd1xuXG5mdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpXG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vZGVib3VuY2Uvfi9kYXRlLW5vdy9pbmRleC5qc1xuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=