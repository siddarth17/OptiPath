import React, { useState } from 'react';
import './TravelInfo.css';

const TravelMail = () => {
    const [email, setEmail] = useState('');
    const [result, setResult] = useState(null);

    const handleInputChange = (e) => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (email.length < 150) {
            alert('Please enter at least 150 characters.');
            return;
        }
        try {
            const response = await fetch('http://18.144.66.232:3001/predict-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: email }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message);
            }
            const isScam = data.prediction === 1;
            const confidence = isScam ? data.probability : 100 - data.probability;
            setResult({
                isScam,
                confidence
            });
        } catch (error) {
            console.error('Error:', error);
            alert('Error processing email prediction: ' + error.message);
        }
    };

    return (
        <div className="travel-mail-container">
            <h2>Travel Information Safety</h2>
            <p className="info">Make your trip secure! Utilize our model to verify the reliability of your travel information, including emails, brochures, and web content.</p>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={email}
                    onChange={handleInputChange}
                    placeholder="Paste the content here..."
                    required
                    minLength="150"
                ></textarea>
                <button type="submit">Check Scam</button>
            </form>
            {result !== null && (
                <div className="result">
                    {result.isScam ? 'This information is most likely suspicious!' : 'This information is most likely not suspicious.'}
                    <p>Confidence: {result.confidence.toFixed(2)}%</p>
                </div>
            )}
            <p className="disclaimer">Disclaimer: This tool is for informational purposes only and may not be fully accurate.</p>
            <p className="citations">Citations: *Al-Subaiey, A., Al-Thani, M., Alam, N. A., Antora, K. F., Khandakar, A., & Zaman, S. A. U. (2024, May 19). Novel Interpretable and Robust Web-based AI Platform for Phishing Email Detection. ArXiv.org. https://arxiv.org/abs/2405.11619*</p>
        </div>
    );
};

export default TravelMail;
