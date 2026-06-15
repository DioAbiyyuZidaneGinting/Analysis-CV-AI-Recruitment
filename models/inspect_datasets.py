import sys
import pandas as pd
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

def audit_dataset(filepath, name):
    print("=" * 60)
    print(f"AUDITING DATASET: {name} ({filepath})")
    print("=" * 60)
    
    try:
        df = pd.read_csv(filepath)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return
        
    print(f"1. Shape: {df.shape}")
    print(f"2. Columns and Data Types:\n{df.dtypes}\n")
    
    print("3. First 5 rows:")
    # Using repr or cleaning strings to avoid terminal display errors
    for i, row in df.head().iterrows():
        print(f"Row {i}:")
        for col in df.columns:
            val = str(row[col])
            # truncate for readability
            if len(val) > 100:
                val = val[:100] + "..."
            print(f"  {col}: {val}")
    print()
    
    print("4. Missing Values:")
    missing = df.isnull().sum()
    print(missing[missing > 0] if missing.sum() > 0 else "No missing values")
    print()
    
    print("5. Class Distributions for Categorical Columns:")
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    for col in categorical_cols:
        unique_vals = df[col].unique()
        if len(unique_vals) < 30:
            print(f"\nDistribution of '{col}':")
            print(df[col].value_counts())
            print(f"Percentage:\n{df[col].value_counts(normalize=True) * 100}")
        else:
            print(f"\n'{col}' has too many unique values ({len(unique_vals)}). First 5 unique values: {list(unique_vals[:5])}")
            
    if 'Category' in df.columns:
        print(f"\nDistribution of target 'Category':")
        vc = df['Category'].value_counts()
        print(vc)
        print(f"Number of classes: {len(vc)}")
    if 'HiringDecision' in df.columns:
        print(f"\nDistribution of target 'HiringDecision':")
        vc = df['HiringDecision'].value_counts()
        print(vc)
        print(f"Number of classes: {len(vc)}")
        
    print("\n6. Numerical Columns Description (Outliers and Ranges):")
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    if len(numerical_cols) > 0:
        print(df[numerical_cols].describe())
    else:
        print("No numerical columns")
    print("\n" + "=" * 60 + "\n")

audit_dataset("UpdatedResumeDataSet.csv", "UpdatedResumeDataSet")
audit_dataset("recruitment_data.csv", "recruitment_data")
