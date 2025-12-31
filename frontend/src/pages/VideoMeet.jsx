import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Badge,
  IconButton,
  TextField,
  Button
} from "@mui/material";

import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";

import styles from "../styles/videoComponent.module.css";
import server from "../environment";

const server_url = server;

let connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export default function VideoMeetComponent() {
  const socketRef = useRef(null);
  const socketIdRef = useRef(null);
  const localVideoref = useRef(null);
  const videoRef = useRef([]);

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);

  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);

  const [screenAvailable, setScreenAvailable] = useState(false);
  const [videos, setVideos] = useState([]);

  const [showModal, setModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [newMessages, setNewMessages] = useState(0);

  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  /* ===================== PERMISSIONS ===================== */

  useEffect(() => {
    getPermissions();
  }, []);

  const getPermissions = async () => {
    try {
      const videoPerm = await navigator.mediaDevices.getUserMedia({ video: true });
      setVideoAvailable(!!videoPerm);

      const audioPerm = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioAvailable(!!audioPerm);

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoAvailable,
        audio: audioAvailable
      });

      window.localStream = stream;
      if (localVideoref.current) localVideoref.current.srcObject = stream;
    } catch (err) {
      console.log(err);
    }
  };

  /* ===================== MEDIA ===================== */

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video,
        audio
      });
      handleUserMedia(stream);
    } catch (err) {
      console.log(err);
    }
  };

  const handleUserMedia = (stream) => {
    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    Object.keys(connections).forEach((id) => {
      if (id === socketIdRef.current) return;
      connections[id].addStream(stream);
      connections[id].createOffer().then((desc) => {
        connections[id].setLocalDescription(desc);
        socketRef.current.emit("signal", id, JSON.stringify({ sdp: desc }));
      });
    });
  };

  /* ===================== SCREEN SHARE ===================== */

  useEffect(() => {
    if (screen) startScreenShare();
  }, [screen]);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      handleUserMedia(stream);
      stream.getTracks()[0].onended = () => setScreen(false);
    } catch (err) {
      console.log(err);
    }
  };

  /* ===================== SOCKET ===================== */

  const connectToSocketServer = () => {
    socketRef.current = io(server_url, {
      transports: ["websocket"],
      secure: true
    });

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", window.location.href);
    });

    socketRef.current.on("signal", gotMessageFromServer);
    socketRef.current.on("chat-message", addMessage);

    socketRef.current.on("user-left", (id) => {
      setVideos((prev) => prev.filter((v) => v.socketId !== id));
    });

    socketRef.current.on("user-joined", (id, clients) => {
      clients.forEach((clientId) => {
        if (connections[clientId]) return;

        connections[clientId] = new RTCPeerConnection(peerConfigConnections);

        connections[clientId].onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit(
              "signal",
              clientId,
              JSON.stringify({ ice: event.candidate })
            );
          }
        };

        connections[clientId].onaddstream = (event) => {
          setVideos((prev) => {
            const exists = prev.find(v => v.socketId === clientId);
            if (exists) return prev;
            const newVideo = { socketId: clientId, stream: event.stream };
            videoRef.current.push(newVideo);
            return [...prev, newVideo];
          });
        };

        if (window.localStream) {
          connections[clientId].addStream(window.localStream);
        }
      });
    });
  };

  const gotMessageFromServer = (fromId, message) => {
    const signal = JSON.parse(message);
    if (fromId === socketIdRef.current) return;

    if (signal.sdp) {
      connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
        .then(() => {
          if (signal.sdp.type === "offer") {
            connections[fromId].createAnswer().then((desc) => {
              connections[fromId].setLocalDescription(desc);
              socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: desc }));
            });
          }
        });
    }

    if (signal.ice) {
      connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
    }
  };

  /* ===================== CHAT ===================== */

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prev) => [...prev, { sender, data }]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((n) => n + 1);
    }
  };

  const sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  /* ===================== CONTROLS ===================== */

  const connect = () => {
    setAskForUsername(false);
    connectToSocketServer();
  };

  const handleEndCall = () => {
    window.localStream?.getTracks().forEach(track => track.stop());
    window.location.href = "/";
  };

  /* ===================== UI ===================== */

  return (
    <div>
      {askForUsername ? (
        <div>
          <h2>Enter Lobby</h2>
          <TextField value={username} onChange={e => setUsername(e.target.value)} label="Username" />
          <Button onClick={connect} variant="contained">Connect</Button>
          <video ref={localVideoref} autoPlay muted />
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          <div className={styles.buttonContainers}>
            <IconButton onClick={() => setVideo(!video)}>{video ? <VideocamIcon /> : <VideocamOffIcon />}</IconButton>
            <IconButton onClick={handleEndCall} color="error"><CallEndIcon /></IconButton>
            <IconButton onClick={() => setAudio(!audio)}>{audio ? <MicIcon /> : <MicOffIcon />}</IconButton>
            {screenAvailable && (
              <IconButton onClick={() => setScreen(!screen)}>
                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            )}
            <Badge badgeContent={newMessages} color="primary">
              <IconButton onClick={() => setModal(!showModal)}><ChatIcon /></IconButton>
            </Badge>
          </div>

          <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted />

          <div className={styles.conferenceView}>
            {videos.map(v => (
              <video
                key={v.socketId}
                ref={ref => ref && (ref.srcObject = v.stream)}
                autoPlay
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
