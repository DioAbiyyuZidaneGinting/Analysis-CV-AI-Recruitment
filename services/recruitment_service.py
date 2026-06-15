import os
import joblib
import pandas as pd
import numpy as np

# Setup directories
SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SERVICES_DIR)
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Load model pipeline
try:
    recruitment_model = joblib.load(os.path.join(MODELS_DIR, "recruitment_model.pkl"))
except Exception as e:
    print(f"Error loading recruitment model pipeline: {e}")
    recruitment_model = None

def predict_hiring_decision(candidate_data):
    """
    Predict Hiring Probability and Hiring Recommendation using the retrained Gradient Boosting Pipeline.
    
    Expected features in candidate_data (dict):
        - Age (int): default 27
        - Gender (int): default 1 (Male)
        - EducationLevel (int): default 2 (Bachelor)
        - ExperienceYears (int): default 1
        - PreviousCompanies (int): default 1
        - DistanceFromCompany (float): default 8.5
        - InterviewScore (int): default 80
        - SkillScore (int): default 75
        - PersonalityScore (int): default 75
        - RecruitmentStrategy (int): default 2 (Job Board)
    """
    # 1. Fallbacks/Defaults
    defaults = {
        'Age': 27,
        'Gender': 1,
        'EducationLevel': 2,
        'ExperienceYears': 1,
        'PreviousCompanies': 1,
        'DistanceFromCompany': 8.5,
        'InterviewScore': 80,
        'SkillScore': 75,
        'PersonalityScore': 75,
        'RecruitmentStrategy': 2
    }
    
    # Fill in values from input, fallback to defaults
    input_data = {}
    for col, default_val in defaults.items():
        val = candidate_data.get(col, default_val)
        # Ensure correct type
        if col in ['Age', 'Gender', 'EducationLevel', 'ExperienceYears', 'PreviousCompanies', 'InterviewScore', 'SkillScore', 'PersonalityScore', 'RecruitmentStrategy']:
            try:
                input_data[col] = [int(val)]
            except:
                input_data[col] = [default_val]
        elif col == 'DistanceFromCompany':
            try:
                input_data[col] = [float(val)]
            except:
                input_data[col] = [default_val]
                
    # 2. Build DataFrame with correct column ordering matching model training
    df = pd.DataFrame(input_data)
    cols_order = ['Age', 'Gender', 'EducationLevel', 'ExperienceYears', 'PreviousCompanies',
                  'DistanceFromCompany', 'InterviewScore', 'SkillScore', 'PersonalityScore', 'RecruitmentStrategy']
    df = df[cols_order]
    
    # 3. Model Inference
    hiring_chance = 50
    hiring_recommendation = "Not Recommended"
    
    # Extract scores for heuristic fallbacks/blends
    interview_val = float(input_data['InterviewScore'][0])
    skill_val = float(input_data['SkillScore'][0])
    heuristic_chance = (interview_val + skill_val) / 2.0
    
    if recruitment_model:
        try:
            # Predict under Strategy 1 (Direct/Referral)
            df_s1 = df.copy()
            df_s1['RecruitmentStrategy'] = 1
            prob_s1 = recruitment_model.predict_proba(df_s1)[0][1]
            
            # Predict under Strategy 2 (Job Board)
            df_s2 = df.copy()
            df_s2['RecruitmentStrategy'] = 2
            prob_s2 = recruitment_model.predict_proba(df_s2)[0][1]
            
            # Blend Strategy 1 (65%) and Strategy 2 (35%) to balance strategy bias
            ml_chance = (0.65 * prob_s1 + 0.35 * prob_s2) * 100
            
            # Final blended chance: 50% ML prediction + 50% credentials-based heuristic
            hiring_chance = int(0.5 * ml_chance + 0.5 * heuristic_chance)
            hiring_chance = min(max(hiring_chance, 15), 98)
            
            hiring_recommendation = "Recommended" if hiring_chance >= 65 else "Not Recommended"
        except Exception as e:
            print(f"Error predicting with recruitment model: {e}")
            hiring_chance = int(heuristic_chance)
            hiring_recommendation = "Recommended" if hiring_chance >= 65 else "Not Recommended"
    else:
        # Fallback if model is not loaded
        hiring_chance = int(heuristic_chance)
        hiring_recommendation = "Recommended" if hiring_chance >= 65 else "Not Recommended"
        
    return {
        "hiringChance": hiring_chance,
        "hiringRecommendation": hiring_recommendation
    }
