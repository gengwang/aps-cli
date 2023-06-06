import dotenv from 'dotenv';
dotenv.config();

// console.log(process.env.BOX_CALLBACK_URL);
var express = require('express');
var app = express();
var server = require('http').Server(app);  

//get token route
var tokenRoute = require('./token');

app.use(process.env.BOX_CALLBACK_PATH, tokenRoute.router);  

//set port
app.set('port', process.env.PORT || 3000);

server.listen(app.get('port'), function() {
    console.log('Server listening on port ' 
        + server.address().port);
});

//start oAuth process
tokenRoute.startoAuth();