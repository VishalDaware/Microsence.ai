"""
Machine Learning Model for Soil Health Prediction
Trains on soil health dataset and provides predictions
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, accuracy_score, classification_report
import pickle
import json
import os
from datetime import datetime

# Load and preprocess data
def load_and_preprocess_data(csv_path):
    """Load CSV and preprocess for ML model"""
    df = pd.read_csv(csv_path)
    
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")
    
    # Create a copy for processing
    df_processed = df.copy()
    
    # Extract health score numeric value (e.g., "4.0 (Poor)" -> 4.0)
    df_processed['Microbial_Health_Score_Numeric'] = df_processed['Microbial_Health_Score'].str.extract(r'(\d+\.?\d*)')[0].astype(float)
    
    # Extract health category (e.g., "4.0 (Poor)" -> "Poor")
    df_processed['Microbial_Health_Category'] = df_processed['Microbial_Health_Score'].str.extract(r'\(([^)]+)\)')[0]
    
    # Drop unnecessary columns
    df_processed = df_processed.drop(['Time_Stamp', 'Field_Name', 'Microbial_Health_Score'], axis=1)
    
    # Features for regression (health score prediction)
    features = ['CO2_ppm', 'Nitrate_ppm', 'pH', 'Temp_C', 'Moisture_pct']
    
    X = df_processed[features]
    y_regression = df_processed['Microbial_Health_Score_Numeric']
    y_classification = df_processed['Microbial_Health_Category']
    
    print(f"\nFeatures: {features}")
    print(f"Target (Regression): Microbial_Health_Score_Numeric")
    print(f"Target (Classification): Microbial_Health_Category")
    print(f"Health Categories: {y_classification.unique()}")
    
    return X, y_regression, y_classification, features

def train_models(X, y_regression, y_classification, features):
    """Train both regression and classification models"""
    
    # Split data
    X_train, X_test, y_reg_train, y_reg_test, y_clf_train, y_clf_test = train_test_split(
        X, y_regression, y_classification, test_size=0.2, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("\n" + "="*60)
    print("TRAINING REGRESSION MODEL (Health Score Prediction)")
    print("="*60)
    
    # Train regression model (for health score prediction)
    regressor = RandomForestRegressor(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    regressor.fit(X_train_scaled, y_reg_train)
    
    # Evaluate regression
    y_reg_pred = regressor.predict(X_test_scaled)
    mse = mean_squared_error(y_reg_test, y_reg_pred)
    rmse = np.sqrt(mse)
    
    print(f"RMSE: {rmse:.4f}")
    print(f"Mean Absolute Error: {np.mean(np.abs(y_reg_test - y_reg_pred)):.4f}")
    
    # Feature importance
    feature_importance = dict(zip(features, regressor.feature_importances_))
    print(f"\nFeature Importance:")
    for feat, imp in sorted(feature_importance.items(), key=lambda x: x[1], reverse=True):
        print(f"  {feat}: {imp:.4f}")
    
    print("\n" + "="*60)
    print("TRAINING CLASSIFICATION MODEL (Health Category Prediction)")
    print("="*60)
    
    # Train classification model (for health category)
    classifier = RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1)
    classifier.fit(X_train_scaled, y_clf_train)
    
    # Evaluate classification
    y_clf_pred = classifier.predict(X_test_scaled)
    accuracy = accuracy_score(y_clf_test, y_clf_pred)
    
    print(f"Accuracy: {accuracy:.4f}")
    print(f"\nClassification Report:")
    print(classification_report(y_clf_test, y_clf_pred))
    
    return {
        'regressor': regressor,
        'classifier': classifier,
        'scaler': scaler,
        'features': features,
        'rmse': rmse,
        'accuracy': accuracy,
        'feature_importance': feature_importance
    }

def save_models(models, model_dir='ml_models'):
    """Save trained models to disk"""
    os.makedirs(model_dir, exist_ok=True)
    
    # Save models
    with open(os.path.join(model_dir, 'regressor.pkl'), 'wb') as f:
        pickle.dump(models['regressor'], f)
    
    with open(os.path.join(model_dir, 'classifier.pkl'), 'wb') as f:
        pickle.dump(models['classifier'], f)
    
    with open(os.path.join(model_dir, 'scaler.pkl'), 'wb') as f:
        pickle.dump(models['scaler'], f)
    
    # Save metadata
    metadata = {
        'features': models['features'],
        'rmse': float(models['rmse']),
        'accuracy': float(models['accuracy']),
        'feature_importance': {k: float(v) for k, v in models['feature_importance'].items()},
        'trained_at': datetime.now().isoformat(),
        'class_labels': ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent']
    }
    
    with open(os.path.join(model_dir, 'metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"\nModels saved to '{model_dir}' directory")

def predict_health(input_data, models):
    """
    Predict soil health given input sensor readings
    
    Args:
        input_data: dict with keys ['CO2_ppm', 'Nitrate_ppm', 'pH', 'Temp_C', 'Moisture_pct']
        models: dict with trained models
    
    Returns:
        dict with predictions and recommendations
    """
    features = models['features']
    scaler = models['scaler']
    regressor = models['regressor']
    classifier = models['classifier']
    
    # Prepare input
    X = np.array([[input_data[feat] for feat in features]])
    X_scaled = scaler.transform(X)
    
    # Get predictions
    health_score = float(regressor.predict(X_scaled)[0])
    health_category = classifier.predict(X_scaled)[0]
    probabilities = classifier.predict_proba(X_scaled)[0]
    
    # Map to standard output
    health_score = max(0, min(10, health_score))  # Clamp between 0-10
    
    return {
        'health_score': health_score,
        'health_category': health_category,
        'probabilities': {label: float(prob) for label, prob in zip(classifier.classes_, probabilities)}
    }

def main():
    """Main training pipeline"""
    csv_path = 'soil_health_20000.csv'
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found!")
        return
    
    print("Loading data...")
    X, y_regression, y_classification, features = load_and_preprocess_data(csv_path)
    
    print("\nTraining models...")
    models = train_models(X, y_regression, y_classification, features)
    
    print("\nSaving models...")
    save_models(models)
    
    print("\n" + "="*60)
    print("TRAINING COMPLETE")
    print("="*60)
    
    # Test prediction
    test_input = {
        'CO2_ppm': 700,
        'Nitrate_ppm': 15,
        'pH': 6.5,
        'Temp_C': 25,
        'Moisture_pct': 50
    }
    
    print("\nTest Prediction:")
    print(f"Input: {test_input}")
    result = predict_health(test_input, models)
    print(f"Predicted Health Score: {result['health_score']:.2f}")
    print(f"Predicted Category: {result['health_category']}")
    print(f"Category Probabilities: {result['probabilities']}")

if __name__ == '__main__':
    main()
