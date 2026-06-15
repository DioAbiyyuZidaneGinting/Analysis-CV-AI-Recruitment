import joblib
import os

models_path = "d:\\AI Recruitment Platform Design\\models"

def inspect_file(filename):
    filepath = os.path.join(models_path, filename)
    if not os.path.exists(filepath):
        print(f"{filename} does not exist.")
        return
    try:
        obj = joblib.load(filepath)
    except Exception as e:
        print(f"Error loading {filename}: {e}")
        return
    print(f"\n--- Inspecting {filename} ---")
    print("Type:", type(obj))
    if hasattr(obj, "classes_"):
        print("Classes:", obj.classes_)
    if hasattr(obj, "feature_names_in_"):
        print("Feature Names In (first 20):", list(obj.feature_names_in_)[:20])
        print("Number of features:", len(obj.feature_names_in_))
    elif hasattr(obj, "n_features_in_"):
        print("Number of features in:", obj.n_features_in_)
    
    if "vectorizer" in filename:
        if hasattr(obj, "get_feature_names_out"):
            print("Feature Names Out (first 20):", list(obj.get_feature_names_out())[:20])
            print("Vocab size:", len(obj.get_feature_names_out()))

inspect_file("label_encoder.pkl")
inspect_file("gender_encoder.pkl")
inspect_file("strategy_encoder.pkl")
inspect_file("vectorizer.pkl")
inspect_file("resume_classifier.pkl")
inspect_file("recruitment_model.pkl")
