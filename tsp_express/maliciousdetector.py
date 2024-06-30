import pandas as pd
import numpy as np
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.sentiment import SentimentIntensityAnalyzer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.preprocessing import StandardScaler
import re
import ssl
from xgboost import XGBClassifier
import time
from joblib import dump, load

# Setup SSL for NLTK downloads
ssl._create_default_https_context = ssl._create_unverified_context
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('vader_lexicon')

# Load datasets
print("Loading data...")
df_ceas = pd.read_csv("phishingdata/CEAS_08.csv")
df_spam = pd.read_csv("phishingdata/Nigerian_Fraud.csv")
df = pd.concat([df_ceas, df_spam], ignore_index=True)

# Prepare text columns
df['subject'] = df['subject'].fillna('').astype(str)
df['body'] = df['body'].fillna('').astype(str)

print(f"Total rows: {df.shape[0]}, Total columns: {df.shape[1]}")

# Prepare stopwords
stop_words = set(stopwords.words('english'))

def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'http[s]?://\S+', 'urlplaceholder', text)
    text = re.sub(r'\S*@\S*\s?', 'emailplaceholder', text)
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    tokens = word_tokenize(text)
    tokens = [word for word in tokens if word not in stop_words]
    return " ".join(tokens)

df['text_combined'] = df['subject'].apply(preprocess_text) + ' ' + df['body'].apply(preprocess_text)

# Sentiment analysis
sia = SentimentIntensityAnalyzer()
df['text_sentiment'] = df['text_combined'].apply(lambda x: sia.polarity_scores(x)['compound'])

# TF-IDF vectorization
tfidf_vectorizer = TfidfVectorizer(max_features=5000, max_df=0.7, min_df=5, ngram_range=(1, 2))
tfidf_features = tfidf_vectorizer.fit_transform(df['text_combined']).toarray()

# Save TF-IDF vectorizer
dump(tfidf_vectorizer, 'phishing_tfidf_vectorizer.joblib')

X = np.hstack((tfidf_features, df[['text_sentiment']].values.reshape(-1, 1)))
y = df['label'].values

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Save scaler
dump(scaler, 'scaler.joblib')

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42, stratify=y)

# Model training
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save the model
dump(model, 'phishing_model.joblib')

# Predictions
y_pred = model.predict(X_test)
probabilities = model.predict_proba(X_test)[:, 1]  # Probability of being phishing

# Output results
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Classification Report:\n", classification_report(y_test, y_pred))
df_results = pd.DataFrame({
    'Actual': y_test,
    'Predicted': y_pred,
    'Confidence': probabilities
})

print(df_results.head())  # Display first few results