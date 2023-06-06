import dotenv from 'dotenv';
dotenv.config();

// console.log(process.env.APS_AUTH_CALLBACK_URL);
var express = require('express');
var app = express();
var server = require('http').Server(app);  

//get token route
var tokenRoute = require('./token');

app.use(process.env.APS_AUTH_CALLBACK_PATH, tokenRoute.router);  

//set port
app.set('port', process.env.APS_AUTH_CALLBACK_PORT || 3000);

server.listen(app.get('port'), function() {
    console.log('Server listening on port ' 
        + server.address().port);
});

app.get("/granted", (_:any, res: any) => {
    res.send("✭ Access has been granted ✭");
    process.exit(0);
});

//start oAuth process
tokenRoute.startOAuth();