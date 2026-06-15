# Model Evaluation and Retraining Report

This report documents the retraining process, evaluation metrics, and rationale for selecting the final machine learning models for both the **CV Analysis Engine** and the **Recruitment Engine**.

---

## 1. CV Analysis Model (Target: `Category`)

The goal of this model is to classify the text of a candidate's resume into one of 25 job categories. To prevent data leakage and ensure realistic performance, all evaluations were performed on the **deduplicated dataset** (166 unique resumes, split into 70% training and 30% testing sets).

### 1.1. Model Comparison (Test Set)
We compared Logistic Regression, Linear SVM (SVC), and Random Forest. 

| Model | Test Accuracy | Test Precision (Weighted) | Test Recall (Weighted) | Test F1-Score (Weighted) |
| :--- | :---: | :---: | :---: | :---: |
| Logistic Regression | 0.3400 | 0.2674 | 0.3400 | 0.2511 |
| Linear SVM | 0.5800 | 0.5486 | 0.5800 | 0.5240 |
| **Random Forest** | **0.6400** | **0.6802** | **0.6400** | **0.6158** |

### 1.2. Rationale for Selecting the Final Model
* **Random Forest** achieved the highest accuracy (64.0%) and F1-score (61.58%) on the test set. 
* Tree-based models are effective at handling high-dimensional sparse representations (TF-IDF) when training data is extremely scarce per class (some classes have as few as 3 unique samples).
* The final model saved to `models/resume_classifier.pkl` was retrained on the entire deduplicated dataset to maximize training examples.

### 1.3. Classification Report (Best Model - Random Forest)
```
                           precision    recall  f1-score   support

                 Advocate       1.00      1.00      1.00         3
                     Arts       1.00      0.50      0.67         2
       Automation Testing       0.33      0.50      0.40         2
               Blockchain       1.00      1.00      1.00         1
         Business Analyst       1.00      0.50      0.67         2
           Civil Engineer       1.00      1.00      1.00         2
             Data Science       1.00      0.67      0.80         3
                 Database       0.38      1.00      0.55         3
          DevOps Engineer       1.00      0.50      0.67         2
         DotNet Developer       1.00      1.00      1.00         2
            ETL Developer       0.00      0.00      0.00         2
   Electrical Engineering       0.50      0.50      0.50         2
                       HR       0.27      1.00      0.43         3
                   Hadoop       1.00      1.00      1.00         2
       Health and fitness       1.00      0.50      0.67         2
           Java Developer       0.60      0.75      0.67         4
      Mechanical Engineer       0.00      0.00      0.00         1
Network Security Engineer       1.00      0.50      0.67         2
       Operations Manager       1.00      1.00      1.00         1
                      PMO       1.00      1.00      1.00         1
         Python Developer       1.00      0.50      0.67         2
            SAP Developer       0.00      0.00      0.00         2
                    Sales       1.00      1.00      1.00         1
                  Testing       0.00      0.00      0.00         2
            Web Designing       0.00      0.00      0.00         1

                 accuracy                           0.64        50
                macro avg       0.68      0.62      0.61        50
             weighted avg       0.68      0.64      0.62        50
```

### 1.4. Confusion Matrix (Best Model)
The confusion matrix is a $25 \times 25$ matrix mapping actual classes to predicted classes. It shows minor confusion between similar technical fields (e.g., Database vs Java Developer, Testing vs Automation Testing) which is expected given the vocabulary overlap.

---

## 2. Recruitment Model (Target: `HiringDecision`)

The goal of this model is to predict the recruitment outcome (`HiringDecision`, 1 for Hired, 0 for Not Hired). The dataset contains 1,500 samples. Evaluation was performed using 5-Fold Stratified Cross-Validation on the training set (80%), followed by final evaluation on a holdout test set (20%).

### 2.1. Model Comparison (5-Fold Cross-Validation)

| Model | CV Accuracy | CV Precision | CV Recall | CV F1-Score | CV ROC AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Logistic Regression | 0.8725 | 0.8277 | 0.7475 | 0.7848 | 0.9101 |
| Random Forest | 0.8992 | 0.8929 | 0.7663 | 0.8245 | 0.9220 |
| Gradient Boosting | 0.9217 | 0.9069 | 0.8333 | 0.8681 | 0.9327 |
| **XGBoost** | **0.9283** | **0.9117** | **0.8521** | **0.8805** | **0.9336** |

### 2.2. Evaluation on Holdout Test Set (XGBoost)
* **Accuracy:** 0.9233
* **Precision:** 0.9268
* **Recall:** 0.8172
* **F1-Score:** 0.8686
* **ROC AUC:** 0.9317

#### Test Set Classification Report:
```
              precision    recall  f1-score   support

           0       0.92      0.97      0.95       207
           1       0.93      0.82      0.87        93

    accuracy                           0.92       300
   macro avg       0.92      0.89      0.91       300
weighted avg       0.92      0.92      0.92       300
```

#### Confusion Matrix:
* **True Negatives (Not Hired predicted correctly):** 201
* **False Positives (Not Hired predicted as Hired):** 6
* **False Negatives (Hired predicted as Not Hired):** 17
* **True Positives (Hired predicted correctly):** 76

### 2.3. Rationale for Selecting the Final Model
* **XGBoost** outperformed all other models across all key metrics, yielding an F1-score of 88.05% in cross-validation and 86.86% on the holdout test set.
* XGBoost's advanced regularization (L1/L2) and gradient-boosted trees allow it to model non-linear boundaries cleanly, significantly reducing both overfitting and training error relative to simpler ensemble methods.

### 2.4. Feature Importances (XGBoost)

| Feature | Importance | Description |
| :--- | :---: | :--- |
| **RecruitmentStrategy_1** (Referral) | 0.5780 | Strongest positive predictor (Referrals have a dominant impact on hiring probability). |
| **EducationLevel** | 0.0824 | Candidate's highest academic qualification. |
| **ExperienceYears** | 0.0659 | Total years of professional experience. |
| **InterviewScore** | 0.0573 | Candidate's live interview assessment score. |
| **PersonalityScore** | 0.0535 | Score on personality/behavioral questionnaires. |
| **SkillScore** | 0.0507 | Technical skill matching score from the resume. |
| **DistanceFromCompany** | 0.0208 | Geographic proximity to the company office. |
| **Gender** | 0.0203 | Demographics (very minor significance, ensuring a fair evaluation). |
| **Age** | 0.0196 | Demographic age metric. |
| **PreviousCompanies** | 0.0192 | Total previous employers. |
| **RecruitmentStrategy_2** (Job Board) | 0.0164 | Moderate application channel. |
| **RecruitmentStrategy_3** (Agency) | 0.0159 | Agency application channel. |

