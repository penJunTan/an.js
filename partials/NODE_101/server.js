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

function HTTP_TAN(){
	this.init.apply(this, arguments);
}

HTTP_TAN.prototype = {

	constructor: HTTP_TAN,

	defaultOnf: {
		host: "localhost",
		port: 8080,
		root: "../../"
	},

	methods: {

		GET: function(req, res){

			this
				.parseUrl(req)
				.then(function(file){
					res.writeHead(200);
					return file;
				}, function(){
					res.writeHead(404);
				})

				.then(function(file){
					console.log(file);
					res.end(file || "找不到相关文件");
				})
			;

			return {
				needEnd: false
			}

		},

		POST: function(req, res){},

		DELETE: function(req, res){},

		PUT: function(req, res){}
	},

	parseUrl: function(req){
		var oCookedUrl,
			_path,

			_defer = Q.defer()
		;

		oCookedUrl = url.parse(req.url);

		_path = path.join(__dirname , this.root, oCookedUrl.pathname);

		fs.readFile(_path, {
			encoding: "utf8"
		}, function(err, file){

			if(err){
				_defer.reject();
				return;
			}
			_defer.resolve(file);

		});

		return _defer.promise;
	},

	response: function(req, res){

		var info;

		// 请求方法来决定响应行为
		info = (this.methods[req.method] || this.methods["GET"]).call(this, req, res) || {};

		info.needEnd = "boolean" === typeof info.needEnd ? info.needEnd : true;
		info.needEnd && res.end();
	},

	init: function(onf){
		onf = onf || {};

		// 配置
		_.extend(this, this.defaultOnf, _.filter({
			host: onf.host,
			port: onf.port,
			root: onf.root
		}, function(value){
			return "undefined" !== typeof value;
		}));

		// bootstrap Http Server
		this.server = http
			.createServer(this.response.bind(this))
			.listen(this.port, this.host)
		;

		console.log("Server running at http://" + this.host + ":" + this.port);
	}

};

new HTTP_TAN();
