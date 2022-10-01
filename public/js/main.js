'use strict';

var Readychannel = false;
var Initiator = false;
var Started = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

const vga = document.querySelector('vga');
let currentwidth = 0;
let currentheight = 0;

vga.onclick = () => {
    getUserMedia(vgaConstraints);
};

const vgaConstraints = { video:{ width: {exact: 640}, height: {exact: 480}}
};

var pcConfig = turnConfig;

var localStreamConstraints = {
    audio: true,
    video: true
  };




var room = prompt('Enter the room you want to connect to:');


var socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
}

socket.on('created', function(room) {
  Initiator = true;
});

socket.on('full', function(room) {
  alert('Room ' + room + ' is full');
});

socket.on('join', function (room){
  Readychannel = true;
});

socket.on('joined', function(room) {
  console.log('joined: ' + room);
  Readychannel = true;
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});


socket.on('message', function(message, room) {
    if (message === 'got user media') {
      maybeStart();
    } else if (message.type === 'offer') {
      if (!Initiator && !Started) {
        maybeStart();
      }
      pc.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
    } else if (message.type === 'answer' && Started) {
      pc.setRemoteDescription(new RTCSessionDescription(message));
    } else if (message.type === 'candidate' && Started) {
      var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
      });
      pc.addIceCandidate(candidate);
    } else if (message === 'bye' && Started) {
      handleRemoteHangup();
    }
});
  


function sendMessage(message, room) {
  console.log('Client sending message: ', message, room);
  socket.emit('message', message, room);
}



var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');
console.log("Going to find Local media");
navigator.mediaDevices.getUserMedia(localStreamConstraints)
.then(gotStream)
.catch(function(e) {
  alert('getUserMedia() error: ' + e.name);
});

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media', room);
  if (Initiator) {
    maybeStart();
  }
}


console.log('Getting user media with constraints', localStreamConstraints);


function maybeStart() {
  console.log('>>>>>>> maybeStart() ', Started, localStream, Readychannel);
  if (!Started && typeof localStream !== 'undefined' && Readychannel) {
    console.log('>>>>>> creating peer connection');
    createPeerConnection();
    pc.addStream(localStream);
    Started = true;
    console.log('Initiator', Initiator);
    if (Initiator) {
      doCall();
    }
  }
}


window.onbeforeunload = function() {
  sendMessage('bye', room);
};



function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = handleIceCandidate;
    pc.onaddstream = handleRemoteStreamAdded;
    pc.onremovestream = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}


function handleIceCandidate(event) {
  console.log('icecandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    }, room);
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peer.');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription, room);
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}


function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye',room);
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  Initiator = false;
}

function stop() {
  Started = false;
  pc.close();
  pc = null;
}