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

// Dragging Functionality for Widget
const widget = document.getElementById("flashnote-widget");
let isDragging = false, startX, startY, initialX, initialY;

widget.addEventListener("mousedown", startDrag);
widget.addEventListener("touchstart", startDrag);

function startDrag(event) {
    isDragging = true;
    widget.style.cursor = "grabbing";
    startX = event.type.includes("touch") ? event.touches[0].clientX : event.clientX;
    startY = event.type.includes("touch") ? event.touches[0].clientY : event.clientY;
    initialX = widget.offsetLeft;
    initialY = widget.offsetTop;
    document.addEventListener("mousemove", drag);
    document.addEventListener("touchmove", drag);
    document.addEventListener("mouseup", stopDrag);
    document.addEventListener("touchend", stopDrag);
}

function drag(event) {
    if (!isDragging) return;
    let currentX = event.type.includes("touch") ? event.touches[0].clientX : event.clientX;
    let currentY = event.type.includes("touch") ? event.touches[0].clientY : event.clientY;
    let deltaX = currentX - startX;
    let deltaY = currentY - startY;
    widget.style.left = initialX + deltaX + "px";
    widget.style.top = initialY + deltaY + "px";
}

function stopDrag() {
    isDragging = false;
    widget.style.cursor = "grab";
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("touchmove", drag);
}
    