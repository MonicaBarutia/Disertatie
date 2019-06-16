(function ($) {
    $(document).ready(function (e) {
        pageReady(true);
        createCanvas();
        triggerAll();
    });

    var index = 1;

    function triggerAll() {
        //se creaza meniul
        $('body').click(function (e) {
            // e.preventDefault();
            console.log("YES!!");
            $("#menu").css({
                "z-index": 50,
                "position": "absolute",
                "right": 0 + "px",
                "top": 0 + "px"
            }).show();
        }).children(".screenshare").click(function () {
            return false;
        });

        var nr = 0;

        //se da click pe elementul text din meniu
        $('#menu')
            .on('click', "#text", function (e) {
                e.preventDefault();
                e.stopPropagation();
                console.log("text");
                $('body').click(function (e) { //se creaza un element textarea unde s-a dat click pe screenshare
                    e.preventDefault();
                    $("#menu").hide();
                    console.log(nr);
                    if (nr === 0) { //se verifica daca s-a creat o textarea cu text
                        console.log("textarea!!");
                        var cursorX = e.pageX;
                        var cursorY = e.pageY;
                        var textArea = $('<textarea class="screenshare"></textarea>');
                        createTextArea(textArea, cursorX, cursorY);
                        textArea.on('blur', function (e) {  //se iese din taxtarea
                            if (textArea.val().trim().length < 1) { //daca nu s-a scris nimic, se sterge textarea
                                textArea.remove();
                                nr = 1;
                                triggerAll();
                            } else { //daca s-a scris in textarea, textarea ramane si se retrigaruieste meniul
                                nr = 1;
                                windowX = $(window).width();
                                windowY = $(window).height();
                                var msg = {
                                    type: "textarea",
                                    text: textArea.val(),
                                    cursorX: cursorX,
                                    cursorY: cursorY,
                                    id: textArea.attr('id'),
                                    uuid: uuid,
                                    screenX: screen.width,
                                    screenY: screen.height,
                                    windowX: windowX,
                                    windowY: windowY,
                                    coordinates: "fix"
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
                e.stopPropagation();
                console.log("delete");
                $('.screenshare').click(function () {
                    id = $(this).attr('id');
                    var msg = {
                        type: "delete",
                        uuid: uuid,
                        id: id
                    };
                    $(this).remove();
                    serverConnection.send(JSON.stringify(msg));
                });
            })
            .on('click', "#pen", function (e) {
                e.preventDefault();
                console.log("pen");
                document.getElementById('myCanvas').style.zIndex = 3;
                document.getElementById('myCanvas2').style.zIndex = 1;
                document.getElementById('myCanvas3').style.zIndex = 2;
                init();
            })
            .on('click', "#rectangle", function (e) {
                e.preventDefault();
                console.log("rectangle");
                document.getElementById('myCanvas').style.zIndex = 1;
                document.getElementById('myCanvas2').style.zIndex = 3;
                document.getElementById('myCanvas3').style.zIndex = 2;
                initRect();
            })
            .on('click', "#arrow", function (e) {
                e.preventDefault();
                console.log("arrow");
                document.getElementById('myCanvas').style.zIndex = 1;
                document.getElementById('myCanvas2').style.zIndex = 2;
                document.getElementById('myCanvas3').style.zIndex = 3;
                initArrow();
            })
            .on('click', '#erase', function (e) {
                e.preventDefault();
                console.log("erase");
                erase();
            });
    }

    function createTextArea(textArea, cursorX, cursorY) {
        textArea.css({"z-index": 50, "position": "absolute", "left": cursorX + "px", "top": cursorY + "px"});
        autosize(textArea);
        $('body').append(textArea);
        id = "textAreaIndex" + index;
        textArea.attr('id', id);
        index++;
        console.log("textarea created!");
        textArea.focus();
    }

    function createCanvas() {
        height = window.innerHeight;
        width = window.innerWidth;
        // height = screen.height;
        // width = screen.width;
        var canvas =
            $('<canvas/>', {'id': 'myCanvas'});
        canvas.css({
            "left": 0 + "px",
            "top": 0 + "px",
            "position": "absolute",
            "background-color": 'transparent',
        });

        var canvas2 =
            $('<canvas/>', {'id': 'myCanvas2'});
        canvas2.css({
            "left": 0 + "px",
            "top": 0 + "px",
            "position": "absolute",
            "background-color": 'transparent',
        });

        var canvas3 =
            $('<canvas/>', {'id': 'myCanvas3'});
        canvas3.css({
            "left": 0 + "px",
            "top": 0 + "px",
            "position": "absolute",
            "background-color": 'transparent',
        });
        $('body').append(canvas)
            .append(canvas2)
            .append(canvas3);

        document.getElementById('myCanvas').setAttribute('width', width + "px");
        document.getElementById('myCanvas').setAttribute('height', height + "px");
        document.getElementById('myCanvas2').setAttribute('width', width + "px");
        document.getElementById('myCanvas2').setAttribute('height', height + "px");
        document.getElementById('myCanvas3').setAttribute('width', width + "px");
        document.getElementById('myCanvas3').setAttribute('height', height + "px");

    }

    var canvas, ctx;
    var mouseX, mouseY, mouseDown = 0,
        lastX, lastY;

    function draw(ctx, x, y, size) {
        if (lastX && lastY && (x !== lastX || y !== lastY)) {
            ctx.fillStyle = contextColor;
            ctx.lineWidth = 2 * size;
            ctx.beginPath();
            ctx.globalCompositeOperation = 'source-over';
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = contextColor;
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
    }

    function onMouseUp() {
        mouseDown = 0;
        lastX = 0;
        lastY = 0;
    }

    function onMouseMove(e) {
        getMousePos(e);
        if (mouseDown === 1) {
            draw(ctx, mouseX, mouseY, 2)
        }
    }

    function getMousePos(e) {
        mouseX = e.offsetX;
        mouseY = e.offsetY
    }

    function init() {
        canvas = document.getElementById('myCanvas');
        ctx = canvas.getContext('2d');
        canvas.removeEventListener('mousedown', mousedown, false);
        canvas.removeEventListener('mousemove', mousemove, false);
        canvas.removeEventListener('mouseup', mouseup, false);
        canvas.addEventListener('mousedown', onMouseDown, false);
        canvas.addEventListener('mousemove', onMouseMove, false);
        canvas.addEventListener('mouseup', onMouseUp, false)
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

    function initRect() {
        canvasRect = document.getElementById('myCanvas2');
        ctxRect = canvasRect.getContext('2d');
        canvasRect.removeEventListener('mousedown', mousedown, false);
        canvasRect.removeEventListener('mousemove', mousemove, false);
        canvasRect.removeEventListener('mouseup', mouseup, false);
        canvasRect.addEventListener('mousedown', mouseDownRect, false);
        canvasRect.addEventListener('mouseup', mouseUpRect, false);
        canvasRect.addEventListener('mousemove', mouseMoveRect, false);
    }

    function mouseDownRect(e) {
        rect.startX = e.pageX - this.offsetLeft;
        rect.startY = e.pageY - this.offsetTop;
        drag = true;
    }

    function mouseUpRect() {
        rectStartXArray[rectStartXArray.length] = rect.startX;
        rectStartYArray[rectStartYArray.length] = rect.startY;
        rectWArray[rectWArray.length] = rect.w;
        rectHArray[rectHArray.length] = rect.h;
        rectColor[rectColor.length] = contextColor;
        drag = false;
    }

    function mouseMoveRect(e) {

        if (drag) {
            rect.w = (e.pageX - this.offsetLeft) - rect.startX;
            rect.h = (e.pageY - this.offsetTop) - rect.startY;
            ctxRect.clearRect(0, 0, canvasRect.width, canvasRect.height);
            drawRect();
        }

        drawOldShapes();
    }

    function drawRect() {
        ctxRect.beginPath();
        ctxRect.globalCompositeOperation = 'source-over';
        ctxRect.lineWidth = 3;
        ctxRect.rect(rect.startX, rect.startY, rect.w, rect.h);
        ctxRect.fillStyle = contextColor;
        ctxRect.strokeStyle = contextColor;
        ctxRect.stroke();
    }

    function drawOldShapes() {
        for (var i = 0; i < rectStartXArray.length; i++) {
            if (rectStartXArray[i] != rect.startX && rectStartYArray[i] != rect.startY && rectWArray[i] != rect.w && rectHArray[i] != rect.h) {
                ctxRect.beginPath();
                ctxRect.lineWidth = 3;
                ctxRect.globalCompositeOperation = 'source-over';
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
            ctxArrow.globalCompositeOperation = 'source-over';
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
            ctxArrow.globalCompositeOperation = 'source-over';
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

    function onmousemove(e) {
        if (hasLoaded) {
            arrowMouseX = e.offsetX;
            arrowMouseY = e.offsetY;
            if (isDrawing) {
                drawArrow();
            }
        }
    }

    function initArrow() {
        canvasArrow = document.getElementById("myCanvas3");
        ctxArrow = canvasArrow.getContext("2d");
        canvasArrow.removeEventListener('mousedown', mousedown, false);
        canvasArrow.removeEventListener('mousemove', mousemove, false);
        canvasArrow.removeEventListener('mouseup', mouseup, false);
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
    var last_mousex = last_mousey = 0;
    var mousex = mousey = 0;
    var mousedownev = false;

//Mousedown
    function mousedown(e) {
        last_mousex = mousex = e.clientX;
        last_mousey = mousey = e.clientY;
        mousedownev = true;
    }

//Mouseup
    function mouseup() {
        mousedownev = false;
    }

//Mousemove
    function mousemove(e) {
        mousex = e.clientX;
        mousey = e.clientY;
        if (mousedownev) {
            for (var k = 0, n = canvasArray.length; k < n; ++k) {
                var el = canvasArray[k];
                id = el.id;
                canvasErase = document.getElementById(id);
                ctxErase = canvasErase.getContext('2d');

                ctxErase.beginPath();

                ctxErase.globalCompositeOperation = 'destination-out';
                ctxErase.lineWidth = 15;

                ctxErase.moveTo(last_mousex, last_mousey);
                ctxErase.lineTo(mousex, mousey);
                ctxErase.lineJoin = ctxErase.lineCap = 'round';
                ctxErase.stroke();
            }

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
    var canvasArray;
    function erase() {
        canvasArray = document.getElementsByTagName("canvas");
        for (var i = 0, n = canvasArray.length; i < n; ++i) {
            var el = canvasArray[i];
            id = el.id;
            canvasErase = document.getElementById(id);
            ctxErase = canvasErase.getContext('2d');
            canvasErase.removeEventListener('mousedown', onmousedown, false);
            canvasErase.removeEventListener('mousemove', onmousemove, false);
            canvasErase.removeEventListener('mouseup', onmouseup, false);
            canvasErase.removeEventListener('mousedown', mouseDownRect, false);
            canvasErase.removeEventListener('mousemove', mouseMoveRect, false);
            canvasErase.removeEventListener('mouseup', mouseUpRect, false);
            canvasErase.removeEventListener('mousedown', onMouseDown, false);
            canvasErase.removeEventListener('mousemove', onMouseMove, false);
            canvasErase.removeEventListener('mouseup', onMouseUp, false);
            canvasErase.addEventListener('mousedown', mousedown, false);
            canvasErase.addEventListener('mousemove', mousemove, false);
            canvasErase.addEventListener('mouseup', mouseup, false);
        }
    }


})(jQuery);

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


