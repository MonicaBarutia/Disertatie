const HTTP_PORT = 8080;

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;


// ----------------------------------------------------------------------------------------

// Create a server for the client html page
var handleRequest = function (request, response) {
    // Render the single client html file for any request the HTTP server receives
    console.log('request received: ' + request.url);

    if (request.url === '/') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(fs.readFileSync('index.html'));
    } else if (request.url === '/index1.html') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(fs.readFileSync('index1.html'));
    } else if (request.url === '/index2.html') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(fs.readFileSync('index2.html'));
    } else if (request.url === '/webrtc.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('webrtc.js'));
    } else if (request.url === '/Screen-Capturing.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('Screen-Capturing.js'));
    } else if (request.url === '/screenSharing.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('screenSharing.js'));
    } else if (request.url === '/ScreenSharing2.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('ScreenSharing2.js'));
    }else if (request.url === '/screenSharing3.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('screenSharing3.js'));
    }else if (request.url === '/style.css') {
        response.writeHead(200, {'Content-Type': 'text/css'});
        response.end(fs.readFileSync('style.css'));
    }
};

var httpServer = http.createServer(handleRequest).listen(HTTP_PORT);
//httpServer.listen(HTTP_PORT, '0.0.0.0');

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
var wss = new WebSocketServer({server: httpServer});

wss.on('connection', function (ws) {
    ws.on('message', function (message) {
        // Broadcast any received message to all clients
        console.log('received: %s', message);
        wss.broadcast(message);
    });
});

wss.broadcast = function (data) {
    this.clients.forEach(function (client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

console.log('Server running. Visit http://localhost:' + HTTP_PORT + ' in Firefox/Chrome');
