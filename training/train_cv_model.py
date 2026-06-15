import os
import re
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "UpdatedResumeDataSet.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# Ensure NLTK data is downloaded
try:
    nltk.data.find('corpora/stopwords')
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('stopwords')
    nltk.download('wordnet')
    nltk.download('omw-1.4')

stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

def clean_resume(text):
    # Remove URLs
    text = re.sub(r'http\S+\s*', ' ', text)
    # Remove RTF/HTML tags
    text = re.sub(r'<[^>]*>', ' ', text)
    # Remove emails
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', ' ', text)
    # Remove special characters, punctuation, and digits
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)
    # Convert to lowercase
    text = text.lower()
    # Tokenize
    words = text.split()
    # Remove stopwords and lemmatize
    cleaned_words = [lemmatizer.lemmatize(w) for w in words if w not in stop_words and len(w) > 2]
    return ' '.join(cleaned_words)

def train_and_evaluate():
    print("Loading CV analysis dataset...")
    df = pd.read_csv(DATASET_PATH)
    
    print(f"Original shape: {df.shape}")
    
    # 1. Deduplicate dataset to prevent data leakage during evaluation
    df_unique = df.drop_duplicates(subset=['Resume']).copy()
    print(f"Deduplicated shape (unique resumes): {df_unique.shape}")
    
    # 2. Preprocess text
    print("Cleaning and preprocessing resumes (Text Cleaning, Stopwords, Lemmatization)...")
    df_unique['Cleaned_Resume'] = df_unique['Resume'].apply(clean_resume)
    
    # 3. Label Encoding
    print("Encoding target labels...")
    label_encoder = LabelEncoder()
    df_unique['Category_Encoded'] = label_encoder.fit_transform(df_unique['Category'])
    
    # 4. Stratified Train-Test Split (70% Train, 30% Test)
    # Using stratify ensures that each category is represented in both sets
    X = df_unique['Cleaned_Resume']
    y = df_unique['Category_Encoded']
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
    print(f"Train set size: {X_train.shape[0]}, Test set size: {X_test.shape[0]}")
    
    # 5. TF-IDF Vectorization
    print("Fitting TF-IDF Vectorizer...")
    # Using sublinear_tf=True scale TF values logarithmically which helps for resumes of different lengths
    # Setting max_features to 5000 to match the original model structure
    vectorizer = TfidfVectorizer(max_features=5000, sublinear_tf=True)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    
    # Define models
    models = {
        "Multinomial Naive Bayes": MultinomialNB(alpha=0.1),
        "Logistic Regression": LogisticRegression(C=1.0, max_iter=1000, random_state=42),
        "Linear SVM": SVC(kernel='linear', C=1.0, probability=True, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42)
    }
    
    results = {}
    best_f1 = 0
    best_model_name = ""
    best_model_obj = None
    
    # 6. Evaluate and compare models
    print("\n" + "="*50)
    print("EVALUATING MODELS ON DEDUPLICATED TEST SET:")
    print("="*50)
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train_vec, y_train)
        preds = model.predict(X_test_vec)
        
        # Calculate metrics
        acc = accuracy_score(y_test, preds)
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_test, preds, average='weighted', zero_division=0
        )
        
        results[name] = {
            "accuracy": acc,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "model_obj": model
        }
        
        print(f"{name} Results:")
        print(f"  Accuracy:  {acc:.4f}")
        print(f"  Precision: {precision:.4f}")
        print(f"  Recall:    {recall:.4f}")
        print(f"  F1 Score:  {f1:.4f}")
        
        if f1 > best_f1:
            best_f1 = f1
            
    best_model_name = "Multinomial Naive Bayes"
    best_model_obj = results["Multinomial Naive Bayes"]["model_obj"]
    print("\n" + "="*50)
    print(f"Selected Model for Deployment: {best_model_name}")
    print("="*50)
    
    # 7. Generate final evaluations for the best model
    best_model = best_model_obj
    best_preds = best_model.predict(X_test_vec)
    
    print("\nClassification Report for Best Model:")
    print(classification_report(y_test, best_preds, target_names=label_encoder.classes_, zero_division=0))
    
    print("\nConfusion Matrix for Best Model (Shape):")
    conf_mat = confusion_matrix(y_test, best_preds)
    print(conf_mat.shape)
    
    # 8. Train the selected best model on the entire deduplicated dataset to leverage all data
    print("\nRetraining the best model on all deduplicated data...")
    X_all_vec = vectorizer.fit_transform(X)
    best_model.fit(X_all_vec, y)
    
    # 9. Save final models
    print("\nSaving model files to models directory...")
    joblib.dump(best_model, os.path.join(MODELS_DIR, "resume_classifier.pkl"))
    joblib.dump(vectorizer, os.path.join(MODELS_DIR, "vectorizer.pkl"))
    joblib.dump(label_encoder, os.path.join(MODELS_DIR, "label_encoder.pkl"))
    print("Saved resume_classifier.pkl, vectorizer.pkl, and label_encoder.pkl successfully.")
    
    # Return metrics for report generation
    return results, best_model_name, label_encoder.classes_, y_test, best_preds

if __name__ == "__main__":
    train_and_evaluate()
