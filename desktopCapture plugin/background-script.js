﻿// this background script is used to invoke desktopCapture API
// to capture screen-MediaStream.

var screenOptions = ['screen', 'window'];


chrome.runtime.onConnect.addListener(function (port) {

    // this one is called for each message from "content-script.js"
    function portOnMessageHandler(message) {
        if (message == 'requestScreenSourceId') {
           chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
	       console.log("aici");
        }

        if (message == 'audio-plus-tab') {
            screenOptions = ['audio', 'tab'];
            chrome.desktopCapture.chooseDesktopMedia(screenOptions, port.sender.tab, onAccessApproved);
        }
    }

    // on getting sourceId
    // "sourceId" will be empty if permission is denied.
    function onAccessApproved(sourceId) {
        // if "cancel" button is clicked
        if(!sourceId || !sourceId.length) {
            return port.postMessage('PermissionDeniedError');
        }
        
        // "ok" button is clicked; share "sourceId" with the
        // content-script which will forward it to the webpage
        port.postMessage( {sourceId: sourceId} );
    }

    port.onMessage.addListener(portOnMessageHandler);
});

