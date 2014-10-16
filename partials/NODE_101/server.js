/**
 * Created by Tan on 2014/8/20.
 */

// load native modules
var
	http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs")
;

// load others modules
var
	_ = require("../../node_modules/underscore"),
	Q = require("../../node_modules/q"),
	Middleware = require("../EXPT/middleware")
;

function NodeServer(appConfig){
	this.init(appConfig);
}

NodeServer.prototype = {

	constructor: NodeServer,

	config: {
		host           : "localhost",
		port           : 8080,
		root           : "./",
		autoStartServer: true
	},

	controllers: {},

	routes: {},

	init: function(appConfig){

		this.iMiddleware = new Middleware();

		this.use(NodeServer.connect.extractUrlQuery());

		// 配置
		appConfig = _.extend({}, this.config, _.pick({
			host: appConfig.host,
			port: appConfig.port,
			root: appConfig.root,
			path: appConfig.path
		}, function(value){
			return "undefined" !== typeof value;
		}));

		this.config = appConfig;

		appConfig.root = path.resolve(__dirname, appConfig.path, appConfig.root);

		if(appConfig.autoStartServer){
			// bootstrap Http Server
			this.startServer(appConfig.response);
		}

		return this;
	},

	startServer: function(){

		this.server = http
			.createServer(this.responseMainHandler.bind(this))
			.listen(this.config.port, this.config.host)
		;

		NodeServer.log("A instance of NodeServer is running on " + this.config.host + ":" + this.config.port);

		return this;
	},

	responseMainHandler: function(req, res){
		this.run(req, res);
	},

	/**
	 *
	 * @param { String } routeUrl
	 * @param { Object } routeConfig
	 * @param { String } routeConfig.controller 该路由使用 controller 名
	 * @returns {NodeServer}
	 */
	when: function(routeUrl, routeConfig){
		this.routes[routeUrl] = routeConfig;
		return this;
	},

	/**
	 *
	 * @param { String } ctrlName
	 * @param { Function } controller
	 * @returns {NodeServer}
	 */
	controller: function(ctrlName, controller){
		this.controllers[ctrlName] = controller;
		return this;
	},

	/**
	 *
	 * @param { Function } middleWare
	 * @returns {NodeServer}
	 */
	use: function(middleWare){
		this.iMiddleware.add(middleWare);
		return this;
	},

	run: function(){
		this.iMiddleware.run.apply(this.iMiddleware, arguments);
		return this;
	}


};

NodeServer.staticImplementor = {

	log: function(){
		console.log.apply(console, arguments);
		return this;
	},

	connect: {

		controller: function(iServer){
			function controllerMiddleware(req, res, next){

				var
					matchedRoute,
					controller
				;

				if("GET" !== req.method.toUpperCase()){ next(); return; }

				// 获取路由
				matchedRoute = iServer.routes[url.parse(req.url).pathname];

				if(!matchedRoute){ next(); return; }

				// 获取 应用 controller
				controller = iServer.controllers[matchedRoute.controller];

				if("function" !== typeof controller){ next(); return; }

				controller.apply(iServer, arguments);

			}

			return controllerMiddleware;
		},

		readFile: function(iServer){

			function readFileMiddleware(req, res, next){

				if(!path.extname(req.url)){
					next();
					return;
				}

				NodeServer
					.readFile(
						// 组合参数中的所有路径, 并规范化后的路径
						path.join(iServer.config.root, url.parse(req.url).pathname)
					)

					.then(function(file){

						res.writeHead(200, {
							'Content-Length': file.length
						});
						res.end(file);

					}, function(error){

						var
							warningMsg = error.message || "找不到相关文件"
						;

						NodeServer.log(warningMsg);

						res.writeHead(404, {
							'Content-Length': warningMsg.length,
							'Content-Type'  : 'text/plain'
						});

						res.end(warningMsg);

					})
				;

			}

			return readFileMiddleware;
		},

		extractUrlQuery: function (){
			return function(req, res, next){
				req.query = url.parse(req.url, true).query;
				next();
			}
		}

	},

	// TODO: 浏览器 直接查看
	readFile: function(filePath){

		var
			_defer = Q.defer()
		;

		fs.readFile(filePath, { encoding: "utf8" }, function(err, file){

			if(err){
				_defer.reject(err);
				return;
			}

			_defer.resolve(file);

		});

		return _defer.promise;

	}

};

_.extend(NodeServer, NodeServer.staticImplementor);

module.exports = NodeServer;


