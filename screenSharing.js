(function ($) {
    $(document).ready(function (e) {
        pageReady(false);
        triggerAll();
    });

    var index = 1;

    function triggerAll() {
        //se creaza meniul
        $('#remoteVideo').click(function (e) {
            e.preventDefault();
            console.log("YES!!");
            remoteVideo = $('#remoteVideo');
            var destination = remoteVideo.offset();
            videoWidth = remoteVideo.width();
            right = destination.left + videoWidth;
            $("#menu").css({
                "z-index": 50,
                "position": "absolute",
                "left": right + "px",
                "top": destination.top + "px"
            }).show();

        });

        var nr = 0;

        //se da click pe elemntul text din meniu
        $('#menu')
            .on('click', "#text", function (e) {
                e.preventDefault();
                console.log("text");
                canvas = $('#smallCanvas');
                if (canvas !== undefined) {
                    canvas.remove();
                }
                $('#remoteVideo').click(function (e) { //se creaza un element textarea unde s-a dat click pe screenshare
                    e.preventDefault();
                    $("#menu").hide();
                    console.log(nr);
                    if (nr === 0) { //se verifica daca s-a creat o textarea cu text
                        console.log("textarea!!");
                        var cursorX = e.pageX;
                        var cursorY = e.pageY;
                        var offset = $(this).offset();
                        var relativeX = (e.pageX - offset.left);
                        var relativeY = (e.pageY - offset.top);
                        var textArea = $('<textarea class="screenshare"></textarea>');
                        createTextArea(textArea, cursorX, cursorY);
                        textArea.on('blur', function (e) {  //se iese din taxtarea
                            if (textArea.val().trim().length < 1) { //daca nu s-a scris nimic, se sterge textarea
                                textArea.remove();
                                nr = 1;
                                triggerAll();
                            } else { //daca s-a scris in textarea, textarea ramane si se retrigaruieste meniul
                                nr = 1;
                                video = $('#remoteVideo');
                                var msg = {
                                    type: "textarea",
                                    text: textArea.val(),
                                    cursorX: relativeX,
                                    cursorY: relativeY,
                                    id: textArea.attr('id'),
                                    uuid: uuid,
                                    elemX: video.width(),
                                    elemY: video.height(),
                                    coordinates: "relative"
                                };
                                serverConnection.send(JSON.stringify(msg));
                                triggerAll();
                            }
                        });
                        textArea.keypress(function (e) {
                            var msg = {
                                type: "keypress",
                                text: String.fromCharCode(e.which),
                                uuid: uuid,
                                id: textArea.attr('id'),
                            };
                            serverConnection.send(JSON.stringify(msg));
                        });
                    }
                })
            })
            .on('click', "#delete", function (e) {
                e.preventDefault();
                console.log("delete");
                $('body').on('click', ".screenshare", function () {
                    id = $(this).attr('id');
                    var msg = {
                        type: "delete",
                        uuid: uuid,
                        id: id
                    };
                    $(this).remove();
                    serverConnection.send(JSON.stringify(msg));
                })
            })
            .on('click', "#pen", function (e) {
                e.preventDefault();
                console.log("pen");
                canvas = $('#smallCanvas');
                if (canvas !== undefined) {
                    canvas.remove();
                }
                createCanvas();
                init();
            })
            .on('click', "#rectangle", function (e) {
                e.preventDefault();
                console.log("rectangle");
                canvas = $('#smallCanvas');
                if (canvas !== undefined) {
                    canvas.remove();
                }
                createCanvas();
                initRect();
            })
            .on('click', '#arrow', function (e) {
                e.preventDefault();
                console.log("arrow");
                canvas = $('#smallCanvas');
                if (canvas !== undefined) {
                    canvas.remove();
                }
                createCanvas();
                initArrow();
            })
            .on('click', '#erase', function (e) {
                e.preventDefault();
                console.log("erase");
                canvas = document.getElementById('smallCanvas');
                ctx = canvas.getContext('2d');
                canvas.removeEventListener('mousedown', onmousedown, false);
                canvas.removeEventListener('mousemove', onmousemove, false);
                canvas.removeEventListener('mouseup', onmouseup, false);
                canvas.removeEventListener('mousedown', mouseDownRect, false);
                canvas.removeEventListener('mousemove', mouseMoveRect, false);
                canvas.removeEventListener('mouseup', mouseUpRect, false);
                erase();
            });


    }

    function createTextArea(textArea, cursorX, cursorY) {
        textArea.css({"z-index": 50, "position": "absolute", "left": cursorX + "px", "top": cursorY + "px"});
        autosize(textArea);
        $('body').append(textArea);
        id = "textArea" + index;
        textArea.attr('id', id);
        index++;
        console.log("textarea created!");
        textArea.focus();
    }

    var canvas, ctx;
    var mouseX, mouseY, mouseDown = 0,
        lastX, lastY;

    function draw(ctx, x, y, size) {
        if (lastX && lastY && (x !== lastX || y !== lastY)) {
            // ctx.fillStyle = "#000000";
            ctx.lineWidth = 2 * size;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        // ctx.fillStyle = "#000000";
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
        var msg = {
            type: "draw",
            text: "onMouseDown",
            uuid: uuid,
        };
        serverConnection.send(JSON.stringify(msg));
        draw(ctx, mouseX, mouseY, 2)
    }

    function onMouseUp() {
        mouseDown = 0;
        lastX = 0;
        lastY = 0;
        var msg = {
            type: "draw",
            text: "onMouseUp",
            uuid: uuid,
        };
        serverConnection.send(JSON.stringify(msg));
    }

    function onMouseMove(e) {
        getMousePos(e);
        video = $('#remoteVideo');
        var msg = {
            type: "draw",
            text: "onMouseMove",
            uuid: uuid,
            mouseX: mouseX,
            mouseY: mouseY,
            elemX: video.width(),
            elemY: video.height()- relbarheight,
        };
        serverConnection.send(JSON.stringify(msg));
        if (mouseDown === 1) {
            draw(ctx, mouseX, mouseY, 2)
        }
    }

    function getMousePos(e) {
        mouseX = e.offsetX;
        mouseY = e.offsetY;
        console.log(mouseX, mouseY);

    }

    function init() {
        canvas = document.getElementById('smallCanvas');
        ctx = canvas.getContext('2d');
        canvas.addEventListener('mousedown', onMouseDown, false);
        canvas.addEventListener('mousemove', onMouseMove, false);
        canvas.addEventListener('mouseup', onMouseUp, false)
    }

    var relbarheight;

    function createCanvas() {
        console.log('document height =', $(document).height());
        console.log('screen height =', screen.height);
        console.log('window inner height = ', window.innerHeight);
        remoteVideo = $('#remoteVideo');
        var canvas =
            $('<canvas/>', {'id': 'smallCanvas'});
        var destination = remoteVideo.offset();
        //barheight = screen.height-window.innerHeight;
        barheight = screen.height-$(document).height();
        relbarheight = barheight*remoteVideo.height()/screen.height;
        canvas.css({
            "left": destination.left + "px",
            "top": destination.top-relbarheight*2 +"px",
            "position": "absolute",
            "background-color": "transparent",
            "border": "1px solid blue"
        });
        $('body').append(canvas);
        document.getElementById('smallCanvas').setAttribute('width', remoteVideo.width());
        document.getElementById('smallCanvas').setAttribute('height', remoteVideo.height()+relbarheight*2);

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

    function initRect() {
        canvasRect = document.getElementById('smallCanvas');
        ctxRect = canvasRect.getContext('2d');
        canvasRect.addEventListener('mousedown', mouseDownRect, false);
        canvasRect.addEventListener('mouseup', mouseUpRect, false);
        canvasRect.addEventListener('mousemove', mouseMoveRect, false);
    }

    function mouseDownRect(e) {
        rect.startX = e.pageX - this.offsetLeft;
        rect.startY = e.pageY - this.offsetTop;
        drag = true;
        video = $('#remoteVideo');
        var msg = {
            type: "rectangle",
            text: "onMouseDown",
            uuid: uuid,
            mouseX: rect.startX,
            mouseY: rect.startY,
            elemX: video.width(),
            elemY: video.height(),
        };
        serverConnection.send(JSON.stringify(msg));

    }

    function mouseUpRect() {
        rectStartXArray[rectStartXArray.length] = rect.startX;
        rectStartYArray[rectStartYArray.length] = rect.startY;
        rectWArray[rectWArray.length] = rect.w;
        rectHArray[rectHArray.length] = rect.h;
        drag = false;
        video = $('#remoteVideo');
        var msg = {
            type: "rectangle",
            text: "onMouseUp",
            uuid: uuid,
        };
        serverConnection.send(JSON.stringify(msg));
    }

    function mouseMoveRect(e) {
        video = $('#remoteVideo');
        if (drag) {
            rect.w = (e.pageX - this.offsetLeft) - rect.startX;
            rect.h = (e.pageY - this.offsetTop) - rect.startY;
            ctxRect.clearRect(0, 0, canvasRect.width, canvasRect.height);
            drawRect();
            var msg = {
                type: "rectangle",
                text: "onMouseMove",
                uuid: uuid,
                mouseX: rect.w,
                mouseY: rect.h,
                elemX: video.width(),
                elemY: video.height(),
            };
            serverConnection.send(JSON.stringify(msg));
        }

        drawOldShapes();
    }

    function drawRect() {
        ctxRect.beginPath();
        ctxRect.rect(rect.startX, rect.startY, rect.w, rect.h);
        ctxRect.stroke();
    }

    function drawOldShapes() {
        for (var i = 0; i < rectStartXArray.length; i++) {
            if (rectStartXArray[i] != rect.startX && rectStartYArray[i] != rect.startY && rectWArray[i] != rect.w && rectHArray[i] != rect.h) {
                ctxRect.beginPath();
                ctxRect.rect(rectStartXArray[i], rectStartYArray[i], rectWArray[i], rectHArray[i]);
                ctxRect.stroke();
            }
        }
    }

    var canvasArrow = null;
    var ctxArrow = null;
    var hasLoaded = false;

    var arrowStartX = 0;
    var arrowStartY = 0;
    var arrowMouseX = 0;
    var arrowMouseY = 0;
    var isDrawing = false;
    var existingLines = [];

    var PI = Math.PI;
    var degreesInRadians225 = 225 * PI / 180;
    var degreesInRadians135 = 135 * PI / 180;
    var headLength = 15;

    function drawArrow() {
        ctxArrow.fillStyle = "#333333";
        ctxArrow.clearRect(0, 0, canvasArrow.width, canvasArrow.height);

        ctxArrow.strokeStyle = "black";
        ctxArrow.lineWidth = 2;
        ctxArrow.beginPath();

        for (var i = 0; i < existingLines.length; ++i) {
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
        }

        ctxArrow.stroke();

        if (isDrawing) {
            ctxArrow.fillStyle = "#333333";
            ctxArrow.lineWidth = 2;
            ctxArrow.beginPath();
            ctxArrow.moveTo(arrowStartX, arrowStartY);
            ctxArrow.lineTo(arrowMouseX, arrowMouseY);
            ctxArrow.stroke();
        }
    }

    function onmousedown(e) {
        if (hasLoaded) {
            if (!isDrawing) {
                arrowStartX = e.offsetX;
                arrowStartY = e.offsetY;

                isDrawing = true;
            }

            video = $('#remoteVideo');
            var msg = {
                type: "arrow",
                text: "onMouseDown",
                uuid: uuid,
                mouseX: arrowStartX,
                mouseY: arrowStartY,
                elemX: video.width(),
                elemY: video.height(),
            };
            serverConnection.send(JSON.stringify(msg));

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

                isDrawing = false;
            }

            video = $('#remoteVideo');
            var msg = {
                type: "arrow",
                text: "onMouseUp",
                uuid: uuid,
            };
            serverConnection.send(JSON.stringify(msg));

            drawArrow();
        }
    }

    function onmousemove(e) {
        if (hasLoaded) {
            arrowMouseX = e.offsetX;
            arrowMouseY = e.offsetY;
            video = $('#remoteVideo');
            var msg = {
                type: "arrow",
                text: "onMouseMove",
                uuid: uuid,
                mouseX: arrowMouseX,
                mouseY: arrowMouseY,
                elemX: video.width(),
                elemY: video.height(),
            };
            serverConnection.send(JSON.stringify(msg));
            if (isDrawing) {
                drawArrow();
            }
        }
    }

    function initArrow() {
        canvasArrow = document.getElementById("smallCanvas");
        ctxArrow = canvasArrow.getContext("2d");
        canvasArrow.addEventListener('mousedown', onmousedown, false);
        canvasArrow.addEventListener('mousemove', onmousemove, false);
        canvasArrow.addEventListener('mouseup', onmouseup, false);
        hasLoaded = true;
        drawArrow();
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
    function mousedown(e) {
        last_mousex = mousex = parseInt(e.clientX - canvasx);
        last_mousey = mousey = parseInt(e.clientY - canvasy);
        mousedownev = true;
        video = $('#remoteVideo');
        var msg = {
            type: "erase",
            text: "onMouseDown",
            uuid: uuid,
            mouseX: last_mousex,
            mouseY: last_mousey,
            elemX: video.width(),
            elemY: video.height(),
        };
        serverConnection.send(JSON.stringify(msg));
    }

//Mouseup
    function mouseup() {
        mousedownev = false;
        var msg = {
            type: "erase",
            text: "onMouseUp",
            uuid: uuid,
        };
        serverConnection.send(JSON.stringify(msg));
    }

//Mousemove
    function mousemove(e) {
        mousex = parseInt(e.clientX - canvasx);
        mousey = parseInt(e.clientY - canvasy);
        video = $('#remoteVideo');
        var msg = {
            type: "erase",
            text: "onMouseMove",
            uuid: uuid,
            mouseX: mousex,
            mouseY: mousey,
            elemX: video.width(),
            elemY: video.height(),
        };
        serverConnection.send(JSON.stringify(msg));
        if (mousedownev) {
            ctxErase.beginPath();

            ctxErase.globalCompositeOperation = 'destination-out';
            ctxErase.lineWidth = 10;

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

    function erase() {
        canvasErase = document.getElementById('smallCanvas');
        ctxErase = canvasErase.getContext('2d');
        canvasx = $(canvasErase).offset().left;
        canvasy = $(canvasErase).offset().top;
        canvasErase.addEventListener('mousedown', mousedown, false);
        canvasErase.addEventListener('mousemove', mousemove, false);
        canvasErase.addEventListener('mouseup', mouseup, false);
    }


})(jQuery);

// asta merge.
function onTextArea() {
    console.log('meme21');
    var msg = {
        type: "keypress",
        text: String.fromCharCode(event.which),
        uuid: uuid,
        id: $(event.target).attr("id"),
    };
    serverConnection.send(JSON.stringify(msg));
}


