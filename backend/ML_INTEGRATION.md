# ML Model Integration - Soil Health Prediction System

This document describes the machine learning integration for the Soil Health Monitoring project.

## Overview

The system uses a **Random Forest ML model** trained on 20,000 soil health readings to predict:
- **Soil Health Score** (0-10 scale)
- **Health Category** (Very Poor, Poor, Fair, Good, Excellent)
- **Category Probabilities** (confidence for each category)
- **Actionable Recommendations** (based on sensor readings)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│        - Dashboard with ML predictions                      │
│        - Real-time health status                            │
│        - AI-powered recommendations                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│          Node.js Backend (Express + Prisma)                 │
│        - REST API endpoints                                 │
│        - Database management                                │
│        - ML service integration                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│      Python ML Service (Flask + scikit-learn)               │
│        - Model inference                                    │
│        - Predictions & recommendations                      │
│        - Model performance metrics                          │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Dataset: `backend/soil_health_20000.csv`

### Step 1: Install Node.js Dependencies

```bash
cd backend
npm install
```

### Step 2: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 3: Setup and Train ML Model

```bash
cd backend
node setup-ml.js
```

This script will:
1. ✅ Verify the dataset exists
2. ✅ Install Python packages
3. ✅ Train the ML models (takes 2-3 minutes)
4. ✅ Create model files in `backend/ml_models/`
5. ✅ Setup environment variables
6. ✅ Create startup scripts

### Step 4: Start the Services

**Terminal 1 - Node.js Backend:**
```bash
cd backend
npm start
# Or: node index.js
```

**Terminal 2 - Python ML Service:**
```bash
cd backend
python ml_service.py
```

**Terminal 3 - Frontend:**
```bash
cd dashboard
npm run dev
```

The system will be available at:
- **Frontend**: http://localhost:5173 (or your Vite port)
- **Node.js API**: http://localhost:5000
- **ML Service**: http://localhost:5001

## API Endpoints

### Node.js Backend (`/api/readings`)

#### Generate New Reading
```
POST /api/readings/generate
Response: { success: true, reading: {...} }
```

#### Get Latest Reading
```
GET /api/readings/latest
Response: { success: true, readings: {...} }
```

#### Get All Readings (Paginated)
```
GET /api/readings/all?limit=100&skip=0
Response: { success: true, readings: [...], total: X, count: X }
```

#### Get ML Predictions
```
POST /api/readings/predict
Response: {
  success: true,
  reading: {...},
  predictions: {
    health_score: 7.45,
    health_category: "Good",
    probabilities: {...}
  },
  recommendations: [...]
}
```

#### Check ML Model Status
```
GET /api/readings/ml-status
Response: {
  success: true,
  status: "loaded",
  metadata: {
    rmse: 0.95,
    accuracy: 0.92,
    features: [...],
    trained_at: "2025-02-05T10:30:00",
    feature_importance: {...}
  }
}
```

### Python ML Service (`/api/ml`)

#### Predict Health
```
POST /api/ml/health
Body: {
  "CO2_ppm": 700,
  "Nitrate_ppm": 15,
  "pH": 6.5,
  "Temp_C": 25,
  "Moisture_pct": 50
}

Response: {
  success: true,
  predictions: {
    health_score: 7.45,
    health_category: "Good",
    probabilities: {
      "Very Poor": 0.01,
      "Poor": 0.05,
      "Fair": 0.10,
      "Good": 0.50,
      "Excellent": 0.34
    }
  },
  recommendations: [...]
}
```

#### Get Model Status
```
GET /api/ml/status
Response: {
  status: "loaded",
  metadata: {
    rmse: 0.95,
    accuracy: 0.92,
    features: [...],
    trained_at: "...",
    feature_importance: {...}
  }
}
```

#### Get Health Info
```
GET /api/ml/health-info
Response: {
  categories: {
    "Excellent": { score_range: [8, 10], ... },
    "Good": { score_range: [6, 8], ... },
    ...
  }
}
```

## Model Details

### Features Used
- **CO₂ Level** (ppm) - Carbon dioxide concentration in soil
- **Nitrate** (ppm) - Nitrogen nutrient availability
- **pH** - Soil acidity/alkalinity
- **Temperature** (°C) - Soil temperature
- **Soil Moisture** (%) - Water content percentage

### Model Performance
- **Regression Model**: RMSE ≈ 0.95 (health score prediction)
- **Classification Model**: Accuracy ≈ 92% (health category prediction)

### Health Categories
| Category | Score Range | Status | Recommended Action |
|----------|------------|--------|-------------------|
| Excellent | 8-10 | 🟢 Optimal | Maintain current practices |
| Good | 6-8 | 🟢 Healthy | Monitor regularly |
| Fair | 4-6 | 🟡 Acceptable | Monitor and adjust conditions |
| Poor | 2-4 | 🟠 Degraded | Implement interventions |
| Very Poor | 0-2 | 🔴 Critical | Immediate action required |

## Frontend Integration

The dashboard now displays:

1. **AI Soil Health Analysis Card**
   - Current Health Score (0-10)
   - Health Status (Category)
   - Confidence Level (%)

2. **ML-Powered Recommendations**
   - Moisture management advice
   - Temperature optimization
   - CO₂ level adjustments
   - Nitrate supplementation
   - pH corrections
   - Overall health recommendations

3. **Real-Time Updates**
   - Auto-refresh predictions when new data is generated
   - Status indicator for ML model availability

## Project Structure

```
backend/
├── ml_model.py              # Model training script
├── ml_service.py            # Flask ML service
├── setup-ml.js              # Setup automation script
├── requirements.txt         # Python dependencies
├── ml_models/              # Trained models directory
│   ├── regressor.pkl       # Regression model
│   ├── classifier.pkl      # Classification model
│   ├── scaler.pkl          # Feature scaler
│   └── metadata.json       # Model metadata
├── src/
│   └── routes/
│       └── readings.js      # Updated with ML endpoints
└── soil_health_20000.csv   # Training dataset

dashboard/
└── src/
    └── pages/
        └── Dashboard.jsx    # Updated with ML predictions
```

## Troubleshooting

### ML Models Not Loading
```
Error: "Models not loaded"
```
**Solution**: Make sure you've run `node setup-ml.js` and the models are trained.

### Port Already in Use
```
Error: Port 5000/5001 already in use
```
**Solution**: Change ports in the environment or kill the process:
```bash
# On Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Python Module Not Found
```
ModuleNotFoundError: No module named 'sklearn'
```
**Solution**: Reinstall requirements:
```bash
pip install --upgrade -r requirements.txt
```

### Predictions Always Return Error
```
Check if Python ML service is running:
curl http://localhost:5001/api/ml/status
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
ML_SERVICE_URL=http://localhost:5001
NODE_ENV=development
DATABASE_URL=file:./dev.db
```

## Performance Optimization

For production deployment:

1. **Model Quantization**: Convert models to smaller formats
2. **Caching**: Cache predictions for identical inputs
3. **Batch Processing**: Process multiple predictions together
4. **Load Balancing**: Use multiple ML service instances
5. **Database Indexing**: Add indexes on frequently queried columns

## Future Enhancements

- [ ] Real-time model retraining with new data
- [ ] Feature importance visualization
- [ ] Confidence-based alert system
- [ ] Predictive analytics (forecast health trends)
- [ ] Custom model parameters per field
- [ ] Model explainability (SHAP values)
- [ ] A/B testing for model versions

## Support & Debugging

Enable debug logging:
```bash
# For Node.js
DEBUG=* npm start

# For Python
FLASK_DEBUG=1 python ml_service.py
```

Check model files:
```bash
python -c "import pickle; m = pickle.load(open('backend/ml_models/regressor.pkl', 'rb')); print(f'Model type: {type(m)}, Features: {m.n_features_in_}')"
```

Test ML service directly:
```bash
curl -X POST http://localhost:5001/api/ml/health \
  -H "Content-Type: application/json" \
  -d '{
    "CO2_ppm": 700,
    "Nitrate_ppm": 15,
    "pH": 6.5,
    "Temp_C": 25,
    "Moisture_pct": 50
  }'
```

---

**Last Updated**: February 5, 2026
**Version**: 1.0.0
