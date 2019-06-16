
document.addEventListener("DOMContentLoaded", function () {
    triggerAll()
});

var nr = 0;

function triggerAll() {
    console.log('trigger');
    document.getElementById("remoteVideo").addEventListener("click", showMenu);
    console.log(nr);
    document.getElementById("menu").querySelector('#text').addEventListener("click", selectTextArea);

}

function showMenu(event) {
    event.preventDefault();
    console.log("YES!!");
    var cursorX = event.pageX;
    var cursorY = event.pageY;
    var menu = document.getElementById("menu");
    Object.assign(menu.style, {
        "z-index": "50",
        "position": "absolute",
        "left": cursorX + "px",
        "top": cursorY + "px",
        "display": "block",
        "visibility": "visible"
    });

}

function selectTextArea(event) {
    event.preventDefault();
    console.log("text");
    console.log(nr);
    nr = 0;

    var cursorX = event.pageX;
    var cursorY = event.pageY;
    var info = document.createElement("span");
    info.id = 'info';

    Object.assign(info.style, {
        "z-index": "50",
        "position": "absolute",
        "left": cursorX + "px",
        "top": cursorY + "px",
    });

    document.body.appendChild(info);

    document.getElementById("info").textContent="Click where to place";
    document.getElementById("menu").style.visibility = "hidden";

    document.getElementById("remoteVideo").addEventListener("click", createTextArea);
}

function createTextArea(event) {
    document.getElementById("info").remove();

    event.preventDefault();
    console.log("create!!!");
    document.getElementById("menu").style.visibility = "hidden";
    console.log("hidden");
    console.log(nr);
    if (nr === 0) {
        console.log("textarea!!");
        var cursorX = event.pageX;
        var cursorY = event.pageY;
        var textArea = document.createElement("textarea");
        textArea.className = "screenshare";
        Object.assign(textArea.style, {
            "z-index": "50",
            "position": "absolute",
            "left": cursorX + "px",
            "top": cursorY + "px",
        });
        autosize(textArea);
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.addEventListener("blur", function () {
            leaveTextArea(textArea)
        })
    }
}

function leaveTextArea(textArea) {
    console.log("leave!");
    document.getElementById("remoteVideo").removeEventListener("click", createTextArea);
    if (textArea.value.trim() === '') {
        textArea.remove();
        nr = 1;
        console.log('l' + nr);
    } else {
        nr = 1;
        console.log('l' + nr);
        serverConnection.send("ok!");
    }
}