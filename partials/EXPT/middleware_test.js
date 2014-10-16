/**
 * Created by Tan on 2014/8/27.
 */

var Middleware = require("./middleWare");

var iM = new Middleware();

iM.add(function(res, req, next){
	console.log("call me First");
	console.log(res, req);
	console.log("call me First__END______________");
	next();
});

iM.add(function(res, req, next){
	console.log("call me 第二");
	console.log(res, req);
	console.log("call me 第二__END______________");
	next();
});

iM.run("a", "b");

