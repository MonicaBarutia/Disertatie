// postMessage is used to exchange "sourceId" between chrome extension and you webpage.
// though, there are tons other options as well, e.g. XHR-signaling, websockets, etc.
window.addEventListener('message', function(event) {
    if (event.origin != window.location.origin) {
        return;
    }

    onMessageReceived(event.data);
});

// and the function that handles received messages
function onMessageReceived(data) {
    console.log("webpage received message: ", data);
    // "cancel" button is clicked
    if (data == 'PermissionDeniedError') {
        chromeMediaSource = 'PermissionDeniedError';
        if (screenCallback) return screenCallback('PermissionDeniedError');
        else throw new Error('PermissionDeniedError');
    }

    // extension notified his presence
    if (data == 'chrome-extension-loaded') {
        chromeMediaSource = 'desktop';
    }

    // extension shared temp sourceId
    if (data.sourceId && screenCallback) {
        screenCallback(sourceId = data.sourceId);
    }
}


// global variables
var chromeMediaSource = 'desktop';//'screen';
var sourceId;
var screenCallback;

// this method can be used to check if chrome extension is installed & enabled.
function isChromeExtensionAvailable(callback) {
    if (!callback) return;

    // ask extension if it is available
    window.postMessage('are-you-there', '*');

    setTimeout(function() {
        if (chromeMediaSource == 'screen') {
            callback(false);
        } else callback(true);
    }, 2000);
}

// this function can be used to get "source-id" from the extension
function getSourceId(callback) {
    if (!callback) throw '"callback" parameter is mandatory.';
    if(sourceId) return callback(sourceId);
   
    console.log("webpage: posting requestScreenSourceId."); 
    screenCallback = callback;
    window.postMessage('requestScreenSourceId', '*');
}


// this function explains how to use above methods/objects
function getScreenConstraints(callback) {
    console.log("getScreenConstraints(): chromeMediaSource=", chromeMediaSource);

    // this statement defines getUserMedia constraints
    // that will be used to capture content of screen
    var screen_constraints = {
        mandatory: {
            chromeMediaSource: 'desktop',
            maxWidth: screen.width > 1920 ? screen.width : 1920,
            maxHeight: screen.height > 1080 ? screen.height : 1080
        },
        optional: [ { googTemporalLayeredScreencast: true } ]
    };

    // this statement verifies chrome extension availability
    // if installed and available then it will invoke extension API
    // otherwise it will fallback to command-line based screen capturing API
    if (chromeMediaSource == 'desktop' && !sourceId) {
        getSourceId(function() {
            screen_constraints.mandatory.chromeMediaSourceId = sourceId;
            callback(sourceId == 'PermissionDeniedError' ? sourceId : null, screen_constraints);
        });
        console.log("forest1");
        return;
    }

    // this statement sets gets 'sourceId" and sets "chromeMediaSourceId" 
    if (chromeMediaSource == 'desktop') {
        screen_constraints.mandatory.chromeMediaSourceId = sourceId;
    }

    // now invoking native getUserMedia API
    callback(null, screen_constraints);
}

