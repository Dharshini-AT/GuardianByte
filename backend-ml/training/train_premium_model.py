import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os

def train_premium_model():
    """Train and save premium calculation model"""
    
    # Load training data
    try:
        df = pd.read_csv('premium_training_data.csv')
    except FileNotFoundError:
        print("Training data not found. Run generate_training_data.py first.")
        return
    
    # Prepare features and target
    features = [
        'zone_encoded', 
        'vehicle_type_encoded', 
        'historical_claims', 
        'daily_earnings',
        'zone_risk_score',
        'vehicle_risk_score'
    ]
    
    X = df[features]
    y = df['weekly_premium']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Train Random Forest model
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print("Premium Model Performance:")
    print(f"MAE: {mae:.2f}")
    print(f"MSE: {mse:.2f}")
    print(f"R²: {r2:.3f}")
    
    # Feature importance
    feature_importance = dict(zip(features, model.feature_importances_))
    print("\nFeature Importance:")
    for feature, importance in sorted(feature_importance.items(), key=lambda x: x[1], reverse=True):
        print(f"{feature}: {importance:.3f}")
    
    # Save model
    os.makedirs('../models', exist_ok=True)
    joblib.dump(model, '../models/premium_model.pkl')
    print("\n✅ Premium model saved to models/premium_model.pkl")
    
    return model

def train_fraud_model():
    """Train and save fraud detection model"""
    
    # Load training data
    try:
        df = pd.read_csv('fraud_training_data.csv')
    except FileNotFoundError:
        print("Training data not found. Run generate_training_data.py first.")
        return
    
    # Prepare features and target
    features = [
        'location_match',
        'timing_match', 
        'frequency_check',
        'amount_check',
        'weather_match',
        'claim_hour',
        'monthly_claims',
        'claim_amount',
        'zone_encoded'
    ]
    
    X = df[features]
    y = df['is_fraud']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train Random Forest model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=8,
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    print("\nFraud Model Performance:")
    print(f"Accuracy: {accuracy:.3f}")
    print(f"Precision: {precision:.3f}")
    print(f"Recall: {recall:.3f}")
    print(f"F1 Score: {f1:.3f}")
    
    # Feature importance
    feature_importance = dict(zip(features, model.feature_importances_))
    print("\nFeature Importance:")
    for feature, importance in sorted(feature_importance.items(), key=lambda x: x[1], reverse=True):
        print(f"{feature}: {importance:.3f}")
    
    # Save model
    os.makedirs('../models', exist_ok=True)
    joblib.dump(model, '../models/fraud_model.pkl')
    print("\n✅ Fraud model saved to models/fraud_model.pkl")
    
    return model

if __name__ == '__main__':
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    
    print("🔄 Training premium calculation model...")
    premium_model = train_premium_model()
    
    print("\n🔄 Training fraud detection model...")
    fraud_model = train_fraud_model()
    
    print("\n✅ All models trained and saved successfully!")
