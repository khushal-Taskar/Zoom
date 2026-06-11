import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'

export default function LandingPage() {

    const router = useNavigate();

    // Generate a random meeting code for guest users
    const handleGuestJoin = () => {
        const randomCode = Math.random().toString(36).substring(2, 8);
        router(`/${randomCode}`);
    };

    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>LinkUp</h2>
                </div>
                <div className='navlist'>
                    <p onClick={handleGuestJoin}>Join as Guest</p>
                    <p onClick={() => router("/auth")}>Register</p>
                    <div onClick={() => router("/auth")} role='button'>
                        <p>Login</p>
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1><span>Connect</span> with your loved Ones</h1>
                    <p>Crystal-clear video calls, instant screen sharing, and real-time chat — all in one place. Free forever.</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                <div>
                    <img src="/mobile.png" alt="Video call preview" />
                </div>
            </div>

            {/* Features Section */}
            <div className="featuresSection">
                <h2>Everything you need to stay connected</h2>
                <div className="featuresGrid">
                    <div className="featureCard">
                        <div className="featureIcon">🎥</div>
                        <h3>HD Video Calls</h3>
                        <p>Crystal-clear video with low latency powered by WebRTC peer-to-peer technology.</p>
                    </div>
                    <div className="featureCard">
                        <div className="featureIcon">🖥️</div>
                        <h3>Screen Sharing</h3>
                        <p>Share your screen instantly during calls for presentations and collaboration.</p>
                    </div>
                    <div className="featureCard">
                        <div className="featureIcon">💬</div>
                        <h3>Live Chat</h3>
                        <p>Send messages in real-time during your meeting using Socket.IO powered chat.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
