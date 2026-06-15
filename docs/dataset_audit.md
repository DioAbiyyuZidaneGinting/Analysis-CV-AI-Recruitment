# Dataset Audit Report: AI Recruitment Platform

This document presents a comprehensive audit of the datasets available in the AI Recruitment Platform project:
1. `UpdatedResumeDataSet.csv` (CV Analysis Model)
2. `recruitment_data.csv` (Recruitment Model)

---

## 1. CV Analysis Dataset: `UpdatedResumeDataSet.csv`

### 1.1. Summary Statistics
* **Jumlah Data (Total Rows):** 962 rows
* **Jumlah Kolom (Total Columns):** 2 (`Category`, `Resume`)
* **Missing Values:** None (0 missing values across all rows and columns)
* **Outliers:** N/A (Text dataset)

### 1.2. Jumlah Kelas & Distribusi Kelas
There are **25 distinct job categories** (classes) in the dataset. 

#### Raw Dataset Class Distribution:
| Category | Count | Percentage |
| :--- | :--- | :--- |
| Java Developer | 84 | 8.73% |
| Testing | 70 | 7.28% |
| DevOps Engineer | 55 | 5.72% |
| Python Developer | 48 | 4.99% |
| Web Designing | 45 | 4.68% |
| HR | 44 | 4.57% |
| Hadoop | 42 | 4.37% |
| Blockchain | 40 | 4.16% |
| Operations Manager | 40 | 4.16% |
| ETL Developer | 40 | 4.16% |
| Mechanical Engineer | 40 | 4.16% |
| Sales | 40 | 4.16% |
| Data Science | 40 | 4.16% |
| Arts | 36 | 3.74% |
| Database | 33 | 3.43% |
| PMO | 30 | 3.12% |
| Health and fitness | 30 | 3.12% |
| Electrical Engineering | 30 | 3.12% |
| DotNet Developer | 28 | 2.91% |
| Business Analyst | 28 | 2.91% |
| Automation Testing | 26 | 2.70% |
| Network Security Engineer | 25 | 2.60% |
| SAP Developer | 24 | 2.49% |
| Civil Engineer | 24 | 2.49% |
| Advocate | 20 | 2.08% |
| **Total** | **962** | **100%** |

### 1.3. Kualitas Dataset & Potensi Data Leakage
> [!WARNING]
> **CRITICAL QUALITY ISSUE: High Rate of Duplication**
> Out of 962 rows in `UpdatedResumeDataSet.csv`, there are **796 exact duplicate rows**. There are only **166 unique resumes** in this dataset.

This leads to several critical insights:
1. **Deduplicated Distribution:** The actual sample size for training is extremely small. The most common category (Java Developer) has only 13 unique samples, and some classes like `PMO` have as few as 3 unique samples.
2. **Potensi Data Leakage (High Risk):** If a standard random train/test split is applied directly to the raw 962-row dataset, identical resumes will appear in both the training set and the testing/validation set. This leads to **data leakage**, resulting in an artificially inflated validation accuracy (near 100%) that fails to generalize to any new, unseen resume.
3. **Action Plan:** To build a robust model, we must **deduplicate the dataset** before split/training, or ensure that the split is done in a stratified, group-aware manner where no duplicate resume crosses the train-test boundary. Given the small number of unique resumes, we must use techniques like Stratified K-Fold and cross-validation, and keep in mind that testing on a clean, deduplicated holdout set is the only way to get a realistic evaluation of the classifier.

### 1.4. Feature Engineering yang Diperlukan
To prepare this text dataset for training:
1. **Text Cleaning:** 
   - Remove URLs (e.g., HTTP links, websites).
   - Remove emails and contact details.
   - Remove special characters, punctuation, RTF tags, and numbers.
   - Convert all text to lowercase and remove redundant whitespaces.
2. **Stopword Removal:** Remove common English stopwords (e.g., "and", "the", "is") which do not add semantic value for classification.
3. **Lemmatization:** Reduce words to their base or dictionary form (e.g., "developed", "developing", "develops" $\rightarrow$ "develop") to consolidate vocabulary.
4. **TF-IDF Vectorization:** Convert the cleaned and lemmatized text into numerical vectors using Term Frequency-Inverse Document Frequency (TF-IDF). A max vocabulary size (e.g., 5000 features) should be set to prevent overfitting on rare words.

---

## 2. Recruitment Dataset: `recruitment_data.csv`

### 2.1. Summary Statistics
* **Jumlah Data (Total Rows):** 1500 rows
* **Jumlah Kolom (Total Columns):** 11 columns
* **Missing Values:** None (0 missing values across all rows and columns)

### 2.2. Kolom, Data Types, & Deskripsi Statistik
All columns are numerical (either `int64` or `float64`):

| Kolom | Tipe Data | Min | Max | Mean | Std Dev | Deskripsi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Age** | `int64` | 20 | 50 | 35.15 | 9.25 | Umur pelamar (uniform distribution) |
| **Gender** | `int64` | 0 | 1 | 0.49 | 0.50 | Jenis kelamin (0: Female, 1: Male) |
| **EducationLevel** | `int64` | 1 | 4 | 2.19 | 0.86 | Tingkat pendidikan (1: High School, 2: Bachelor, 3: Master, 4: PhD) |
| **ExperienceYears** | `int64` | 0 | 15 | 7.69 | 4.64 | Pengalaman kerja dalam tahun |
| **PreviousCompanies** | `int64` | 1 | 5 | 3.00 | 1.41 | Jumlah perusahaan sebelumnya |
| **DistanceFromCompany**| `float64`| 1.03 | 50.99 | 25.51 | 14.57 | Jarak ke kantor (dalam km/mil) |
| **InterviewScore** | `int64` | 0 | 100 | 50.56 | 28.63 | Nilai hasil interview pelamar |
| **SkillScore** | `int64` | 0 | 100 | 51.12 | 29.35 | Nilai technical skill pelamar |
| **PersonalityScore** | `int64` | 0 | 100 | 49.39 | 29.35 | Nilai personality test pelamar |
| **RecruitmentStrategy**| `int64` | 1 | 3 | 1.89 | 0.69 | Strategi rekrutmen (1: Referral, 2: Job Board, 3: Agency) |
| **HiringDecision** | `int64` | 0 | 1 | 0.31 | 0.46 | **Target variable** (0: Not Hired, 1: Hired) |

### 2.3. Distribusi Kelas Target (`HiringDecision`)
The target label `HiringDecision` is moderately imbalanced:
* **0 (Not Hired):** 1,035 samples (69.0%)
* **1 (Hired):** 465 samples (31.0%)

*Note: Since there is class imbalance, metric selection should focus on F1-Score and ROC AUC rather than pure Accuracy.*

### 2.4. Outlier Analysis
Based on the min, max, and standard deviation analysis:
* All features conform to strict logical constraints. For example, age ranges from 20 to 50, score metrics are strictly bound between 0 and 100, and previous companies are between 1 and 5.
* Standard deviation values are reasonable and there are no extreme anomaly spikes.
* **Conclusion:** There are no outlier data points that require removal.

### 2.5. Kualitas Dataset & Potensi Data Leakage
* **Kualitas Dataset:** High. The dataset is fully complete (no missing values) and clean, with no duplicate records.
* **Potensi Data Leakage (Low Risk):** There are no candidate identifiers (like name or email) that could cause leakage. However, we must ensure feature scaling parameters (like standard scaler fit mean/std) are calculated strictly on the training fold and applied to the test fold during evaluation to prevent scale leakage.

### 2.6. Feature Engineering yang Diperlukan
1. **Feature Encoding (Optional but Recommended):** 
   - `RecruitmentStrategy` is a nominal categorical variable coded as 1, 2, 3. Treating it as a continuous number might confuse linear models. One-hot encoding it is recommended for models like Logistic Regression. Tree-based models (Random Forest, XGBoost) can handle integer encodings, but one-hot encoding ensures model independence.
   - `EducationLevel` is ordinal (1 < 2 < 3 < 4), so it can remain as integer encoding.
2. **Feature Scaling:**
   - Numerical columns such as `Age`, `DistanceFromCompany`, `InterviewScore`, `SkillScore`, and `PersonalityScore` have widely different scales. 
   - Feature scaling (using `StandardScaler` or `MinMaxScaler`) is **mandatory** for distance-based or linear models (Logistic Regression, SVM) to ensure all features contribute proportionally. It is not strictly necessary for tree-based models (Random Forest, Gradient Boosting, XGBoost), but we will apply it consistently where needed.
