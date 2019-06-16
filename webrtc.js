var serverConnection;
var localVideo;
var remoteVideo;
var peerConnection;
var localStream;
var uuid;

var peerConnectionConfig = {
    'iceServers': [
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'},
    ]
};

function pageReady(screenCapStream) {
    uuid = uuid();

    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');

    serverConnection = new WebSocket('ws://' + window.location.hostname + ':8080');
    serverConnection.onmessage = gotMessageFromServer;

    if (screenCapStream == false) {   // we share a webcam video
        var constraints = {
            video: true,
            audio: true,
        };

        if (navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
        } else {
            alert('Your browser does not support getUserMedia API');
        }
    } else {                        // we share our screen
        getScreenConstraints(function (error, screen_constraints) {
            if (error) {
                return alert(error);
            }
            console.log('screen_constraints', screen_constraints);

            //navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
            navigator.getUserMedia({video: screen_constraints}, function (stream) {
                console.log("----- ", screen_constraints);
                //localVideo.src = URL.createObjectURL(stream);
                localVideo.srcObject = stream;
                localVideo.play();
                localStream = stream;
                console.log("screencap stream=", stream.getTracks());
            }, function (error) {
                alert(JSON.stringify(error, null, '\t'));
            });
        });
    }

}

function getUserMediaSuccess(stream) {
    console.log("webcam stream=", stream.getTracks());
    localStream = stream;
    //localVideo.src = window.URL.createObjectURL(stream);
    localVideo.srcObject = stream;
}

function start(isCaller) {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.onaddstream = gotRemoteStream;
    console.log("localStream=", localStream);
    peerConnection.addStream(localStream);

    if (isCaller) {
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
    }

    var identity = peerConnection.peerIdentity;
    if (identity) {
        alert("Identity of the peer: idp='" +
            identity.idp + "'; assertion='" +
            identity.name + "'");
    }
    else {
        alert("Identity of the peer has not been verified");
    }
}

function gotMessageFromServer(message) {
    if (!peerConnection) start(false);

    var signal = JSON.parse(message.data);

    // Ignore messages from ourself
    if (signal.uuid == uuid) return;

    if (signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function () {
            // Only create answers in response to offers
            if (signal.sdp.type == 'offer') {
                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            }
        }).catch(errorHandler);
    } else if (signal.ice) {
        console.log("ice message: ", signal.ice);
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }

    if (signal.type === "textarea") {
        var x, y;
        if (signal.coordinates === "relative") {
            position = calculatePositionFullScreen(signal.cursorX, signal.cursorY, signal.elemX, signal.elemY);
            x = position[0];
            y = position[1];
        } else if (signal.coordinates === "fix") {
            position = calculatePositionVideoTag(signal.cursorX, signal.cursorY, signal.screenX, signal.screenY);
            x = position[0];
            y = position[1];
        }

        console.log("textarea");
        textArea = document.createElement("textarea");
        textArea.className = "screenshare";
        Object.assign(textArea.style, {
            "z-index": "50",
            "position": "absolute",
            "left": x + "px",
            "top": y + "px",
        });
        textArea.value = signal.text;
        autosize(textArea);
        textArea.setAttribute('id', signal.id);
        textArea.setAttribute('onkeypress', 'onTextArea()');
        document.body.appendChild(textArea);
    }

    if (signal.type === "keypress") {
        textArea = document.getElementById(signal.id);
        if (textArea !== null)
            textArea.value += signal.text;
    }

    if (signal.type === "delete") {
        elem = document.getElementById(signal.id);
        if (elem !== null)
            elem.remove();
    }

    if (signal.type === "draw") {
        canvas = document.getElementById("myCanvas");
        if (canvas !== null) {
            ctx = canvas.getContext('2d');
            console.log(signal.text);
            if (signal.text === "onMouseDown") {
                onMouseDown();
            }
            if (signal.text === "onMouseMove") {
                coordinates = calculatePositionFullScreen(signal.mouseX, signal.mouseY, signal.elemX, signal.elemY);
                onMouseMove(coordinates[0], coordinates[1]);
            }
            if (signal.text === "onMouseUp") {
                onMouseUp();
            }
        }
    }

    if (signal.type === "rectangle") {
        canvasRect = document.getElementById('myCanvas2');
        if (canvasRect !== null) {
            ctxRect = canvasRect.getContext('2d');
            console.log(signal.text);
            if (signal.text === "onMouseDown") {
                coordinates = calculatePositionFullScreen(signal.mouseX, signal.mouseY, signal.elemX, signal.elemY);
                mouseDownRect(coordinates[0], coordinates[1]);
            }
            if (signal.text === "onMouseMove") {
                coordinates = calculatePositionFullScreen(signal.mouseX, signal.mouseY, signal.elemX, signal.elemY);
                mouseMoveRect(coordinates[0], coordinates[1]);
            }
            if (signal.text === "onMouseUp") {
                mouseUpRect();
            }
        }
    }

    if (signal.type === "arrow") {
        hasLoaded = true;
        canvasArrow = document.getElementById('myCanvas3');
        if (canvasArrow !== null) {
            ctxArrow = canvasArrow.getContext('2d');
            console.log(signal.text);
            if (signal.text === "onMouseDown") {
                drawArrow();
                coordinates = calculatePositionFullScreen(signal.mouseX, signal.mouseY, signal.elemX, signal.elemY);
                onmousedown(coordinates[0], coordinates[1]);
            }
            if (signal.text === "onMouseMove") {
                drawArrow();
                coordinates = calculatePositionFullScreen(signal.mouseX, signal.mouseY, signal.elemX, signal.elemY);
                onmousemove(coordinates[0], coordinates[1]);
            }
            if (signal.text === "onMouseUp") {
                drawArrow();
                onmouseup();
            }

        }
    }

    if (signal.type === "erase") {
        var canvasArray = document.getElementsByTagName("canvas");
        for (var i = 0, n = canvasArray.length; i < n; ++i) {
            var el = canvasArray[i];
            id = el.id;
            canvasErase = document.getElementById(id);
            if (canvasErase !== null) {
                ctxErase = canvasErase.getContext('2d');
                console.log(signal.text);
                if (signal.text === "onMouseDown") {
                    coordinates = calculatePositionFullScreen(signal.mouseX, signal.mouseY, signal.elemX, signal.elemY);
                    mousedown(coordinates[0], coordinates[1]);
                }
                if (signal.text === "onMouseMove") {
                    coordinates = calculatePositionFullScreen(signal.mouseX, signal.mouseY, signal.elemX, signal.elemY);
                    mousemove(coordinates[0], coordinates[1]);
                }
                if (signal.text === "onMouseUp") {
                    mouseup();
                }

            }
        }
    }

    if (signal.type === "color") {
        canvas = document.getElementById("myCanvas");
        ctx = canvas.getContext('2d');
        ctx.strokeStyle = signal.color;
        ctx.fillStyle = signal.color;
        contextColor = signal.color;
    }
}

function gotIceCandidate(event) {
    if (event.candidate != null) {
        serverConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
    }
}

function createdDescription(description) {
    console.log('got description');
    var sdpLines = description.sdp.split('\r\n');
    var eLine = 'e=forest@cs.ubbcluj.ro';
    var sIndex = sdpLines.indexOf('s=-');
    sdpLines.splice(sIndex + 1, 0, eLine);
    //var aLine = 'a=user:forest';
    //sdpLines.splice(sdpLines.length-1, 0, aLine);
    console.log(sdpLines);
    description.sdp = sdpLines.join('\r\n');
    peerConnection.setLocalDescription(description).then(function () {
        serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
    }).catch(errorHandler);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    //remoteVideo.src = window.URL.createObjectURL(event.stream);
    remoteVideo.srcObject = event.stream;
}

function errorHandler(error) {
    console.log("Error: ", error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function uuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function calculatePositionFullScreen(relativeX, relativeY, elemX, elemY) {
    // screenX = screen.width;
    // screenY = screen.height;
    windowX = window.innerWidth;
    windowY = window.innerHeight;
    //windowX = document.documentElement.clientWidth;
    //windowY = document.documentElement.clientHeight;
    x = windowX * relativeX / elemX;
    y = windowY * relativeY / elemY ;
    y = y + 17 / 100 * y;
    return [x, y];
}

function calculatePositionVideoTag(x, y, screenX, screenY) {
    var elem = document.getElementById('remoteVideo');
    // barheight = screen.height-html.clientHeight;
    // relbarheight = barheight*remoteVideo.height()/screen.height;
    elemX = elem.offsetWidth;
    elemY = elem.offsetHeight;
    relativeX = elemX * x / screenX + elem.offsetLeft;
    relativeY = elemY * y / screenY + elem.offsetTop;
    return [relativeX, relativeY]
}

var canvas, ctx;
var mouseX, mouseY, mouseDown = 0,
    lastX, lastY;

function draw(ctx, x, y, size) {
    if (lastX && lastY && (x !== lastX || y !== lastY)) {
        ctx.fillStyle = contextColor;
        ctx.strokeStyle = contextColor;
        ctx.lineWidth = 2 * size;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    ctx.fillStyle = contextColor;
    ctx.strokeStyle = contextColor;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    lastX = x;
    lastY = y;
}

function clearCanvas(canvas, ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

function onMouseDown() {
    mouseDown = 1;
    draw(ctx, mouseX, mouseY, 2)
}

function onMouseUp() {
    mouseDown = 0;
    lastX = 0;
    lastY = 0;
}

function onMouseMove(mouseX, mouseY) {
    getMousePos(mouseX, mouseY);
    if (mouseDown === 1) {
        draw(ctx, mouseX, mouseY, 2)
    }
}

function getMousePos(pixelX, pixelY) {
    mouseX = pixelX;
    mouseY = pixelY;
    console.log(mouseX, mouseY);
}

var canvasRect;
var ctxRect;
// ctx.globalAlpha = 0.5;
var rect = {};
var drag = false;
var rectStartXArray = new Array();
var rectStartYArray = new Array();
var rectWArray = new Array();
var rectHArray = new Array();
var rectColor = new Array();

function mouseDownRect(pixelX, pixelY) {
    rect.startX = pixelX;
    rect.startY = pixelY;
    drag = true;
}

function mouseUpRect() {
    console.log(contextColor);
    rectStartXArray[rectStartXArray.length] = rect.startX;
    rectStartYArray[rectStartYArray.length] = rect.startY;
    rectWArray[rectWArray.length] = rect.w;
    rectHArray[rectHArray.length] = rect.h;
    rectColor[rectColor.length] = contextColor;
    drag = false;
}

function mouseMoveRect(pixelX, pixelY) {
    if (drag) {
        rect.w = pixelX;
        rect.h = pixelY;
        ctxRect.clearRect(0, 0, canvasRect.width, canvasRect.height);
        drawRect();
    }

    drawOldShapes();
}

function drawRect() {
    ctxRect.beginPath();
    ctxRect.rect(rect.startX, rect.startY, rect.w, rect.h);
    ctxRect.fillStyle = contextColor;
    ctxRect.strokeStyle = contextColor;
    ctxRect.stroke();
}

function drawOldShapes() {
    for (var i = 0; i < rectStartXArray.length; i++) {
        if (rectStartXArray[i] != rect.startX && rectStartYArray[i] != rect.startY && rectWArray[i] != rect.w && rectHArray[i] != rect.h) {
            ctxRect.beginPath();
            ctxRect.rect(rectStartXArray[i], rectStartYArray[i], rectWArray[i], rectHArray[i]);
            ctxRect.fillStyle = rectColor[i];
            ctxRect.strokeStyle = rectColor[i];
            ctxRect.stroke();
        }
    }
}

var canvasArrow;
var ctxArrow;
var hasLoaded = false;

var arrowStartX = 0;
var arrowStartY = 0;
var arrowMouseX = 0;
var arrowMouseY = 0;
var isDrawing = false;
var existingLines = [];
var lineColor = [];

var PI = Math.PI;
var degreesInRadians225 = 225 * PI / 180;
var degreesInRadians135 = 135 * PI / 180;
var headLength = 15;

function drawArrow() {
    ctxArrow.clearRect(0, 0, canvasArrow.width, canvasArrow.height);
    ctxArrow.lineWidth = 2;


    for (var i = 0; i < existingLines.length; ++i) {
        ctxArrow.beginPath();
        var line = existingLines[i];

        // calc the angle of the line
        var dx = line.endX - line.arrowStartX;
        var dy = line.endY - line.arrowStartY;
        var angle = Math.atan2(dy, dx);

        // calc arrowhead points
        var x225 = line.endX + headLength * Math.cos(angle + degreesInRadians225);
        var y225 = line.endY + headLength * Math.sin(angle + degreesInRadians225);
        var x135 = line.endX + headLength * Math.cos(angle + degreesInRadians135);
        var y135 = line.endY + headLength * Math.sin(angle + degreesInRadians135);

        ctxArrow.moveTo(line.arrowStartX, line.arrowStartY);
        ctxArrow.lineTo(line.endX, line.endY);
        // draw partial arrowhead at 225 degrees
        ctxArrow.moveTo(line.endX, line.endY);
        ctxArrow.lineTo(x225, y225);
        // draw partial arrowhead at 135 degrees
        ctxArrow.moveTo(line.endX, line.endY);
        ctxArrow.lineTo(x135, y135);

        ctxArrow.fillStyle = lineColor[i];
        ctxArrow.strokeStyle = lineColor[i];
        ctxArrow.stroke();
    }


    if (isDrawing) {
        ctxArrow.fillStyle = contextColor;
        ctxArrow.lineWidth = 2;
        ctxArrow.beginPath();
        ctxArrow.moveTo(arrowStartX, arrowStartY);
        ctxArrow.lineTo(arrowMouseX, arrowMouseY);
        ctxArrow.stroke();
    }
}

function onmousedown(pixelX, pixelY) {
    if (hasLoaded) {
        if (!isDrawing) {
            arrowStartX = pixelX;
            arrowStartY = pixelY;

            isDrawing = true;
        }

        drawArrow();
    }
}

function onmouseup() {
    if (hasLoaded) {
        if (isDrawing) {
            existingLines.push({
                arrowStartX: arrowStartX,
                arrowStartY: arrowStartY,
                endX: arrowMouseX,
                endY: arrowMouseY
            });
            lineColor[lineColor.length] = contextColor;

            isDrawing = false;
        }

        drawArrow();
    }
}

function onmousemove(pixelX, pixelY) {
    if (hasLoaded) {
        arrowMouseX = pixelX;
        arrowMouseY = pixelY;

        if (isDrawing) {
            drawArrow();
        }
    }
}

var contextColor = 'black';

function updateColor(event) {
    // console.log( event.target.value);
    console.log(event.value);
    canvas = document.getElementById("smallCanvas");
    if (canvas !== undefined) {
        var msg = {
            type: "color",
            color: event.value,
        };
        serverConnection.send(JSON.stringify(msg));
    }
    ctx = canvas.getContext('2d');
    contextColor = event.value;
    ctx.strokeStyle = event.value;
    ctx.fillStyle = event.value;
}

//Canvas
var canvasErase;
var ctxErase;
//Variables
var canvasx;
var canvasy;
var last_mousex = last_mousey = 0;
var mousex = mousey = 0;
var mousedownev = false;

//Mousedown
function mousedown(pixelX, pixelY) {
    last_mousex = mousex = pixelX;
    last_mousey = mousey = pixelY;
    mousedownev = true;
}

//Mouseup
function mouseup() {
    mousedownev = false;
}

//Mousemove
function mousemove(pixelX, pixelY) {
    mousex = pixelX;
    mousey = pixelY;
    if (mousedownev) {
        ctxErase.beginPath();

        ctxErase.globalCompositeOperation = 'destination-out';
        ctxErase.lineWidth = 20;
        ctxErase.moveTo(last_mousex, last_mousey);
        ctxErase.lineTo(mousex, mousey);
        ctxErase.lineJoin = ctxErase.lineCap = 'round';
        ctxErase.stroke();

        for (var i = 0; i < existingLines.length; ++i) {
            var line = existingLines[i];
            if ((mousex <= line.endX && mousex >= line.arrowStartX) || (mousex >= line.endX && mousex <= line.arrowStartX)) {
                if ((mousey <= line.endY && mousey >= line.arrowStartY) || (mousey >= line.endY && mousey <= line.arrowStartY)) {
                    existingLines.splice(i, 1);
                }
            }
        }

        for (var j = 0; j < rectStartXArray.length; ++j) {
            if (mousex >= rectStartXArray[j] && mousex <= rectStartXArray[j] + rectWArray[j] && mousey >= rectStartYArray[j] && mousey <= rectStartYArray[j] + rectHArray[j]) {
                rectStartXArray.splice(j, 1);
                rectStartYArray.splice(j, 1);
                rectWArray.splice(j, 1);
                rectHArray.splice(j, 1);
            }
        }

    }
    last_mousex = mousex;
    last_mousey = mousey;
}



