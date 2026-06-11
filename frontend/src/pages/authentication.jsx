import React, { useState, useContext } from 'react';
import "../App.css";
import { AuthContext } from '../contexts/AuthContext';

export default function Authentication() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [formState, setFormState] = useState(0); // 0 = Login, 1 = Register
    const [loading, setLoading] = useState(false);

    const { handleRegister, handleLogin } = useContext(AuthContext);

    let handleAuth = async () => {
        // Basic validation
        if (!username || !password) {
            setError("Please fill in all fields");
            return;
        }
        if (formState === 1 && !name) {
            setError("Please enter your full name");
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (formState === 0) {
                await handleLogin(username, password);
            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                setMessage(result);
                setUsername('');
                setPassword('');
                setError('');
                setFormState(0);
            }
        } catch (err) {
            console.log(err);
            let msg = err.response?.data?.message || "Something went wrong";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Allow form submit with Enter key
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAuth();
        }
    };

    return (
        <div className="authPage">
            <div className="authLeft">
                <div className="brandSection">
                    <h1>LinkUp</h1>
                    <p>Connect with anyone, anywhere</p>
                </div>

                <div className="authCard">
                    {/* Tab Switcher */}
                    <div className="authTabs">
                        <button
                            className={`authTab ${formState === 0 ? 'active' : ''}`}
                            onClick={() => { setFormState(0); setError(''); setMessage(''); }}
                        >
                            Sign In
                        </button>
                        <button
                            className={`authTab ${formState === 1 ? 'active' : ''}`}
                            onClick={() => { setFormState(1); setError(''); setMessage(''); }}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Full Name (only for Register) */}
                    {formState === 1 && (
                        <input
                            className="authInput"
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    )}

                    {/* Username */}
                    <input
                        className="authInput"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    {/* Password */}
                    <input
                        className="authInput"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    {/* Error / Success Messages */}
                    {error && <p className="authError">{error}</p>}
                    {message && <p className="authSuccess">{message}</p>}

                    {/* Submit Button */}
                    <button
                        className="authButton"
                        onClick={handleAuth}
                        disabled={loading}
                    >
                        {loading ? "Please wait..." : (formState === 0 ? "Login" : "Register")}
                    </button>
                </div>
            </div>
        </div>
    );
}