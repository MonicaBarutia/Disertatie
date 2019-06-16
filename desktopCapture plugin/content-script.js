// this content-script plays role of medium to publish/subscribe messages from webpage to the background script

// this object is used to make sure our extension isn't conflicted with irrelevant messages!
var rtcmulticonnectionMessages = {
    'are-you-there': true,
    'requestScreenSourceId':  true,
    'audio-plus-tab': true
};


// this port connects with background script
var port = chrome.runtime.connect();

// if background script sent a message
port.onMessage.addListener(function (message) {
    // get message from background script and forward to the webpage
    window.postMessage(message, '*');
});

// this event handler watches for messages sent from the webpage
// it receives those messages and forwards to background script
window.addEventListener('message', function (event) {
    console.log("content-script.js received event..", event.data);
    // if invalid source
    if (event.source != window)
        return;
        
    // it is 3rd party message
    if(!rtcmulticonnectionMessages[event.data]) return;
        
    // if browser is asking whether extension is available
    if(event.data == 'are-you-there') {
        window.postMessage('chrome-extension-loaded', '*');
    }

    // if it is something that need to be shared with background script
    if(event.data == 'requestScreenSourceId' || event.data === 'audio-plus-tab') {
	    console.log("content-script.js posting message..");
        // forward message to background script
        port.postMessage(event.data);
    }
});

// inform browser that you're available!
//window.postMessage('chrome-extension-loaded', '*');


console.log("in content-script.js..");
