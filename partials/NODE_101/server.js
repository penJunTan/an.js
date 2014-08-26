/**
 * Created by Tan on 2014/8/20.
 */

var
	http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs")
;

var
	_ = require("../../node_modules/underscore"),
	Q = require("../../node_modules/q")
;

// overwrite

(function(_){
	var createCallback = function(func, context, argCount) {
		if (context === void 0) return func;
		switch (argCount == null ? 3 : argCount) {
			case 1: return function(value) {
				return func.call(context, value);
			};
			case 2: return function(value, other) {
				return func.call(context, value, other);
			};
			case 3: return function(value, index, collection) {
				return func.call(context, value, index, collection);
			};
			case 4: return function(accumulator, value, index, collection) {
				return func.call(context, accumulator, value, index, collection);
			};
		}
		return function() {
			return func.apply(context, arguments);
		};
	};

	_.pick = function(obj, iteratee, context){
		var result = {}, key;
		if(obj == null) { return result; }

		if(_.isFunction(iteratee)){
			iteratee = createCallback(iteratee, context);
			for(key in obj){
				var value = obj[key];
				if(iteratee(value, key, obj)) result[key] = value;
			}
		}else{
			var keys = concat.apply([], slice.call(arguments, 1));
			obj = new Object(obj);
			for(var i = 0, length = keys.length; i < length; i++){
				key = keys[i];
				if(key in obj) result[key] = obj[key];
			}
		}
		return result;
	};
})(_);

function ServerTAN(){
	0 !== arguments.length && this.init.apply(this, arguments);
}

ServerTAN.prototype = {

	constructor: ServerTAN,

	defaultOnf: {
		host: "localhost",
		port: 8080,
		root: "./"
	},

	methods: {

		GET: function(req, res){

			var promise,
				queryInfo
			;

			queryInfo = url.parse(req.url, true).query;

			// 判断 文件url || controller url
			if(path.extname(req.url)){
				promise = this.startReadFile(req, res, queryInfo);

			}else{
				promise = this.loadController(req, res, queryInfo);
			}

			return promise;
		},

		POST: function(req, res){

		},

		DELETE: function(req, res){},

		PUT: function(req, res){}
	},

	controllers: {},

	routes: {},

	readFile: function(_filePath){

		var
			_defer = Q.defer()
		;

		fs.readFile(_filePath, {
			encoding: "utf8"
		}, function(err, file){

			if(err){
				_defer.reject({ reqInfo: "找不到相关文件" });
				return;
			}

			_defer.resolve({ reqInfo  : file });

		});

		return _defer.promise;

	},

	startReadFile: function(req, res){

		var promise;

		promise = this.readFile(path.join(this.root, url.parse(req.url).pathname));

		promise

			.then(function(info){
				res.writeHead(200, {
					'Content-Length': info.reqInfo.length
				});
				res.end(info.reqInfo);

			}, function(info){
				var
					warningMsg = info.reqInfo || "找不到相关文件"
				;

				res.writeHead(404, {
					'Content-Length': warningMsg.length,
					'Content-Type'  : 'text/plain'
				});
				res.end(warningMsg || "找不到相关文件");
			})
		;

		return promise;
	},

	loadController: function(req, res){
		var
			_defer = Q.defer(),
			matchRoute,
			controller,
			resInfo,

			oCookedUrl = url.parse(req.url)
		;

		// TODO 匹配: url动态参数
		matchRoute = this.routes[oCookedUrl.pathname];

		if(!matchRoute){
			_defer.reject({
				isEnd  : false,
				reqInfo: "找不到响应控制器"
			});
			return _defer.promise;
		}

		controller = this.controllers[matchRoute.controller];

		if("function" === typeof controller){
			resInfo = {
				isEnd  : true,
				resInfo: controller.apply(this.server, arguments)
			};

		}else{
			resInfo = {
				isEnd  : false,
				resInfo: controller
			};
		}

		resInfo.controller = matchRoute.controller;

		_defer.resolve(resInfo);

		return _defer.promise;
	},

	response: function(req, res){

		var promise;

		// 请求方法来决定响应行为
		promise = (this.methods[req.method] || this.methods["GET"]).call(this, req, res);

		promise
			.then(function(info){
				return [true, info];
			},
			function(info){
				return [false, info];
			})
			.then(function(info){
				var
					warnMsg,
					isResolved
				;

				if(res.finished){ return }

				isResolved = info[0];
				info = info [1];

				warnMsg = "服务器无法处理您的请求!";
				warnMsg += "\n请求方式: " + req.method;
				warnMsg += info.controller ? "\n请求控制器: " + info.controller : "";

				res.writeHead(isResolved ? 200 : 404, {
					'Content-Type'  : 'text/plain'
				});

				res.end(warnMsg);
			})
		;

	},

	init: function(onf){
		onf = onf || {};

		// 配置
		_.extend(this, this.defaultOnf, _.pick({
			host: onf.host,
			port: onf.port,
			root: onf.root,
			path: onf.path
		}, function(value){
			return "undefined" !== typeof value;
		}));

		this.root = path.resolve(__dirname, this.path, this.root);

		// bootstrap Http Server
		this.server = http
			.createServer(this.response.bind(this))
			.listen(this.port, this.host)
		;
	}

};

function Server(){
	this.iSserver = new ServerTAN();

	this.server = this.iSserver.server;
	this.iSserver.init.apply(this.iSserver, arguments);
}

Server.prototype = {
	constructor: Server,

	when: function(url, onf){
		this.iSserver.routes[url] = onf;
		return this;
	},

	controller: function(key, controller){
		this.iSserver.controllers[key] = controller;
		return this;
	}

};

module.exports = Server;


