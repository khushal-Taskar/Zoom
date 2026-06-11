import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import { IconButton, Button } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import "../App.css";

export default function History() {

    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // Could not load history
            }
        }
        fetchHistory();
    }, []);

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <div className="historyPage">
            {/* Header */}
            <div className="historyHeader">
                <IconButton
                    onClick={() => routeTo("/home")}
                    sx={{ color: 'var(--text-secondary)' }}
                >
                    <HomeIcon />
                </IconButton>
                <h2>Meeting History</h2>
            </div>

            {/* Meeting Cards Grid */}
            {meetings.length > 0 ? (
                <div className="historyGrid">
                    {meetings.map((meeting, index) => (
                        <div key={index} className="historyCard">
                            <div className="meetingCode">📋 {meeting.meetingCode}</div>
                            <div className="meetingDate">📅 {formatDate(meeting.date)}</div>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<VideoCallIcon />}
                                onClick={() => routeTo(`/${meeting.meetingCode}`)}
                                sx={{
                                    color: 'var(--accent-light)',
                                    borderColor: 'var(--border-accent)',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: '0.8rem',
                                    '&:hover': {
                                        borderColor: 'var(--accent)',
                                        background: 'rgba(124, 58, 237, 0.1)'
                                    }
                                }}
                            >
                                Rejoin
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="emptyState">
                    <div className="emptyIcon">📭</div>
                    <p>No meetings yet</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        Join or create a meeting to see it here
                    </p>
                </div>
            )}
        </div>
    )
}
