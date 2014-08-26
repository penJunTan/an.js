/**
 * Created by Tan on 2014/8/21.
 */


var Server_Tan = require("./server");

var
	iServer,
	onf
;

onf = {
	port: 8080,
	root: "../../",
	path: __dirname
};

iServer = new Server_Tan(onf);

iServer
	.when("/hello_word", {
		controller: "helloWordCtrl"
	})
	.when("/query_101", {
		controller: "queryCtrl"
	})
;

iServer.controller("helloWordCtrl", function(req, res, query){
	res.writeHead(201);
	res.end("hello~~~");
});

iServer.controller("queryCtrl", function(req, res, query){
	var response;

	response = "你请求的参数:" + JSON.stringify(query);
	res.writeHead(200);
	res.end(response);
});
