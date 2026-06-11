import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { IconButton, TextField, Button } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LogoutIcon from '@mui/icons-material/Logout';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    // Join an existing meeting by code
    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    };

    // Create a new meeting with a random code
    let handleCreateMeeting = () => {
        const code = Math.random().toString(36).substring(2, 8);
        setMeetingCode(code);
    };

    // Copy meeting code to clipboard
    let handleCopyCode = () => {
        if (meetingCode) {
            navigator.clipboard.writeText(meetingCode);
        }
    };

    return (
        <>
            {/* Navigation Bar */}
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>LinkUp</h2>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <IconButton
                        onClick={() => navigate("/history")}
                        sx={{ color: 'var(--text-secondary)' }}
                    >
                        <RestoreIcon />
                    </IconButton>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer' }}
                        onClick={() => navigate("/history")}
                    >
                        History
                    </span>
                    <Button
                        onClick={() => {
                            localStorage.removeItem("token");
                            navigate("/auth");
                        }}
                        startIcon={<LogoutIcon />}
                        sx={{
                            color: 'var(--text-secondary)',
                            marginLeft: '8px',
                            textTransform: 'none',
                            '&:hover': { color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)' }
                        }}
                    >
                        Logout
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2><span>Premium</span> Video Calls for Everyone</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            Enter a meeting code to join, or create a new meeting instantly.
                        </p>

                        {/* Join Meeting Input */}
                        <div className="joinContainer">
                            <TextField
                                onChange={e => setMeetingCode(e.target.value)}
                                value={meetingCode}
                                label="Meeting Code"
                                variant="outlined"
                                size="small"
                                sx={{
                                    flex: 1,
                                    '& .MuiOutlinedInput-root': {
                                        color: 'var(--text-primary)',
                                        '& fieldset': { borderColor: 'var(--border-color)' },
                                        '&:hover fieldset': { borderColor: 'var(--accent)' },
                                        '&.Mui-focused fieldset': { borderColor: 'var(--accent)' },
                                    },
                                    '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
                                    '& .MuiInputLabel-root.Mui-focused': { color: 'var(--accent-light)' },
                                }}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleJoinVideoCall(); }}
                            />
                            {meetingCode && (
                                <IconButton onClick={handleCopyCode} sx={{ color: 'var(--text-secondary)' }}>
                                    <ContentCopyIcon />
                                </IconButton>
                            )}
                            <Button
                                onClick={handleJoinVideoCall}
                                variant='contained'
                                sx={{
                                    background: 'var(--gradient-primary)',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: '8px',
                                    padding: '8px 24px',
                                    boxShadow: '0 4px 15px var(--accent-glow)',
                                    '&:hover': { boxShadow: '0 6px 25px var(--accent-glow)' }
                                }}
                            >
                                Join
                            </Button>
                        </div>

                        {/* Quick Actions */}
                        <div className="quickActions">
                            <div className="actionCard" onClick={handleCreateMeeting}>
                                <div className="actionIcon violet">
                                    <VideoCallIcon fontSize="small" />
                                </div>
                                <span>New Meeting</span>
                            </div>
                            <div className="actionCard" onClick={() => navigate("/history")}>
                                <div className="actionIcon blue">
                                    <RestoreIcon fontSize="small" />
                                </div>
                                <span>View History</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='rightPanel'>
                    <img srcSet='/logo3.png' alt="Meeting illustration" />
                </div>
            </div>
        </>
    )
}

export default withAuth(HomeComponent)