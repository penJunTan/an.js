/**
 * Created by Tan on 2014/8/26.
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

	"use strict";

	var
		_oPrivatePersistence
	;

	_oPrivatePersistence = {

		__uuid: 0,

		pool: {},

		uuid: function(){
			return this.__uuid++;
		},

		set: function(any){
			var uid = this.uuid();
			this.pool[uid] = any;
			return uid;
		},

		get: function(uid){
			return this.pool[uid];
		}
	};

	function Middleware(){
		this.init.apply(this, arguments);
	}

	Middleware.prototype = {

		constructor: Middleware,

		init: function(){
			var
				arrMiddleWare = [],
				oPPid
			;

			oPPid = _oPrivatePersistence.set(arrMiddleWare);

			this.ID = oPPid;

			this.init = function(){};

			return this;
		},

		add: function(memberFn){
			var middleWare;

			if("function" === typeof memberFn){
				middleWare = _oPrivatePersistence.get(this.ID);
				middleWare.push(memberFn);
			}

			return this;
		},

		remove: function(memberFn){
			var middleWare = _oPrivatePersistence.get(this.ID);

			for(var i = 0, len = middleWare.length; i < len; i++){
				if(middleWare[i] === middleWare){
					middleWare.splice(i, 1);
					break;
				}
			}

			return this;
		},

		list: function(){
			return _oPrivatePersistence.get(this.ID).map(function(item){
				return item;
			});
		},

		reset: function(){
			var middleWare = _oPrivatePersistence.get(this.ID);
			middleWare.length = 0;
			return this;
		},

		unload: function(){
			return this.reset();
		},

		run: function(){
			var
				middleWare,
				runArgs
			;

			middleWare = _oPrivatePersistence.get(this.ID);

			if(0 === middleWare.length){ return this; }

			middleWare = middleWare.slice();

			runArgs = Array.prototype.slice.call(arguments);
			runArgs.push(next);
			next();

			function next(){
				var
					headMemberFn = middleWare.shift(),
					nextArgs = Array.prototype.slice.call(arguments)
				;

				if("function" === typeof headMemberFn){
					headMemberFn.apply(null, runArgs.concat(nextArgs));
				}else{
					0 !== middleWare.length && next();
				}
			}

			// gc
			runArgs.length = 0;
			next =
			runArgs =
			middleWare = null;

			return this;
		}
	};

	module.exports = Middleware;

});
