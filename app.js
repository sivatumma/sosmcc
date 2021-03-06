var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var server = require('http').Server(app);
// var io = require('socket.io')(82);
app.use(cors());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.set('view engine', 'jade');
app.use(express.static(path.join(process.cwd(), 'app')));
app.get('/', function(req, res) {
    res.sendfile(__dirname + 'dist/index.html');
});
/**********************************************************************************************
 ************   SPECIAL CODE THAT FETCHES DEVICE DATA - DON'T DISTURB UNLESS YOU KNOW - BELOW */
var server = require('net').createServer(function(deviceSocket) {
    deviceSocket.on('data', function(data) {
        var decodedDeviceData = new Buffer(data, 'hex').toString('utf8');
        console.log("Data from client", data);
        deviceSocket.emit('data', new Buffer(data, 'hex').toString('utf8'));
    });
    server.on('connection', function(c) {
        console.log("Connected a device");
    });
    server.on('listening', function() {
        console.log("Listening now");
    });
    server.on('data', function(d) {
        console.log("Here is d", d);
    });
    server.on('end', function() {
        console.log("This client is disconnecting, disconnected");
    });
    server.listen(5062, "0.0.0.0");
});

var listening = false;
var server = require('net').createServer(function(deviceSocket) {

	deviceSocket.on('connection', function(c) {    console.log("Connected a device",c);  });
	deviceSocket.on('data', function(data) {
		var decodedDeviceData = new Buffer(data, 'hex').toString('utf8');
		if(decodedDeviceData.startsWith('!1')){
			console.log("This looks like first connection, Capture IMEI and bind to this connection");
			this.uniqueIMEI = decodedDeviceData.split(',')[1].split(';')[0];
		}
		doPost(decodedDeviceData, this.uniqueIMEI);
	});
});


server.on('listening', function() {
	console.log("Listening");
	listening = true;
});

if (!listening) server.listen(5062, "0.0.0.0");
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

function doPost(data,imei) {
	var http = require("http");
	var options = {
		hostname: '192.168.137.3',
		port: 80,
		path: '/Service/device_post.php',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		}
	};
	var req = http.request(options, function(res) {
		console.log('Status: ' + res.statusCode);
		console.log('Headers: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function(body) {
			console.log('Body: ' + body);
		});
	});
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	var decode = data.split(",");

	var postData = {
		user: imei,
		latitude: decode[3],
		longitide: decode[4],
		update_time: new Date(),
		locationmethod: "SOS_Device",
		sessionid: "",
		accuracy: "",
		eventtype: "Normal",
		extrainfo: "Normal Location"
	};

	console.log("Going to hit with the following postData : ", postData);
	req.write(JSON.stringify(postData));
	req.end();
} // will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

module.exports = app;