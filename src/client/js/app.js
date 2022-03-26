const socket = io();

const roomNameContainer = document.getElementById("roomName");
const roomNameForm = roomNameContainer.querySelector("form");
const roomNameInput = roomNameForm.querySelector("input");
const videos = document.getElementById("videos");
const btn = document.getElementById("button");
const muteBtn = btn.querySelector("#muteBtn");
const cameraBtn = btn.querySelector("#cameraBtn");
const cameras = document.getElementById("cameras");
const camera = cameras.querySelector("select");

videos.hidden = true;
btn.hidden = true;
cameras.hidden = true;

let myStream;
let myPeerConnection;
let roomName;
let muted = false;
let cameraOff = false;

const handleMuteBtnClicked = (event) => {
  event.preventDefault();
  myStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  if (!muted) {
    muted = true;
    muteBtn.innerText = "Unmute";
  } else {
    muted = false;
    muteBtn.innerText = "Mute";
  }
};

muteBtn.addEventListener("click", handleMuteBtnClicked);

const handleCameraBtnClicked = (event) => {
  event.preventDefault();
  myStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  if (!cameraOff) {
    cameraOff = true;
    cameraBtn.innerText = "Camera On";
  } else {
    cameraOff = false;
    cameraBtn.innerText = "Camera Off";
  }
};

cameraBtn.addEventListener("click", handleCameraBtnClicked);

const handleCameraChanged = async () => {
  await getMedia(camera.value);
  if (myPeerConnection) {
    const videoTrack = myStrema.getVideoTracks()[0];
    const videoSender = myPeerConnection.getSenders();
    console.log(videoSender);
  }
};

cameras.addEventListener("input", handleCameraChanged);

const getCameras = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const currentVideoInput = myStream.getVideoTracks()[0];
  const videoInputDevices = devices.filter((device) => {
    return device.kind === "videoinput";
  });
  videoInputDevices.forEach((videoInput) => {
    const option = document.createElement("option");
    option.value = videoInput.deviceId;
    option.innerText = videoInput.label;
    if (currentVideoInput.label === videoInput.label) {
      option.selected = true;
    }
    camera.appendChild(option);
  });
};

const getMedia = async (deviceId) => {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstrains = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : initialConstrains
    );

    const video = document.createElement("video");
    video.autoplay = true;
    video.srcObject = myStream;
    video.playsInline = true;
    videos.appendChild(video);
    console.log("video Created!");

    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
};

const handleRoomNameFormSubmit = async (event) => {
  event.preventDefault();
  socket.emit("enter_room", roomNameInput.value);
  roomName = roomNameInput.value;
  videos.hidden = false;
  roomName.hidden = true;
  btn.hidden = false;
  cameras.hidden = false;
  await getMedia();
  makeConnection();
};

roomNameForm.addEventListener("submit", handleRoomNameFormSubmit);

// Socket Code
socket.on("info_enter_room", async (roomName) => {
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
  console.log("sent offer");
});

socket.on("offer", async (offer) => {
  console.log("received offer");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  console.log("sent answer");
  console.log(answer);
  socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
  console.log("received answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("received candidate");
  myPeerConnection.addIceCandidate(ice);
});

// RTC Code
const makeConnection = () => {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("track", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
};

const handleIce = (data) => {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
};

const handleAddStream = (data) => {
  const video = document.createElement("video");
  video.autoplay = true;
  video.srcObject = data.streams[0];
  videos.appendChild(video);
};
