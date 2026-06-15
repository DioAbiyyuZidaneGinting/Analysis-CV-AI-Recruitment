import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, classification_report, confusion_matrix
from xgboost import XGBClassifier

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "recruitment_data.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_and_evaluate():
    print("Loading recruitment dataset...")
    df = pd.read_csv(DATASET_PATH)
    
    print(f"Dataset shape: {df.shape}")
    
    # Split features and target
    X = df.drop(columns=['HiringDecision'])
    y = df['HiringDecision']
    
    # Define feature groups for preprocessing
    numeric_features = ['Age', 'DistanceFromCompany', 'InterviewScore', 'SkillScore', 'PersonalityScore', 'ExperienceYears', 'PreviousCompanies']
    categorical_features = ['RecruitmentStrategy']
    passthrough_features = ['Gender', 'EducationLevel']
    
    # Define preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
            ('pass', 'passthrough', passthrough_features)
        ]
    )
    
    # Split into train and test sets (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")
    
    # Define the models
    models = {
        "Backpropagation (Neural Network)": MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=1000, random_state=42, early_stopping=True),
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, random_state=42),
        "XGBoost": XGBClassifier(random_state=42, eval_metric="logloss")
    }
    
    # Cross-validation comparison
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_results = {}
    
    print("\n" + "="*50)
    print("PERFORMING 5-FOLD CROSS-VALIDATION ON TRAIN SET:")
    print("="*50)
    
    for name, clf in models.items():
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', clf)
        ])
        
        # Evaluate using cross_validate to get multiple metrics
        scores = cross_validate(
            pipeline, X_train, y_train, cv=cv,
            scoring=['accuracy', 'precision', 'recall', 'f1', 'roc_auc']
        )
        
        cv_results[name] = {
            "accuracy": np.mean(scores['test_accuracy']),
            "precision": np.mean(scores['test_precision']),
            "recall": np.mean(scores['test_recall']),
            "f1_score": np.mean(scores['test_f1']),
            "roc_auc": np.mean(scores['test_roc_auc'])
        }
        
        print(f"\n{name} CV Results:")
        print(f"  Accuracy:  {cv_results[name]['accuracy']:.4f}")
        print(f"  Precision: {cv_results[name]['precision']:.4f}")
        print(f"  Recall:    {cv_results[name]['recall']:.4f}")
        print(f"  F1 Score:  {cv_results[name]['f1_score']:.4f}")
        print(f"  ROC AUC:   {cv_results[name]['roc_auc']:.4f}")

    # Select Backpropagation (Neural Network) as the chosen model for deployment
    best_model_name = "Backpropagation (Neural Network)"
    print("\n" + "="*50)
    print(f"Selected Model for Deployment: {best_model_name}")
    print("="*50)
    
    # 7. Evaluate on Holdout Test Set
    best_clf = models[best_model_name]
    best_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', best_clf)
    ])
    
    best_pipeline.fit(X_train, y_train)
    preds = best_pipeline.predict(X_test)
    probs = best_pipeline.predict_proba(X_test)[:, 1]
    
    print("\nHoldout Test Set Evaluation for Best Model:")
    print(f"  Accuracy:  {accuracy_score(y_test, preds):.4f}")
    print(f"  Precision: {precision_score(y_test, preds):.4f}")
    print(f"  Recall:    {recall_score(y_test, preds):.4f}")
    print(f"  F1 Score:  {f1_score(y_test, preds):.4f}")
    print(f"  ROC AUC:   {roc_auc_score(y_test, probs):.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, preds))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, preds))
    
    # 8. Retrain the selected best model pipeline on all data
    print("\nRetraining the best model pipeline on all data...")
    best_pipeline.fit(X, y)
    
    # Get feature importances if the model supports it
    importances = None
    feature_names = []
    if hasattr(best_clf, "feature_importances_"):
        # Retrieve feature names from ColumnTransformer
        preprocessor.fit(X)
        cat_encoder = preprocessor.named_transformers_['cat']
        cat_features = list(cat_encoder.get_feature_names_out(categorical_features))
        feature_names = numeric_features + cat_features + passthrough_features
        importances = best_clf.feature_importances_
        
        print("\nFeature Importances:")
        feat_imp_df = pd.DataFrame({
            'Feature': feature_names,
            'Importance': importances
        }).sort_values(by='Importance', ascending=False)
        print(feat_imp_df.to_string(index=False))
        
    elif hasattr(best_clf, "coef_"):
        # Linear model coefficients
        preprocessor.fit(X)
        cat_encoder = preprocessor.named_transformers_['cat']
        cat_features = list(cat_encoder.get_feature_names_out(categorical_features))
        feature_names = numeric_features + cat_features + passthrough_features
        importances = best_clf.coef_[0]
        
        print("\nModel Coefficients (Impact):")
        feat_imp_df = pd.DataFrame({
            'Feature': feature_names,
            'Coefficient': importances
        }).sort_values(by='Coefficient', key=abs, ascending=False)
        print(feat_imp_df.to_string(index=False))
        
    # Save the model
    print("\nSaving recruitment model to models directory...")
    joblib.dump(best_pipeline, os.path.join(MODELS_DIR, "recruitment_model.pkl"))
    print("Saved recruitment_model.pkl successfully.")
    
    # Save a temporary label encoder for gender & strategy if needed
    # (Since gender and strategy are already numeric in the data, we don't strictly need encoders,
    # but we can save dummy encoders to ensure no file loading issues exist)
    from sklearn.preprocessing import LabelEncoder
    dummy_gender = LabelEncoder().fit([0, 1])
    dummy_strategy = LabelEncoder().fit([1, 2, 3])
    joblib.dump(dummy_gender, os.path.join(MODELS_DIR, "gender_encoder.pkl"))
    joblib.dump(dummy_strategy, os.path.join(MODELS_DIR, "strategy_encoder.pkl"))
    print("Saved gender_encoder.pkl and strategy_encoder.pkl successfully.")
    
    return cv_results, best_model_name, y_test, preds, probs, importances, feature_names

if __name__ == "__main__":
    train_and_evaluate()
