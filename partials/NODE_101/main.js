/**
 * Created by Tan on 2014/8/21.
 */


// load modules
var nodeServer = require("./server");

// declare var
var
	iServer,
	onfServer
;

onfServer = {
	port: 8080,
	root: "../../",
	path: __dirname
};

iServer = new nodeServer(onfServer);


// 中间件处理流程
iServer

	.use(nodeServer.connect.controller(iServer))

	.use(nodeServer.connect.readFile(iServer))

	.use(function errorConnect(req, res){
		var strWarnMsg;

		strWarnMsg = "服务器无法处理您的请求!";
		strWarnMsg += "\n请求方式: " + req.method;
		strWarnMsg += "\n请求URL: " + req.url;

		res.writeHead( 404, {
			'Content-Type'  : 'text/plain'
		});

		res.end(strWarnMsg);
	})
;


// 配置路由
iServer

	.when("/hello_word", {
		controller: "helloWordCtrl"
	})

	.when("/query_101", {
		controller: "queryCtrl"
	})

;

// 设置 controller
iServer

	.controller("helloWordCtrl", function(req, res, next){
		res.writeHead(201);
		res.end("hello~~~");
	})

	.controller("queryCtrl", function(req, res, next){
		var response;

		response = "你请求的参数:" + JSON.stringify(req.query);
		res.writeHead(200);
		res.end(response);
	})
;
