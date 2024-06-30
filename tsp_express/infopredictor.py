from flask import Flask, request, jsonify
import numpy as np
from joblib import load
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import re
import string

app = Flask(__name__)

try:
    model = load('phishing_model.joblib')
    tfidf_vectorizer = load('phishing_tfidf_vectorizer.joblib')
    scaler = load('scaler.joblib')
    stop_words = set(stopwords.words('english'))
except Exception as e:
    print(f"Failed to load models or components: {e}")

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'http[s]?://\S+', 'urlplaceholder', text)
    text = re.sub(r'\S*@\S*\s?', 'emailplaceholder', text)
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    tokens = word_tokenize(text)
    return " ".join([word for word in tokens if word not in stop_words])

@app.route('/predict', methods=['POST'])
def predict_info():
    try:
        text_input = request.json['text']
        processed_text = preprocess_text(text_input)
        features = tfidf_vectorizer.transform([processed_text]).toarray()
        sentiment_analyzer = SentimentIntensityAnalyzer()
        sentiment = sentiment_analyzer.polarity_scores(processed_text)['compound']
        features = np.hstack((features, [[sentiment]]))
        features_scaled = scaler.transform(features)
        prediction = int(model.predict(features_scaled)[0])
        probability = round(model.predict_proba(features_scaled)[0, 1] * 100, 2)
        return jsonify({'prediction': prediction, 'probability': probability})
    except KeyError as e:
        return jsonify({'error': 'Missing required field: ' + str(e), 'message': 'Error processing email prediction'}), 400
    except Exception as e:
        return jsonify({'error': str(e), 'message': 'Error processing email prediction'}), 500

if __name__ == '__main__':
    app.run(port=5000)