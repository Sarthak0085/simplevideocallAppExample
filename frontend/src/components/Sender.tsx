import { useEffect, useState } from "react";

const Sender = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "sender" }));
    };
    setSocket(socket);
  }, []);

  const startSendingVideo = async () => {
    if (!socket) return;
    const pc = new RTCPeerConnection();
    pc.onnegotiationneeded = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.send(
        JSON.stringify({
          type: "createOffer",
          sdp: pc.localDescription,
        })
      );
    };

    pc.onicecandidate = (event) => {
      console.log(event);
      if (event.candidate) {
        socket?.send(
          JSON.stringify({ type: "iceCandidate", candidate: event.candidate })
        );
      }
    };

    // socket?.send(
    //   JSON.stringify({ type: "createOffer", sdp: pc.localDescription })
    // );

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "createAnswer") {
        pc.setRemoteDescription(message.sdp);
      } else if (message.type === "iceCandidate") {
        pc.addIceCandidate(message.candidate);
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    pc.addTrack(stream.getVideoTracks()[0]);

    // const video = document.createElement("video");
    // video.srcObject = stream;
    // video.play();
    // // this is wrong, should propogate via a component
    // document.body.appendChild(video);
  };

  return (
    <div>
      Sender
      <button onClick={startSendingVideo}>Send Video</button>
    </div>
  );
};

export default Sender;
