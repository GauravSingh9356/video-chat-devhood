let socket = io.connect('https://video-chat-devhood.vercel.app/');
let divVideoChatLobby = document.getElementById('video-chat-lobby');
let divVideoChat = document.getElementById('video-chat-room');
let joinButton = document.getElementById('join');
let userVideo = document.getElementById('user-video');
let peerVideo = document.getElementById('peer-video');
let roomInput = document.getElementById('roomName');
let muteButton = document.getElementById('muteButton');
let leaveButton = document.getElementById('leaveRoomButton');
let hideCameraButton = document.getElementById('hideCameraButton');
let buttonDiv = document.getElementById('btn-group');

// let message = document.getElementById('message');
// let send = document.getElementById('send');
// let chatApp = document.getElementById('chat-app');
// let output = document.getElementById('output');
let roomName;
let creator = false;
let rtcPeerConnection;
let userStream;

let muteButtonFlag = false;
let hideCameraButtonFlag = false;

// send.addEventListener('click', (e) => {
//   e.preventDefault();
//   let mssg = message.value;
//   socket.emit('sendingMessage', mssg);
//   message.value = '';
// });

// socket.on('sendingMessage', (message) => {
//   output.innerHTML += `<p><strong> ${message}</strong></p>`;
// });
// Contains the stun server URL we will be using.
let iceServers = {
  iceServers: [
    { urls: 'stun:stun.services.mozilla.com' },
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

joinButton.addEventListener('click', function () {
  if (roomInput.value == '') {
    alert('Please enter a room name');
  } else {
    roomName = roomInput.value;
    socket.emit('join', roomName);
  }
});

muteButton.addEventListener('click', function () {
  muteButtonFlag = !muteButtonFlag;
  if (muteButtonFlag) {
    userStream.getTracks()[0].enabled = false;
    muteButton.textContent = 'Unmute';
  } else {
    userStream.getTracks()[0].enabled = true;
    muteButton.textContent = 'mute';
  }
});

hideCameraButton.addEventListener('click', function () {
  hideCameraButtonFlag = !hideCameraButtonFlag;
  if (hideCameraButtonFlag) {
    userStream.getTracks()[1].enabled = false;
    hideCameraButton.textContent = 'Show Camera';
  } else {
    userStream.getTracks()[1].enabled = true;
    hideCameraButton.textContent = 'Hide Camera';
  }
});

// Triggered when a room is succesfully created.

socket.on('created', function () {
  creator = true;

  const options = {
    style: {
      main: {
        background: '#222',
        color: '#fff',
      },
    },
  };
  iqwerty.toast.toast(
    'New Room Created! Share the room name to your Peer to start Video Chat!',
    options
  );

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { width: 500, height: 400 },
    })
    .then(function (stream) {
      /* use the stream */
      userStream = stream;
      divVideoChatLobby.style = 'display:none';
      buttonDiv.style.display = 'flex';

      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
    })
    .catch(function (err) {
      /* handle the error */
      alert("Couldn't Access User Media");
    });
});

// Triggered when a room is succesfully joined.

socket.on('joined', function () {
  creator = false;

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { width: 500, height: 400 },
    })
    .then(function (stream) {
      /* use the stream */
      userStream = stream;
      divVideoChatLobby.style = 'display:none';
      buttonDiv.style.display = 'flex';

      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
      socket.emit('ready', roomName);
    })
    .catch(function (err) {
      /* handle the error */
      alert("Couldn't Access User Media");
    });
});

// Triggered when a room is full (meaning has 2 people).

socket.on('full', function () {
  alert("Room is Full, Can't Join");
});

// Triggered when a peer has joined the room and ready to communicate.

socket.on('ready', function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection
      .createOffer()
      .then((offer) => {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit('offer', offer, roomName);
      })

      .catch((error) => {
        console.log(error);
      });
  }
});

// Triggered on receiving an ice candidate from the peer.

socket.on('candidate', function (candidate) {
  let icecandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(icecandidate);
});

// Triggered on receiving an offer from the person who created the room.

socket.on('offer', function (offer) {
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection
      .createAnswer()
      .then((answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit('answer', answer, roomName);
      })
      .catch((error) => {
        console.log(error);
      });
  }
});

// Triggered on receiving an answer from the person who joined the room.

socket.on('answer', function (answer) {
  rtcPeerConnection.setRemoteDescription(answer);
});

// Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.

function OnIceCandidateFunction(event) {
  console.log('Candidate');
  if (event.candidate) {
    socket.emit('candidate', event.candidate, roomName);
  }
}

// Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.

function OnTrackFunction(event) {
  // let container = document.getElementById('video-chat-room');
  // let videoEl = document.createElement('video');
  // videoEl.id = 'peer-video';
  // videoEl.srcObject = event.streams[0];
  // videoEl.style.display = 'row';
  // videoEl.style.padding = '20px';
  // container.appendChild(videoEl);
  peerVideo.srcObject = event.streams[0];

  peerVideo.onloadedmetadata = function (e) {
    peerVideo.play();
  };
}
