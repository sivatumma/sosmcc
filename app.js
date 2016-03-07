var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

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

io.on('connection', function(socket) {
  console.log("Client connected through 'connect' socket.io ");

  /**********************************************************************************************
   ************   SPECIAL CODE THAT FETCHES DEVICE DATA - DON'T DISTURB UNLESS YOU KNOW - BELOW */


/*
var server = require('net').createServer(function (socket) {
	socket.on('data',function(data){
		console.log("Data from client",data, new Buffer(data,'hex').toString('utf8'));
		
	});
});

*/

  var listening = false;
  var server = require('net').createServer(function(deviceSocket) {
    deviceSocket.on('data', function(data) {
      var decodedDeviceData = new Buffer(data,'hex').toString('utf8');
      console.log("Data from client", decodedDeviceData);
	doPost(decodedDeviceData);
	//console.log("This is the socket.io socket ", socket);
      //socket.emit('data',{data:data});
      // deviceSocket.emit('data', decodedDeviceData);

    });
  });


  // server.on('connection', function(c) {    console.log("Connected a device");  });
  server.on('listening', function() {    listening = true;  });
  // server.on('data', function(d) {    console.log("Here is d", d);  });
  // server.on('end', function() {    console.log("This client is disconnecting, disconnected");  });

  if(!listening) server.listen(5062, "0.0.0.0");

  /**************************************************************************************
   *******   SPECIAL CODE THAT FETCHES DEVICE DATA - DON'T DISTURB UNLESS YOU KNOW ABOVE */
});

// uncomment after placing your favicon in /public
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


// error handlers

// development error handler
function doPost(data) {
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
		user: "SOS_Device",
		latitude: decode[3],
		longitide: decode[4],
		update_time: new Date(),
		locationmethod: "SOS_Device",
		sessionid: "",
		accuracy: "",
		eventtype: "Normal",
		extrainfo: "Normal Location"
	};

	req.write(JSON.stringify(postData));
	req.end();
}// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

server.listen(80);


module.exports = app;
