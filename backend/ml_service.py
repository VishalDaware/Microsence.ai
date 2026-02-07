"""
Flask service for ML model predictions
Provides endpoints for soil health predictions and recommendations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import json
import os
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Global model storage
models = None

def load_models():
    """Load pre-trained models"""
    global models
    
    model_dir = 'ml_models'
    
    try:
        with open(os.path.join(model_dir, 'regressor.pkl'), 'rb') as f:
            regressor = pickle.load(f)
        
        with open(os.path.join(model_dir, 'classifier.pkl'), 'rb') as f:
            classifier = pickle.load(f)
        
        with open(os.path.join(model_dir, 'scaler.pkl'), 'rb') as f:
            scaler = pickle.load(f)
        
        with open(os.path.join(model_dir, 'metadata.json'), 'r') as f:
            metadata = json.load(f)
        
        models = {
            'regressor': regressor,
            'classifier': classifier,
            'scaler': scaler,
            'metadata': metadata,
            'features': metadata['features']
        }
        
        print(f"✓ Models loaded successfully")
        return True
    except Exception as e:
        print(f"✗ Error loading models: {e}")
        return False

def generate_recommendations(input_data, health_score, health_category):
    """Generate recommendations based on sensor readings and health status"""
    recommendations = []
    
    # Moisture recommendations
    moisture = input_data.get('Moisture_pct', 0)
    if moisture < 40:
        recommendations.append("⚠️ Low soil moisture - Increase irrigation to 40-65%")
    elif moisture > 70:
        recommendations.append("⚠️ High soil moisture - Reduce watering to prevent root rot")
    else:
        recommendations.append("✓ Soil moisture optimal")
    
    # Temperature recommendations
    temp = input_data.get('Temp_C', 0)
    if temp < 15:
        recommendations.append("❄️ Temperature too low - Provide additional heating/protection")
    elif temp > 30:
        recommendations.append("🌡️ Temperature too high - Improve ventilation and shade")
    else:
        recommendations.append("✓ Temperature in optimal range")
    
    # CO2 recommendations
    co2 = input_data.get('CO2_ppm', 0)
    if co2 < 300:
        recommendations.append("↓ CO₂ level low - Improve air circulation")
    elif co2 > 800:
        recommendations.append("↑ CO₂ level high - Increase ventilation")
    else:
        recommendations.append("✓ CO₂ levels optimal")
    
    # Nitrate recommendations
    nitrate = input_data.get('Nitrate_ppm', 0)
    if nitrate < 10:
        recommendations.append("🌱 Low nitrate - Apply nitrogen-rich fertilizer")
    elif nitrate > 30:
        recommendations.append("🌱 High nitrate - Reduce fertilization to prevent salt stress")
    else:
        recommendations.append("✓ Nitrate levels optimal")
    
    # pH recommendations
    ph = input_data.get('pH', 0)
    if ph < 6.0:
        recommendations.append("📊 pH too low - Add lime to increase pH")
    elif ph > 7.5:
        recommendations.append("📊 pH too high - Add sulfur to decrease pH")
    else:
        recommendations.append("✓ pH in optimal range")
    
    # Overall health recommendation
    if health_category == 'Excellent' or health_category == 'Good':
        recommendations.append("🌟 Soil health is excellent - Maintain current practices")
    elif health_category == 'Fair':
        recommendations.append("⚠️ Soil health is fair - Monitor and adjust conditions")
    else:
        recommendations.append("🔴 Soil health is poor - Immediate intervention required")
    
    return recommendations

@app.route('/api/ml/health', methods=['POST'])
def predict_health():
    """
    Predict soil health given sensor readings
    
    Request body:
    {
        "CO2_ppm": float,
        "Nitrate_ppm": float,
        "pH": float,
        "Temp_C": float,
        "Moisture_pct": float
    }
    """
    if models is None:
        return jsonify({'error': 'Models not loaded'}), 500
    
    try:
        data = request.json
        
        # Validate input
        required_fields = models['features']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Prepare input
        X = np.array([[data[feat] for feat in required_fields]])
        X_scaled = models['scaler'].transform(X)
        
        # Get predictions
        health_score = float(models['regressor'].predict(X_scaled)[0])
        health_category = models['classifier'].predict(X_scaled)[0]
        probabilities = models['classifier'].predict_proba(X_scaled)[0]
        
        # Clamp health score between 0-10
        health_score = max(0, min(10, health_score))
        
        # Generate recommendations
        recommendations = generate_recommendations(data, health_score, health_category)
        
        return jsonify({
            'success': True,
            'predictions': {
                'health_score': round(health_score, 2),
                'health_category': health_category,
                'probabilities': {
                    label: round(float(prob), 3) 
                    for label, prob in zip(models['classifier'].classes_, probabilities)
                }
            },
            'recommendations': recommendations,
            'input_data': data,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/ml/status', methods=['GET'])
def model_status():
    """Get model information and status"""
    if models is None:
        return jsonify({'status': 'not_loaded'}), 500
    
    return jsonify({
        'status': 'loaded',
        'metadata': {
            'rmse': models['metadata']['rmse'],
            'accuracy': models['metadata']['accuracy'],
            'features': models['metadata']['features'],
            'trained_at': models['metadata']['trained_at'],
            'feature_importance': models['metadata']['feature_importance']
        }
    })

@app.route('/api/ml/health', methods=['GET'])
def batch_predict():
    """
    Batch predict health for multiple readings
    Query params: readings as JSON array
    """
    if models is None:
        return jsonify({'error': 'Models not loaded'}), 500
    
    try:
        readings = request.args.get('readings')
        if not readings:
            return jsonify({'error': 'Missing readings parameter'}), 400
        
        readings = json.loads(readings)
        results = []
        
        for reading in readings:
            X = np.array([[reading[feat] for feat in models['features']]])
            X_scaled = models['scaler'].transform(X)
            
            health_score = float(models['regressor'].predict(X_scaled)[0])
            health_score = max(0, min(10, health_score))
            health_category = models['classifier'].predict(X_scaled)[0]
            
            results.append({
                'input': reading,
                'health_score': round(health_score, 2),
                'health_category': health_category
            })
        
        return jsonify({'success': True, 'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/ml/health-info', methods=['GET'])
def health_info():
    """Get health categories and their descriptions"""
    categories = {
        'Very Poor': {
            'score_range': [0, 2],
            'description': 'Soil is severely degraded',
            'color': '#dc2626',
            'emoji': '🔴'
        },
        'Poor': {
            'score_range': [2, 4],
            'description': 'Soil has significant issues',
            'color': '#f97316',
            'emoji': '🟠'
        },
        'Fair': {
            'score_range': [4, 6],
            'description': 'Soil is acceptable but needs improvement',
            'color': '#eab308',
            'emoji': '🟡'
        },
        'Good': {
            'score_range': [6, 8],
            'description': 'Soil is healthy',
            'color': '#84cc16',
            'emoji': '🟢'
        },
        'Excellent': {
            'score_range': [8, 10],
            'description': 'Soil is in excellent condition',
            'color': '#16a34a',
            'emoji': '🟢'
        }
    }
    
    return jsonify({'categories': categories})

if __name__ == '__main__':
    print("Loading ML models...")
    if load_models():
        print("Starting Flask server...")
        app.run(debug=False, port=5001, host='0.0.0.0')
    else:
        print("Failed to load models. Make sure to run ml_model.py first.")
