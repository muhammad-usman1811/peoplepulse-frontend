import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");

    const handleBackToLogin = () => {
        navigate("/login");
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Reset link requested for:", email);
    };

    return (
        <div className="forgot-password-page">

            {/* Left Section */}
            <div className="forgot-left-section">
                <div className="branding">
                    <img src="/logo.jpg" alt="PeoplePulse Logo" />

                    <h2>Welcome to<br />PeoplePulse.</h2>

                    <p>
                        Attendance, leave, payroll, performance and
                        announcements — all in one corporate HRMS.
                    </p>
                </div>
            </div>

            {/* Right Section */}
            <div className="forgot-right-section">

                <div className="forgot-password-container">

                    <a
                        href="/login"
                        className="back-login"
                        onClick={(e) => {
                            e.preventDefault();
                            handleBackToLogin();
                        }}
                    >
                        Back to login
                    </a>

                    <h1>Reset your password</h1>

                    <p className="description">
                        We'll email you a link to set a new password.
                    </p>

                    <form onSubmit={handleSubmit}>

                        <label htmlFor="email">
                            Work email
                        </label>

                        <input
                            id="email"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <button type="submit" className="btn btn-primary">
                            Send reset link
                        </button>

                    </form>

                </div>

            </div>

        </div>
    );
}

export default ForgotPassword;