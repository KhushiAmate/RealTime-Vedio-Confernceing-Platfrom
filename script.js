let peer, localStream, currentCall;
const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");

// Initialize PeerJS and get a unique Peer ID
peer = new Peer();
peer.on("open", (id) => {
    document.getElementById("peer-id").innerText = id;
    console.log(`Your Peer ID: ${id}`);
});

// Get User Media (Webcam & Microphone)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = stream;
    })
    .catch(err => console.error("Error accessing media devices.", err));

// Function to make a call
function makeCall() {
    const friendId = document.getElementById("friend-id").value;
    if (!friendId) {
        alert("Enter a Peer ID to call.");
        return;
    }

    const call = peer.call(friendId, localStream);
    currentCall = call;

    call.on("stream", (remoteStream) => {
        remoteVideo.srcObject = remoteStream;
    });

    call.on("close", () => {
        remoteVideo.srcObject = null;
    });
}

// Answer incoming calls
peer.on("call", (call) => {
    call.answer(localStream);
    currentCall = call;

    call.on("stream", (remoteStream) => {
        remoteVideo.srcObject = remoteStream;
    });

    call.on("close", () => {
        remoteVideo.srcObject = null;
    });
});

// Screen Sharing
function shareScreen() {
    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(screenStream => {
            const videoTrack = screenStream.getVideoTracks()[0];
            localVideo.srcObject = screenStream;

            peer.connections.forEach(connection => {
                const sender = connection.peerConnection.getSenders().find(s => s.track.kind === "video");
                sender.replaceTrack(videoTrack);
            });

            videoTrack.onended = () => {
                navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                    .then(stream => {
                        localVideo.srcObject = stream;
                        peer.connections.forEach(connection => {
                            const sender = connection.peerConnection.getSenders().find(s => s.track.kind === "video");
                            sender.replaceTrack(stream.getVideoTracks()[0]);
                        });
                    });
            };
        })
        .catch(err => console.error("Error sharing screen:", err));
}

// End Call
function endCall() {
    if (currentCall) {
        currentCall.close();
        remoteVideo.srcObject = null;
        alert("Call ended.");
    }
}
