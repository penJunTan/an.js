/**
 * Created by Tan on 2014/7/19.
 */


;(function(root, factory){

	if("function" === typeof define && define.amd){
		define(factory);
	}else if("object" === typeof exports){
		factory(require, exports, module);
	}else{
		root.returnExports = factory();
	}

})(this, function(require, exports, module){

	var
		regPool,
		atomEngine,
		strategyRelativeHandler,
		domCharacterHelper,
		supports = support(),

		_uc,
		slice
	;

	require("../Utils/es5_shim");

	// Done 1. getElementsByClass
	// Done 2. strategySplit
	// Done 3. normalizeExpr
	// TODO 4. optimizeStrategy
	// Done 5. continue strategyRelativeHandler
	// TODO 5. continue domCharacterHelper

	_uc = require("../Utils/Uncurrying");
	slice = _uc(Array.prototype.slice);

	/**
	 * 原子 css 表达式搜索引擎
	 * @type {{__native: __native, __hunt: __hunt, __id: __id, __tag: __tag, __class: __class, getElementByClass: getElementByClass}}
	 */
	atomEngine = {

		__native: function(expr){
			return slice(document.querySelectorAll(expr));
		},

		__hunt: function(expr){

			var collection;

			hunt: {

				if(-1 !== expr.indexOf(".")){
					collection = this.__class(expr);
					break hunt;
				}

				if(-1 !== expr.indexOf("#")){
					collection = this.__id(expr);
					break hunt;
				}

				collection = this.__tag(expr);
			}

			return collection;

		},

		__id: function(expr){
			var collection;
			collection = document.getElementById(expr.replace("#", ""));
			return collection ? [collection] : [];
		},

		__tag: function(expr){
			var collection;
			collection = document.getElementsByTagName(expr);
			return slice(collection);
		},

		/**
		 * 支持: .class, class, tag.class
		 * 支持 一级 class 选择器. 如: div.one div.demo, 但不支持三级或多级 div.one.two
		 * @param expr
		 * @returns {*}
		 * @private
		 */
		__class: function(expr){
			var _tag,
				indexDot
			;

			indexDot = expr.indexOf(".");

			if(-1 !== indexDot){
				expr = expr.slice(indexDot + 1);
				_tag = indexDot ? expr.slice(0, indexDot): "*";

			}else{
				_tag = "*"
			}

			return this.getElementByClass(expr, _tag);
		},

		getElementByClass: function(className, sTag){
			var
				collection,
				len
			;

			sTag = sTag || "*";
			sTag = sTag.toLowerCase();

			collection = document.getElementsByTagName(sTag);
			collection = slice(collection);

			len = collection.length;

			while(len--){
				if(!domCharacterHelper.match.__class(collection[len], className)){
					collection.splice(len, 1);
				}
			}

			return collection;

		}
	};

	strategyRelativeHandler = {

		core: function(subExpr, collection, collectionCurrent, iStrategy, relativeFilter){
			var
				len = collection.length,
				itemArrCurrentElem,
				itemArrNewMatched,
				__action = iStrategy.action,

				collectionNow
			;

			collectionNow = [];

			while(len--){
				itemArrCurrentElem = collectionCurrent[len];

				// 伪类可能直接修改 collectionCurrent, 跳过整个循环
				// 比如 eq(0)
				if(!itemArrCurrentElem){ break }

				if(!Array.isArray(itemArrCurrentElem)){
					itemArrCurrentElem = [itemArrCurrentElem];
				}

				itemArrNewMatched = [];
				itemArrCurrentElem.forEach(function(elem){
					if(relativeFilter){

						relativeFilter(elem, function(elemFilter){
							if(elemFilter && domCharacterHelper.match["__" + __action](elemFilter, subExpr, collection, collectionCurrent)){
								itemArrNewMatched.push(elemFilter);
							}
						});

					}else{

						if(domCharacterHelper.match["__" + __action](elem, subExpr, collection, collectionCurrent)){
							itemArrNewMatched.push(elem);
						}

					}
				});

				if(0 === itemArrNewMatched.length){
					collection.splice(len, 1);
				}else{
					collectionNow.push(itemArrNewMatched);
				}

			}

			// 将 collectionNow 装入 collectionCurrent
			collectionCurrent.length = 0;
			collectionCurrent.push.apply(collectionCurrent, collectionNow);

			// gc
			itemArrNewMatched = null;
			collectionNow.length = 0;

		},

		self: function(subExpr, collection, collectionCurrent, iStrategy){
			this.core.apply(this, arguments);
		},

		// 父辈们是否匹配
		ancestor: function(subExpr, collection, collectionCurrent ,iStrategy){
			var args = slice(arguments);

			args.push(function(elem, judge){
				while(elem = elem.parentNode){
					judge(elem);
				}
			});

			this.core.apply(this, args);
		},

		// 父级是否匹配
		parent: function(subExpr, collection, collectionCurrent ,iStrategy){
			var args = slice(arguments);

			args.push(function(elem, judge){
				judge(elem.parentNode);
			});

			this.core.apply(this, args);
		},

		// 获取子辈们
		offspring: function(){
			var args = slice(arguments);

			args.push(function(elem, judge){

				var children = elem.children;

				for(var i = 0, len = children.length, child; i < len; i++){
					child = children[i];
					1 === child.nodeType && judge(child);
				}

			});

			this.core.apply(this, args);
		},

		// 相邻是否匹配
		adjacent : function(){
			var args = slice(arguments);

			args.push(function(elem, judge){
				var _previous;
				_previous = elem.previousElementSibling;

				if("undefined" === typeof _previous){

					_previous = elem.previousSibling;
					while(_previous){
						if(1 === _previous.nodeType){ break }
						_previous = _previous.previousSibling;
					}
				}

				judge(_previous);

			});

			this.core.apply(this, args);
		},

		// 兄弟是否匹配
		siblings: function(){
			var args = slice(arguments);

			args.push(function(elem, judge){

				var _parent,
					children
				;

				_parent = elem.parentElement;

				if("undefined" === typeof _parent){

					_parent = elem.parentNode;
					while(_parent){
						if(1 === _parent.nodeType){ break }
						_parent = _parent.parentNode;
					}
				}

				children = _parent.children;
				for(var i = 0, len = children.length, child; i < len; i++){
					child = children[i];

					if(elem === child){ break; }

					if(1 === child.nodeType){
						judge(child);
					}
				}

			});

			this.core.apply(this, args);
		}

	};


	/**
	 * 检测 元素 是否匹配 id, className, Tag 等
	 * @type {{match: {__id: __id, __class: __class, __Tag: __Tag}}}
	 */
	domCharacterHelper = {
		match: {

			__id: function(elem, idFlag){
				var _id = elem.id;

				if("#" === idFlag[0]){
					idFlag = idFlag.slice(1);
				}

				return _id ? _id.toLowerCase() === idFlag.toLowerCase() : false;
			},

			/**
			 * hasClass
			 * @param elem
			 * @param className
			 * @returns {boolean}
			 * @private
			 */
			__class: function(elem, className){
				var
					cookedClassName,
					preFence
				;

				if(elem.classList){
					return elem.classList.contains(className);
				}

				preFence = "~Tan~";

				cookedClassName = elem.className;

				if(!cookedClassName){ return false }

				cookedClassName = cookedClassName.replace(/\s+/g, preFence) + preFence;

				return -1 !== cookedClassName.indexOf(className + preFence);

			},

			/**
			 * equal tagName
			 * @param elem
			 * @param equation
			 * @returns {boolean}
			 * @private
			 */
			__tag: function(elem, equation){
				return (elem.tagName || "").toLowerCase() === equation;
			},

			/**
			 * equal attribute value
			 * TODO: 后期可扩展为 $, *, ^, !, ~
			 * @param elem
			 * @param equation
			 * @returns {boolean}
			 * @private
			 */
			__attr: function(elem, equation){
				var
					attr,
					value,
					pass
				;

				equation = equation.split("=");
				attr = equation[0];
				value = equation[1];

				pass = value === elem.getAttribute(attr);

				return pass;

			},

			__pseudo: function(elem, equation, collection, collectionCurrent){

				// TODO: 后期要扩展 能自定义 扩展伪类
				if(-1 !== equation.indexOf("eq")){
					collectionCurrent.length = 0;
					collection.length = 1;
					return true;
				}

				console.debug(elem, equation, collection, collectionCurrent);
			}
		},

		relativeHash: {
			" ": "ancestor",
			">": "parent",
			"+": "adjacent",
			"~": "siblings"
		}

	};

	var rLimit = "([^\\+~>\\,=\\$\\!\\*\\^\\\'\\\":\\(\\)\\[\\]\\s])";

	/**
	 * 正则池
	 */
	regPool = {
		offspring  : new RegExp(rLimit + "\\s+" + rLimit, "g"),
		space      : /\s+/g,
		prefixFlag : /\s+([\.#])/g,
		specialFlag: /~Tan~/g,
		groupSet   : /\s|>|\+|~/g,
		exprUnit   : /[\.\#]*([^\.#:\[\]])+/g
	};

	/**
	 * main function
	 * @param {String} expr
	 * @returns { Array }
	 */
	function hunt(expr){
		console.debug(expr);
		expr = normalizeExpr(expr);
		// 判断是否为群组选择器
		return expr ? -1 === expr.indexOf(",") ? processHunt(expr) : group(expr) : [];
	}

	/**
	 * 规范化 css expression
	 * @param { String } expr
	 * @returns {*}
	 */
	function normalizeExpr(expr){
		expr = expr.trim();

		return expr

			// replace space before "#" or "."
			.replace(regPool.prefixFlag, "~Tan~$1")

			// replace normal valid appearance
			.replace(regPool.offspring, "$1~Tan~$2")

			// remove other space
			.replace(regPool.space, "")

			.replace(regPool.specialFlag, " ")
		;

	}

	function processHunt(expr){
		var
			strategy,
			_collectionDom,
			_collectionPioneerDom
		;

		strategy = strategySplit(expr);
		strategy = optimizeStrategy(strategy);

		_collectionDom = [];
		_collectionPioneerDom = [];

		// 遍历 strategy, 根据 strategy 每组, 流式( Stream ) 去匹配(过滤) DOM
		for(var i = 0, len = strategy.length; i < len; i++){
			collectMain(strategy[i], _collectionDom, _collectionPioneerDom);

			// 退出遍历
			if(0 === _collectionDom.length){ break }
		}

		console.debug("final: " ,  _collectionDom);
		console.debug("queryAll: " ,  slice(document.querySelectorAll(expr)));
		_collectionPioneerDom.length = 0;

		return _collectionDom;

	}

	function collectMain(iStrategy, collection, _collectionPioneerDom){

		// 初始节点
		// 目前看来: 除了 初始节点 使用了 atomEngine, 其余都是 特性匹配
		if(0 === collection.length){

			collection.push.apply(collection, atomEngine["__" + (iStrategy.action || "hunt")](iStrategy.atomExpr));
			_collectionPioneerDom.push.apply(_collectionPioneerDom, collection);

		}else{

			strategyRelativeHandler[iStrategy.relative](iStrategy.atomExpr, collection, _collectionPioneerDom, iStrategy);

		}

	}

	/**
	 * 进行 群主选择器, 它优先级最高
	 * @param expr
	 * @returns {*}
	 */
	function group(expr){
		var
			arr = expr.split(","),
			results
		;

		for(var i = 0, len = arr.length, oneResult; i < len; i++){
			oneResult = hunt(arr[i]);
			results = results ?
				results.concat(oneResult) :
				oneResult
			;
		}

		return results;

	}

	/**
	 * 拆分 选择器
	 * @param { String } expr
	 * @returns {Array}
	 */
	function strategySplit(expr){
		var
			arrRelationship,
			rawSelectors,
			strategyContainer = []
		;

		// 得到 关系选择符
		arrRelationship = expr.match(regPool.groupSet) || [];

		// 得到 选择符
		rawSelectors = arrRelationship ? expr.split(regPool.groupSet) : [expr];

		// 忽略第一个单元选择符
		arrRelationship.push(null);

		(function(rawSelectors, arrRelationship){

			var len = rawSelectors.length,
				itemRawSelector,
				itemRelative,
				strategy,
				featureStrategyContainer
			;

			while(len--){
				// 创建策略对象
				strategy = {};

				featureStrategyContainer = [];
				itemRawSelector = rawSelectors[len];

				itemRelative = arrRelationship.pop();

				// 处理 单元选择器 特性
				itemRawSelector = attachFeature(itemRawSelector, strategy, featureStrategyContainer);

				// 处理 多重选择器
				itemRawSelector = assembleSelector(itemRawSelector, strategy, featureStrategyContainer);

				strategyContainer.push({
					atomExpr: itemRawSelector,

					action: pureUnitAction(itemRawSelector),

					// relative 泛值:
					//  + leaf 根节点
					//  + self 自身
					//  + ancestor 祖先
					//  + parent 父辈
					//  + adjacent 相邻选择符
					//  + siblings 兄弟选择器

					relative: domCharacterHelper.relativeHash[itemRelative] || "leaf"
				});

				Array.prototype.push.apply(strategyContainer, featureStrategyContainer)
			}

		})(rawSelectors, arrRelationship);

		console.log(JSON.stringify(strategyContainer).replace(/\},\{/g, "},\n{"));

		return strategyContainer
	}

	// step2: 判断是否存在 [] , 进行属性选择
	// step3: 判断是否存在 ":", 进行伪类选择
	/**
	 * 处理 属性选择器, 伪类选择器
	 * @param selector
	 * @param strategy
	 * @param featureStrategyContainer
	 * @returns {*}
	 */
	function attachFeature(selector, strategy, featureStrategyContainer){
		var
			rAttr = /\[([^\[\]]*)\]/,
			rPseudo = /:(.+)$/,
			rawAttr,
			rawPseudo
		;

		// 属性选择特性
		rawAttr = selector.match(rAttr);

		if(rawAttr){
			rawAttr = rawAttr[1];
			rawAttr = rawAttr.replace(/'|"/g,"");

			featureStrategyContainer.push({
				atomExpr: rawAttr,
				action  : "attr",
				relative: "self"
			});

			selector = selector.replace(rAttr, "");

		}

		// 伪类 选择特性
		rawPseudo = selector.match(rPseudo);
		if(rawPseudo){
			rawPseudo = rawPseudo[1];
			selector = selector.replace(rPseudo, "");

			featureStrategyContainer.push({
				atomExpr: rawPseudo,
				action  : "pseudo",
				relative: "self"
			});

		}

		return selector;
	}

	/**
	 * 修正 主选择器
	 * @param selector
	 * @param strategy
	 * @returns {*}
	 */
	function assembleSelector(selector, strategy, featureStrategyContainer){

		var newSelector,
			mulSelector,
			strategyAssembleContainer
		;

		// 判断第一位是否为 "." "#"
		// 如果是则使用对应 __inClass __inId
		// 如果不是则统统使用 __inTag

		// 可能出现的格式
		// div
		// .class1
		// #id1
		// div.class
		// .class1.class2
		// .class1#id1

		var
			hashExprAction = {
				".": "class",
				"#": "id"
			}
		;

		mulSelector = selector.match(regPool.exprUnit);

		if(1 === mulSelector.length){
			newSelector = selector;

		}else{

			newSelector = mulSelector.pop();

			strategyAssembleContainer = [];

			mulSelector.forEach(function(expr){
				strategyAssembleContainer.push({
					atomExpr: expr,
					action  : hashExprAction[expr[0]] || "tag",
					relative: "self"
				});
			});

			strategyAssembleContainer.reverse();
			featureStrategyContainer.push.apply(featureStrategyContainer, strategyAssembleContainer);

		}

		return newSelector;
	}

	function pureUnitAction(selector){

		var _action;
		hunt: {

			if(-1 !== selector.indexOf(".")){
				_action = "class";
				break hunt;
			}

			if(-1 !== selector.indexOf("#")){
				_action = "id";
				break hunt;
			}

			_action = "tag";
		}

		return _action;

	}

	/**
	 * 优化 选择器, 将 上一步 strategySplit 结果.
	 * 对比 浏览器支持.
	 * 对于 可以使用 querySelectorAll 合并 表达式. 并将 action 设为 "native"
	 */
	function optimizeStrategy(strategy){
		return strategy;
	}

	/**
	 * @return { Object }
	 */
	function support(){
		var doc = document;

		return {
			elementSibling  : doc.documentElement.previousElementSibling === null,
			querySelectorAll: "undefined" !== typeof doc.createElement("Tan").querySelectorAll
		}
	}

	module.exports = hunt;

});

(function(){
	// .view div
	var spiltResult_1 = [
		{
			atomExpr: "div",
			// 开始标识符
			relative: "leaf",
			action  : "tag",
			type    : "filter"
		},
		{
			atomExpr: ".view",
			// 祖先标识符, 适用于 包含选择符
			action  : "class",
			relative: "ancestor",
			type    : "filter"
		}
	];

	// .view div
	var spiltResult_2 = [
		{
			atomExpr: ".view",
			// 开始标识符
			action  : "class",
			relative  : "leaf",
			type    : "advance"
		},
		{
			atomExpr: "div",
			action  : "tag",
			// 祖先标识符, 适用于 包含选择符
			relative  : "offspring",
			type    : "advance"
		}
	];

	// .view div .j_HighLight
	var spiltResult_3 = [
		{
			atomExpr: ".j_HighLight",
			action  : "class",
			// 开始标识符
			relative  : "leaf"
		},
		{
			atomExpr: "div",
			action  : "tag",
			// 祖先标识符, 适用于 包含选择符
			relative  : "ancestor"
		},
		{
			atomExpr: ".view",
			action  : "class",
			// 祖先标识符, 适用于 包含选择符
			relative  : "ancestor"
		}
	];

	// div .light > span
	var spiltResult_4 = [
		{
			atomExpr: "span",
			action  : "tag",
			// 开始标识符
			relative  : "leaf",
			type    : "filter"
		},
		{
			atomExpr: ".light",
			action  : "class",
			// 父级标识符, 适用于 子代选择符
			relative  : "parent",
			type    : "filter"
		},
		{
			atomExpr: "div",
			action  : "tag",
			// 祖先标识符, 适用于 包含选择符
			relative  : "ancestor",
			type    : "filter"
		}
	];

	// .light + span > .target
	var spiltResult_5 = [
		{
			atomExpr: ".target",
			action  : "class",
			// 开始标识符
			relative  : "leaf",
			type    : "filter"
		},
		{
			atomExpr: "span",
			action  : "tag",
			// 祖先标识符, 适用于 包含选择符
			relative  : "parent",
			type    : "filter"
		},
		{
			atomExpr: ".light",
			action  : "class",
			// 兄弟标识符, 适用于 相邻选择符
			relative  : "adjacent",
			type    : "filter"
		}
	];

	// body div[data-spec]
	var spiltResult_5 = [
		{
			atomExpr: "div",
			action  : "tag",
			// 开始标识符
			relative  : "leaf",
			type    : "filter"
		},
		{
			atomExpr: "[data-spec]",
			action  : "attr",
			// 自身
			relative  : "self",
			type    : "filter"
		}

    ]

})();
