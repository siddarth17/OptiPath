import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const LoginSignUp = ({ onLogin }) => {
    const navigate = useNavigate();
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [signupError, setSignupError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        try {
            const response = await axios.post('http://localhost:3001/login', {
                email: loginEmail,
                password: loginPassword
            });
            localStorage.setItem('token', response.data.token);
            onLogin();
            navigate('/home');
        } catch (error) {
            console.error('Login failed:', error);
            setLoginError('Invalid email or password');
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError('');
        if (signupPassword !== confirmPassword) {
            setSignupError("Passwords don't match");
            return;
        }
        try {
            await axios.post('http://localhost:3001/register', {
                email: signupEmail,
                password: signupPassword
            });
            alert('Sign up successful. Please log in.');
            // Clear signup form
            setSignupEmail('');
            setSignupPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Signup failed:', error);
            setSignupError('Failed to sign up. Please try again.');
        }
    };

    return (
        <div className="login-signup-container">
            <div className="note">
                <h2>Login to save your locations</h2>
            </div>
            <div className="loginform-container">
                <div className="login-form">
                    <h3>Login</h3>
                    <form onSubmit={handleLogin}>
                        <input 
                            type="email" 
                            placeholder="Email" 
                            required 
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            required 
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        {loginError && <div className="error-message">{loginError}</div>}
                        <button type="submit">Login</button>
                    </form>
                </div>
                <div className="signup-form">
                    <h3>Sign Up</h3>
                    <form onSubmit={handleSignup}>
                        <input 
                            type="email" 
                            placeholder="Email" 
                            required 
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            required 
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                        />
                        <input 
                            type="password" 
                            placeholder="Confirm Password" 
                            required 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {signupError && <div className="error-message">{signupError}</div>}
                        <button type="submit">Sign Up</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginSignUp;