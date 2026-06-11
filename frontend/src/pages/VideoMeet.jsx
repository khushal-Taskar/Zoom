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
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";

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

  const chatEndRef = useRef(null);

  /* ===================== PERMISSIONS ===================== */

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (!message.trim()) return;
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  /* ===================== CONTROLS ===================== */

  const connect = () => {
    if (!username.trim()) return;
    setAskForUsername(false);
    connectToSocketServer();
  };

  const handleEndCall = () => {
    window.localStream?.getTracks().forEach(track => track.stop());
    window.location.href = "/home";
  };

  const handleToggleChat = () => {
    setModal(!showModal);
    if (!showModal) setNewMessages(0); // Reset badge when opening chat
  };

  /* ===================== UI ===================== */

  return (
    <div>
      {askForUsername ? (
        /* ---- LOBBY SCREEN ---- */
        <div className={styles.lobbyContainer}>
          <div className={styles.lobbyCard}>
            <h2>Ready to join?</h2>
            <p>Enter your name to join the meeting</p>
            <TextField
              value={username}
              onChange={e => setUsername(e.target.value)}
              label="Your Name"
              variant="outlined"
              fullWidth
              size="small"
              onKeyDown={(e) => { if (e.key === 'Enter') connect(); }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: '#f0f0f5',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                  '&:hover fieldset': { borderColor: '#7c3aed' },
                  '&.Mui-focused fieldset': { borderColor: '#7c3aed' },
                },
                '& .MuiInputLabel-root': { color: '#6b6b80' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#a78bfa' },
              }}
            />
            <Button
              onClick={connect}
              variant="contained"
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)',
                '&:hover': { boxShadow: '0 6px 25px rgba(124, 58, 237, 0.4)' }
              }}
            >
              Join Meeting
            </Button>
            <video className={styles.lobbyPreview} ref={localVideoref} autoPlay muted />
          </div>
        </div>
      ) : (
        /* ---- MEETING ROOM ---- */
        <div className={styles.meetVideoContainer}>

          {/* Remote Videos */}
          <div className={styles.conferenceView}>
            {videos.map(v => (
              <video
                key={v.socketId}
                ref={ref => ref && (ref.srcObject = v.stream)}
                autoPlay
              />
            ))}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted />

          {/* Control Bar */}
          <div className={styles.buttonContainers}>
            <IconButton
              onClick={() => setVideo(!video)}
              sx={{ color: video ? '#f0f0f5' : '#ef4444' }}
            >
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton
              onClick={() => setAudio(!audio)}
              sx={{ color: audio ? '#f0f0f5' : '#ef4444' }}
            >
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable && (
              <IconButton
                onClick={() => setScreen(!screen)}
                sx={{ color: screen ? '#7c3aed' : '#f0f0f5' }}
              >
                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            )}

            <Badge badgeContent={newMessages} color="primary" max={9}>
              <IconButton
                onClick={handleToggleChat}
                sx={{ color: showModal ? '#7c3aed' : '#f0f0f5' }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>

            <IconButton
              onClick={handleEndCall}
              sx={{
                backgroundColor: '#ef4444',
                color: 'white',
                '&:hover': { backgroundColor: '#dc2626' },
                marginLeft: '8px'
              }}
            >
              <CallEndIcon />
            </IconButton>
          </div>

          {/* Chat Panel (was missing — now fully implemented) */}
          {showModal && (
            <div className={styles.chatPanel}>
              <div className={styles.chatHeader}>
                <h3>Meeting Chat</h3>
                <IconButton onClick={() => setModal(false)} size="small" sx={{ color: '#a0a0b8' }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>

              <div className={styles.chatMessages}>
                {messages.length === 0 && (
                  <p style={{ color: '#6b6b80', textAlign: 'center', fontSize: '0.85rem', marginTop: '2rem' }}>
                    No messages yet. Say hello! 👋
                  </p>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`${styles.chatBubble} ${msg.sender === username ? styles.sent : styles.received}`}
                  >
                    {msg.sender !== username && (
                      <span className={styles.senderName}>{msg.sender}</span>
                    )}
                    {msg.data}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className={styles.chatInputArea}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                />
                <IconButton
                  onClick={sendMessage}
                  sx={{
                    color: '#7c3aed',
                    '&:hover': { background: 'rgba(124, 58, 237, 0.1)' }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
