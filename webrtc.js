let peerConnection;
let dataChannel;

// WebRTC Configuration
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// QR Code Elements
const generateQRButton = document.getElementById("generateQR");
const scanQRInput = document.getElementById("scanQR");
const qrContainer = document.getElementById("qrContainer");

// Messaging Elements
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessage");
const receivedMessage = document.getElementById("receivedMessage");

// Generate QR Code for Pairing
generateQRButton.addEventListener("click", async () => {
    peerConnection = new RTCPeerConnection(configuration);
    dataChannel = peerConnection.createDataChannel("messaging");

    dataChannel.onmessage = event => {
        receivedMessage.textContent = event.data;
        localStorage.setItem("lastMessage", event.data);
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const qrCode = new QRCode(qrContainer, JSON.stringify(peerConnection.localDescription));
});

// Scan QR Code to Establish Connection
scanQRInput.addEventListener("change", async event => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
        const offer = JSON.parse(reader.result);
        peerConnection = new RTCPeerConnection(configuration);

        peerConnection.ondatachannel = event => {
            dataChannel = event.channel;
            dataChannel.onmessage = e => {
                receivedMessage.textContent = e.data;
                localStorage.setItem("lastMessage", e.data);
            };
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Show Answer as QR Code for the other device to scan
        qrContainer.innerHTML = "";
        new QRCode(qrContainer, JSON.stringify(peerConnection.localDescription));
    };

    reader.readAsText(file);
});

// Send Message
sendMessageButton.addEventListener("click", () => {
    if (dataChannel && dataChannel.readyState === "open") {
        const message = messageInput.value;
        dataChannel.send(message);
        localStorage.setItem("lastMessage", message);
        receivedMessage.textContent = message;
    }
});

// Load Last Message from Local Storage
window.onload = () => {
    const lastMessage = localStorage.getItem("lastMessage");
    if (lastMessage) {
        receivedMessage.textContent = lastMessage;
    }
};
    