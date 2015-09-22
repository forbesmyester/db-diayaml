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
	    debounce = __webpack_require__(64);
	
	var editor = ace.edit("editor");
	editor.setTheme("ace/theme/monokai");
	editor.getSession().setMode("ace/mode/yaml");
	
	function redraw() {
	    var json = {};
	    try {
	        json = jsyaml.safeLoad(editor.getValue());
	    } catch (e) {
	        document.getElementById("diagram").innerHTML = '<div class="error"><h2>Error</h2><p>Your YAML does not appear to be valid</p></div>';
	        return;
	    }
	    /* eslint new-cap: 0 */
	    document.getElementById("diagram").innerHTML = Viz(lib.getDotSrc(lib.transform(json)).join("\n"), "svg");
	}
	
	redraw();
	
	editor.getSession().on('change', debounce(redraw, 750));

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var R = {
	    partial: __webpack_require__(12),
	    map: __webpack_require__(19),
	    sort: __webpack_require__(25),
	    keys: __webpack_require__(26),
	    mapObjIndexed: __webpack_require__(28),
	    concat: __webpack_require__(29),
	    values: __webpack_require__(31),
	    assocPath: __webpack_require__(32),
	    reduce: __webpack_require__(2),
	    slice: __webpack_require__(34),
	    path: __webpack_require__(36),
	    defaultTo: __webpack_require__(37),
	    join: __webpack_require__(38),
	    flatten: __webpack_require__(58),
	    pipe: __webpack_require__(60),
	    flip: __webpack_require__(63)
	};
	
	function writeSubGraphField(tablename, fieldname) {
	    return "<" + tablename + "__" + fieldname + ">" + fieldname;
	}
	
	function writeTable(tabledata, tablename) {
	    var lines = ["subgraph cluster" + tablename + " {"];
	    var fields = R.join("|", R.map(R.partial(writeSubGraphField, tablename), R.sort(function (a, b) {
	        if (a == 'id') {
	            return -1;
	        }
	        if (b == 'id') {
	            return 1;
	        }
	        return 0;
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
	            var l,
	                links,
	                current = [];
	            links = R.defaultTo([], R.path(['links'], field));
	            R.map(function (link) {
	                l = link.target.split(".");
	                if (l.length < 2) {
	                    l.push("id");
	                }
	                current = R.concat([tablename, fieldname], l);
	                if (link.hasOwnProperty('diaprops')) {
	                    current.push(link.diaprops);
	                }
	                r.push(current);
	            }, links);
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
	
	    function asLineProp(v, k) {
	        return k + '=' + v;
	    }
	
	    function sorter(a, b) {
	        if (a < b) {
	            return -1;
	        }
	        return 1;
	    }
	
	    var propsStr = '';
	    if (linkSpec[4]) {
	        propsStr = R.pipe(R.mapObjIndexed(asLineProp), R.values, R.sort(sorter), R.join(', '), R.concat(' ['), R.flip(R.concat)("]"))(linkSpec[4]);
	    }
	    return R.join(' -> ', [R.join(':', ['struct' + linkSpec[0], linkSpec[0] + '__' + linkSpec[1]]), R.join(':', ['struct' + linkSpec[2], linkSpec[2] + '__' + linkSpec[3]])]) + propsStr;
	}
	
	function getDotSrc(struct) {
	    var finalStruct = addLinkFields(struct);
	    var inner = R.map(function (s) {
	        return "  " + s;
	    }, R.flatten([R.values(R.mapObjIndexed(writeTable, finalStruct)), R.map(writeLink, findLinks(finalStruct))]));
	    // inner.unshift('nodesep = 1;');
	    return R.flatten(['digraph db {', inner, '}']);
	}
	
	function transform1(struct) {
	    return R.mapObjIndexed(function (table) {
	        return R.mapObjIndexed(function (field) {
	            if (typeof field == 'string') {
	                return { links: field.split(/, */g) };
	            }
	            return field;
	        }, table);
	    }, struct);
	}
	
	function transform2(struct) {
	
	    function getNewVal(link) {
	        if (typeof link == 'string') {
	            return { target: link };
	        }
	        return link;
	    }
	
	    return R.mapObjIndexed(function (table) {
	        return R.mapObjIndexed(function (field) {
	            if (field === null) {
	                return null;
	            }
	            var r = R.assocPath(['links'], R.map(getNewVal, R.defaultTo([], R.path(['links'], field))), field);
	            if (field.hasOwnProperty('link')) {
	                if (!r.links) {
	                    r.links = [];
	                }
	                r.links.push(getNewVal(r.link));
	                delete r.link;
	            }
	            return r;
	        }, table);
	    }, struct);
	}
	
	function transform(struct) {
	    return transform2(transform1(struct));
	}
	
	transform.transform1 = transform1;
	transform.transform2 = transform2;
	
	module.exports = {
	    writeTable: writeTable,
	    addLinkFields: addLinkFields,
	    findLinks: findLinks,
	    writeLink: writeLink,
	    getDotSrc: getDotSrc,
	    transform: transform
	};

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry3 = __webpack_require__(3);
	var _reduce = __webpack_require__(6);
	
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
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(4);
	var _curry2 = __webpack_require__(5);
	
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
/* 4 */
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
	      return fn.apply(this, arguments);
	    }
	  };
	};

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(4);
	
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
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _xwrap = __webpack_require__(7);
	var bind = __webpack_require__(8);
	var isArrayLike = __webpack_require__(10);
	
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
/* 7 */
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
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _arity = __webpack_require__(9);
	var _curry2 = __webpack_require__(5);
	
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
	  return _arity(fn.length, function () {
	    return fn.apply(thisObj, arguments);
	  });
	});

/***/ },
/* 9 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = function _arity(n, fn) {
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
	      throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
	  }
	};

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(4);
	var _isArray = __webpack_require__(11);
	
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
/* 11 */
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
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _concat = __webpack_require__(13);
	var _createPartialApplicator = __webpack_require__(14);
	var curry = __webpack_require__(16);
	
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
/* 13 */
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
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _arity = __webpack_require__(9);
	var _slice = __webpack_require__(15);
	
	module.exports = function _createPartialApplicator(concat) {
	  return function (fn) {
	    var args = _slice(arguments, 1);
	    return _arity(Math.max(0, fn.length - args.length), function () {
	      return fn.apply(this, concat(args, arguments));
	    });
	  };
	};

/***/ },
/* 15 */
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
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(4);
	var curryN = __webpack_require__(17);
	
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
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _arity = __webpack_require__(9);
	var _curry1 = __webpack_require__(4);
	var _curry2 = __webpack_require__(5);
	var _curryN = __webpack_require__(18);
	
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
	  if (length === 1) {
	    return _curry1(fn);
	  }
	  return _arity(length, _curryN(length, [], fn));
	});

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _arity = __webpack_require__(9);
	
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
	    return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
	  };
	};

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	var _dispatchable = __webpack_require__(20);
	var _map = __webpack_require__(22);
	var _xmap = __webpack_require__(23);
	
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
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _isArray = __webpack_require__(11);
	var _isTransformer = __webpack_require__(21);
	var _slice = __webpack_require__(15);
	
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
/* 21 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = function _isTransformer(obj) {
	  return typeof obj['@@transducer/step'] === 'function';
	};

/***/ },
/* 22 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function _map(fn, list) {
	  var idx = 0,
	      len = list.length,
	      result = Array(len);
	  while (idx < len) {
	    result[idx] = fn(list[idx]);
	    idx += 1;
	  }
	  return result;
	};

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	var _xfBase = __webpack_require__(24);
	
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
/* 24 */
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
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	var _slice = __webpack_require__(15);
	
	/**
	 * Returns a copy of the list, sorted according to the comparator function, which should accept two values at a
	 * time and return a negative number if the first value is smaller, a positive number if it's larger, and zero
	 * if they are equal.  Please note that this is a **copy** of the list.  It does not modify the original.
	 *
	 * @func
	 * @memberOf R
	 * @category List
	 * @sig (a,a -> Number) -> [a] -> [a]
	 * @param {Function} comparator A sorting function :: a -> b -> Int
	 * @param {Array} list The list to sort
	 * @return {Array} a new array with its elements sorted by the comparator function.
	 * @example
	 *
	 *      var diff = function(a, b) { return a - b; };
	 *      R.sort(diff, [4,2,7,5]); //=> [2, 4, 5, 7]
	 */
	module.exports = _curry2(function sort(comparator, list) {
	  return _slice(list).sort(comparator);
	});

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(4);
	var _has = __webpack_require__(27);
	
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
/* 27 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function _has(prop, obj) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	};

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	var _reduce = __webpack_require__(6);
	var keys = __webpack_require__(26);
	
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
	module.exports = _curry2(function mapObjIndexed(fn, obj) {
	  return _reduce(function (acc, key) {
	    acc[key] = fn(obj[key], key, obj);
	    return acc;
	  }, {}, keys(obj));
	});

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _concat = __webpack_require__(13);
	var _curry2 = __webpack_require__(5);
	var _hasMethod = __webpack_require__(30);
	var _isArray = __webpack_require__(11);
	
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
	module.exports = _curry2(function concat(set1, set2) {
	  if (_isArray(set2)) {
	    return _concat(set1, set2);
	  } else if (_hasMethod('concat', set1)) {
	    return set1.concat(set2);
	  } else {
	    throw new TypeError("can't concat " + typeof set1);
	  }
	});

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _isArray = __webpack_require__(11);
	
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
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(4);
	var keys = __webpack_require__(26);
	
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
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry3 = __webpack_require__(3);
	var _slice = __webpack_require__(15);
	var assoc = __webpack_require__(33);
	
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
	 * @see R.dissocPath
	 * @example
	 *
	 *      R.assocPath(['a', 'b', 'c'], 42, {a: {b: {c: 0}}}); //=> {a: {b: {c: 42}}}
	 */
	module.exports = _curry3(function assocPath(path, val, obj) {
	  switch (path.length) {
	    case 0:
	      return obj;
	    case 1:
	      return assoc(path[0], val, obj);
	    default:
	      return assoc(path[0], assocPath(_slice(path, 1), val, Object(obj[path[0]])), obj);
	  }
	});

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry3 = __webpack_require__(3);
	
	/**
	 * Makes a shallow clone of an object, setting or overriding the specified
	 * property with the given value.  Note that this copies and flattens
	 * prototype properties onto the new object as well.  All non-primitive
	 * properties are copied by reference.
	 *
	 * @func
	 * @memberOf R
	 * @category Object
	 * @sig String -> a -> {k: v} -> {k: v}
	 * @param {String} prop the property name to set
	 * @param {*} val the new value
	 * @param {Object} obj the object to clone
	 * @return {Object} a new object similar to the original except for the specified property.
	 * @see R.dissoc
	 * @example
	 *
	 *      R.assoc('c', 3, {a: 1, b: 2}); //=> {a: 1, b: 2, c: 3}
	 */
	module.exports = _curry3(function assoc(prop, val, obj) {
	  var result = {};
	  for (var p in obj) {
	    result[p] = obj[p];
	  }
	  result[prop] = val;
	  return result;
	});

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _checkForMethod = __webpack_require__(35);
	var _curry3 = __webpack_require__(3);
	
	/**
	 * Returns the elements of the given list or string (or object with a `slice`
	 * method) from `fromIndex` (inclusive) to `toIndex` (exclusive).
	 *
	 * @func
	 * @memberOf R
	 * @category List
	 * @sig Number -> Number -> [a] -> [a]
	 * @sig Number -> Number -> String -> String
	 * @param {Number} fromIndex The start index (inclusive).
	 * @param {Number} toIndex The end index (exclusive).
	 * @param {*} list
	 * @return {*}
	 * @example
	 *
	 *      R.slice(1, 3, ['a', 'b', 'c', 'd']);        //=> ['b', 'c']
	 *      R.slice(1, Infinity, ['a', 'b', 'c', 'd']); //=> ['b', 'c', 'd']
	 *      R.slice(0, -1, ['a', 'b', 'c', 'd']);       //=> ['a', 'b', 'c']
	 *      R.slice(-3, -1, ['a', 'b', 'c', 'd']);      //=> ['b', 'c']
	 *      R.slice(0, 3, 'ramda');                     //=> 'ram'
	 */
	module.exports = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
	  return Array.prototype.slice.call(list, fromIndex, toIndex);
	}));

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _isArray = __webpack_require__(11);
	var _slice = __webpack_require__(15);
	
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
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	
	/**
	 * Retrieve the value at a given path.
	 *
	 * @func
	 * @memberOf R
	 * @category Object
	 * @sig [String] -> {k: v} -> v | Undefined
	 * @param {Array} path The path to use.
	 * @return {*} The data at `path`.
	 * @example
	 *
	 *      R.path(['a', 'b'], {a: {b: 2}}); //=> 2
	 *      R.path(['a', 'b'], {c: {b: 2}}); //=> undefined
	 */
	module.exports = _curry2(function path(paths, obj) {
	  if (obj == null) {
	    return;
	  } else {
	    var val = obj;
	    for (var idx = 0, len = paths.length; idx < len && val != null; idx += 1) {
	      val = val[paths[idx]];
	    }
	    return val;
	  }
	});

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	
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
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var invoker = __webpack_require__(39);
	
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
	 * @see R.split
	 * @example
	 *
	 *      var spacer = R.join(' ');
	 *      spacer(['a', 2, 3.4]);   //=> 'a 2 3.4'
	 *      R.join('|', [1, 2, 3]);    //=> '1|2|3'
	 */
	module.exports = invoker(1, 'join');

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	var _slice = __webpack_require__(15);
	var curryN = __webpack_require__(17);
	var is = __webpack_require__(40);
	var toString = __webpack_require__(41);
	
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
	    if (target != null && is(Function, target[method])) {
	      return target[method].apply(target, _slice(arguments, 0, arity));
	    }
	    throw new TypeError(toString(target) + ' does not have a method named "' + method + '"');
	  });
	});

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	
	/**
	 * See if an object (`val`) is an instance of the supplied constructor.
	 * This function will check up the inheritance chain, if any.
	 *
	 * @func
	 * @memberOf R
	 * @category Type
	 * @sig (* -> {*}) -> a -> Boolean
	 * @param {Object} ctor A constructor
	 * @param {*} val The value to test
	 * @return {Boolean}
	 * @example
	 *
	 *      R.is(Object, {}); //=> true
	 *      R.is(Number, 1); //=> true
	 *      R.is(Object, 1); //=> false
	 *      R.is(String, 's'); //=> true
	 *      R.is(String, new String('')); //=> true
	 *      R.is(Object, new String('')); //=> true
	 *      R.is(Object, 's'); //=> false
	 *      R.is(Number, {}); //=> false
	 */
	module.exports = _curry2(function is(Ctor, val) {
	  return val != null && val.constructor === Ctor || val instanceof Ctor;
	});

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(4);
	var _toString = __webpack_require__(42);
	
	/**
	 * Returns the string representation of the given value. `eval`'ing the output
	 * should result in a value equivalent to the input value. Many of the built-in
	 * `toString` methods do not satisfy this requirement.
	 *
	 * If the given value is an `[object Object]` with a `toString` method other
	 * than `Object.prototype.toString`, this method is invoked with no arguments
	 * to produce the return value. This means user-defined constructor functions
	 * can provide a suitable `toString` method. For example:
	 *
	 *     function Point(x, y) {
	 *       this.x = x;
	 *       this.y = y;
	 *     }
	 *
	 *     Point.prototype.toString = function() {
	 *       return 'new Point(' + this.x + ', ' + this.y + ')';
	 *     };
	 *
	 *     R.toString(new Point(1, 2)); //=> 'new Point(1, 2)'
	 *
	 * @func
	 * @memberOf R
	 * @category String
	 * @sig * -> String
	 * @param {*} val
	 * @return {String}
	 * @example
	 *
	 *      R.toString(42); //=> '42'
	 *      R.toString('abc'); //=> '"abc"'
	 *      R.toString([1, 2, 3]); //=> '[1, 2, 3]'
	 *      R.toString({foo: 1, bar: 2, baz: 3}); //=> '{"bar": 2, "baz": 3, "foo": 1}'
	 *      R.toString(new Date('2001-02-03T04:05:06Z')); //=> 'new Date("2001-02-03T04:05:06.000Z")'
	 */
	module.exports = _curry1(function toString(val) {
	  return _toString(val, []);
	});

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _contains = __webpack_require__(43);
	var _map = __webpack_require__(22);
	var _quote = __webpack_require__(49);
	var _toISOString = __webpack_require__(50);
	var keys = __webpack_require__(26);
	var reject = __webpack_require__(51);
	var test = __webpack_require__(56);
	
	module.exports = function _toString(x, seen) {
	  var recur = function recur(y) {
	    var xs = seen.concat([x]);
	    return _contains(y, xs) ? '<Circular>' : _toString(y, xs);
	  };
	
	  //  mapPairs :: (Object, [String]) -> [String]
	  var mapPairs = function mapPairs(obj, keys) {
	    return _map(function (k) {
	      return _quote(k) + ': ' + recur(obj[k]);
	    }, keys.slice().sort());
	  };
	
	  switch (Object.prototype.toString.call(x)) {
	    case '[object Arguments]':
	      return '(function() { return arguments; }(' + _map(recur, x).join(', ') + '))';
	    case '[object Array]':
	      return '[' + _map(recur, x).concat(mapPairs(x, reject(test(/^\d+$/), keys(x)))).join(', ') + ']';
	    case '[object Boolean]':
	      return typeof x === 'object' ? 'new Boolean(' + recur(x.valueOf()) + ')' : x.toString();
	    case '[object Date]':
	      return 'new Date(' + _quote(_toISOString(x)) + ')';
	    case '[object Null]':
	      return 'null';
	    case '[object Number]':
	      return typeof x === 'object' ? 'new Number(' + recur(x.valueOf()) + ')' : 1 / x === -Infinity ? '-0' : x.toString(10);
	    case '[object String]':
	      return typeof x === 'object' ? 'new String(' + recur(x.valueOf()) + ')' : _quote(x);
	    case '[object Undefined]':
	      return 'undefined';
	    default:
	      return typeof x.constructor === 'function' && x.constructor.name !== 'Object' && typeof x.toString === 'function' && x.toString() !== '[object Object]' ? x.toString() : // Function, RegExp, user-defined types
	      '{' + mapPairs(x, keys(x)).join(', ') + '}';
	  }
	};

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _indexOf = __webpack_require__(44);
	
	module.exports = function _contains(a, list) {
	  return _indexOf(list, a, 0) >= 0;
	};

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var equals = __webpack_require__(45);
	
	module.exports = function _indexOf(list, item, from) {
	  var idx = from;
	  while (idx < list.length) {
	    if (equals(list[idx], item)) {
	      return idx;
	    }
	    idx += 1;
	  }
	  return -1;
	};

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	var _equals = __webpack_require__(46);
	var _hasMethod = __webpack_require__(30);
	
	/**
	 * Returns `true` if its arguments are equivalent, `false` otherwise.
	 * Dispatches to an `equals` method if present. Handles cyclical data
	 * structures.
	 *
	 * @func
	 * @memberOf R
	 * @category Relation
	 * @sig a -> b -> Boolean
	 * @param {*} a
	 * @param {*} b
	 * @return {Boolean}
	 * @example
	 *
	 *      R.equals(1, 1); //=> true
	 *      R.equals(1, '1'); //=> false
	 *      R.equals([1, 2, 3], [1, 2, 3]); //=> true
	 *
	 *      var a = {}; a.v = a;
	 *      var b = {}; b.v = b;
	 *      R.equals(a, b); //=> true
	 */
	module.exports = _curry2(function equals(a, b) {
	  return _hasMethod('equals', a) ? a.equals(b) : _hasMethod('equals', b) ? b.equals(a) : _equals(a, b, [], []);
	});

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _has = __webpack_require__(27);
	var identical = __webpack_require__(47);
	var keys = __webpack_require__(26);
	var type = __webpack_require__(48);
	
	// The algorithm used to handle cyclic structures is
	// inspired by underscore's isEqual
	module.exports = function _equals(a, b, stackA, stackB) {
	  var typeA = type(a);
	  if (typeA !== type(b)) {
	    return false;
	  }
	
	  if (typeA === 'Boolean' || typeA === 'Number' || typeA === 'String') {
	    return typeof a === 'object' ? typeof b === 'object' && identical(a.valueOf(), b.valueOf()) : identical(a, b);
	  }
	
	  if (identical(a, b)) {
	    return true;
	  }
	
	  if (typeA === 'RegExp') {
	    // RegExp equality algorithm: http://stackoverflow.com/a/10776635
	    return a.source === b.source && a.global === b.global && a.ignoreCase === b.ignoreCase && a.multiline === b.multiline && a.sticky === b.sticky && a.unicode === b.unicode;
	  }
	
	  if (Object(a) === a) {
	    if (typeA === 'Date' && a.getTime() !== b.getTime()) {
	      return false;
	    }
	
	    var keysA = keys(a);
	    if (keysA.length !== keys(b).length) {
	      return false;
	    }
	
	    var idx = stackA.length - 1;
	    while (idx >= 0) {
	      if (stackA[idx] === a) {
	        return stackB[idx] === b;
	      }
	      idx -= 1;
	    }
	
	    stackA[stackA.length] = a;
	    stackB[stackB.length] = b;
	    idx = keysA.length - 1;
	    while (idx >= 0) {
	      var key = keysA[idx];
	      if (!_has(key, b) || !_equals(b[key], a[key], stackA, stackB)) {
	        return false;
	      }
	      idx -= 1;
	    }
	    stackA.pop();
	    stackB.pop();
	    return true;
	  }
	  return false;
	};

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	
	/**
	 * Returns true if its arguments are identical, false otherwise. Values are
	 * identical if they reference the same memory. `NaN` is identical to `NaN`;
	 * `0` and `-0` are not identical.
	 *
	 * @func
	 * @memberOf R
	 * @category Relation
	 * @sig a -> a -> Boolean
	 * @param {*} a
	 * @param {*} b
	 * @return {Boolean}
	 * @example
	 *
	 *      var o = {};
	 *      R.identical(o, o); //=> true
	 *      R.identical(1, 1); //=> true
	 *      R.identical(1, '1'); //=> false
	 *      R.identical([], []); //=> false
	 *      R.identical(0, -0); //=> false
	 *      R.identical(NaN, NaN); //=> true
	 */
	module.exports = _curry2(function identical(a, b) {
	  // SameValue algorithm
	  if (a === b) {
	    // Steps 1-5, 7-10
	    // Steps 6.b-6.e: +0 != -0
	    return a !== 0 || 1 / a === 1 / b;
	  } else {
	    // Step 6.a: NaN == NaN
	    return a !== a && b !== b;
	  }
	});

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(4);
	
	/**
	 * Gives a single-word string description of the (native) type of a value, returning such
	 * answers as 'Object', 'Number', 'Array', or 'Null'.  Does not attempt to distinguish user
	 * Object types any further, reporting them all as 'Object'.
	 *
	 * @func
	 * @memberOf R
	 * @category Type
	 * @sig (* -> {*}) -> String
	 * @param {*} val The value to test
	 * @return {String}
	 * @example
	 *
	 *      R.type({}); //=> "Object"
	 *      R.type(1); //=> "Number"
	 *      R.type(false); //=> "Boolean"
	 *      R.type('s'); //=> "String"
	 *      R.type(null); //=> "Null"
	 *      R.type([]); //=> "Array"
	 *      R.type(/[A-z]/); //=> "RegExp"
	 */
	module.exports = _curry1(function type(val) {
	  return val === null ? 'Null' : val === undefined ? 'Undefined' : Object.prototype.toString.call(val).slice(8, -1);
	});

/***/ },
/* 49 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = function _quote(s) {
	  return '"' + s.replace(/"/g, '\\"') + '"';
	};

/***/ },
/* 50 */
/***/ function(module, exports) {

	/**
	 * Polyfill from <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString>.
	 */
	'use strict';
	
	module.exports = (function () {
	  var pad = function pad(n) {
	    return (n < 10 ? '0' : '') + n;
	  };
	
	  return typeof Date.prototype.toISOString === 'function' ? function _toISOString(d) {
	    return d.toISOString();
	  } : function _toISOString(d) {
	    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
	  };
	})();

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _complement = __webpack_require__(52);
	var _curry2 = __webpack_require__(5);
	var filter = __webpack_require__(53);
	
	/**
	 * Similar to `filter`, except that it keeps only values for which the given predicate
	 * function returns falsy. The predicate function is passed one argument: *(value)*.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 * @see R.transduce
	 *
	 * @func
	 * @memberOf R
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> [a]
	 * @param {Function} fn The function called per iteration.
	 * @param {Array} list The collection to iterate over.
	 * @return {Array} The new filtered array.
	 * @see R.filter
	 * @example
	 *
	 *      var isOdd = function(n) {
	 *        return n % 2 === 1;
	 *      };
	 *      R.reject(isOdd, [1, 2, 3, 4]); //=> [2, 4]
	 */
	module.exports = _curry2(function reject(fn, list) {
	  return filter(_complement(fn), list);
	});

/***/ },
/* 52 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function _complement(f) {
	  return function () {
	    return !f.apply(this, arguments);
	  };
	};

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	var _dispatchable = __webpack_require__(20);
	var _filter = __webpack_require__(54);
	var _xfilter = __webpack_require__(55);
	
	/**
	 * Returns a new list containing only those items that match a given predicate function.
	 * The predicate function is passed one argument: *(value)*.
	 *
	 * Note that `R.filter` does not skip deleted or unassigned indices, unlike the native
	 * `Array.prototype.filter` method. For more details on this behavior, see:
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter#Description
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 * @see R.transduce
	 *
	 * @func
	 * @memberOf R
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> [a]
	 * @param {Function} fn The function called per iteration.
	 * @param {Array} list The collection to iterate over.
	 * @return {Array} The new filtered array.
	 * @see R.reject
	 * @example
	 *
	 *      var isEven = function(n) {
	 *        return n % 2 === 0;
	 *      };
	 *      R.filter(isEven, [1, 2, 3, 4]); //=> [2, 4]
	 */
	module.exports = _curry2(_dispatchable('filter', _xfilter, _filter));

/***/ },
/* 54 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function _filter(fn, list) {
	  var idx = 0,
	      len = list.length,
	      result = [];
	  while (idx < len) {
	    if (fn(list[idx])) {
	      result[result.length] = list[idx];
	    }
	    idx += 1;
	  }
	  return result;
	};

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry2 = __webpack_require__(5);
	var _xfBase = __webpack_require__(24);
	
	module.exports = (function () {
	  function XFilter(f, xf) {
	    this.xf = xf;
	    this.f = f;
	  }
	  XFilter.prototype['@@transducer/init'] = _xfBase.init;
	  XFilter.prototype['@@transducer/result'] = _xfBase.result;
	  XFilter.prototype['@@transducer/step'] = function (result, input) {
	    return this.f(input) ? this.xf['@@transducer/step'](result, input) : result;
	  };
	
	  return _curry2(function _xfilter(f, xf) {
	    return new XFilter(f, xf);
	  });
	})();

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _cloneRegExp = __webpack_require__(57);
	var _curry2 = __webpack_require__(5);
	
	/**
	 * Determines whether a given string matches a given regular expression.
	 *
	 * @func
	 * @memberOf R
	 * @category String
	 * @sig RegExp -> String -> Boolean
	 * @param {RegExp} pattern
	 * @param {String} str
	 * @return {Boolean}
	 * @example
	 *
	 *      R.test(/^x/, 'xyz'); //=> true
	 *      R.test(/^y/, 'xyz'); //=> false
	 */
	module.exports = _curry2(function test(pattern, str) {
	  return _cloneRegExp(pattern).test(str);
	});

/***/ },
/* 57 */
/***/ function(module, exports) {

	'use strict';
	
	module.exports = function _cloneRegExp(pattern) {
	                                  return new RegExp(pattern.source, (pattern.global ? 'g' : '') + (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : '') + (pattern.sticky ? 'y' : '') + (pattern.unicode ? 'u' : ''));
	};

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(4);
	var _makeFlat = __webpack_require__(59);
	
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
	 * @see R.unnest
	 * @example
	 *
	 *      R.flatten([1, 2, [3, 4], 5, [6, [7, 8, [9, [10, 11], 12]]]]);
	 *      //=> [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
	 */
	module.exports = _curry1(_makeFlat(true));

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var isArrayLike = __webpack_require__(10);
	
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
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _pipe = __webpack_require__(61);
	var curryN = __webpack_require__(17);
	var reduce = __webpack_require__(2);
	var tail = __webpack_require__(62);
	
	/**
	 * Performs left-to-right function composition. The leftmost function may have
	 * any arity; the remaining functions must be unary.
	 *
	 * In some libraries this function is named `sequence`.
	 *
	 * @func
	 * @memberOf R
	 * @category Function
	 * @sig (((a, b, ..., n) -> o), (o -> p), ..., (x -> y), (y -> z)) -> (a -> b -> ... -> n -> z)
	 * @param {...Function} functions
	 * @return {Function}
	 * @see R.compose
	 * @example
	 *
	 *      var f = R.pipe(Math.pow, R.negate, R.inc);
	 *
	 *      f(3, 4); // -(3^4) + 1
	 */
	module.exports = function pipe() {
	  if (arguments.length === 0) {
	    throw new Error('pipe requires at least one argument');
	  }
	  return curryN(arguments[0].length, reduce(_pipe, arguments[0], tail(arguments)));
	};

/***/ },
/* 61 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = function _pipe(f, g) {
	  return function () {
	    return g.call(this, f.apply(this, arguments));
	  };
	};

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _checkForMethod = __webpack_require__(35);
	var slice = __webpack_require__(34);
	
	/**
	 * Returns all but the first element of the given list or string (or object
	 * with a `tail` method).
	 *
	 * @func
	 * @memberOf R
	 * @category List
	 * @see R.head, R.init, R.last
	 * @sig [a] -> [a]
	 * @sig String -> String
	 * @param {*} list
	 * @return {*}
	 * @example
	 *
	 *      R.tail([1, 2, 3]);  //=> [2, 3]
	 *      R.tail([1, 2]);     //=> [2]
	 *      R.tail([1]);        //=> []
	 *      R.tail([]);         //=> []
	 *
	 *      R.tail('abc');  //=> 'bc'
	 *      R.tail('ab');   //=> 'b'
	 *      R.tail('a');    //=> ''
	 *      R.tail('');     //=> ''
	 */
	module.exports = _checkForMethod('tail', slice(1, Infinity));

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _curry1 = __webpack_require__(4);
	var _slice = __webpack_require__(15);
	var curry = __webpack_require__(16);
	
	/**
	 * Returns a new function much like the supplied one, except that the first two arguments'
	 * order is reversed.
	 *
	 * @func
	 * @memberOf R
	 * @category Function
	 * @sig (a -> b -> c -> ... -> z) -> (b -> a -> c -> ... -> z)
	 * @param {Function} fn The function to invoke with its first two parameters reversed.
	 * @return {*} The result of invoking `fn` with its first two parameters' order reversed.
	 * @example
	 *
	 *      var mergeThree = function(a, b, c) {
	 *        return ([]).concat(a, b, c);
	 *      };
	 *
	 *      mergeThree(1, 2, 3); //=> [1, 2, 3]
	 *
	 *      R.flip(mergeThree)(1, 2, 3); //=> [2, 1, 3]
	 */
	module.exports = _curry1(function flip(fn) {
	  return curry(function (a, b) {
	    var args = _slice(arguments);
	    args[0] = b;
	    args[1] = a;
	    return fn.apply(this, args);
	  });
	});

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * Module dependencies.
	 */
	
	'use strict';
	
	var now = __webpack_require__(65);
	
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
/* 65 */
/***/ function(module, exports) {

	"use strict";
	
	module.exports = Date.now || now;
	
	function now() {
	    return new Date().getTime();
	}

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNjU4ZmE5MmZmODU0MzhmMGQ2YWYiLCJ3ZWJwYWNrOi8vLy4vd2ViLmpzIiwid2VicGFjazovLy8uL2xpYi5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9yZWR1Y2UuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2N1cnJ5My5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fY3VycnkxLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19jdXJyeTIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX3JlZHVjZS5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9feHdyYXAuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvYmluZC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fYXJpdHkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaXNBcnJheUxpa2UuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2lzQXJyYXkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvcGFydGlhbC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fY29uY2F0LmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19jcmVhdGVQYXJ0aWFsQXBwbGljYXRvci5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fc2xpY2UuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvY3VycnkuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvY3VycnlOLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19jdXJyeU4uanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvbWFwLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19kaXNwYXRjaGFibGUuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2lzVHJhbnNmb3JtZXIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX21hcC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9feG1hcC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9feGZCYXNlLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL3NvcnQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMva2V5cy5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9faGFzLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL21hcE9iakluZGV4ZWQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvY29uY2F0LmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19oYXNNZXRob2QuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvdmFsdWVzLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2Fzc29jUGF0aC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9hc3NvYy5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9zbGljZS5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fY2hlY2tGb3JNZXRob2QuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvcGF0aC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9kZWZhdWx0VG8uanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvam9pbi5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnZva2VyLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2lzLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL3RvU3RyaW5nLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL190b1N0cmluZy5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fY29udGFpbnMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2luZGV4T2YuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvZXF1YWxzLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19lcXVhbHMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaWRlbnRpY2FsLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL3R5cGUuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX3F1b3RlLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL190b0lTT1N0cmluZy5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9yZWplY3QuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2NvbXBsZW1lbnQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvZmlsdGVyLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ludGVybmFsL19maWx0ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX3hmaWx0ZXIuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvdGVzdC5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fY2xvbmVSZWdFeHAuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvZmxhdHRlbi5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fbWFrZUZsYXQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9yYW1kYS9zcmMvcGlwZS5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fcGlwZS5qcyIsIndlYnBhY2s6Ly8vLi9+L3JhbWRhL3NyYy90YWlsLmpzIiwid2VicGFjazovLy8uL34vcmFtZGEvc3JjL2ZsaXAuanMiLCJ3ZWJwYWNrOi8vLy4vfi9kZWJvdW5jZS9pbmRleC5qcyIsIndlYnBhY2s6Ly8vLi9+L2RlYm91bmNlL34vZGF0ZS1ub3cvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7QUN0Q0EsYUFBWSxDQUFDOzs7OztBQUtiLEtBQUksR0FBRyxHQUFHLG1CQUFPLENBQUMsQ0FBVSxDQUFDO0tBQ3pCLFFBQVEsR0FBRyxtQkFBTyxDQUFDLEVBQVUsQ0FBQyxDQUFDOztBQUVuQyxLQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2hDLE9BQU0sQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNyQyxPQUFNLENBQUMsVUFBVSxFQUFFLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDOztBQUU3QyxVQUFTLE1BQU0sR0FBRztBQUNkLFNBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNkLFNBQUk7QUFDQSxhQUFJLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztNQUM3QyxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ1IsaUJBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUMsU0FBUyxHQUFHLHFGQUFxRixDQUFDO0FBQ3JJLGdCQUFPO01BQ1Y7O0FBRUQsYUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUM5QyxHQUFHLENB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VUFBSyxDQUFDO0FBQUUsY0FBTyxVQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0FBQUUsZ0JBQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFBRSxDQUFDO0FBQ3RGLFVBQUssQ0FBQztBQUFFLGNBQU8sVUFBUyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7QUFBRSxnQkFBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUFFLENBQUM7QUFDMUYsVUFBSyxDQUFDO0FBQUUsY0FBTyxVQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7QUFBRSxnQkFBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUFFLENBQUM7QUFDOUYsVUFBSyxDQUFDO0FBQUUsY0FBTyxVQUFTLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0FBQUUsZ0JBQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFBRSxDQUFDO0FBQ2xHLFVBQUssRUFBRTtBQUFFLGNBQU8sVUFBUyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUU7QUFBRSxnQkFBTyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztRQUFFLENBQUM7QUFDdkc7QUFBUyxhQUFNLElBQUks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QUcsSUFBSSxDQUFDO1FBQ3JDO01BQ0Y7SUFDRixDQUFDOztBQUVGLFVBQU8sU0FBUyxTQUFTLEdBQUc7QUFDMUIsWUFBTyxHQUFHLElBQUksQ0FBQztBQUNmLFNBQUksR0FBRyxTQUFTLENBQUM7QUFDakIsY0FBUyxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFNBQUksT0FBTyxHQUFHLFNBQVMsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUNwQyxTQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sR0FBRyxVQUFVLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ2hELFNBQUksT0FBTyxFQUFFO0FBQ1gsYUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ25DLGNBQU8sR0FBRyxJQUFJLEdBQUcsSUFBSSxDQUFDO01BQ3ZCOztBQUVELFlBQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztFQUNILEM7Ozs7Ozs7O0FDcERELE9BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHOztBQUVoQyxVQUFTLEdBQUcsR0FBRztBQUNYLFlBQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLEVBQUUiLCJmaWxlIjoid2ViLndlYnBhY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDY1OGZhOTJmZjg1NDM4ZjBkNmFmXG4gKiovIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xuLyogZ2xvYmFsIGFjZSwgVml6LCBqc3lhbWwgKi9cblxudmFyIGxpYiA9IHJlcXVpcmUoJy4vbGliLmpzJyksXG4gICAgZGVib3VuY2UgPSByZXF1aXJlKCdkZWJvdW5jZScpO1xuXG52YXIgZWRpdG9yID0gYWNlLmVkaXQoXCJlZGl0b3JcIik7XG5lZGl0b3Iuc2V0VGhlbWUoXCJhY2UvdGhlbWUvbW9ub2thaVwiKTtcbmVkaXRvci5nZXRTZXNzaW9uKCkuc2V0TW9kZShcImFjZS9tb2RlL3lhbWxcIik7XG5cbmZ1bmN0aW9uIHJlZHJhdygpIHtcbiAgICB2YXIganNvbiA9IHt9O1xuICAgIHRyeSB7XG4gICAgICAgIGpzb24gPSBqc3lhbWwuc2FmZUxvYWQoZWRpdG9yLmdldFZhbHVlKCkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkaWFncmFtXCIpLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwiZXJyb3JcIj48aDI+RXJyb3I8L2gyPjxwPllvdXIgWUFNTCBkb2VzIG5vdCBhcHBlYXIgdG8gYmUgdmFsaWQ8L3A+PC9kaXY+JztcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvKiBlc2xpbnQgbmV3LWNhcDogMCAqL1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZGlhZ3JhbVwiKS5pbm5lckhUTUwgPSBWaXooXG4gICAgICAgIGxpYi5nZXREb3RTcmMobGliLnRyYW5zZm9ybShqc29uKSkuam9pbihcIlxcblwiKSxcbiAgICAgICAgXCJzdmdcIlxuICAgICk7XG59XG5cbnJlZHJhdygpO1xuXG5cbmVkaXRvci5nZXRTZXNzaW9uKCkub24oJ2NoYW5nZScsIGRlYm91bmNlKHJlZHJhdywgNzUwKSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3dlYi5qc1xuICoqLyIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgUiA9IHJlcXVpcmUoJ3JlcXVpcmUtcGFydHMnKSgncmFtZGEnLCAnc3JjJywgW1wicGFydGlhbFwiLCBcIm1hcFwiLCBcInNvcnRcIiwgXCJrZXlzXCIsIFwibWFwT2JqSW5kZXhlZFwiLCBcImNvbmNhdFwiLCBcInZhbHVlc1wiLCBcImFzc29jUGF0aFwiLCBcInJlZHVjZVwiLCBcInNsaWNlXCIsIFwicGF0aFwiLCBcImRlZmF1bHRUb1wiLCBcImpvaW5cIiwgXCJmbGF0dGVuXCIsIFwicGlwZVwiLCBcImZsaXBcIl0pO1xuXG5mdW5jdGlvbiB3cml0ZVN1YkdyYXBoRmllbGQodGFibGVuYW1lLCBmaWVsZG5hbWUpIHtcbiAgICByZXR1cm4gXCI8XCIgKyB0YWJsZW5hbWUgKyBcIl9fXCIgKyBmaWVsZG5hbWUgKyBcIj5cIiArIGZpZWxkbmFtZTtcbn1cblxuZnVuY3Rpb24gd3JpdGVUYWJsZSh0YWJsZWRhdGEsIHRhYmxlbmFtZSkge1xuICAgIHZhciBsaW5lcyA9IFtcInN1YmdyYXBoIGNsdXN0ZXJcIiArIHRhYmxlbmFtZSArIFwiIHtcIl07XG4gICAgdmFyIGZpZWxkcyA9IFIuam9pbihcbiAgICAgICAgXCJ8XCIsXG4gICAgICAgIFIubWFwKFxuICAgICAgICAgICAgUi5wYXJ0aWFsKHdyaXRlU3ViR3JhcGhGaWVsZCwgdGFibGVuYW1lKSxcbiAgICAgICAgICAgIFIuc29ydChcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhID09ICdpZCcpIHsgcmV0dXJuIC0xOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChiID09ICdpZCcpIHsgcmV0dXJuIDE7IH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBSLmtleXModGFibGVkYXRhKVxuICAgICAgICAgICAgKVxuICAgICAgICApXG4gICAgKTtcbiAgICBsaW5lcy5wdXNoKCcgIGxhYmVsID0gXCInICsgdGFibGVuYW1lICsgJ1wiOycpO1xuICAgIGxpbmVzLnB1c2goJyAgc3RydWN0JyArIHRhYmxlbmFtZSArICcgW2xhYmVsPVwieycgKyBmaWVsZHMgKyAnfVwiLHNoYXBlPXJlY29yZF07Jyk7XG4gICAgbGluZXMucHVzaChcIn1cIik7XG4gICAgcmV0dXJuIGxpbmVzO1xufVxuXG5mdW5jdGlvbiBmaW5kTGlua3Moc3RydWN0KSB7XG4gICAgdmFyIHIgPSBbXTtcbiAgICBSLm1hcE9iakluZGV4ZWQoZnVuY3Rpb24odGFibGUsIHRhYmxlbmFtZSkge1xuICAgICAgICByZXR1cm4gUi5tYXBPYmpJbmRleGVkKGZ1bmN0aW9uKGZpZWxkLCBmaWVsZG5hbWUpIHtcbiAgICAgICAgICAgIHZhciBsLCBsaW5rcywgY3VycmVudCA9IFtdO1xuICAgICAgICAgICAgbGlua3MgPSBSLmRlZmF1bHRUbyhbXSwgUi5wYXRoKFsnbGlua3MnXSwgZmllbGQpKTtcbiAgICAgICAgICAgIFIubWFwKGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgICAgICAgICBsID0gbGluay50YXJnZXQuc3BsaXQoXCIuXCIpO1xuICAgICAgICAgICAgICAgIGlmIChsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgbC5wdXNoKFwiaWRcIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN1cnJlbnQgPSBSLmNvbmNhdChbdGFibGVuYW1lLCBmaWVsZG5hbWVdLCBsKTtcbiAgICAgICAgICAgICAgICBpZiAobGluay5oYXNPd25Qcm9wZXJ0eSgnZGlhcHJvcHMnKSkge1xuICAgICAgICAgICAgICAgICAgICBjdXJyZW50LnB1c2gobGluay5kaWFwcm9wcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHIucHVzaChjdXJyZW50KTtcbiAgICAgICAgICAgIH0sIGxpbmtzKTtcbiAgICAgICAgfSwgdGFibGUpO1xuICAgIH0sIHN0cnVjdCk7XG4gICAgcmV0dXJuIHI7XG59XG5cbmZ1bmN0aW9uIGFkZExpbmtGaWVsZHMoc3RydWN0KSB7XG4gICAgdmFyIGxpbmtzID0gZmluZExpbmtzKHN0cnVjdCk7XG4gICAgcmV0dXJuIFIucmVkdWNlKGZ1bmN0aW9uKG15U3RydWN0LCBsaW5rKSB7XG4gICAgICAgIHJldHVybiBSLmFzc29jUGF0aChcbiAgICAgICAgICAgIFIuc2xpY2UoMiwgNCwgbGluayksXG4gICAgICAgICAgICBSLmRlZmF1bHRUbyhudWxsLCBSLnBhdGgoUi5zbGljZSgyLCA0LCBsaW5rKSwgbXlTdHJ1Y3QpKSxcbiAgICAgICAgICAgIG15U3RydWN0XG4gICAgICAgICk7XG4gICAgfSwgc3RydWN0LCBsaW5rcyk7XG59XG5cbmZ1bmN0aW9uIHdyaXRlTGluayhsaW5rU3BlYykge1xuXG4gICAgZnVuY3Rpb24gYXNMaW5lUHJvcCh2LCBrKSB7XG4gICAgICAgIHJldHVybiBrICsgJz0nICsgdjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzb3J0ZXIoYSwgYikge1xuICAgICAgICBpZiAoYSA8IGIpIHsgcmV0dXJuIC0xOyB9XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cblxuICAgIHZhciBwcm9wc1N0ciA9ICcnO1xuICAgIGlmIChsaW5rU3BlY1s0XSkge1xuICAgICAgICBwcm9wc1N0ciA9IFIucGlwZShcbiAgICAgICAgICAgIFIubWFwT2JqSW5kZXhlZChhc0xpbmVQcm9wKSxcbiAgICAgICAgICAgIFIudmFsdWVzLFxuICAgICAgICAgICAgUi5zb3J0KHNvcnRlciksXG4gICAgICAgICAgICBSLmpvaW4oJywgJyksXG4gICAgICAgICAgICBSLmNvbmNhdCgnIFsnKSxcbiAgICAgICAgICAgIFIuZmxpcChSLmNvbmNhdCkoXCJdXCIpXG4gICAgICAgICkobGlua1NwZWNbNF0pO1xuICAgIH1cbiAgICByZXR1cm4gUi5qb2luKCcgLT4gJywgW1xuICAgICAgICBSLmpvaW4oJzonLCBbJ3N0cnVjdCcgKyBsaW5rU3BlY1swXSwgbGlua1NwZWNbMF0gKyAnX18nICsgbGlua1NwZWNbMV1dKSxcbiAgICAgICAgUi5qb2luKCc6JywgWydzdHJ1Y3QnICsgbGlua1NwZWNbMl0sIGxpbmtTcGVjWzJdICsgJ19fJyArIGxpbmtTcGVjWzNdXSlcbiAgICBdKSArIHByb3BzU3RyO1xufVxuXG5mdW5jdGlvbiBnZXREb3RTcmMoc3RydWN0KSB7XG4gICAgdmFyIGZpbmFsU3RydWN0ID0gYWRkTGlua0ZpZWxkcyhzdHJ1Y3QpO1xuICAgIHZhciBpbm5lciA9IFIubWFwKGZ1bmN0aW9uKHMpIHsgcmV0dXJuIFwiICBcIiArIHM7IH0sIFIuZmxhdHRlbihbXG4gICAgICAgIFIudmFsdWVzKFIubWFwT2JqSW5kZXhlZCh3cml0ZVRhYmxlLCBmaW5hbFN0cnVjdCkpLFxuICAgICAgICBSLm1hcCh3cml0ZUxpbmssIGZpbmRMaW5rcyhmaW5hbFN0cnVjdCkpXG4gICAgXSkpO1xuICAgIC8vIGlubmVyLnVuc2hpZnQoJ25vZGVzZXAgPSAxOycpO1xuICAgIHJldHVybiBSLmZsYXR0ZW4oWydkaWdyYXBoIGRiIHsnLCBpbm5lciwgJ30nXSk7XG59XG5cbmZ1bmN0aW9uIHRyYW5zZm9ybTEoc3RydWN0KSB7XG4gICAgcmV0dXJuIFIubWFwT2JqSW5kZXhlZChmdW5jdGlvbih0YWJsZSkge1xuICAgICAgICByZXR1cm4gUi5tYXBPYmpJbmRleGVkKGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZpZWxkID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgbGlua3M6IGZpZWxkLnNwbGl0KC8sICovZykgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmaWVsZDtcbiAgICAgICAgfSwgdGFibGUpO1xuICAgIH0sIHN0cnVjdCk7XG59XG5cbmZ1bmN0aW9uIHRyYW5zZm9ybTIoc3RydWN0KSB7XG5cbiAgICBmdW5jdGlvbiBnZXROZXdWYWwobGluaykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBsaW5rID09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdGFyZ2V0OiBsaW5rIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbGluaztcbiAgICB9XG5cbiAgICByZXR1cm4gUi5tYXBPYmpJbmRleGVkKGZ1bmN0aW9uKHRhYmxlKSB7XG4gICAgICAgIHJldHVybiBSLm1hcE9iakluZGV4ZWQoZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgICAgICAgIGlmIChmaWVsZCA9PT0gbnVsbCkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgICAgICAgdmFyIHIgPSBSLmFzc29jUGF0aChcbiAgICAgICAgICAgICAgICBbJ2xpbmtzJ10sXG4gICAgICAgICAgICAgICAgUi5tYXAoXG4gICAgICAgICAgICAgICAgICAgIGdldE5ld1ZhbCxcbiAgICAgICAgICAgICAgICAgICAgUi5kZWZhdWx0VG8oW10sIFIucGF0aChbJ2xpbmtzJ10sIGZpZWxkKSlcbiAgICAgICAgICAgICAgICApLFxuICAgICAgICAgICAgICAgIGZpZWxkXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgaWYgKGZpZWxkLmhhc093blByb3BlcnR5KCdsaW5rJykpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXIubGlua3MpIHsgci5saW5rcyA9IFtdOyB9XG4gICAgICAgICAgICAgICAgci5saW5rcy5wdXNoKGdldE5ld1ZhbChyLmxpbmspKTtcbiAgICAgICAgICAgICAgICBkZWxldGUgci5saW5rO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgIH0sIHRhYmxlKTtcbiAgICB9LCBzdHJ1Y3QpO1xufVxuXG5mdW5jdGlvbiB0cmFuc2Zvcm0oc3RydWN0KSB7XG4gICAgcmV0dXJuIHRyYW5zZm9ybTIodHJhbnNmb3JtMShzdHJ1Y3QpKTtcbn1cblxudHJhbnNmb3JtLnRyYW5zZm9ybTEgPSB0cmFuc2Zvcm0xO1xudHJhbnNmb3JtLnRyYW5zZm9ybTIgPSB0cmFuc2Zvcm0yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB3cml0ZVRhYmxlOiB3cml0ZVRhYmxlLFxuICAgIGFkZExpbmtGaWVsZHM6IGFkZExpbmtGaWVsZHMsXG4gICAgZmluZExpbmtzOiBmaW5kTGlua3MsXG4gICAgd3JpdGVMaW5rOiB3cml0ZUxpbmssXG4gICAgZ2V0RG90U3JjOiBnZXREb3RTcmMsXG4gICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm1cbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL2xpYi5qc1xuICoqLyIsInZhciBfY3VycnkzID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkzJyk7XG52YXIgX3JlZHVjZSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX3JlZHVjZScpO1xuXG5cbi8qKlxuICogUmV0dXJucyBhIHNpbmdsZSBpdGVtIGJ5IGl0ZXJhdGluZyB0aHJvdWdoIHRoZSBsaXN0LCBzdWNjZXNzaXZlbHkgY2FsbGluZyB0aGUgaXRlcmF0b3JcbiAqIGZ1bmN0aW9uIGFuZCBwYXNzaW5nIGl0IGFuIGFjY3VtdWxhdG9yIHZhbHVlIGFuZCB0aGUgY3VycmVudCB2YWx1ZSBmcm9tIHRoZSBhcnJheSwgYW5kXG4gKiB0aGVuIHBhc3NpbmcgdGhlIHJlc3VsdCB0byB0aGUgbmV4dCBjYWxsLlxuICpcbiAqIFRoZSBpdGVyYXRvciBmdW5jdGlvbiByZWNlaXZlcyB0d28gdmFsdWVzOiAqKGFjYywgdmFsdWUpKi4gIEl0IG1heSB1c2UgYFIucmVkdWNlZGAgdG9cbiAqIHNob3J0Y3V0IHRoZSBpdGVyYXRpb24uXG4gKlxuICogTm90ZTogYFIucmVkdWNlYCBkb2VzIG5vdCBza2lwIGRlbGV0ZWQgb3IgdW5hc3NpZ25lZCBpbmRpY2VzIChzcGFyc2UgYXJyYXlzKSwgdW5saWtlXG4gKiB0aGUgbmF0aXZlIGBBcnJheS5wcm90b3R5cGUucmVkdWNlYCBtZXRob2QuIEZvciBtb3JlIGRldGFpbHMgb24gdGhpcyBiZWhhdmlvciwgc2VlOlxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvcmVkdWNlI0Rlc2NyaXB0aW9uXG4gKiBAc2VlIFIucmVkdWNlZFxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IExpc3RcbiAqIEBzaWcgKGEsYiAtPiBhKSAtPiBhIC0+IFtiXSAtPiBhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24uIFJlY2VpdmVzIHR3byB2YWx1ZXMsIHRoZSBhY2N1bXVsYXRvciBhbmQgdGhlXG4gKiAgICAgICAgY3VycmVudCBlbGVtZW50IGZyb20gdGhlIGFycmF5LlxuICogQHBhcmFtIHsqfSBhY2MgVGhlIGFjY3VtdWxhdG9yIHZhbHVlLlxuICogQHBhcmFtIHtBcnJheX0gbGlzdCBUaGUgbGlzdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcmV0dXJuIHsqfSBUaGUgZmluYWwsIGFjY3VtdWxhdGVkIHZhbHVlLlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIHZhciBudW1iZXJzID0gWzEsIDIsIDNdO1xuICogICAgICB2YXIgYWRkID0gZnVuY3Rpb24oYSwgYikge1xuICogICAgICAgIHJldHVybiBhICsgYjtcbiAqICAgICAgfTtcbiAqXG4gKiAgICAgIFIucmVkdWNlKGFkZCwgMTAsIG51bWJlcnMpOyAvLz0+IDE2XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MyhfcmVkdWNlKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvcmVkdWNlLmpzXG4gKiovIiwidmFyIF9jdXJyeTEgPSByZXF1aXJlKCcuL19jdXJyeTEnKTtcbnZhciBfY3VycnkyID0gcmVxdWlyZSgnLi9fY3VycnkyJyk7XG5cblxuLyoqXG4gKiBPcHRpbWl6ZWQgaW50ZXJuYWwgdGhyZWUtYXJpdHkgY3VycnkgZnVuY3Rpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGN1cnJ5LlxuICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBjdXJyaWVkIGZ1bmN0aW9uLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9jdXJyeTMoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGYzKGEsIGIsIGMpIHtcbiAgICB2YXIgbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKG4gPT09IDApIHtcbiAgICAgIHJldHVybiBmMztcbiAgICB9IGVsc2UgaWYgKG4gPT09IDEgJiYgYSAhPSBudWxsICYmIGFbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gZjM7XG4gICAgfSBlbHNlIGlmIChuID09PSAxKSB7XG4gICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbihiLCBjKSB7IHJldHVybiBmbihhLCBiLCBjKTsgfSk7XG4gICAgfSBlbHNlIGlmIChuID09PSAyICYmIGEgIT0gbnVsbCAmJiBhWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICBiICE9IG51bGwgJiYgYlsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBmMztcbiAgICB9IGVsc2UgaWYgKG4gPT09IDIgJiYgYSAhPSBudWxsICYmIGFbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbihhLCBjKSB7IHJldHVybiBmbihhLCBiLCBjKTsgfSk7XG4gICAgfSBlbHNlIGlmIChuID09PSAyICYmIGIgIT0gbnVsbCAmJiBiWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24oYiwgYykgeyByZXR1cm4gZm4oYSwgYiwgYyk7IH0pO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMikge1xuICAgICAgcmV0dXJuIF9jdXJyeTEoZnVuY3Rpb24oYykgeyByZXR1cm4gZm4oYSwgYiwgYyk7IH0pO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMyAmJiBhICE9IG51bGwgJiYgYVsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYiAhPSBudWxsICYmIGJbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGMgIT0gbnVsbCAmJiBjWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGYzO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMyAmJiBhICE9IG51bGwgJiYgYVsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYiAhPSBudWxsICYmIGJbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbihhLCBiKSB7IHJldHVybiBmbihhLCBiLCBjKTsgfSk7XG4gICAgfSBlbHNlIGlmIChuID09PSAzICYmIGEgIT0gbnVsbCAmJiBhWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICBjICE9IG51bGwgJiYgY1snQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBfY3VycnkyKGZ1bmN0aW9uKGEsIGMpIHsgcmV0dXJuIGZuKGEsIGIsIGMpOyB9KTtcbiAgICB9IGVsc2UgaWYgKG4gPT09IDMgJiYgYiAhPSBudWxsICYmIGJbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGMgIT0gbnVsbCAmJiBjWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24oYiwgYykgeyByZXR1cm4gZm4oYSwgYiwgYyk7IH0pO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMyAmJiBhICE9IG51bGwgJiYgYVsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBfY3VycnkxKGZ1bmN0aW9uKGEpIHsgcmV0dXJuIGZuKGEsIGIsIGMpOyB9KTtcbiAgICB9IGVsc2UgaWYgKG4gPT09IDMgJiYgYiAhPSBudWxsICYmIGJbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gX2N1cnJ5MShmdW5jdGlvbihiKSB7IHJldHVybiBmbihhLCBiLCBjKTsgfSk7XG4gICAgfSBlbHNlIGlmIChuID09PSAzICYmIGMgIT0gbnVsbCAmJiBjWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIF9jdXJyeTEoZnVuY3Rpb24oYykgeyByZXR1cm4gZm4oYSwgYiwgYyk7IH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZm4oYSwgYiwgYyk7XG4gICAgfVxuICB9O1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2N1cnJ5My5qc1xuICoqLyIsIi8qKlxuICogT3B0aW1pemVkIGludGVybmFsIHR3by1hcml0eSBjdXJyeSBmdW5jdGlvbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gY3VycnkuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIGN1cnJpZWQgZnVuY3Rpb24uXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX2N1cnJ5MShmbikge1xuICByZXR1cm4gZnVuY3Rpb24gZjEoYSkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZjE7XG4gICAgfSBlbHNlIGlmIChhICE9IG51bGwgJiYgYVsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBmMTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9O1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2N1cnJ5MS5qc1xuICoqLyIsInZhciBfY3VycnkxID0gcmVxdWlyZSgnLi9fY3VycnkxJyk7XG5cblxuLyoqXG4gKiBPcHRpbWl6ZWQgaW50ZXJuYWwgdHdvLWFyaXR5IGN1cnJ5IGZ1bmN0aW9uLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiB0byBjdXJyeS5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgY3VycmllZCBmdW5jdGlvbi5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfY3VycnkyKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBmMihhLCBiKSB7XG4gICAgdmFyIG4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGlmIChuID09PSAwKSB7XG4gICAgICByZXR1cm4gZjI7XG4gICAgfSBlbHNlIGlmIChuID09PSAxICYmIGEgIT0gbnVsbCAmJiBhWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIGYyO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMSkge1xuICAgICAgcmV0dXJuIF9jdXJyeTEoZnVuY3Rpb24oYikgeyByZXR1cm4gZm4oYSwgYik7IH0pO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMiAmJiBhICE9IG51bGwgJiYgYVsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYiAhPSBudWxsICYmIGJbJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gZjI7XG4gICAgfSBlbHNlIGlmIChuID09PSAyICYmIGEgIT0gbnVsbCAmJiBhWydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSA9PT0gdHJ1ZSkge1xuICAgICAgcmV0dXJuIF9jdXJyeTEoZnVuY3Rpb24oYSkgeyByZXR1cm4gZm4oYSwgYik7IH0pO1xuICAgIH0gZWxzZSBpZiAobiA9PT0gMiAmJiBiICE9IG51bGwgJiYgYlsnQEBmdW5jdGlvbmFsL3BsYWNlaG9sZGVyJ10gPT09IHRydWUpIHtcbiAgICAgIHJldHVybiBfY3VycnkxKGZ1bmN0aW9uKGIpIHsgcmV0dXJuIGZuKGEsIGIpOyB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZuKGEsIGIpO1xuICAgIH1cbiAgfTtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19jdXJyeTIuanNcbiAqKi8iLCJ2YXIgX3h3cmFwID0gcmVxdWlyZSgnLi9feHdyYXAnKTtcbnZhciBiaW5kID0gcmVxdWlyZSgnLi4vYmluZCcpO1xudmFyIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi4vaXNBcnJheUxpa2UnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gX2FycmF5UmVkdWNlKHhmLCBhY2MsIGxpc3QpIHtcbiAgICB2YXIgaWR4ID0gMCwgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgICAgYWNjID0geGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10oYWNjLCBsaXN0W2lkeF0pO1xuICAgICAgaWYgKGFjYyAmJiBhY2NbJ0BAdHJhbnNkdWNlci9yZWR1Y2VkJ10pIHtcbiAgICAgICAgYWNjID0gYWNjWydAQHRyYW5zZHVjZXIvdmFsdWUnXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpZHggKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIHhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10oYWNjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9pdGVyYWJsZVJlZHVjZSh4ZiwgYWNjLCBpdGVyKSB7XG4gICAgdmFyIHN0ZXAgPSBpdGVyLm5leHQoKTtcbiAgICB3aGlsZSAoIXN0ZXAuZG9uZSkge1xuICAgICAgYWNjID0geGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10oYWNjLCBzdGVwLnZhbHVlKTtcbiAgICAgIGlmIChhY2MgJiYgYWNjWydAQHRyYW5zZHVjZXIvcmVkdWNlZCddKSB7XG4gICAgICAgIGFjYyA9IGFjY1snQEB0cmFuc2R1Y2VyL3ZhbHVlJ107XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgc3RlcCA9IGl0ZXIubmV4dCgpO1xuICAgIH1cbiAgICByZXR1cm4geGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShhY2MpO1xuICB9XG5cbiAgZnVuY3Rpb24gX21ldGhvZFJlZHVjZSh4ZiwgYWNjLCBvYmopIHtcbiAgICByZXR1cm4geGZbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXShvYmoucmVkdWNlKGJpbmQoeGZbJ0BAdHJhbnNkdWNlci9zdGVwJ10sIHhmKSwgYWNjKSk7XG4gIH1cblxuICB2YXIgc3ltSXRlcmF0b3IgPSAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcpID8gU3ltYm9sLml0ZXJhdG9yIDogJ0BAaXRlcmF0b3InO1xuICByZXR1cm4gZnVuY3Rpb24gX3JlZHVjZShmbiwgYWNjLCBsaXN0KSB7XG4gICAgaWYgKHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZm4gPSBfeHdyYXAoZm4pO1xuICAgIH1cbiAgICBpZiAoaXNBcnJheUxpa2UobGlzdCkpIHtcbiAgICAgIHJldHVybiBfYXJyYXlSZWR1Y2UoZm4sIGFjYywgbGlzdCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbGlzdC5yZWR1Y2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBfbWV0aG9kUmVkdWNlKGZuLCBhY2MsIGxpc3QpO1xuICAgIH1cbiAgICBpZiAobGlzdFtzeW1JdGVyYXRvcl0gIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIF9pdGVyYWJsZVJlZHVjZShmbiwgYWNjLCBsaXN0W3N5bUl0ZXJhdG9yXSgpKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBsaXN0Lm5leHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBfaXRlcmFibGVSZWR1Y2UoZm4sIGFjYywgbGlzdCk7XG4gICAgfVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3JlZHVjZTogbGlzdCBtdXN0IGJlIGFycmF5IG9yIGl0ZXJhYmxlJyk7XG4gIH07XG59KSgpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fcmVkdWNlLmpzXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG4gIGZ1bmN0aW9uIFhXcmFwKGZuKSB7XG4gICAgdGhpcy5mID0gZm47XG4gIH1cbiAgWFdyYXAucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdpbml0IG5vdCBpbXBsZW1lbnRlZCBvbiBYV3JhcCcpO1xuICB9O1xuICBYV3JhcC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IGZ1bmN0aW9uKGFjYykgeyByZXR1cm4gYWNjOyB9O1xuICBYV3JhcC5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPSBmdW5jdGlvbihhY2MsIHgpIHtcbiAgICByZXR1cm4gdGhpcy5mKGFjYywgeCk7XG4gIH07XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIF94d3JhcChmbikgeyByZXR1cm4gbmV3IFhXcmFwKGZuKTsgfTtcbn0oKSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL194d3JhcC5qc1xuICoqLyIsInZhciBfYXJpdHkgPSByZXF1aXJlKCcuL2ludGVybmFsL19hcml0eScpO1xudmFyIF9jdXJyeTIgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTInKTtcblxuXG4vKipcbiAqIENyZWF0ZXMgYSBmdW5jdGlvbiB0aGF0IGlzIGJvdW5kIHRvIGEgY29udGV4dC5cbiAqIE5vdGU6IGBSLmJpbmRgIGRvZXMgbm90IHByb3ZpZGUgdGhlIGFkZGl0aW9uYWwgYXJndW1lbnQtYmluZGluZyBjYXBhYmlsaXRpZXMgb2ZcbiAqIFtGdW5jdGlvbi5wcm90b3R5cGUuYmluZF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRnVuY3Rpb24vYmluZCkuXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBjYXRlZ29yeSBPYmplY3RcbiAqIEBzZWUgUi5wYXJ0aWFsXG4gKiBAc2lnICgqIC0+ICopIC0+IHsqfSAtPiAoKiAtPiAqKVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGJpbmQgdG8gY29udGV4dFxuICogQHBhcmFtIHtPYmplY3R9IHRoaXNPYmogVGhlIGNvbnRleHQgdG8gYmluZCBgZm5gIHRvXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBmdW5jdGlvbiB0aGF0IHdpbGwgZXhlY3V0ZSBpbiB0aGUgY29udGV4dCBvZiBgdGhpc09iamAuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MihmdW5jdGlvbiBiaW5kKGZuLCB0aGlzT2JqKSB7XG4gIHJldHVybiBfYXJpdHkoZm4ubGVuZ3RoLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZm4uYXBwbHkodGhpc09iaiwgYXJndW1lbnRzKTtcbiAgfSk7XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvYmluZC5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX2FyaXR5KG4sIGZuKSB7XG4gIC8vIGpzaGludCB1bnVzZWQ6dmFyc1xuICBzd2l0Y2ggKG4pIHtcbiAgICBjYXNlIDA6IHJldHVybiBmdW5jdGlvbigpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG4gICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24oYTApIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG4gICAgY2FzZSAyOiByZXR1cm4gZnVuY3Rpb24oYTAsIGExKSB7IHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9O1xuICAgIGNhc2UgMzogcmV0dXJuIGZ1bmN0aW9uKGEwLCBhMSwgYTIpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG4gICAgY2FzZSA0OiByZXR1cm4gZnVuY3Rpb24oYTAsIGExLCBhMiwgYTMpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG4gICAgY2FzZSA1OiByZXR1cm4gZnVuY3Rpb24oYTAsIGExLCBhMiwgYTMsIGE0KSB7IHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9O1xuICAgIGNhc2UgNjogcmV0dXJuIGZ1bmN0aW9uKGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG4gICAgY2FzZSA3OiByZXR1cm4gZnVuY3Rpb24oYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG4gICAgY2FzZSA4OiByZXR1cm4gZnVuY3Rpb24oYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYsIGE3KSB7IHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9O1xuICAgIGNhc2UgOTogcmV0dXJuIGZ1bmN0aW9uKGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2LCBhNywgYTgpIHsgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG4gICAgY2FzZSAxMDogcmV0dXJuIGZ1bmN0aW9uKGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2LCBhNywgYTgsIGE5KSB7IHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9O1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcignRmlyc3QgYXJndW1lbnQgdG8gX2FyaXR5IG11c3QgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlciBubyBncmVhdGVyIHRoYW4gdGVuJyk7XG4gIH1cbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19hcml0eS5qc1xuICoqLyIsInZhciBfY3VycnkxID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkxJyk7XG52YXIgX2lzQXJyYXkgPSByZXF1aXJlKCcuL2ludGVybmFsL19pc0FycmF5Jyk7XG5cblxuLyoqXG4gKiBUZXN0cyB3aGV0aGVyIG9yIG5vdCBhbiBvYmplY3QgaXMgc2ltaWxhciB0byBhbiBhcnJheS5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBUeXBlXG4gKiBAY2F0ZWdvcnkgTGlzdFxuICogQHNpZyAqIC0+IEJvb2xlYW5cbiAqIEBwYXJhbSB7Kn0geCBUaGUgb2JqZWN0IHRvIHRlc3QuXG4gKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgYHhgIGhhcyBhIG51bWVyaWMgbGVuZ3RoIHByb3BlcnR5IGFuZCBleHRyZW1lIGluZGljZXMgZGVmaW5lZDsgYGZhbHNlYCBvdGhlcndpc2UuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgUi5pc0FycmF5TGlrZShbXSk7IC8vPT4gdHJ1ZVxuICogICAgICBSLmlzQXJyYXlMaWtlKHRydWUpOyAvLz0+IGZhbHNlXG4gKiAgICAgIFIuaXNBcnJheUxpa2Uoe30pOyAvLz0+IGZhbHNlXG4gKiAgICAgIFIuaXNBcnJheUxpa2Uoe2xlbmd0aDogMTB9KTsgLy89PiBmYWxzZVxuICogICAgICBSLmlzQXJyYXlMaWtlKHswOiAnemVybycsIDk6ICduaW5lJywgbGVuZ3RoOiAxMH0pOyAvLz0+IHRydWVcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkxKGZ1bmN0aW9uIGlzQXJyYXlMaWtlKHgpIHtcbiAgaWYgKF9pc0FycmF5KHgpKSB7IHJldHVybiB0cnVlOyB9XG4gIGlmICgheCkgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHR5cGVvZiB4ICE9PSAnb2JqZWN0JykgeyByZXR1cm4gZmFsc2U7IH1cbiAgaWYgKHggaW5zdGFuY2VvZiBTdHJpbmcpIHsgcmV0dXJuIGZhbHNlOyB9XG4gIGlmICh4Lm5vZGVUeXBlID09PSAxKSB7IHJldHVybiAhIXgubGVuZ3RoOyB9XG4gIGlmICh4Lmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gdHJ1ZTsgfVxuICBpZiAoeC5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHguaGFzT3duUHJvcGVydHkoMCkgJiYgeC5oYXNPd25Qcm9wZXJ0eSh4Lmxlbmd0aCAtIDEpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pc0FycmF5TGlrZS5qc1xuICoqLyIsIi8qKlxuICogVGVzdHMgd2hldGhlciBvciBub3QgYW4gb2JqZWN0IGlzIGFuIGFycmF5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbCBUaGUgb2JqZWN0IHRvIHRlc3QuXG4gKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgYHZhbGAgaXMgYW4gYXJyYXksIGBmYWxzZWAgb3RoZXJ3aXNlLlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIF9pc0FycmF5KFtdKTsgLy89PiB0cnVlXG4gKiAgICAgIF9pc0FycmF5KG51bGwpOyAvLz0+IGZhbHNlXG4gKiAgICAgIF9pc0FycmF5KHt9KTsgLy89PiBmYWxzZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gX2lzQXJyYXkodmFsKSB7XG4gIHJldHVybiAodmFsICE9IG51bGwgJiZcbiAgICAgICAgICB2YWwubGVuZ3RoID49IDAgJiZcbiAgICAgICAgICBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsKSA9PT0gJ1tvYmplY3QgQXJyYXldJyk7XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9faXNBcnJheS5qc1xuICoqLyIsInZhciBfY29uY2F0ID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY29uY2F0Jyk7XG52YXIgX2NyZWF0ZVBhcnRpYWxBcHBsaWNhdG9yID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3JlYXRlUGFydGlhbEFwcGxpY2F0b3InKTtcbnZhciBjdXJyeSA9IHJlcXVpcmUoJy4vY3VycnknKTtcblxuXG4vKipcbiAqIEFjY2VwdHMgYXMgaXRzIGFyZ3VtZW50cyBhIGZ1bmN0aW9uIGFuZCBhbnkgbnVtYmVyIG9mIHZhbHVlcyBhbmQgcmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQsXG4gKiB3aGVuIGludm9rZWQsIGNhbGxzIHRoZSBvcmlnaW5hbCBmdW5jdGlvbiB3aXRoIGFsbCBvZiB0aGUgdmFsdWVzIHByZXBlbmRlZCB0byB0aGVcbiAqIG9yaWdpbmFsIGZ1bmN0aW9uJ3MgYXJndW1lbnRzIGxpc3QuIEluIHNvbWUgbGlicmFyaWVzIHRoaXMgZnVuY3Rpb24gaXMgbmFtZWQgYGFwcGx5TGVmdGAuXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBzaWcgKGEgLT4gYiAtPiAuLi4gLT4gaSAtPiBqIC0+IC4uLiAtPiBtIC0+IG4pIC0+IGEgLT4gYi0+IC4uLiAtPiBpIC0+IChqIC0+IC4uLiAtPiBtIC0+IG4pXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gaW52b2tlLlxuICogQHBhcmFtIHsuLi4qfSBbYXJnc10gQXJndW1lbnRzIHRvIHByZXBlbmQgdG8gYGZuYCB3aGVuIHRoZSByZXR1cm5lZCBmdW5jdGlvbiBpcyBpbnZva2VkLlxuICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGZ1bmN0aW9uIHdyYXBwaW5nIGBmbmAuIFdoZW4gaW52b2tlZCwgaXQgd2lsbCBjYWxsIGBmbmBcbiAqICAgICAgICAgd2l0aCBgYXJnc2AgcHJlcGVuZGVkIHRvIGBmbmAncyBhcmd1bWVudHMgbGlzdC5cbiAqIEBleGFtcGxlXG4gKlxuICogICAgICB2YXIgbXVsdGlwbHkgPSBmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhICogYjsgfTtcbiAqICAgICAgdmFyIGRvdWJsZSA9IFIucGFydGlhbChtdWx0aXBseSwgMik7XG4gKiAgICAgIGRvdWJsZSgyKTsgLy89PiA0XG4gKlxuICogICAgICB2YXIgZ3JlZXQgPSBmdW5jdGlvbihzYWx1dGF0aW9uLCB0aXRsZSwgZmlyc3ROYW1lLCBsYXN0TmFtZSkge1xuICogICAgICAgIHJldHVybiBzYWx1dGF0aW9uICsgJywgJyArIHRpdGxlICsgJyAnICsgZmlyc3ROYW1lICsgJyAnICsgbGFzdE5hbWUgKyAnISc7XG4gKiAgICAgIH07XG4gKiAgICAgIHZhciBzYXlIZWxsbyA9IFIucGFydGlhbChncmVldCwgJ0hlbGxvJyk7XG4gKiAgICAgIHZhciBzYXlIZWxsb1RvTXMgPSBSLnBhcnRpYWwoc2F5SGVsbG8sICdNcy4nKTtcbiAqICAgICAgc2F5SGVsbG9Ub01zKCdKYW5lJywgJ0pvbmVzJyk7IC8vPT4gJ0hlbGxvLCBNcy4gSmFuZSBKb25lcyEnXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gY3VycnkoX2NyZWF0ZVBhcnRpYWxBcHBsaWNhdG9yKF9jb25jYXQpKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvcGFydGlhbC5qc1xuICoqLyIsIi8qKlxuICogUHJpdmF0ZSBgY29uY2F0YCBmdW5jdGlvbiB0byBtZXJnZSB0d28gYXJyYXktbGlrZSBvYmplY3RzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fEFyZ3VtZW50c30gW3NldDE9W11dIEFuIGFycmF5LWxpa2Ugb2JqZWN0LlxuICogQHBhcmFtIHtBcnJheXxBcmd1bWVudHN9IFtzZXQyPVtdXSBBbiBhcnJheS1saWtlIG9iamVjdC5cbiAqIEByZXR1cm4ge0FycmF5fSBBIG5ldywgbWVyZ2VkIGFycmF5LlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIF9jb25jYXQoWzQsIDUsIDZdLCBbMSwgMiwgM10pOyAvLz0+IFs0LCA1LCA2LCAxLCAyLCAzXVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9jb25jYXQoc2V0MSwgc2V0Mikge1xuICBzZXQxID0gc2V0MSB8fCBbXTtcbiAgc2V0MiA9IHNldDIgfHwgW107XG4gIHZhciBpZHg7XG4gIHZhciBsZW4xID0gc2V0MS5sZW5ndGg7XG4gIHZhciBsZW4yID0gc2V0Mi5sZW5ndGg7XG4gIHZhciByZXN1bHQgPSBbXTtcblxuICBpZHggPSAwO1xuICB3aGlsZSAoaWR4IDwgbGVuMSkge1xuICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IHNldDFbaWR4XTtcbiAgICBpZHggKz0gMTtcbiAgfVxuICBpZHggPSAwO1xuICB3aGlsZSAoaWR4IDwgbGVuMikge1xuICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IHNldDJbaWR4XTtcbiAgICBpZHggKz0gMTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2NvbmNhdC5qc1xuICoqLyIsInZhciBfYXJpdHkgPSByZXF1aXJlKCcuL19hcml0eScpO1xudmFyIF9zbGljZSA9IHJlcXVpcmUoJy4vX3NsaWNlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfY3JlYXRlUGFydGlhbEFwcGxpY2F0b3IoY29uY2F0KSB7XG4gIHJldHVybiBmdW5jdGlvbihmbikge1xuICAgIHZhciBhcmdzID0gX3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIF9hcml0eShNYXRoLm1heCgwLCBmbi5sZW5ndGggLSBhcmdzLmxlbmd0aCksIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGNvbmNhdChhcmdzLCBhcmd1bWVudHMpKTtcbiAgICB9KTtcbiAgfTtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19jcmVhdGVQYXJ0aWFsQXBwbGljYXRvci5qc1xuICoqLyIsIi8qKlxuICogQW4gb3B0aW1pemVkLCBwcml2YXRlIGFycmF5IGBzbGljZWAgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7QXJndW1lbnRzfEFycmF5fSBhcmdzIFRoZSBhcnJheSBvciBhcmd1bWVudHMgb2JqZWN0IHRvIGNvbnNpZGVyLlxuICogQHBhcmFtIHtOdW1iZXJ9IFtmcm9tPTBdIFRoZSBhcnJheSBpbmRleCB0byBzbGljZSBmcm9tLCBpbmNsdXNpdmUuXG4gKiBAcGFyYW0ge051bWJlcn0gW3RvPWFyZ3MubGVuZ3RoXSBUaGUgYXJyYXkgaW5kZXggdG8gc2xpY2UgdG8sIGV4Y2x1c2l2ZS5cbiAqIEByZXR1cm4ge0FycmF5fSBBIG5ldywgc2xpY2VkIGFycmF5LlxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIF9zbGljZShbMSwgMiwgMywgNCwgNV0sIDEsIDMpOyAvLz0+IFsyLCAzXVxuICpcbiAqICAgICAgdmFyIGZpcnN0VGhyZWVBcmdzID0gZnVuY3Rpb24oYSwgYiwgYywgZCkge1xuICogICAgICAgIHJldHVybiBfc2xpY2UoYXJndW1lbnRzLCAwLCAzKTtcbiAqICAgICAgfTtcbiAqICAgICAgZmlyc3RUaHJlZUFyZ3MoMSwgMiwgMywgNCk7IC8vPT4gWzEsIDIsIDNdXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX3NsaWNlKGFyZ3MsIGZyb20sIHRvKSB7XG4gIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIGNhc2UgMTogcmV0dXJuIF9zbGljZShhcmdzLCAwLCBhcmdzLmxlbmd0aCk7XG4gICAgY2FzZSAyOiByZXR1cm4gX3NsaWNlKGFyZ3MsIGZyb20sIGFyZ3MubGVuZ3RoKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdmFyIGxpc3QgPSBbXTtcbiAgICAgIHZhciBpZHggPSAwO1xuICAgICAgdmFyIGxlbiA9IE1hdGgubWF4KDAsIE1hdGgubWluKGFyZ3MubGVuZ3RoLCB0bykgLSBmcm9tKTtcbiAgICAgIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICAgICAgbGlzdFtpZHhdID0gYXJnc1tmcm9tICsgaWR4XTtcbiAgICAgICAgaWR4ICs9IDE7XG4gICAgICB9XG4gICAgICByZXR1cm4gbGlzdDtcbiAgfVxufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX3NsaWNlLmpzXG4gKiovIiwidmFyIF9jdXJyeTEgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTEnKTtcbnZhciBjdXJyeU4gPSByZXF1aXJlKCcuL2N1cnJ5TicpO1xuXG5cbi8qKlxuICogUmV0dXJucyBhIGN1cnJpZWQgZXF1aXZhbGVudCBvZiB0aGUgcHJvdmlkZWQgZnVuY3Rpb24uIFRoZSBjdXJyaWVkXG4gKiBmdW5jdGlvbiBoYXMgdHdvIHVudXN1YWwgY2FwYWJpbGl0aWVzLiBGaXJzdCwgaXRzIGFyZ3VtZW50cyBuZWVkbid0XG4gKiBiZSBwcm92aWRlZCBvbmUgYXQgYSB0aW1lLiBJZiBgZmAgaXMgYSB0ZXJuYXJ5IGZ1bmN0aW9uIGFuZCBgZ2AgaXNcbiAqIGBSLmN1cnJ5KGYpYCwgdGhlIGZvbGxvd2luZyBhcmUgZXF1aXZhbGVudDpcbiAqXG4gKiAgIC0gYGcoMSkoMikoMylgXG4gKiAgIC0gYGcoMSkoMiwgMylgXG4gKiAgIC0gYGcoMSwgMikoMylgXG4gKiAgIC0gYGcoMSwgMiwgMylgXG4gKlxuICogU2Vjb25kbHksIHRoZSBzcGVjaWFsIHBsYWNlaG9sZGVyIHZhbHVlIGBSLl9fYCBtYXkgYmUgdXNlZCB0byBzcGVjaWZ5XG4gKiBcImdhcHNcIiwgYWxsb3dpbmcgcGFydGlhbCBhcHBsaWNhdGlvbiBvZiBhbnkgY29tYmluYXRpb24gb2YgYXJndW1lbnRzLFxuICogcmVnYXJkbGVzcyBvZiB0aGVpciBwb3NpdGlvbnMuIElmIGBnYCBpcyBhcyBhYm92ZSBhbmQgYF9gIGlzIGBSLl9fYCxcbiAqIHRoZSBmb2xsb3dpbmcgYXJlIGVxdWl2YWxlbnQ6XG4gKlxuICogICAtIGBnKDEsIDIsIDMpYFxuICogICAtIGBnKF8sIDIsIDMpKDEpYFxuICogICAtIGBnKF8sIF8sIDMpKDEpKDIpYFxuICogICAtIGBnKF8sIF8sIDMpKDEsIDIpYFxuICogICAtIGBnKF8sIDIpKDEpKDMpYFxuICogICAtIGBnKF8sIDIpKDEsIDMpYFxuICogICAtIGBnKF8sIDIpKF8sIDMpKDEpYFxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAc2lnICgqIC0+IGEpIC0+ICgqIC0+IGEpXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gY3VycnkuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBuZXcsIGN1cnJpZWQgZnVuY3Rpb24uXG4gKiBAc2VlIFIuY3VycnlOXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIGFkZEZvdXJOdW1iZXJzID0gZnVuY3Rpb24oYSwgYiwgYywgZCkge1xuICogICAgICAgIHJldHVybiBhICsgYiArIGMgKyBkO1xuICogICAgICB9O1xuICpcbiAqICAgICAgdmFyIGN1cnJpZWRBZGRGb3VyTnVtYmVycyA9IFIuY3VycnkoYWRkRm91ck51bWJlcnMpO1xuICogICAgICB2YXIgZiA9IGN1cnJpZWRBZGRGb3VyTnVtYmVycygxLCAyKTtcbiAqICAgICAgdmFyIGcgPSBmKDMpO1xuICogICAgICBnKDQpOyAvLz0+IDEwXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MShmdW5jdGlvbiBjdXJyeShmbikge1xuICByZXR1cm4gY3VycnlOKGZuLmxlbmd0aCwgZm4pO1xufSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2N1cnJ5LmpzXG4gKiovIiwidmFyIF9hcml0eSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2FyaXR5Jyk7XG52YXIgX2N1cnJ5MSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MScpO1xudmFyIF9jdXJyeTIgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTInKTtcbnZhciBfY3VycnlOID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnlOJyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgY3VycmllZCBlcXVpdmFsZW50IG9mIHRoZSBwcm92aWRlZCBmdW5jdGlvbiwgd2l0aCB0aGVcbiAqIHNwZWNpZmllZCBhcml0eS4gVGhlIGN1cnJpZWQgZnVuY3Rpb24gaGFzIHR3byB1bnVzdWFsIGNhcGFiaWxpdGllcy5cbiAqIEZpcnN0LCBpdHMgYXJndW1lbnRzIG5lZWRuJ3QgYmUgcHJvdmlkZWQgb25lIGF0IGEgdGltZS4gSWYgYGdgIGlzXG4gKiBgUi5jdXJyeU4oMywgZilgLCB0aGUgZm9sbG93aW5nIGFyZSBlcXVpdmFsZW50OlxuICpcbiAqICAgLSBgZygxKSgyKSgzKWBcbiAqICAgLSBgZygxKSgyLCAzKWBcbiAqICAgLSBgZygxLCAyKSgzKWBcbiAqICAgLSBgZygxLCAyLCAzKWBcbiAqXG4gKiBTZWNvbmRseSwgdGhlIHNwZWNpYWwgcGxhY2Vob2xkZXIgdmFsdWUgYFIuX19gIG1heSBiZSB1c2VkIHRvIHNwZWNpZnlcbiAqIFwiZ2Fwc1wiLCBhbGxvd2luZyBwYXJ0aWFsIGFwcGxpY2F0aW9uIG9mIGFueSBjb21iaW5hdGlvbiBvZiBhcmd1bWVudHMsXG4gKiByZWdhcmRsZXNzIG9mIHRoZWlyIHBvc2l0aW9ucy4gSWYgYGdgIGlzIGFzIGFib3ZlIGFuZCBgX2AgaXMgYFIuX19gLFxuICogdGhlIGZvbGxvd2luZyBhcmUgZXF1aXZhbGVudDpcbiAqXG4gKiAgIC0gYGcoMSwgMiwgMylgXG4gKiAgIC0gYGcoXywgMiwgMykoMSlgXG4gKiAgIC0gYGcoXywgXywgMykoMSkoMilgXG4gKiAgIC0gYGcoXywgXywgMykoMSwgMilgXG4gKiAgIC0gYGcoXywgMikoMSkoMylgXG4gKiAgIC0gYGcoXywgMikoMSwgMylgXG4gKiAgIC0gYGcoXywgMikoXywgMykoMSlgXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBzaWcgTnVtYmVyIC0+ICgqIC0+IGEpIC0+ICgqIC0+IGEpXG4gKiBAcGFyYW0ge051bWJlcn0gbGVuZ3RoIFRoZSBhcml0eSBmb3IgdGhlIHJldHVybmVkIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGN1cnJ5LlxuICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3LCBjdXJyaWVkIGZ1bmN0aW9uLlxuICogQHNlZSBSLmN1cnJ5XG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIGFkZEZvdXJOdW1iZXJzID0gZnVuY3Rpb24oKSB7XG4gKiAgICAgICAgcmV0dXJuIFIuc3VtKFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCA0KSk7XG4gKiAgICAgIH07XG4gKlxuICogICAgICB2YXIgY3VycmllZEFkZEZvdXJOdW1iZXJzID0gUi5jdXJyeU4oNCwgYWRkRm91ck51bWJlcnMpO1xuICogICAgICB2YXIgZiA9IGN1cnJpZWRBZGRGb3VyTnVtYmVycygxLCAyKTtcbiAqICAgICAgdmFyIGcgPSBmKDMpO1xuICogICAgICBnKDQpOyAvLz0+IDEwXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MihmdW5jdGlvbiBjdXJyeU4obGVuZ3RoLCBmbikge1xuICBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIF9jdXJyeTEoZm4pO1xuICB9XG4gIHJldHVybiBfYXJpdHkobGVuZ3RoLCBfY3VycnlOKGxlbmd0aCwgW10sIGZuKSk7XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvY3VycnlOLmpzXG4gKiovIiwidmFyIF9hcml0eSA9IHJlcXVpcmUoJy4vX2FyaXR5Jyk7XG5cblxuLyoqXG4gKiBJbnRlcm5hbCBjdXJyeU4gZnVuY3Rpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IGxlbmd0aCBUaGUgYXJpdHkgb2YgdGhlIGN1cnJpZWQgZnVuY3Rpb24uXG4gKiBAcmV0dXJuIHthcnJheX0gQW4gYXJyYXkgb2YgYXJndW1lbnRzIHJlY2VpdmVkIHRodXMgZmFyLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGN1cnJ5LlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9jdXJyeU4obGVuZ3RoLCByZWNlaXZlZCwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBjb21iaW5lZCA9IFtdO1xuICAgIHZhciBhcmdzSWR4ID0gMDtcbiAgICB2YXIgbGVmdCA9IGxlbmd0aDtcbiAgICB2YXIgY29tYmluZWRJZHggPSAwO1xuICAgIHdoaWxlIChjb21iaW5lZElkeCA8IHJlY2VpdmVkLmxlbmd0aCB8fCBhcmdzSWR4IDwgYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgdmFyIHJlc3VsdDtcbiAgICAgIGlmIChjb21iaW5lZElkeCA8IHJlY2VpdmVkLmxlbmd0aCAmJlxuICAgICAgICAgIChyZWNlaXZlZFtjb21iaW5lZElkeF0gPT0gbnVsbCB8fFxuICAgICAgICAgICByZWNlaXZlZFtjb21iaW5lZElkeF1bJ0BAZnVuY3Rpb25hbC9wbGFjZWhvbGRlciddICE9PSB0cnVlIHx8XG4gICAgICAgICAgIGFyZ3NJZHggPj0gYXJndW1lbnRzLmxlbmd0aCkpIHtcbiAgICAgICAgcmVzdWx0ID0gcmVjZWl2ZWRbY29tYmluZWRJZHhdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gYXJndW1lbnRzW2FyZ3NJZHhdO1xuICAgICAgICBhcmdzSWR4ICs9IDE7XG4gICAgICB9XG4gICAgICBjb21iaW5lZFtjb21iaW5lZElkeF0gPSByZXN1bHQ7XG4gICAgICBpZiAocmVzdWx0ID09IG51bGwgfHwgcmVzdWx0WydAQGZ1bmN0aW9uYWwvcGxhY2Vob2xkZXInXSAhPT0gdHJ1ZSkge1xuICAgICAgICBsZWZ0IC09IDE7XG4gICAgICB9XG4gICAgICBjb21iaW5lZElkeCArPSAxO1xuICAgIH1cbiAgICByZXR1cm4gbGVmdCA8PSAwID8gZm4uYXBwbHkodGhpcywgY29tYmluZWQpIDogX2FyaXR5KGxlZnQsIF9jdXJyeU4obGVuZ3RoLCBjb21iaW5lZCwgZm4pKTtcbiAgfTtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19jdXJyeU4uanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MiA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MicpO1xudmFyIF9kaXNwYXRjaGFibGUgPSByZXF1aXJlKCcuL2ludGVybmFsL19kaXNwYXRjaGFibGUnKTtcbnZhciBfbWFwID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fbWFwJyk7XG52YXIgX3htYXAgPSByZXF1aXJlKCcuL2ludGVybmFsL194bWFwJyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IGxpc3QsIGNvbnN0cnVjdGVkIGJ5IGFwcGx5aW5nIHRoZSBzdXBwbGllZCBmdW5jdGlvbiB0byBldmVyeSBlbGVtZW50IG9mIHRoZVxuICogc3VwcGxpZWQgbGlzdC5cbiAqXG4gKiBOb3RlOiBgUi5tYXBgIGRvZXMgbm90IHNraXAgZGVsZXRlZCBvciB1bmFzc2lnbmVkIGluZGljZXMgKHNwYXJzZSBhcnJheXMpLCB1bmxpa2UgdGhlXG4gKiBuYXRpdmUgYEFycmF5LnByb3RvdHlwZS5tYXBgIG1ldGhvZC4gRm9yIG1vcmUgZGV0YWlscyBvbiB0aGlzIGJlaGF2aW9yLCBzZWU6XG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9tYXAjRGVzY3JpcHRpb25cbiAqXG4gKiBBY3RzIGFzIGEgdHJhbnNkdWNlciBpZiBhIHRyYW5zZm9ybWVyIGlzIGdpdmVuIGluIGxpc3QgcG9zaXRpb24uXG4gKiBAc2VlIFIudHJhbnNkdWNlXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgTGlzdFxuICogQHNpZyAoYSAtPiBiKSAtPiBbYV0gLT4gW2JdXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGV2ZXJ5IGVsZW1lbnQgb2YgdGhlIGlucHV0IGBsaXN0YC5cbiAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gYmUgaXRlcmF0ZWQgb3Zlci5cbiAqIEByZXR1cm4ge0FycmF5fSBUaGUgbmV3IGxpc3QuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIGRvdWJsZSA9IGZ1bmN0aW9uKHgpIHtcbiAqICAgICAgICByZXR1cm4geCAqIDI7XG4gKiAgICAgIH07XG4gKlxuICogICAgICBSLm1hcChkb3VibGUsIFsxLCAyLCAzXSk7IC8vPT4gWzIsIDQsIDZdXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MihfZGlzcGF0Y2hhYmxlKCdtYXAnLCBfeG1hcCwgX21hcCkpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9tYXAuanNcbiAqKi8iLCJ2YXIgX2lzQXJyYXkgPSByZXF1aXJlKCcuL19pc0FycmF5Jyk7XG52YXIgX2lzVHJhbnNmb3JtZXIgPSByZXF1aXJlKCcuL19pc1RyYW5zZm9ybWVyJyk7XG52YXIgX3NsaWNlID0gcmVxdWlyZSgnLi9fc2xpY2UnKTtcblxuXG4vKipcbiAqIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGRpc3BhdGNoZXMgd2l0aCBkaWZmZXJlbnQgc3RyYXRlZ2llcyBiYXNlZCBvbiB0aGVcbiAqIG9iamVjdCBpbiBsaXN0IHBvc2l0aW9uIChsYXN0IGFyZ3VtZW50KS4gSWYgaXQgaXMgYW4gYXJyYXksIGV4ZWN1dGVzIFtmbl0uXG4gKiBPdGhlcndpc2UsIGlmIGl0IGhhcyBhICBmdW5jdGlvbiB3aXRoIFttZXRob2RuYW1lXSwgaXQgd2lsbCBleGVjdXRlIHRoYXRcbiAqIGZ1bmN0aW9uIChmdW5jdG9yIGNhc2UpLiBPdGhlcndpc2UsIGlmIGl0IGlzIGEgdHJhbnNmb3JtZXIsIHVzZXMgdHJhbnNkdWNlclxuICogW3hmXSB0byByZXR1cm4gYSBuZXcgdHJhbnNmb3JtZXIgKHRyYW5zZHVjZXIgY2FzZSkuIE90aGVyd2lzZSwgaXQgd2lsbFxuICogZGVmYXVsdCB0byBleGVjdXRpbmcgW2ZuXS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZG5hbWUgcHJvcGVydHkgdG8gY2hlY2sgZm9yIGEgY3VzdG9tIGltcGxlbWVudGF0aW9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB4ZiB0cmFuc2R1Y2VyIHRvIGluaXRpYWxpemUgaWYgb2JqZWN0IGlzIHRyYW5zZm9ybWVyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBkZWZhdWx0IHJhbWRhIGltcGxlbWVudGF0aW9uXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBmdW5jdGlvbiB0aGF0IGRpc3BhdGNoZXMgb24gb2JqZWN0IGluIGxpc3QgcG9zaXRpb25cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfZGlzcGF0Y2hhYmxlKG1ldGhvZG5hbWUsIHhmLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKGxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZuKCk7XG4gICAgfVxuICAgIHZhciBvYmogPSBhcmd1bWVudHNbbGVuZ3RoIC0gMV07XG4gICAgaWYgKCFfaXNBcnJheShvYmopKSB7XG4gICAgICB2YXIgYXJncyA9IF9zbGljZShhcmd1bWVudHMsIDAsIGxlbmd0aCAtIDEpO1xuICAgICAgaWYgKHR5cGVvZiBvYmpbbWV0aG9kbmFtZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG9ialttZXRob2RuYW1lXS5hcHBseShvYmosIGFyZ3MpO1xuICAgICAgfVxuICAgICAgaWYgKF9pc1RyYW5zZm9ybWVyKG9iaikpIHtcbiAgICAgICAgdmFyIHRyYW5zZHVjZXIgPSB4Zi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHRyYW5zZHVjZXIob2JqKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fZGlzcGF0Y2hhYmxlLmpzXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfaXNUcmFuc2Zvcm1lcihvYmopIHtcbiAgcmV0dXJuIHR5cGVvZiBvYmpbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPT09ICdmdW5jdGlvbic7XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9faXNUcmFuc2Zvcm1lci5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX21hcChmbiwgbGlzdCkge1xuICB2YXIgaWR4ID0gMCwgbGVuID0gbGlzdC5sZW5ndGgsIHJlc3VsdCA9IEFycmF5KGxlbik7XG4gIHdoaWxlIChpZHggPCBsZW4pIHtcbiAgICByZXN1bHRbaWR4XSA9IGZuKGxpc3RbaWR4XSk7XG4gICAgaWR4ICs9IDE7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19tYXAuanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MiA9IHJlcXVpcmUoJy4vX2N1cnJ5MicpO1xudmFyIF94ZkJhc2UgPSByZXF1aXJlKCcuL194ZkJhc2UnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gWE1hcChmLCB4Zikge1xuICAgIHRoaXMueGYgPSB4ZjtcbiAgICB0aGlzLmYgPSBmO1xuICB9XG4gIFhNYXAucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICBYTWFwLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gX3hmQmFzZS5yZXN1bHQ7XG4gIFhNYXAucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24ocmVzdWx0LCBpbnB1dCkge1xuICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvc3RlcCddKHJlc3VsdCwgdGhpcy5mKGlucHV0KSk7XG4gIH07XG5cbiAgcmV0dXJuIF9jdXJyeTIoZnVuY3Rpb24gX3htYXAoZiwgeGYpIHsgcmV0dXJuIG5ldyBYTWFwKGYsIHhmKTsgfSk7XG59KSgpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9feG1hcC5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL2luaXQnXSgpO1xuICB9LFxuICByZXN1bHQ6IGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgIHJldHVybiB0aGlzLnhmWydAQHRyYW5zZHVjZXIvcmVzdWx0J10ocmVzdWx0KTtcbiAgfVxufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX3hmQmFzZS5qc1xuICoqLyIsInZhciBfY3VycnkyID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkyJyk7XG52YXIgX3NsaWNlID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fc2xpY2UnKTtcblxuXG4vKipcbiAqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBsaXN0LCBzb3J0ZWQgYWNjb3JkaW5nIHRvIHRoZSBjb21wYXJhdG9yIGZ1bmN0aW9uLCB3aGljaCBzaG91bGQgYWNjZXB0IHR3byB2YWx1ZXMgYXQgYVxuICogdGltZSBhbmQgcmV0dXJuIGEgbmVnYXRpdmUgbnVtYmVyIGlmIHRoZSBmaXJzdCB2YWx1ZSBpcyBzbWFsbGVyLCBhIHBvc2l0aXZlIG51bWJlciBpZiBpdCdzIGxhcmdlciwgYW5kIHplcm9cbiAqIGlmIHRoZXkgYXJlIGVxdWFsLiAgUGxlYXNlIG5vdGUgdGhhdCB0aGlzIGlzIGEgKipjb3B5Kiogb2YgdGhlIGxpc3QuICBJdCBkb2VzIG5vdCBtb2RpZnkgdGhlIG9yaWdpbmFsLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IExpc3RcbiAqIEBzaWcgKGEsYSAtPiBOdW1iZXIpIC0+IFthXSAtPiBbYV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBhcmF0b3IgQSBzb3J0aW5nIGZ1bmN0aW9uIDo6IGEgLT4gYiAtPiBJbnRcbiAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGxpc3QgdG8gc29ydFxuICogQHJldHVybiB7QXJyYXl9IGEgbmV3IGFycmF5IHdpdGggaXRzIGVsZW1lbnRzIHNvcnRlZCBieSB0aGUgY29tcGFyYXRvciBmdW5jdGlvbi5cbiAqIEBleGFtcGxlXG4gKlxuICogICAgICB2YXIgZGlmZiA9IGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEgLSBiOyB9O1xuICogICAgICBSLnNvcnQoZGlmZiwgWzQsMiw3LDVdKTsgLy89PiBbMiwgNCwgNSwgN11cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkyKGZ1bmN0aW9uIHNvcnQoY29tcGFyYXRvciwgbGlzdCkge1xuICByZXR1cm4gX3NsaWNlKGxpc3QpLnNvcnQoY29tcGFyYXRvcik7XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvc29ydC5qc1xuICoqLyIsInZhciBfY3VycnkxID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkxJyk7XG52YXIgX2hhcyA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2hhcycpO1xuXG5cbi8qKlxuICogUmV0dXJucyBhIGxpc3QgY29udGFpbmluZyB0aGUgbmFtZXMgb2YgYWxsIHRoZSBlbnVtZXJhYmxlIG93blxuICogcHJvcGVydGllcyBvZiB0aGUgc3VwcGxpZWQgb2JqZWN0LlxuICogTm90ZSB0aGF0IHRoZSBvcmRlciBvZiB0aGUgb3V0cHV0IGFycmF5IGlzIG5vdCBndWFyYW50ZWVkIHRvIGJlXG4gKiBjb25zaXN0ZW50IGFjcm9zcyBkaWZmZXJlbnQgSlMgcGxhdGZvcm1zLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHNpZyB7azogdn0gLT4gW2tdXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gZXh0cmFjdCBwcm9wZXJ0aWVzIGZyb21cbiAqIEByZXR1cm4ge0FycmF5fSBBbiBhcnJheSBvZiB0aGUgb2JqZWN0J3Mgb3duIHByb3BlcnRpZXMuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgUi5rZXlzKHthOiAxLCBiOiAyLCBjOiAzfSk7IC8vPT4gWydhJywgJ2InLCAnYyddXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICAvLyBjb3ZlciBJRSA8IDkga2V5cyBpc3N1ZXNcbiAgdmFyIGhhc0VudW1CdWcgPSAhKHt0b1N0cmluZzogbnVsbH0pLnByb3BlcnR5SXNFbnVtZXJhYmxlKCd0b1N0cmluZycpO1xuICB2YXIgbm9uRW51bWVyYWJsZVByb3BzID0gWydjb25zdHJ1Y3RvcicsICd2YWx1ZU9mJywgJ2lzUHJvdG90eXBlT2YnLCAndG9TdHJpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdwcm9wZXJ0eUlzRW51bWVyYWJsZScsICdoYXNPd25Qcm9wZXJ0eScsICd0b0xvY2FsZVN0cmluZyddO1xuXG4gIHZhciBjb250YWlucyA9IGZ1bmN0aW9uIGNvbnRhaW5zKGxpc3QsIGl0ZW0pIHtcbiAgICB2YXIgaWR4ID0gMDtcbiAgICB3aGlsZSAoaWR4IDwgbGlzdC5sZW5ndGgpIHtcbiAgICAgIGlmIChsaXN0W2lkeF0gPT09IGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBpZHggKz0gMTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG4gIHJldHVybiB0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbicgP1xuICAgIF9jdXJyeTEoZnVuY3Rpb24ga2V5cyhvYmopIHtcbiAgICAgIHJldHVybiBPYmplY3Qob2JqKSAhPT0gb2JqID8gW10gOiBPYmplY3Qua2V5cyhvYmopO1xuICAgIH0pIDpcbiAgICBfY3VycnkxKGZ1bmN0aW9uIGtleXMob2JqKSB7XG4gICAgICBpZiAoT2JqZWN0KG9iaikgIT09IG9iaikge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG4gICAgICB2YXIgcHJvcCwga3MgPSBbXSwgbklkeDtcbiAgICAgIGZvciAocHJvcCBpbiBvYmopIHtcbiAgICAgICAgaWYgKF9oYXMocHJvcCwgb2JqKSkge1xuICAgICAgICAgIGtzW2tzLmxlbmd0aF0gPSBwcm9wO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaGFzRW51bUJ1Zykge1xuICAgICAgICBuSWR4ID0gbm9uRW51bWVyYWJsZVByb3BzLmxlbmd0aCAtIDE7XG4gICAgICAgIHdoaWxlIChuSWR4ID49IDApIHtcbiAgICAgICAgICBwcm9wID0gbm9uRW51bWVyYWJsZVByb3BzW25JZHhdO1xuICAgICAgICAgIGlmIChfaGFzKHByb3AsIG9iaikgJiYgIWNvbnRhaW5zKGtzLCBwcm9wKSkge1xuICAgICAgICAgICAga3Nba3MubGVuZ3RoXSA9IHByb3A7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5JZHggLT0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGtzO1xuICAgIH0pO1xufSgpKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMva2V5cy5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX2hhcyhwcm9wLCBvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2hhcy5qc1xuICoqLyIsInZhciBfY3VycnkyID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkyJyk7XG52YXIgX3JlZHVjZSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX3JlZHVjZScpO1xudmFyIGtleXMgPSByZXF1aXJlKCcuL2tleXMnKTtcblxuXG4vKipcbiAqIExpa2UgYG1hcE9iamAsIGJ1dCBidXQgcGFzc2VzIGFkZGl0aW9uYWwgYXJndW1lbnRzIHRvIHRoZSBwcmVkaWNhdGUgZnVuY3Rpb24uIFRoZVxuICogcHJlZGljYXRlIGZ1bmN0aW9uIGlzIHBhc3NlZCB0aHJlZSBhcmd1bWVudHM6ICoodmFsdWUsIGtleSwgb2JqKSouXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAc2lnICh2LCBrLCB7azogdn0gLT4gdikgLT4ge2s6IHZ9IC0+IHtrOiB2fVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gQSBmdW5jdGlvbiBjYWxsZWQgZm9yIGVhY2ggcHJvcGVydHkgaW4gYG9iamAuIEl0cyByZXR1cm4gdmFsdWUgd2lsbFxuICogICAgICAgIGJlY29tZSBhIG5ldyBwcm9wZXJ0eSBvbiB0aGUgcmV0dXJuIG9iamVjdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBpdGVyYXRlIG92ZXIuXG4gKiBAcmV0dXJuIHtPYmplY3R9IEEgbmV3IG9iamVjdCB3aXRoIHRoZSBzYW1lIGtleXMgYXMgYG9iamAgYW5kIHZhbHVlcyB0aGF0IGFyZSB0aGUgcmVzdWx0XG4gKiAgICAgICAgIG9mIHJ1bm5pbmcgZWFjaCBwcm9wZXJ0eSB0aHJvdWdoIGBmbmAuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIHZhbHVlcyA9IHsgeDogMSwgeTogMiwgejogMyB9O1xuICogICAgICB2YXIgcHJlcGVuZEtleUFuZERvdWJsZSA9IGZ1bmN0aW9uKG51bSwga2V5LCBvYmopIHtcbiAqICAgICAgICByZXR1cm4ga2V5ICsgKG51bSAqIDIpO1xuICogICAgICB9O1xuICpcbiAqICAgICAgUi5tYXBPYmpJbmRleGVkKHByZXBlbmRLZXlBbmREb3VibGUsIHZhbHVlcyk7IC8vPT4geyB4OiAneDInLCB5OiAneTQnLCB6OiAnejYnIH1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkyKGZ1bmN0aW9uIG1hcE9iakluZGV4ZWQoZm4sIG9iaikge1xuICByZXR1cm4gX3JlZHVjZShmdW5jdGlvbihhY2MsIGtleSkge1xuICAgIGFjY1trZXldID0gZm4ob2JqW2tleV0sIGtleSwgb2JqKTtcbiAgICByZXR1cm4gYWNjO1xuICB9LCB7fSwga2V5cyhvYmopKTtcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9tYXBPYmpJbmRleGVkLmpzXG4gKiovIiwidmFyIF9jb25jYXQgPSByZXF1aXJlKCcuL2ludGVybmFsL19jb25jYXQnKTtcbnZhciBfY3VycnkyID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkyJyk7XG52YXIgX2hhc01ldGhvZCA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2hhc01ldGhvZCcpO1xudmFyIF9pc0FycmF5ID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9faXNBcnJheScpO1xuXG5cbi8qKlxuICogUmV0dXJucyBhIG5ldyBsaXN0IGNvbnNpc3Rpbmcgb2YgdGhlIGVsZW1lbnRzIG9mIHRoZSBmaXJzdCBsaXN0IGZvbGxvd2VkIGJ5IHRoZSBlbGVtZW50c1xuICogb2YgdGhlIHNlY29uZC5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBMaXN0XG4gKiBAc2lnIFthXSAtPiBbYV0gLT4gW2FdXG4gKiBAcGFyYW0ge0FycmF5fSBsaXN0MSBUaGUgZmlyc3QgbGlzdCB0byBtZXJnZS5cbiAqIEBwYXJhbSB7QXJyYXl9IGxpc3QyIFRoZSBzZWNvbmQgc2V0IHRvIG1lcmdlLlxuICogQHJldHVybiB7QXJyYXl9IEEgbmV3IGFycmF5IGNvbnNpc3Rpbmcgb2YgdGhlIGNvbnRlbnRzIG9mIGBsaXN0MWAgZm9sbG93ZWQgYnkgdGhlXG4gKiAgICAgICAgIGNvbnRlbnRzIG9mIGBsaXN0MmAuIElmLCBpbnN0ZWFkIG9mIGFuIEFycmF5IGZvciBgbGlzdDFgLCB5b3UgcGFzcyBhblxuICogICAgICAgICBvYmplY3Qgd2l0aCBhIGBjb25jYXRgIG1ldGhvZCBvbiBpdCwgYGNvbmNhdGAgd2lsbCBjYWxsIGBsaXN0MS5jb25jYXRgXG4gKiAgICAgICAgIGFuZCBwYXNzIGl0IHRoZSB2YWx1ZSBvZiBgbGlzdDJgLlxuICpcbiAqIEBleGFtcGxlXG4gKlxuICogICAgICBSLmNvbmNhdChbXSwgW10pOyAvLz0+IFtdXG4gKiAgICAgIFIuY29uY2F0KFs0LCA1LCA2XSwgWzEsIDIsIDNdKTsgLy89PiBbNCwgNSwgNiwgMSwgMiwgM11cbiAqICAgICAgUi5jb25jYXQoJ0FCQycsICdERUYnKTsgLy8gJ0FCQ0RFRidcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkyKGZ1bmN0aW9uIGNvbmNhdChzZXQxLCBzZXQyKSB7XG4gIGlmIChfaXNBcnJheShzZXQyKSkge1xuICAgIHJldHVybiBfY29uY2F0KHNldDEsIHNldDIpO1xuICB9IGVsc2UgaWYgKF9oYXNNZXRob2QoJ2NvbmNhdCcsIHNldDEpKSB7XG4gICAgcmV0dXJuIHNldDEuY29uY2F0KHNldDIpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJjYW4ndCBjb25jYXQgXCIgKyB0eXBlb2Ygc2V0MSk7XG4gIH1cbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9jb25jYXQuanNcbiAqKi8iLCJ2YXIgX2lzQXJyYXkgPSByZXF1aXJlKCcuL19pc0FycmF5Jyk7XG5cblxuLyoqXG4gKiBQcml2YXRlIGZ1bmN0aW9uIHRoYXQgZGV0ZXJtaW5lcyB3aGV0aGVyIG9yIG5vdCBhIHByb3ZpZGVkIG9iamVjdCBoYXMgYSBnaXZlbiBtZXRob2QuXG4gKiBEb2VzIG5vdCBpZ25vcmUgbWV0aG9kcyBzdG9yZWQgb24gdGhlIG9iamVjdCdzIHByb3RvdHlwZSBjaGFpbi4gVXNlZCBmb3IgZHluYW1pY2FsbHlcbiAqIGRpc3BhdGNoaW5nIFJhbWRhIG1ldGhvZHMgdG8gbm9uLUFycmF5IG9iamVjdHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXRob2ROYW1lIFRoZSBuYW1lIG9mIHRoZSBtZXRob2QgdG8gY2hlY2sgZm9yLlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHRlc3QuXG4gKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaGFzIGEgZ2l2ZW4gbWV0aG9kLCBgZmFsc2VgIG90aGVyd2lzZS5cbiAqIEBleGFtcGxlXG4gKlxuICogICAgICB2YXIgcGVyc29uID0geyBuYW1lOiAnSm9obicgfTtcbiAqICAgICAgcGVyc29uLnNob3V0ID0gZnVuY3Rpb24oKSB7IGFsZXJ0KHRoaXMubmFtZSk7IH07XG4gKlxuICogICAgICBfaGFzTWV0aG9kKCdzaG91dCcsIHBlcnNvbik7IC8vPT4gdHJ1ZVxuICogICAgICBfaGFzTWV0aG9kKCdmb28nLCBwZXJzb24pOyAvLz0+IGZhbHNlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX2hhc01ldGhvZChtZXRob2ROYW1lLCBvYmopIHtcbiAgcmV0dXJuIG9iaiAhPSBudWxsICYmICFfaXNBcnJheShvYmopICYmIHR5cGVvZiBvYmpbbWV0aG9kTmFtZV0gPT09ICdmdW5jdGlvbic7XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9faGFzTWV0aG9kLmpzXG4gKiovIiwidmFyIF9jdXJyeTEgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTEnKTtcbnZhciBrZXlzID0gcmVxdWlyZSgnLi9rZXlzJyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgdGhlIGVudW1lcmFibGUgb3duIHByb3BlcnRpZXMgb2YgdGhlIHN1cHBsaWVkIG9iamVjdC5cbiAqIE5vdGUgdGhhdCB0aGUgb3JkZXIgb2YgdGhlIG91dHB1dCBhcnJheSBpcyBub3QgZ3VhcmFudGVlZCBhY3Jvc3NcbiAqIGRpZmZlcmVudCBKUyBwbGF0Zm9ybXMuXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgT2JqZWN0XG4gKiBAc2lnIHtrOiB2fSAtPiBbdl1cbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBleHRyYWN0IHZhbHVlcyBmcm9tXG4gKiBAcmV0dXJuIHtBcnJheX0gQW4gYXJyYXkgb2YgdGhlIHZhbHVlcyBvZiB0aGUgb2JqZWN0J3Mgb3duIHByb3BlcnRpZXMuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgUi52YWx1ZXMoe2E6IDEsIGI6IDIsIGM6IDN9KTsgLy89PiBbMSwgMiwgM11cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkxKGZ1bmN0aW9uIHZhbHVlcyhvYmopIHtcbiAgdmFyIHByb3BzID0ga2V5cyhvYmopO1xuICB2YXIgbGVuID0gcHJvcHMubGVuZ3RoO1xuICB2YXIgdmFscyA9IFtdO1xuICB2YXIgaWR4ID0gMDtcbiAgd2hpbGUgKGlkeCA8IGxlbikge1xuICAgIHZhbHNbaWR4XSA9IG9ialtwcm9wc1tpZHhdXTtcbiAgICBpZHggKz0gMTtcbiAgfVxuICByZXR1cm4gdmFscztcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy92YWx1ZXMuanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MyA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MycpO1xudmFyIF9zbGljZSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX3NsaWNlJyk7XG52YXIgYXNzb2MgPSByZXF1aXJlKCcuL2Fzc29jJyk7XG5cblxuLyoqXG4gKiBNYWtlcyBhIHNoYWxsb3cgY2xvbmUgb2YgYW4gb2JqZWN0LCBzZXR0aW5nIG9yIG92ZXJyaWRpbmcgdGhlIG5vZGVzXG4gKiByZXF1aXJlZCB0byBjcmVhdGUgdGhlIGdpdmVuIHBhdGgsIGFuZCBwbGFjaW5nIHRoZSBzcGVjaWZpYyB2YWx1ZSBhdCB0aGVcbiAqIHRhaWwgZW5kIG9mIHRoYXQgcGF0aC4gIE5vdGUgdGhhdCB0aGlzIGNvcGllcyBhbmQgZmxhdHRlbnMgcHJvdG90eXBlXG4gKiBwcm9wZXJ0aWVzIG9udG8gdGhlIG5ldyBvYmplY3QgYXMgd2VsbC4gIEFsbCBub24tcHJpbWl0aXZlIHByb3BlcnRpZXNcbiAqIGFyZSBjb3BpZWQgYnkgcmVmZXJlbmNlLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHNpZyBbU3RyaW5nXSAtPiBhIC0+IHtrOiB2fSAtPiB7azogdn1cbiAqIEBwYXJhbSB7QXJyYXl9IHBhdGggdGhlIHBhdGggdG8gc2V0XG4gKiBAcGFyYW0geyp9IHZhbCB0aGUgbmV3IHZhbHVlXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIHRoZSBvYmplY3QgdG8gY2xvbmVcbiAqIEByZXR1cm4ge09iamVjdH0gYSBuZXcgb2JqZWN0IHNpbWlsYXIgdG8gdGhlIG9yaWdpbmFsIGV4Y2VwdCBhbG9uZyB0aGUgc3BlY2lmaWVkIHBhdGguXG4gKiBAc2VlIFIuZGlzc29jUGF0aFxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIFIuYXNzb2NQYXRoKFsnYScsICdiJywgJ2MnXSwgNDIsIHthOiB7Yjoge2M6IDB9fX0pOyAvLz0+IHthOiB7Yjoge2M6IDQyfX19XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MyhmdW5jdGlvbiBhc3NvY1BhdGgocGF0aCwgdmFsLCBvYmopIHtcbiAgc3dpdGNoIChwYXRoLmxlbmd0aCkge1xuICAgIGNhc2UgMDpcbiAgICAgIHJldHVybiBvYmo7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIGFzc29jKHBhdGhbMF0sIHZhbCwgb2JqKTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGFzc29jKHBhdGhbMF0sIGFzc29jUGF0aChfc2xpY2UocGF0aCwgMSksIHZhbCwgT2JqZWN0KG9ialtwYXRoWzBdXSkpLCBvYmopO1xuICB9XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvYXNzb2NQYXRoLmpzXG4gKiovIiwidmFyIF9jdXJyeTMgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTMnKTtcblxuXG4vKipcbiAqIE1ha2VzIGEgc2hhbGxvdyBjbG9uZSBvZiBhbiBvYmplY3QsIHNldHRpbmcgb3Igb3ZlcnJpZGluZyB0aGUgc3BlY2lmaWVkXG4gKiBwcm9wZXJ0eSB3aXRoIHRoZSBnaXZlbiB2YWx1ZS4gIE5vdGUgdGhhdCB0aGlzIGNvcGllcyBhbmQgZmxhdHRlbnNcbiAqIHByb3RvdHlwZSBwcm9wZXJ0aWVzIG9udG8gdGhlIG5ldyBvYmplY3QgYXMgd2VsbC4gIEFsbCBub24tcHJpbWl0aXZlXG4gKiBwcm9wZXJ0aWVzIGFyZSBjb3BpZWQgYnkgcmVmZXJlbmNlLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHNpZyBTdHJpbmcgLT4gYSAtPiB7azogdn0gLT4ge2s6IHZ9XG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcCB0aGUgcHJvcGVydHkgbmFtZSB0byBzZXRcbiAqIEBwYXJhbSB7Kn0gdmFsIHRoZSBuZXcgdmFsdWVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogdGhlIG9iamVjdCB0byBjbG9uZVxuICogQHJldHVybiB7T2JqZWN0fSBhIG5ldyBvYmplY3Qgc2ltaWxhciB0byB0aGUgb3JpZ2luYWwgZXhjZXB0IGZvciB0aGUgc3BlY2lmaWVkIHByb3BlcnR5LlxuICogQHNlZSBSLmRpc3NvY1xuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIFIuYXNzb2MoJ2MnLCAzLCB7YTogMSwgYjogMn0pOyAvLz0+IHthOiAxLCBiOiAyLCBjOiAzfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IF9jdXJyeTMoZnVuY3Rpb24gYXNzb2MocHJvcCwgdmFsLCBvYmopIHtcbiAgdmFyIHJlc3VsdCA9IHt9O1xuICBmb3IgKHZhciBwIGluIG9iaikge1xuICAgIHJlc3VsdFtwXSA9IG9ialtwXTtcbiAgfVxuICByZXN1bHRbcHJvcF0gPSB2YWw7XG4gIHJldHVybiByZXN1bHQ7XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvYXNzb2MuanNcbiAqKi8iLCJ2YXIgX2NoZWNrRm9yTWV0aG9kID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY2hlY2tGb3JNZXRob2QnKTtcbnZhciBfY3VycnkzID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkzJyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gbGlzdCBvciBzdHJpbmcgKG9yIG9iamVjdCB3aXRoIGEgYHNsaWNlYFxuICogbWV0aG9kKSBmcm9tIGBmcm9tSW5kZXhgIChpbmNsdXNpdmUpIHRvIGB0b0luZGV4YCAoZXhjbHVzaXZlKS5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBMaXN0XG4gKiBAc2lnIE51bWJlciAtPiBOdW1iZXIgLT4gW2FdIC0+IFthXVxuICogQHNpZyBOdW1iZXIgLT4gTnVtYmVyIC0+IFN0cmluZyAtPiBTdHJpbmdcbiAqIEBwYXJhbSB7TnVtYmVyfSBmcm9tSW5kZXggVGhlIHN0YXJ0IGluZGV4IChpbmNsdXNpdmUpLlxuICogQHBhcmFtIHtOdW1iZXJ9IHRvSW5kZXggVGhlIGVuZCBpbmRleCAoZXhjbHVzaXZlKS5cbiAqIEBwYXJhbSB7Kn0gbGlzdFxuICogQHJldHVybiB7Kn1cbiAqIEBleGFtcGxlXG4gKlxuICogICAgICBSLnNsaWNlKDEsIDMsIFsnYScsICdiJywgJ2MnLCAnZCddKTsgICAgICAgIC8vPT4gWydiJywgJ2MnXVxuICogICAgICBSLnNsaWNlKDEsIEluZmluaXR5LCBbJ2EnLCAnYicsICdjJywgJ2QnXSk7IC8vPT4gWydiJywgJ2MnLCAnZCddXG4gKiAgICAgIFIuc2xpY2UoMCwgLTEsIFsnYScsICdiJywgJ2MnLCAnZCddKTsgICAgICAgLy89PiBbJ2EnLCAnYicsICdjJ11cbiAqICAgICAgUi5zbGljZSgtMywgLTEsIFsnYScsICdiJywgJ2MnLCAnZCddKTsgICAgICAvLz0+IFsnYicsICdjJ11cbiAqICAgICAgUi5zbGljZSgwLCAzLCAncmFtZGEnKTsgICAgICAgICAgICAgICAgICAgICAvLz0+ICdyYW0nXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MyhfY2hlY2tGb3JNZXRob2QoJ3NsaWNlJywgZnVuY3Rpb24gc2xpY2UoZnJvbUluZGV4LCB0b0luZGV4LCBsaXN0KSB7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChsaXN0LCBmcm9tSW5kZXgsIHRvSW5kZXgpO1xufSkpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9zbGljZS5qc1xuICoqLyIsInZhciBfaXNBcnJheSA9IHJlcXVpcmUoJy4vX2lzQXJyYXknKTtcbnZhciBfc2xpY2UgPSByZXF1aXJlKCcuL19zbGljZScpO1xuXG5cbi8qKlxuICogU2ltaWxhciB0byBoYXNNZXRob2QsIHRoaXMgY2hlY2tzIHdoZXRoZXIgYSBmdW5jdGlvbiBoYXMgYSBbbWV0aG9kbmFtZV1cbiAqIGZ1bmN0aW9uLiBJZiBpdCBpc24ndCBhbiBhcnJheSBpdCB3aWxsIGV4ZWN1dGUgdGhhdCBmdW5jdGlvbiBvdGhlcndpc2UgaXQgd2lsbFxuICogZGVmYXVsdCB0byB0aGUgcmFtZGEgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIHJhbWRhIGltcGxlbXRhdGlvblxuICogQHBhcmFtIHtTdHJpbmd9IG1ldGhvZG5hbWUgcHJvcGVydHkgdG8gY2hlY2sgZm9yIGEgY3VzdG9tIGltcGxlbWVudGF0aW9uXG4gKiBAcmV0dXJuIHtPYmplY3R9IFdoYXRldmVyIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIG1ldGhvZCBpcy5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfY2hlY2tGb3JNZXRob2QobWV0aG9kbmFtZSwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGlmIChsZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBmbigpO1xuICAgIH1cbiAgICB2YXIgb2JqID0gYXJndW1lbnRzW2xlbmd0aCAtIDFdO1xuICAgIHJldHVybiAoX2lzQXJyYXkob2JqKSB8fCB0eXBlb2Ygb2JqW21ldGhvZG5hbWVdICE9PSAnZnVuY3Rpb24nKSA/XG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpIDpcbiAgICAgIG9ialttZXRob2RuYW1lXS5hcHBseShvYmosIF9zbGljZShhcmd1bWVudHMsIDAsIGxlbmd0aCAtIDEpKTtcbiAgfTtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19jaGVja0Zvck1ldGhvZC5qc1xuICoqLyIsInZhciBfY3VycnkyID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkyJyk7XG5cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgdmFsdWUgYXQgYSBnaXZlbiBwYXRoLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHNpZyBbU3RyaW5nXSAtPiB7azogdn0gLT4gdiB8IFVuZGVmaW5lZFxuICogQHBhcmFtIHtBcnJheX0gcGF0aCBUaGUgcGF0aCB0byB1c2UuXG4gKiBAcmV0dXJuIHsqfSBUaGUgZGF0YSBhdCBgcGF0aGAuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgUi5wYXRoKFsnYScsICdiJ10sIHthOiB7YjogMn19KTsgLy89PiAyXG4gKiAgICAgIFIucGF0aChbJ2EnLCAnYiddLCB7Yzoge2I6IDJ9fSk7IC8vPT4gdW5kZWZpbmVkXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MihmdW5jdGlvbiBwYXRoKHBhdGhzLCBvYmopIHtcbiAgaWYgKG9iaiA9PSBudWxsKSB7XG4gICAgcmV0dXJuO1xuICB9IGVsc2Uge1xuICAgIHZhciB2YWwgPSBvYmo7XG4gICAgZm9yICh2YXIgaWR4ID0gMCwgbGVuID0gcGF0aHMubGVuZ3RoOyBpZHggPCBsZW4gJiYgdmFsICE9IG51bGw7IGlkeCArPSAxKSB7XG4gICAgICB2YWwgPSB2YWxbcGF0aHNbaWR4XV07XG4gICAgfVxuICAgIHJldHVybiB2YWw7XG4gIH1cbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9wYXRoLmpzXG4gKiovIiwidmFyIF9jdXJyeTIgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTInKTtcblxuXG4vKipcbiAqIFJldHVybnMgdGhlIHNlY29uZCBhcmd1bWVudCBpZiBpdCBpcyBub3QgbnVsbCBvciB1bmRlZmluZWQuIElmIGl0IGlzIG51bGxcbiAqIG9yIHVuZGVmaW5lZCwgdGhlIGZpcnN0IChkZWZhdWx0KSBhcmd1bWVudCBpcyByZXR1cm5lZC5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBMb2dpY1xuICogQHNpZyBhIC0+IGIgLT4gYSB8IGJcbiAqIEBwYXJhbSB7YX0gdmFsIFRoZSBkZWZhdWx0IHZhbHVlLlxuICogQHBhcmFtIHtifSB2YWwgVGhlIHZhbHVlIHRvIHJldHVybiBpZiBpdCBpcyBub3QgbnVsbCBvciB1bmRlZmluZWRcbiAqIEByZXR1cm4geyp9IFRoZSB0aGUgc2Vjb25kIHZhbHVlIG9yIHRoZSBkZWZhdWx0IHZhbHVlXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIGRlZmF1bHRUbzQyID0gZGVmYXVsdFRvKDQyKTtcbiAqXG4gKiAgICAgIGRlZmF1bHRUbzQyKG51bGwpOyAgLy89PiA0MlxuICogICAgICBkZWZhdWx0VG80Mih1bmRlZmluZWQpOyAgLy89PiA0MlxuICogICAgICBkZWZhdWx0VG80MignUmFtZGEnKTsgIC8vPT4gJ1JhbWRhJ1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IF9jdXJyeTIoZnVuY3Rpb24gZGVmYXVsdFRvKGQsIHYpIHtcbiAgcmV0dXJuIHYgPT0gbnVsbCA/IGQgOiB2O1xufSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2RlZmF1bHRUby5qc1xuICoqLyIsInZhciBpbnZva2VyID0gcmVxdWlyZSgnLi9pbnZva2VyJyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIG1hZGUgYnkgaW5zZXJ0aW5nIHRoZSBgc2VwYXJhdG9yYCBiZXR3ZWVuIGVhY2hcbiAqIGVsZW1lbnQgYW5kIGNvbmNhdGVuYXRpbmcgYWxsIHRoZSBlbGVtZW50cyBpbnRvIGEgc2luZ2xlIHN0cmluZy5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBMaXN0XG4gKiBAc2lnIFN0cmluZyAtPiBbYV0gLT4gU3RyaW5nXG4gKiBAcGFyYW0ge051bWJlcnxTdHJpbmd9IHNlcGFyYXRvciBUaGUgc3RyaW5nIHVzZWQgdG8gc2VwYXJhdGUgdGhlIGVsZW1lbnRzLlxuICogQHBhcmFtIHtBcnJheX0geHMgVGhlIGVsZW1lbnRzIHRvIGpvaW4gaW50byBhIHN0cmluZy5cbiAqIEByZXR1cm4ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgbWFkZSBieSBjb25jYXRlbmF0aW5nIGB4c2Agd2l0aCBgc2VwYXJhdG9yYC5cbiAqIEBzZWUgUi5zcGxpdFxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIHZhciBzcGFjZXIgPSBSLmpvaW4oJyAnKTtcbiAqICAgICAgc3BhY2VyKFsnYScsIDIsIDMuNF0pOyAgIC8vPT4gJ2EgMiAzLjQnXG4gKiAgICAgIFIuam9pbignfCcsIFsxLCAyLCAzXSk7ICAgIC8vPT4gJzF8MnwzJ1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IGludm9rZXIoMSwgJ2pvaW4nKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvam9pbi5qc1xuICoqLyIsInZhciBfY3VycnkyID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkyJyk7XG52YXIgX3NsaWNlID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fc2xpY2UnKTtcbnZhciBjdXJyeU4gPSByZXF1aXJlKCcuL2N1cnJ5TicpO1xudmFyIGlzID0gcmVxdWlyZSgnLi9pcycpO1xudmFyIHRvU3RyaW5nID0gcmVxdWlyZSgnLi90b1N0cmluZycpO1xuXG5cbi8qKlxuICogVHVybnMgYSBuYW1lZCBtZXRob2Qgd2l0aCBhIHNwZWNpZmllZCBhcml0eSBpbnRvIGEgZnVuY3Rpb25cbiAqIHRoYXQgY2FuIGJlIGNhbGxlZCBkaXJlY3RseSBzdXBwbGllZCB3aXRoIGFyZ3VtZW50cyBhbmQgYSB0YXJnZXQgb2JqZWN0LlxuICpcbiAqIFRoZSByZXR1cm5lZCBmdW5jdGlvbiBpcyBjdXJyaWVkIGFuZCBhY2NlcHRzIGBhcml0eSArIDFgIHBhcmFtZXRlcnMgd2hlcmVcbiAqIHRoZSBmaW5hbCBwYXJhbWV0ZXIgaXMgdGhlIHRhcmdldCBvYmplY3QuXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBzaWcgTnVtYmVyIC0+IFN0cmluZyAtPiAoYSAtPiBiIC0+IC4uLiAtPiBuIC0+IE9iamVjdCAtPiAqKVxuICogQHBhcmFtIHtOdW1iZXJ9IGFyaXR5IE51bWJlciBvZiBhcmd1bWVudHMgdGhlIHJldHVybmVkIGZ1bmN0aW9uIHNob3VsZCB0YWtlXG4gKiAgICAgICAgYmVmb3JlIHRoZSB0YXJnZXQgb2JqZWN0LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWV0aG9kIE5hbWUgb2YgdGhlIG1ldGhvZCB0byBjYWxsLlxuICogQHJldHVybiB7RnVuY3Rpb259IEEgbmV3IGN1cnJpZWQgZnVuY3Rpb24uXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIHNsaWNlRnJvbSA9IFIuaW52b2tlcigxLCAnc2xpY2UnKTtcbiAqICAgICAgc2xpY2VGcm9tKDYsICdhYmNkZWZnaGlqa2xtJyk7IC8vPT4gJ2doaWprbG0nXG4gKiAgICAgIHZhciBzbGljZUZyb202ID0gUi5pbnZva2VyKDIsICdzbGljZScpKDYpO1xuICogICAgICBzbGljZUZyb202KDgsICdhYmNkZWZnaGlqa2xtJyk7IC8vPT4gJ2doJ1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IF9jdXJyeTIoZnVuY3Rpb24gaW52b2tlcihhcml0eSwgbWV0aG9kKSB7XG4gIHJldHVybiBjdXJyeU4oYXJpdHkgKyAxLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgdGFyZ2V0ID0gYXJndW1lbnRzW2FyaXR5XTtcbiAgICBpZiAodGFyZ2V0ICE9IG51bGwgJiYgaXMoRnVuY3Rpb24sIHRhcmdldFttZXRob2RdKSkge1xuICAgICAgcmV0dXJuIHRhcmdldFttZXRob2RdLmFwcGx5KHRhcmdldCwgX3NsaWNlKGFyZ3VtZW50cywgMCwgYXJpdHkpKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcih0b1N0cmluZyh0YXJnZXQpICsgJyBkb2VzIG5vdCBoYXZlIGEgbWV0aG9kIG5hbWVkIFwiJyArIG1ldGhvZCArICdcIicpO1xuICB9KTtcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnZva2VyLmpzXG4gKiovIiwidmFyIF9jdXJyeTIgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTInKTtcblxuXG4vKipcbiAqIFNlZSBpZiBhbiBvYmplY3QgKGB2YWxgKSBpcyBhbiBpbnN0YW5jZSBvZiB0aGUgc3VwcGxpZWQgY29uc3RydWN0b3IuXG4gKiBUaGlzIGZ1bmN0aW9uIHdpbGwgY2hlY2sgdXAgdGhlIGluaGVyaXRhbmNlIGNoYWluLCBpZiBhbnkuXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgVHlwZVxuICogQHNpZyAoKiAtPiB7Kn0pIC0+IGEgLT4gQm9vbGVhblxuICogQHBhcmFtIHtPYmplY3R9IGN0b3IgQSBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHsqfSB2YWwgVGhlIHZhbHVlIHRvIHRlc3RcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgUi5pcyhPYmplY3QsIHt9KTsgLy89PiB0cnVlXG4gKiAgICAgIFIuaXMoTnVtYmVyLCAxKTsgLy89PiB0cnVlXG4gKiAgICAgIFIuaXMoT2JqZWN0LCAxKTsgLy89PiBmYWxzZVxuICogICAgICBSLmlzKFN0cmluZywgJ3MnKTsgLy89PiB0cnVlXG4gKiAgICAgIFIuaXMoU3RyaW5nLCBuZXcgU3RyaW5nKCcnKSk7IC8vPT4gdHJ1ZVxuICogICAgICBSLmlzKE9iamVjdCwgbmV3IFN0cmluZygnJykpOyAvLz0+IHRydWVcbiAqICAgICAgUi5pcyhPYmplY3QsICdzJyk7IC8vPT4gZmFsc2VcbiAqICAgICAgUi5pcyhOdW1iZXIsIHt9KTsgLy89PiBmYWxzZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IF9jdXJyeTIoZnVuY3Rpb24gaXMoQ3RvciwgdmFsKSB7XG4gIHJldHVybiB2YWwgIT0gbnVsbCAmJiB2YWwuY29uc3RydWN0b3IgPT09IEN0b3IgfHwgdmFsIGluc3RhbmNlb2YgQ3Rvcjtcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pcy5qc1xuICoqLyIsInZhciBfY3VycnkxID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkxJyk7XG52YXIgX3RvU3RyaW5nID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fdG9TdHJpbmcnKTtcblxuXG4vKipcbiAqIFJldHVybnMgdGhlIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gdmFsdWUuIGBldmFsYCdpbmcgdGhlIG91dHB1dFxuICogc2hvdWxkIHJlc3VsdCBpbiBhIHZhbHVlIGVxdWl2YWxlbnQgdG8gdGhlIGlucHV0IHZhbHVlLiBNYW55IG9mIHRoZSBidWlsdC1pblxuICogYHRvU3RyaW5nYCBtZXRob2RzIGRvIG5vdCBzYXRpc2Z5IHRoaXMgcmVxdWlyZW1lbnQuXG4gKlxuICogSWYgdGhlIGdpdmVuIHZhbHVlIGlzIGFuIGBbb2JqZWN0IE9iamVjdF1gIHdpdGggYSBgdG9TdHJpbmdgIG1ldGhvZCBvdGhlclxuICogdGhhbiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ2AsIHRoaXMgbWV0aG9kIGlzIGludm9rZWQgd2l0aCBubyBhcmd1bWVudHNcbiAqIHRvIHByb2R1Y2UgdGhlIHJldHVybiB2YWx1ZS4gVGhpcyBtZWFucyB1c2VyLWRlZmluZWQgY29uc3RydWN0b3IgZnVuY3Rpb25zXG4gKiBjYW4gcHJvdmlkZSBhIHN1aXRhYmxlIGB0b1N0cmluZ2AgbWV0aG9kLiBGb3IgZXhhbXBsZTpcbiAqXG4gKiAgICAgZnVuY3Rpb24gUG9pbnQoeCwgeSkge1xuICogICAgICAgdGhpcy54ID0geDtcbiAqICAgICAgIHRoaXMueSA9IHk7XG4gKiAgICAgfVxuICpcbiAqICAgICBQb2ludC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAqICAgICAgIHJldHVybiAnbmV3IFBvaW50KCcgKyB0aGlzLnggKyAnLCAnICsgdGhpcy55ICsgJyknO1xuICogICAgIH07XG4gKlxuICogICAgIFIudG9TdHJpbmcobmV3IFBvaW50KDEsIDIpKTsgLy89PiAnbmV3IFBvaW50KDEsIDIpJ1xuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IFN0cmluZ1xuICogQHNpZyAqIC0+IFN0cmluZ1xuICogQHBhcmFtIHsqfSB2YWxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBleGFtcGxlXG4gKlxuICogICAgICBSLnRvU3RyaW5nKDQyKTsgLy89PiAnNDInXG4gKiAgICAgIFIudG9TdHJpbmcoJ2FiYycpOyAvLz0+ICdcImFiY1wiJ1xuICogICAgICBSLnRvU3RyaW5nKFsxLCAyLCAzXSk7IC8vPT4gJ1sxLCAyLCAzXSdcbiAqICAgICAgUi50b1N0cmluZyh7Zm9vOiAxLCBiYXI6IDIsIGJhejogM30pOyAvLz0+ICd7XCJiYXJcIjogMiwgXCJiYXpcIjogMywgXCJmb29cIjogMX0nXG4gKiAgICAgIFIudG9TdHJpbmcobmV3IERhdGUoJzIwMDEtMDItMDNUMDQ6MDU6MDZaJykpOyAvLz0+ICduZXcgRGF0ZShcIjIwMDEtMDItMDNUMDQ6MDU6MDYuMDAwWlwiKSdcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkxKGZ1bmN0aW9uIHRvU3RyaW5nKHZhbCkgeyByZXR1cm4gX3RvU3RyaW5nKHZhbCwgW10pOyB9KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvdG9TdHJpbmcuanNcbiAqKi8iLCJ2YXIgX2NvbnRhaW5zID0gcmVxdWlyZSgnLi9fY29udGFpbnMnKTtcbnZhciBfbWFwID0gcmVxdWlyZSgnLi9fbWFwJyk7XG52YXIgX3F1b3RlID0gcmVxdWlyZSgnLi9fcXVvdGUnKTtcbnZhciBfdG9JU09TdHJpbmcgPSByZXF1aXJlKCcuL190b0lTT1N0cmluZycpO1xudmFyIGtleXMgPSByZXF1aXJlKCcuLi9rZXlzJyk7XG52YXIgcmVqZWN0ID0gcmVxdWlyZSgnLi4vcmVqZWN0Jyk7XG52YXIgdGVzdCA9IHJlcXVpcmUoJy4uL3Rlc3QnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF90b1N0cmluZyh4LCBzZWVuKSB7XG4gIHZhciByZWN1ciA9IGZ1bmN0aW9uIHJlY3VyKHkpIHtcbiAgICB2YXIgeHMgPSBzZWVuLmNvbmNhdChbeF0pO1xuICAgIHJldHVybiBfY29udGFpbnMoeSwgeHMpID8gJzxDaXJjdWxhcj4nIDogX3RvU3RyaW5nKHksIHhzKTtcbiAgfTtcblxuICAvLyAgbWFwUGFpcnMgOjogKE9iamVjdCwgW1N0cmluZ10pIC0+IFtTdHJpbmddXG4gIHZhciBtYXBQYWlycyA9IGZ1bmN0aW9uKG9iaiwga2V5cykge1xuICAgIHJldHVybiBfbWFwKGZ1bmN0aW9uKGspIHsgcmV0dXJuIF9xdW90ZShrKSArICc6ICcgKyByZWN1cihvYmpba10pOyB9LCBrZXlzLnNsaWNlKCkuc29ydCgpKTtcbiAgfTtcblxuICBzd2l0Y2ggKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSkge1xuICAgIGNhc2UgJ1tvYmplY3QgQXJndW1lbnRzXSc6XG4gICAgICByZXR1cm4gJyhmdW5jdGlvbigpIHsgcmV0dXJuIGFyZ3VtZW50czsgfSgnICsgX21hcChyZWN1ciwgeCkuam9pbignLCAnKSArICcpKSc7XG4gICAgY2FzZSAnW29iamVjdCBBcnJheV0nOlxuICAgICAgcmV0dXJuICdbJyArIF9tYXAocmVjdXIsIHgpLmNvbmNhdChtYXBQYWlycyh4LCByZWplY3QodGVzdCgvXlxcZCskLyksIGtleXMoeCkpKSkuam9pbignLCAnKSArICddJztcbiAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzpcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ29iamVjdCcgPyAnbmV3IEJvb2xlYW4oJyArIHJlY3VyKHgudmFsdWVPZigpKSArICcpJyA6IHgudG9TdHJpbmcoKTtcbiAgICBjYXNlICdbb2JqZWN0IERhdGVdJzpcbiAgICAgIHJldHVybiAnbmV3IERhdGUoJyArIF9xdW90ZShfdG9JU09TdHJpbmcoeCkpICsgJyknO1xuICAgIGNhc2UgJ1tvYmplY3QgTnVsbF0nOlxuICAgICAgcmV0dXJuICdudWxsJztcbiAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOlxuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnb2JqZWN0JyA/ICduZXcgTnVtYmVyKCcgKyByZWN1cih4LnZhbHVlT2YoKSkgKyAnKScgOiAxIC8geCA9PT0gLUluZmluaXR5ID8gJy0wJyA6IHgudG9TdHJpbmcoMTApO1xuICAgIGNhc2UgJ1tvYmplY3QgU3RyaW5nXSc6XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnID8gJ25ldyBTdHJpbmcoJyArIHJlY3VyKHgudmFsdWVPZigpKSArICcpJyA6IF9xdW90ZSh4KTtcbiAgICBjYXNlICdbb2JqZWN0IFVuZGVmaW5lZF0nOlxuICAgICAgcmV0dXJuICd1bmRlZmluZWQnO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gKHR5cGVvZiB4LmNvbnN0cnVjdG9yID09PSAnZnVuY3Rpb24nICYmIHguY29uc3RydWN0b3IubmFtZSAhPT0gJ09iamVjdCcgJiZcbiAgICAgICAgICAgICAgdHlwZW9mIHgudG9TdHJpbmcgPT09ICdmdW5jdGlvbicgJiYgeC50b1N0cmluZygpICE9PSAnW29iamVjdCBPYmplY3RdJykgP1xuICAgICAgICAgICAgIHgudG9TdHJpbmcoKSA6ICAvLyBGdW5jdGlvbiwgUmVnRXhwLCB1c2VyLWRlZmluZWQgdHlwZXNcbiAgICAgICAgICAgICAneycgKyBtYXBQYWlycyh4LCBrZXlzKHgpKS5qb2luKCcsICcpICsgJ30nO1xuICB9XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fdG9TdHJpbmcuanNcbiAqKi8iLCJ2YXIgX2luZGV4T2YgPSByZXF1aXJlKCcuL19pbmRleE9mJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfY29udGFpbnMoYSwgbGlzdCkge1xuICByZXR1cm4gX2luZGV4T2YobGlzdCwgYSwgMCkgPj0gMDtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19jb250YWlucy5qc1xuICoqLyIsInZhciBlcXVhbHMgPSByZXF1aXJlKCcuLi9lcXVhbHMnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9pbmRleE9mKGxpc3QsIGl0ZW0sIGZyb20pIHtcbiAgdmFyIGlkeCA9IGZyb207XG4gIHdoaWxlIChpZHggPCBsaXN0Lmxlbmd0aCkge1xuICAgIGlmIChlcXVhbHMobGlzdFtpZHhdLCBpdGVtKSkge1xuICAgICAgcmV0dXJuIGlkeDtcbiAgICB9XG4gICAgaWR4ICs9IDE7XG4gIH1cbiAgcmV0dXJuIC0xO1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2luZGV4T2YuanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MiA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MicpO1xudmFyIF9lcXVhbHMgPSByZXF1aXJlKCcuL2ludGVybmFsL19lcXVhbHMnKTtcbnZhciBfaGFzTWV0aG9kID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9faGFzTWV0aG9kJyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIGB0cnVlYCBpZiBpdHMgYXJndW1lbnRzIGFyZSBlcXVpdmFsZW50LCBgZmFsc2VgIG90aGVyd2lzZS5cbiAqIERpc3BhdGNoZXMgdG8gYW4gYGVxdWFsc2AgbWV0aG9kIGlmIHByZXNlbnQuIEhhbmRsZXMgY3ljbGljYWwgZGF0YVxuICogc3RydWN0dXJlcy5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICogQHNpZyBhIC0+IGIgLT4gQm9vbGVhblxuICogQHBhcmFtIHsqfSBhXG4gKiBAcGFyYW0geyp9IGJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgUi5lcXVhbHMoMSwgMSk7IC8vPT4gdHJ1ZVxuICogICAgICBSLmVxdWFscygxLCAnMScpOyAvLz0+IGZhbHNlXG4gKiAgICAgIFIuZXF1YWxzKFsxLCAyLCAzXSwgWzEsIDIsIDNdKTsgLy89PiB0cnVlXG4gKlxuICogICAgICB2YXIgYSA9IHt9OyBhLnYgPSBhO1xuICogICAgICB2YXIgYiA9IHt9OyBiLnYgPSBiO1xuICogICAgICBSLmVxdWFscyhhLCBiKTsgLy89PiB0cnVlXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MihmdW5jdGlvbiBlcXVhbHMoYSwgYikge1xuICByZXR1cm4gX2hhc01ldGhvZCgnZXF1YWxzJywgYSkgPyBhLmVxdWFscyhiKSA6XG4gICAgICAgICBfaGFzTWV0aG9kKCdlcXVhbHMnLCBiKSA/IGIuZXF1YWxzKGEpIDogX2VxdWFscyhhLCBiLCBbXSwgW10pO1xufSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2VxdWFscy5qc1xuICoqLyIsInZhciBfaGFzID0gcmVxdWlyZSgnLi9faGFzJyk7XG52YXIgaWRlbnRpY2FsID0gcmVxdWlyZSgnLi4vaWRlbnRpY2FsJyk7XG52YXIga2V5cyA9IHJlcXVpcmUoJy4uL2tleXMnKTtcbnZhciB0eXBlID0gcmVxdWlyZSgnLi4vdHlwZScpO1xuXG4vLyBUaGUgYWxnb3JpdGhtIHVzZWQgdG8gaGFuZGxlIGN5Y2xpYyBzdHJ1Y3R1cmVzIGlzXG4vLyBpbnNwaXJlZCBieSB1bmRlcnNjb3JlJ3MgaXNFcXVhbFxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfZXF1YWxzKGEsIGIsIHN0YWNrQSwgc3RhY2tCKSB7XG4gIHZhciB0eXBlQSA9IHR5cGUoYSk7XG4gIGlmICh0eXBlQSAhPT0gdHlwZShiKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICh0eXBlQSA9PT0gJ0Jvb2xlYW4nIHx8IHR5cGVBID09PSAnTnVtYmVyJyB8fCB0eXBlQSA9PT0gJ1N0cmluZycpIHtcbiAgICByZXR1cm4gdHlwZW9mIGEgPT09ICdvYmplY3QnID9cbiAgICAgIHR5cGVvZiBiID09PSAnb2JqZWN0JyAmJiBpZGVudGljYWwoYS52YWx1ZU9mKCksIGIudmFsdWVPZigpKSA6XG4gICAgICBpZGVudGljYWwoYSwgYik7XG4gIH1cblxuICBpZiAoaWRlbnRpY2FsKGEsIGIpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpZiAodHlwZUEgPT09ICdSZWdFeHAnKSB7XG4gICAgLy8gUmVnRXhwIGVxdWFsaXR5IGFsZ29yaXRobTogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTA3NzY2MzVcbiAgICByZXR1cm4gKGEuc291cmNlID09PSBiLnNvdXJjZSkgJiZcbiAgICAgICAgICAgKGEuZ2xvYmFsID09PSBiLmdsb2JhbCkgJiZcbiAgICAgICAgICAgKGEuaWdub3JlQ2FzZSA9PT0gYi5pZ25vcmVDYXNlKSAmJlxuICAgICAgICAgICAoYS5tdWx0aWxpbmUgPT09IGIubXVsdGlsaW5lKSAmJlxuICAgICAgICAgICAoYS5zdGlja3kgPT09IGIuc3RpY2t5KSAmJlxuICAgICAgICAgICAoYS51bmljb2RlID09PSBiLnVuaWNvZGUpO1xuICB9XG5cbiAgaWYgKE9iamVjdChhKSA9PT0gYSkge1xuICAgIGlmICh0eXBlQSA9PT0gJ0RhdGUnICYmIGEuZ2V0VGltZSgpICE9PSBiLmdldFRpbWUoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBrZXlzQSA9IGtleXMoYSk7XG4gICAgaWYgKGtleXNBLmxlbmd0aCAhPT0ga2V5cyhiKS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgaWR4ID0gc3RhY2tBLmxlbmd0aCAtIDE7XG4gICAgd2hpbGUgKGlkeCA+PSAwKSB7XG4gICAgICBpZiAoc3RhY2tBW2lkeF0gPT09IGEpIHtcbiAgICAgICAgcmV0dXJuIHN0YWNrQltpZHhdID09PSBiO1xuICAgICAgfVxuICAgICAgaWR4IC09IDE7XG4gICAgfVxuXG4gICAgc3RhY2tBW3N0YWNrQS5sZW5ndGhdID0gYTtcbiAgICBzdGFja0Jbc3RhY2tCLmxlbmd0aF0gPSBiO1xuICAgIGlkeCA9IGtleXNBLmxlbmd0aCAtIDE7XG4gICAgd2hpbGUgKGlkeCA+PSAwKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c0FbaWR4XTtcbiAgICAgIGlmICghX2hhcyhrZXksIGIpIHx8ICFfZXF1YWxzKGJba2V5XSwgYVtrZXldLCBzdGFja0EsIHN0YWNrQikpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgaWR4IC09IDE7XG4gICAgfVxuICAgIHN0YWNrQS5wb3AoKTtcbiAgICBzdGFja0IucG9wKCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2VxdWFscy5qc1xuICoqLyIsInZhciBfY3VycnkyID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkyJyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgaXRzIGFyZ3VtZW50cyBhcmUgaWRlbnRpY2FsLCBmYWxzZSBvdGhlcndpc2UuIFZhbHVlcyBhcmVcbiAqIGlkZW50aWNhbCBpZiB0aGV5IHJlZmVyZW5jZSB0aGUgc2FtZSBtZW1vcnkuIGBOYU5gIGlzIGlkZW50aWNhbCB0byBgTmFOYDtcbiAqIGAwYCBhbmQgYC0wYCBhcmUgbm90IGlkZW50aWNhbC5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBSZWxhdGlvblxuICogQHNpZyBhIC0+IGEgLT4gQm9vbGVhblxuICogQHBhcmFtIHsqfSBhXG4gKiBAcGFyYW0geyp9IGJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIG8gPSB7fTtcbiAqICAgICAgUi5pZGVudGljYWwobywgbyk7IC8vPT4gdHJ1ZVxuICogICAgICBSLmlkZW50aWNhbCgxLCAxKTsgLy89PiB0cnVlXG4gKiAgICAgIFIuaWRlbnRpY2FsKDEsICcxJyk7IC8vPT4gZmFsc2VcbiAqICAgICAgUi5pZGVudGljYWwoW10sIFtdKTsgLy89PiBmYWxzZVxuICogICAgICBSLmlkZW50aWNhbCgwLCAtMCk7IC8vPT4gZmFsc2VcbiAqICAgICAgUi5pZGVudGljYWwoTmFOLCBOYU4pOyAvLz0+IHRydWVcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkyKGZ1bmN0aW9uIGlkZW50aWNhbChhLCBiKSB7XG4gIC8vIFNhbWVWYWx1ZSBhbGdvcml0aG1cbiAgaWYgKGEgPT09IGIpIHsgLy8gU3RlcHMgMS01LCA3LTEwXG4gICAgLy8gU3RlcHMgNi5iLTYuZTogKzAgIT0gLTBcbiAgICByZXR1cm4gYSAhPT0gMCB8fCAxIC8gYSA9PT0gMSAvIGI7XG4gIH0gZWxzZSB7XG4gICAgLy8gU3RlcCA2LmE6IE5hTiA9PSBOYU5cbiAgICByZXR1cm4gYSAhPT0gYSAmJiBiICE9PSBiO1xuICB9XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaWRlbnRpY2FsLmpzXG4gKiovIiwidmFyIF9jdXJyeTEgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTEnKTtcblxuXG4vKipcbiAqIEdpdmVzIGEgc2luZ2xlLXdvcmQgc3RyaW5nIGRlc2NyaXB0aW9uIG9mIHRoZSAobmF0aXZlKSB0eXBlIG9mIGEgdmFsdWUsIHJldHVybmluZyBzdWNoXG4gKiBhbnN3ZXJzIGFzICdPYmplY3QnLCAnTnVtYmVyJywgJ0FycmF5Jywgb3IgJ051bGwnLiAgRG9lcyBub3QgYXR0ZW1wdCB0byBkaXN0aW5ndWlzaCB1c2VyXG4gKiBPYmplY3QgdHlwZXMgYW55IGZ1cnRoZXIsIHJlcG9ydGluZyB0aGVtIGFsbCBhcyAnT2JqZWN0Jy5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBUeXBlXG4gKiBAc2lnICgqIC0+IHsqfSkgLT4gU3RyaW5nXG4gKiBAcGFyYW0geyp9IHZhbCBUaGUgdmFsdWUgdG8gdGVzdFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIFIudHlwZSh7fSk7IC8vPT4gXCJPYmplY3RcIlxuICogICAgICBSLnR5cGUoMSk7IC8vPT4gXCJOdW1iZXJcIlxuICogICAgICBSLnR5cGUoZmFsc2UpOyAvLz0+IFwiQm9vbGVhblwiXG4gKiAgICAgIFIudHlwZSgncycpOyAvLz0+IFwiU3RyaW5nXCJcbiAqICAgICAgUi50eXBlKG51bGwpOyAvLz0+IFwiTnVsbFwiXG4gKiAgICAgIFIudHlwZShbXSk7IC8vPT4gXCJBcnJheVwiXG4gKiAgICAgIFIudHlwZSgvW0Etel0vKTsgLy89PiBcIlJlZ0V4cFwiXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MShmdW5jdGlvbiB0eXBlKHZhbCkge1xuICByZXR1cm4gdmFsID09PSBudWxsICAgICAgPyAnTnVsbCcgICAgICA6XG4gICAgICAgICB2YWwgPT09IHVuZGVmaW5lZCA/ICdVbmRlZmluZWQnIDpcbiAgICAgICAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWwpLnNsaWNlKDgsIC0xKTtcbn0pO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy90eXBlLmpzXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfcXVvdGUocykge1xuICByZXR1cm4gJ1wiJyArIHMucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpICsgJ1wiJztcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19xdW90ZS5qc1xuICoqLyIsIi8qKlxuICogUG9seWZpbGwgZnJvbSA8aHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvRGF0ZS90b0lTT1N0cmluZz4uXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgcGFkID0gZnVuY3Rpb24gcGFkKG4pIHsgcmV0dXJuIChuIDwgMTAgPyAnMCcgOiAnJykgKyBuOyB9O1xuXG4gIHJldHVybiB0eXBlb2YgRGF0ZS5wcm90b3R5cGUudG9JU09TdHJpbmcgPT09ICdmdW5jdGlvbicgP1xuICAgIGZ1bmN0aW9uIF90b0lTT1N0cmluZyhkKSB7XG4gICAgICByZXR1cm4gZC50b0lTT1N0cmluZygpO1xuICAgIH0gOlxuICAgIGZ1bmN0aW9uIF90b0lTT1N0cmluZyhkKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICBkLmdldFVUQ0Z1bGxZZWFyKCkgKyAnLScgK1xuICAgICAgICBwYWQoZC5nZXRVVENNb250aCgpICsgMSkgKyAnLScgK1xuICAgICAgICBwYWQoZC5nZXRVVENEYXRlKCkpICsgJ1QnICtcbiAgICAgICAgcGFkKGQuZ2V0VVRDSG91cnMoKSkgKyAnOicgK1xuICAgICAgICBwYWQoZC5nZXRVVENNaW51dGVzKCkpICsgJzonICtcbiAgICAgICAgcGFkKGQuZ2V0VVRDU2Vjb25kcygpKSArICcuJyArXG4gICAgICAgIChkLmdldFVUQ01pbGxpc2Vjb25kcygpIC8gMTAwMCkudG9GaXhlZCgzKS5zbGljZSgyLCA1KSArICdaJ1xuICAgICAgKTtcbiAgICB9O1xufSgpKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX3RvSVNPU3RyaW5nLmpzXG4gKiovIiwidmFyIF9jb21wbGVtZW50ID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY29tcGxlbWVudCcpO1xudmFyIF9jdXJyeTIgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTInKTtcbnZhciBmaWx0ZXIgPSByZXF1aXJlKCcuL2ZpbHRlcicpO1xuXG5cbi8qKlxuICogU2ltaWxhciB0byBgZmlsdGVyYCwgZXhjZXB0IHRoYXQgaXQga2VlcHMgb25seSB2YWx1ZXMgZm9yIHdoaWNoIHRoZSBnaXZlbiBwcmVkaWNhdGVcbiAqIGZ1bmN0aW9uIHJldHVybnMgZmFsc3kuIFRoZSBwcmVkaWNhdGUgZnVuY3Rpb24gaXMgcGFzc2VkIG9uZSBhcmd1bWVudDogKih2YWx1ZSkqLlxuICpcbiAqIEFjdHMgYXMgYSB0cmFuc2R1Y2VyIGlmIGEgdHJhbnNmb3JtZXIgaXMgZ2l2ZW4gaW4gbGlzdCBwb3NpdGlvbi5cbiAqIEBzZWUgUi50cmFuc2R1Y2VcbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBMaXN0XG4gKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IFthXSAtPiBbYV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHJldHVybiB7QXJyYXl9IFRoZSBuZXcgZmlsdGVyZWQgYXJyYXkuXG4gKiBAc2VlIFIuZmlsdGVyXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIGlzT2RkID0gZnVuY3Rpb24obikge1xuICogICAgICAgIHJldHVybiBuICUgMiA9PT0gMTtcbiAqICAgICAgfTtcbiAqICAgICAgUi5yZWplY3QoaXNPZGQsIFsxLCAyLCAzLCA0XSk7IC8vPT4gWzIsIDRdXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MihmdW5jdGlvbiByZWplY3QoZm4sIGxpc3QpIHtcbiAgcmV0dXJuIGZpbHRlcihfY29tcGxlbWVudChmbiksIGxpc3QpO1xufSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL3JlamVjdC5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX2NvbXBsZW1lbnQoZikge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICFmLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fY29tcGxlbWVudC5qc1xuICoqLyIsInZhciBfY3VycnkyID0gcmVxdWlyZSgnLi9pbnRlcm5hbC9fY3VycnkyJyk7XG52YXIgX2Rpc3BhdGNoYWJsZSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2Rpc3BhdGNoYWJsZScpO1xudmFyIF9maWx0ZXIgPSByZXF1aXJlKCcuL2ludGVybmFsL19maWx0ZXInKTtcbnZhciBfeGZpbHRlciA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX3hmaWx0ZXInKTtcblxuXG4vKipcbiAqIFJldHVybnMgYSBuZXcgbGlzdCBjb250YWluaW5nIG9ubHkgdGhvc2UgaXRlbXMgdGhhdCBtYXRjaCBhIGdpdmVuIHByZWRpY2F0ZSBmdW5jdGlvbi5cbiAqIFRoZSBwcmVkaWNhdGUgZnVuY3Rpb24gaXMgcGFzc2VkIG9uZSBhcmd1bWVudDogKih2YWx1ZSkqLlxuICpcbiAqIE5vdGUgdGhhdCBgUi5maWx0ZXJgIGRvZXMgbm90IHNraXAgZGVsZXRlZCBvciB1bmFzc2lnbmVkIGluZGljZXMsIHVubGlrZSB0aGUgbmF0aXZlXG4gKiBgQXJyYXkucHJvdG90eXBlLmZpbHRlcmAgbWV0aG9kLiBGb3IgbW9yZSBkZXRhaWxzIG9uIHRoaXMgYmVoYXZpb3IsIHNlZTpcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2ZpbHRlciNEZXNjcmlwdGlvblxuICpcbiAqIEFjdHMgYXMgYSB0cmFuc2R1Y2VyIGlmIGEgdHJhbnNmb3JtZXIgaXMgZ2l2ZW4gaW4gbGlzdCBwb3NpdGlvbi5cbiAqIEBzZWUgUi50cmFuc2R1Y2VcbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBMaXN0XG4gKiBAc2lnIChhIC0+IEJvb2xlYW4pIC0+IFthXSAtPiBbYV1cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvbiBjYWxsZWQgcGVyIGl0ZXJhdGlvbi5cbiAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGNvbGxlY3Rpb24gdG8gaXRlcmF0ZSBvdmVyLlxuICogQHJldHVybiB7QXJyYXl9IFRoZSBuZXcgZmlsdGVyZWQgYXJyYXkuXG4gKiBAc2VlIFIucmVqZWN0XG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIGlzRXZlbiA9IGZ1bmN0aW9uKG4pIHtcbiAqICAgICAgICByZXR1cm4gbiAlIDIgPT09IDA7XG4gKiAgICAgIH07XG4gKiAgICAgIFIuZmlsdGVyKGlzRXZlbiwgWzEsIDIsIDMsIDRdKTsgLy89PiBbMiwgNF1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkyKF9kaXNwYXRjaGFibGUoJ2ZpbHRlcicsIF94ZmlsdGVyLCBfZmlsdGVyKSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ZpbHRlci5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gX2ZpbHRlcihmbiwgbGlzdCkge1xuICB2YXIgaWR4ID0gMCwgbGVuID0gbGlzdC5sZW5ndGgsIHJlc3VsdCA9IFtdO1xuICB3aGlsZSAoaWR4IDwgbGVuKSB7XG4gICAgaWYgKGZuKGxpc3RbaWR4XSkpIHtcbiAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IGxpc3RbaWR4XTtcbiAgICB9XG4gICAgaWR4ICs9IDE7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL19maWx0ZXIuanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MiA9IHJlcXVpcmUoJy4vX2N1cnJ5MicpO1xudmFyIF94ZkJhc2UgPSByZXF1aXJlKCcuL194ZkJhc2UnKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gWEZpbHRlcihmLCB4Zikge1xuICAgIHRoaXMueGYgPSB4ZjtcbiAgICB0aGlzLmYgPSBmO1xuICB9XG4gIFhGaWx0ZXIucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gX3hmQmFzZS5pbml0O1xuICBYRmlsdGVyLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3Jlc3VsdCddID0gX3hmQmFzZS5yZXN1bHQ7XG4gIFhGaWx0ZXIucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gZnVuY3Rpb24ocmVzdWx0LCBpbnB1dCkge1xuICAgIHJldHVybiB0aGlzLmYoaW5wdXQpID8gdGhpcy54ZlsnQEB0cmFuc2R1Y2VyL3N0ZXAnXShyZXN1bHQsIGlucHV0KSA6IHJlc3VsdDtcbiAgfTtcblxuICByZXR1cm4gX2N1cnJ5MihmdW5jdGlvbiBfeGZpbHRlcihmLCB4ZikgeyByZXR1cm4gbmV3IFhGaWx0ZXIoZiwgeGYpOyB9KTtcbn0pKCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL2ludGVybmFsL194ZmlsdGVyLmpzXG4gKiovIiwidmFyIF9jbG9uZVJlZ0V4cCA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2Nsb25lUmVnRXhwJyk7XG52YXIgX2N1cnJ5MiA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MicpO1xuXG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIGEgZ2l2ZW4gc3RyaW5nIG1hdGNoZXMgYSBnaXZlbiByZWd1bGFyIGV4cHJlc3Npb24uXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgU3RyaW5nXG4gKiBAc2lnIFJlZ0V4cCAtPiBTdHJpbmcgLT4gQm9vbGVhblxuICogQHBhcmFtIHtSZWdFeHB9IHBhdHRlcm5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgUi50ZXN0KC9eeC8sICd4eXonKTsgLy89PiB0cnVlXG4gKiAgICAgIFIudGVzdCgvXnkvLCAneHl6Jyk7IC8vPT4gZmFsc2VcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkyKGZ1bmN0aW9uIHRlc3QocGF0dGVybiwgc3RyKSB7XG4gIHJldHVybiBfY2xvbmVSZWdFeHAocGF0dGVybikudGVzdChzdHIpO1xufSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL3Rlc3QuanNcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9jbG9uZVJlZ0V4cChwYXR0ZXJuKSB7XG4gIHJldHVybiBuZXcgUmVnRXhwKHBhdHRlcm4uc291cmNlLCAocGF0dGVybi5nbG9iYWwgICAgID8gJ2cnIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwYXR0ZXJuLmlnbm9yZUNhc2UgPyAnaScgOiAnJykgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhdHRlcm4ubXVsdGlsaW5lICA/ICdtJyA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAocGF0dGVybi5zdGlja3kgICAgID8gJ3knIDogJycpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwYXR0ZXJuLnVuaWNvZGUgICAgPyAndScgOiAnJykpO1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvaW50ZXJuYWwvX2Nsb25lUmVnRXhwLmpzXG4gKiovIiwidmFyIF9jdXJyeTEgPSByZXF1aXJlKCcuL2ludGVybmFsL19jdXJyeTEnKTtcbnZhciBfbWFrZUZsYXQgPSByZXF1aXJlKCcuL2ludGVybmFsL19tYWtlRmxhdCcpO1xuXG5cbi8qKlxuICogUmV0dXJucyBhIG5ldyBsaXN0IGJ5IHB1bGxpbmcgZXZlcnkgaXRlbSBvdXQgb2YgaXQgKGFuZCBhbGwgaXRzIHN1Yi1hcnJheXMpIGFuZCBwdXR0aW5nXG4gKiB0aGVtIGluIGEgbmV3IGFycmF5LCBkZXB0aC1maXJzdC5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBMaXN0XG4gKiBAc2lnIFthXSAtPiBbYl1cbiAqIEBwYXJhbSB7QXJyYXl9IGxpc3QgVGhlIGFycmF5IHRvIGNvbnNpZGVyLlxuICogQHJldHVybiB7QXJyYXl9IFRoZSBmbGF0dGVuZWQgbGlzdC5cbiAqIEBzZWUgUi51bm5lc3RcbiAqIEBleGFtcGxlXG4gKlxuICogICAgICBSLmZsYXR0ZW4oWzEsIDIsIFszLCA0XSwgNSwgWzYsIFs3LCA4LCBbOSwgWzEwLCAxMV0sIDEyXV1dXSk7XG4gKiAgICAgIC8vPT4gWzEsIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCAxMSwgMTJdXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gX2N1cnJ5MShfbWFrZUZsYXQodHJ1ZSkpO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9mbGF0dGVuLmpzXG4gKiovIiwidmFyIGlzQXJyYXlMaWtlID0gcmVxdWlyZSgnLi4vaXNBcnJheUxpa2UnKTtcblxuXG4vKipcbiAqIGBfbWFrZUZsYXRgIGlzIGEgaGVscGVyIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIG9uZS1sZXZlbCBvciBmdWxseSByZWN1cnNpdmUgZnVuY3Rpb25cbiAqIGJhc2VkIG9uIHRoZSBmbGFnIHBhc3NlZCBpbi5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIF9tYWtlRmxhdChyZWN1cnNpdmUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGZsYXR0KGxpc3QpIHtcbiAgICB2YXIgdmFsdWUsIHJlc3VsdCA9IFtdLCBpZHggPSAwLCBqLCBpbGVuID0gbGlzdC5sZW5ndGgsIGpsZW47XG4gICAgd2hpbGUgKGlkeCA8IGlsZW4pIHtcbiAgICAgIGlmIChpc0FycmF5TGlrZShsaXN0W2lkeF0pKSB7XG4gICAgICAgIHZhbHVlID0gcmVjdXJzaXZlID8gZmxhdHQobGlzdFtpZHhdKSA6IGxpc3RbaWR4XTtcbiAgICAgICAgaiA9IDA7XG4gICAgICAgIGpsZW4gPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgIHdoaWxlIChqIDwgamxlbikge1xuICAgICAgICAgIHJlc3VsdFtyZXN1bHQubGVuZ3RoXSA9IHZhbHVlW2pdO1xuICAgICAgICAgIGogKz0gMTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gbGlzdFtpZHhdO1xuICAgICAgfVxuICAgICAgaWR4ICs9IDE7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fbWFrZUZsYXQuanNcbiAqKi8iLCJ2YXIgX3BpcGUgPSByZXF1aXJlKCcuL2ludGVybmFsL19waXBlJyk7XG52YXIgY3VycnlOID0gcmVxdWlyZSgnLi9jdXJyeU4nKTtcbnZhciByZWR1Y2UgPSByZXF1aXJlKCcuL3JlZHVjZScpO1xudmFyIHRhaWwgPSByZXF1aXJlKCcuL3RhaWwnKTtcblxuXG4vKipcbiAqIFBlcmZvcm1zIGxlZnQtdG8tcmlnaHQgZnVuY3Rpb24gY29tcG9zaXRpb24uIFRoZSBsZWZ0bW9zdCBmdW5jdGlvbiBtYXkgaGF2ZVxuICogYW55IGFyaXR5OyB0aGUgcmVtYWluaW5nIGZ1bmN0aW9ucyBtdXN0IGJlIHVuYXJ5LlxuICpcbiAqIEluIHNvbWUgbGlicmFyaWVzIHRoaXMgZnVuY3Rpb24gaXMgbmFtZWQgYHNlcXVlbmNlYC5cbiAqXG4gKiBAZnVuY1xuICogQG1lbWJlck9mIFJcbiAqIEBjYXRlZ29yeSBGdW5jdGlvblxuICogQHNpZyAoKChhLCBiLCAuLi4sIG4pIC0+IG8pLCAobyAtPiBwKSwgLi4uLCAoeCAtPiB5KSwgKHkgLT4geikpIC0+IChhIC0+IGIgLT4gLi4uIC0+IG4gLT4geilcbiAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IGZ1bmN0aW9uc1xuICogQHJldHVybiB7RnVuY3Rpb259XG4gKiBAc2VlIFIuY29tcG9zZVxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIHZhciBmID0gUi5waXBlKE1hdGgucG93LCBSLm5lZ2F0ZSwgUi5pbmMpO1xuICpcbiAqICAgICAgZigzLCA0KTsgLy8gLSgzXjQpICsgMVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBpcGUoKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwaXBlIHJlcXVpcmVzIGF0IGxlYXN0IG9uZSBhcmd1bWVudCcpO1xuICB9XG4gIHJldHVybiBjdXJyeU4oYXJndW1lbnRzWzBdLmxlbmd0aCxcbiAgICAgICAgICAgICAgICByZWR1Y2UoX3BpcGUsIGFyZ3VtZW50c1swXSwgdGFpbChhcmd1bWVudHMpKSk7XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9waXBlLmpzXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBfcGlwZShmLCBnKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZy5jYWxsKHRoaXMsIGYuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG4gIH07XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9+L3JhbWRhL3NyYy9pbnRlcm5hbC9fcGlwZS5qc1xuICoqLyIsInZhciBfY2hlY2tGb3JNZXRob2QgPSByZXF1aXJlKCcuL2ludGVybmFsL19jaGVja0Zvck1ldGhvZCcpO1xudmFyIHNsaWNlID0gcmVxdWlyZSgnLi9zbGljZScpO1xuXG5cbi8qKlxuICogUmV0dXJucyBhbGwgYnV0IHRoZSBmaXJzdCBlbGVtZW50IG9mIHRoZSBnaXZlbiBsaXN0IG9yIHN0cmluZyAob3Igb2JqZWN0XG4gKiB3aXRoIGEgYHRhaWxgIG1ldGhvZCkuXG4gKlxuICogQGZ1bmNcbiAqIEBtZW1iZXJPZiBSXG4gKiBAY2F0ZWdvcnkgTGlzdFxuICogQHNlZSBSLmhlYWQsIFIuaW5pdCwgUi5sYXN0XG4gKiBAc2lnIFthXSAtPiBbYV1cbiAqIEBzaWcgU3RyaW5nIC0+IFN0cmluZ1xuICogQHBhcmFtIHsqfSBsaXN0XG4gKiBAcmV0dXJuIHsqfVxuICogQGV4YW1wbGVcbiAqXG4gKiAgICAgIFIudGFpbChbMSwgMiwgM10pOyAgLy89PiBbMiwgM11cbiAqICAgICAgUi50YWlsKFsxLCAyXSk7ICAgICAvLz0+IFsyXVxuICogICAgICBSLnRhaWwoWzFdKTsgICAgICAgIC8vPT4gW11cbiAqICAgICAgUi50YWlsKFtdKTsgICAgICAgICAvLz0+IFtdXG4gKlxuICogICAgICBSLnRhaWwoJ2FiYycpOyAgLy89PiAnYmMnXG4gKiAgICAgIFIudGFpbCgnYWInKTsgICAvLz0+ICdiJ1xuICogICAgICBSLnRhaWwoJ2EnKTsgICAgLy89PiAnJ1xuICogICAgICBSLnRhaWwoJycpOyAgICAgLy89PiAnJ1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IF9jaGVja0Zvck1ldGhvZCgndGFpbCcsIHNsaWNlKDEsIEluZmluaXR5KSk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL34vcmFtZGEvc3JjL3RhaWwuanNcbiAqKi8iLCJ2YXIgX2N1cnJ5MSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX2N1cnJ5MScpO1xudmFyIF9zbGljZSA9IHJlcXVpcmUoJy4vaW50ZXJuYWwvX3NsaWNlJyk7XG52YXIgY3VycnkgPSByZXF1aXJlKCcuL2N1cnJ5Jyk7XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IGZ1bmN0aW9uIG11Y2ggbGlrZSB0aGUgc3VwcGxpZWQgb25lLCBleGNlcHQgdGhhdCB0aGUgZmlyc3QgdHdvIGFyZ3VtZW50cydcbiAqIG9yZGVyIGlzIHJldmVyc2VkLlxuICpcbiAqIEBmdW5jXG4gKiBAbWVtYmVyT2YgUlxuICogQGNhdGVnb3J5IEZ1bmN0aW9uXG4gKiBAc2lnIChhIC0+IGIgLT4gYyAtPiAuLi4gLT4geikgLT4gKGIgLT4gYSAtPiBjIC0+IC4uLiAtPiB6KVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uIHRvIGludm9rZSB3aXRoIGl0cyBmaXJzdCB0d28gcGFyYW1ldGVycyByZXZlcnNlZC5cbiAqIEByZXR1cm4geyp9IFRoZSByZXN1bHQgb2YgaW52b2tpbmcgYGZuYCB3aXRoIGl0cyBmaXJzdCB0d28gcGFyYW1ldGVycycgb3JkZXIgcmV2ZXJzZWQuXG4gKiBAZXhhbXBsZVxuICpcbiAqICAgICAgdmFyIG1lcmdlVGhyZWUgPSBmdW5jdGlvbihhLCBiLCBjKSB7XG4gKiAgICAgICAgcmV0dXJuIChbXSkuY29uY2F0KGEsIGIsIGMpO1xuICogICAgICB9O1xuICpcbiAqICAgICAgbWVyZ2VUaHJlZSgxLCAyLCAzKTsgLy89PiBbMSwgMiwgM11cbiAqXG4gKiAgICAgIFIuZmxpcChtZXJnZVRocmVlKSgxLCAyLCAzKTsgLy89PiBbMiwgMSwgM11cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBfY3VycnkxKGZ1bmN0aW9uIGZsaXAoZm4pIHtcbiAgcmV0dXJuIGN1cnJ5KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgYXJncyA9IF9zbGljZShhcmd1bWVudHMpO1xuICAgIGFyZ3NbMF0gPSBiO1xuICAgIGFyZ3NbMV0gPSBhO1xuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfSk7XG59KTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9yYW1kYS9zcmMvZmxpcC5qc1xuICoqLyIsIlxuLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbnZhciBub3cgPSByZXF1aXJlKCdkYXRlLW5vdycpO1xuXG4vKipcbiAqIFJldHVybnMgYSBmdW5jdGlvbiwgdGhhdCwgYXMgbG9uZyBhcyBpdCBjb250aW51ZXMgdG8gYmUgaW52b2tlZCwgd2lsbCBub3RcbiAqIGJlIHRyaWdnZXJlZC4gVGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIGFmdGVyIGl0IHN0b3BzIGJlaW5nIGNhbGxlZCBmb3JcbiAqIE4gbWlsbGlzZWNvbmRzLiBJZiBgaW1tZWRpYXRlYCBpcyBwYXNzZWQsIHRyaWdnZXIgdGhlIGZ1bmN0aW9uIG9uIHRoZVxuICogbGVhZGluZyBlZGdlLCBpbnN0ZWFkIG9mIHRoZSB0cmFpbGluZy5cbiAqXG4gKiBAc291cmNlIHVuZGVyc2NvcmUuanNcbiAqIEBzZWUgaHR0cDovL3Vuc2NyaXB0YWJsZS5jb20vMjAwOS8wMy8yMC9kZWJvdW5jaW5nLWphdmFzY3JpcHQtbWV0aG9kcy9cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmN0aW9uIHRvIHdyYXBcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lb3V0IGluIG1zIChgMTAwYClcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gd2hldGhlciB0byBleGVjdXRlIGF0IHRoZSBiZWdpbm5pbmcgKGBmYWxzZWApXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVib3VuY2UoZnVuYywgd2FpdCwgaW1tZWRpYXRlKXtcbiAgdmFyIHRpbWVvdXQsIGFyZ3MsIGNvbnRleHQsIHRpbWVzdGFtcCwgcmVzdWx0O1xuICBpZiAobnVsbCA9PSB3YWl0KSB3YWl0ID0gMTAwO1xuXG4gIGZ1bmN0aW9uIGxhdGVyKCkge1xuICAgIHZhciBsYXN0ID0gbm93KCkgLSB0aW1lc3RhbXA7XG5cbiAgICBpZiAobGFzdCA8IHdhaXQgJiYgbGFzdCA+IDApIHtcbiAgICAgIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0IC0gbGFzdCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRpbWVvdXQgPSBudWxsO1xuICAgICAgaWYgKCFpbW1lZGlhdGUpIHtcbiAgICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgICAgaWYgKCF0aW1lb3V0KSBjb250ZXh0ID0gYXJncyA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiBkZWJvdW5jZWQoKSB7XG4gICAgY29udGV4dCA9IHRoaXM7XG4gICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICB0aW1lc3RhbXAgPSBub3coKTtcbiAgICB2YXIgY2FsbE5vdyA9IGltbWVkaWF0ZSAmJiAhdGltZW91dDtcbiAgICBpZiAoIXRpbWVvdXQpIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGxhdGVyLCB3YWl0KTtcbiAgICBpZiAoY2FsbE5vdykge1xuICAgICAgcmVzdWx0ID0gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgICAgIGNvbnRleHQgPSBhcmdzID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9kZWJvdW5jZS9pbmRleC5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gRGF0ZS5ub3cgfHwgbm93XG5cbmZ1bmN0aW9uIG5vdygpIHtcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKClcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vfi9kZWJvdW5jZS9+L2RhdGUtbm93L2luZGV4LmpzXG4gKiovIl0sInNvdXJjZVJvb3QiOiIifQ==