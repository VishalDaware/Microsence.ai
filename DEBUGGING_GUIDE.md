# Recommendation System Debugging Guide

## What Was Added

I've added enhanced logging at every step of the recommendation pipeline:

1. **Backend `/predict` endpoint** - Detailed logs showing:
   - Request parameters received
   - Database query results
   - ML service request payload
   - ML service response structure
   - Final response sent to frontend

2. **ML Service (`/api/ml/health`)** - Detailed logs showing:
   - Input validation
   - Model predictions at each step
   - Recommendation generation
   - Final response format

3. **Dashboard Component** - Detailed logs showing:
   - State changes when recommendations are set
   - What props are passed to RecommendationCard
   - Which source (ML vs fallback) is being used

4. **RecommendationCard Component** - Detailed logs showing:
   - What props were received
   - Whether recommendations array is valid
   - What gets rendered

5. **New diagnostic endpoint** - `/api/readings/test` for testing

## Testing Steps

### Option 1: Test with Diagnostic Endpoint (Recommended)

1. Make sure both backend and ML service are running:
   ```bash
   # Terminal 1: Backend (port 5000)
   cd backend
   npm run dev
   
   # Terminal 2: ML Service (port 5001)
   cd ml_service
   python app.py
   
   # Terminal 3: Frontend (port 5173)
   cd dashboard
   npm run dev
   ```

2. First, generate some sensor data:
   - Login to the dashboard
   - Click "Generate Data" or use the Test Recommendations button
   - Note your userId (see browser console: `localStorage userId`)

3. Test the diagnostic endpoint in your browser:
   ```
   http://localhost:5000/api/readings/test?userId=1&fieldId=1
   ```
   (Replace userId and fieldId with your actual values)

   This will show you:
   - ✓ User found
   - ✓ Latest reading found
   - ✓ ML service response
   - ✓ Recommendations array and count

4. Open the browser console (F12) and look at the output

---

### Option 2: Full Test Flow (Detailed Debugging)

1. Start all services as shown above

2. Open browser DevTools: Press **F12** → **Console** tab

3. Login and click **Generate Data**

4. Watch the console for logs in this order:

   **From Dashboard.jsx:**
   ```
   📡 Fetching recommendations from: http://localhost:5000/api/readings/predict?userId=1&fieldId=1
   📥 Response status: 200
   ✓ Raw predict response: {success: true, recommendations: [...]}
   ✓ Setting recommendations (count: 6)
     [0]: ✓ Soil moisture optimal
     [1]: ✓ Temperature in optimal range
     ...
   ```

   **From RecommendationCard.jsx:**
   ```
   📋 RecommendationCard rendered with props:
   ✨ RENDERING 6 ML RECOMMENDATIONS
     [0] ✓ Soil moisture optimal
     [1] ✓ Temperature in optimal range
     ...
   ```

5. Click **"Test Recommendations"** button without generating new data

6. Check terminal/console output for:
   - Backend predict endpoint logs
   - ML service logs
   - Frontend component logs

---

## Checking Backend Logs

### Terminal where backend is running (port 5000):

You should see logs like:
```
========== PREDICT ENDPOINT CALLED ==========
📥 Query params: { userId: '1', fieldId: '1' }
✓ Parsed userId: 1
🔍 Filtering by fieldId: 1
📖 Latest reading found: { id: 123, soilMoisture: 45.2, ... }
🔗 ML Service URL: http://localhost:5001
📤 Sending to ML service: { CO2_ppm: 450, ... }
📥 ML Service response status: 200
✓ ML Response parsed successfully
✨ ML Predictions: { healthScore: 7.5, ... }
📋 Recommendations array: ["✓ Soil moisture optimal", ...]
✅ Sending response: { success: true, hasRecommendations: true, recommendationCount: 6 }
========== PREDICT ENDPOINT COMPLETE ==========
```

### Terminal where ML service is running (port 5001):

You should see logs like:
```
========== ML HEALTH PREDICTION CALLED ==========
📥 Received input data: { CO2_ppm: 450, Nitrate_ppm: 18, ... }
✓ All required fields present
🔮 Making predictions...
  - Health score: 7.5
  - Health category: Good
✓ Generated 6 recommendations:
  1. ✓ Soil moisture optimal
  2. ✓ Temperature in optimal range
  3. ✓ CO₂ levels optimal
  4. ✓ Nitrate levels optimal
  5. ✓ pH in optimal range
  6. 🌟 Soil health is excellent - Maintain current practices
✨ Final response structure:
  - success: true
  - health_score: 7.5
  - health_category: Good
  - recommendations count: 6
========== ML HEALTH PREDICTION COMPLETE ==========
```

---

## What to Look For

### Good Signs (✓)
- Backend predict endpoint is being called (see "PREDICT ENDPOINT CALLED" log)
- ML service receives request (see "ML HEALTH PREDICTION CALLED" log)
- Recommendations array has items (count > 0)
- RecommendationCard receives ml recommendations (not fallback)
- Pie chart updates with sensor values

### Problem Signs (❌)
- "PREDICT ENDPOINT CALLED" doesn't appear → Request not reaching backend
- ML service logs absent → Backend not calling ML service
- "recommendations: undefined" in logs → Response missing recommendations property
- RecommendationCard shows fallback text → Recommendations array empty or invalid

---

## If Something Goes Wrong

### Network Error?
- Check that backend is running on `http://localhost:5000`
- Check that ML service is running on `http://localhost:5001`
- Look for network errors in browser console

### No Recommendations Data?
1. First, check /test endpoint to isolate the issue:
   ```
   http://localhost:5000/api/readings/test?userId=1&fieldId=1
   ```

2. If /test shows recommendations but dashboard doesn't:
   - Issue is in frontend state/rendering
   - Check browser console for React errors

3. If /test shows no recommendations:
   - Issue is in backend/ML service
   - Check terminal logs from both services

### Database Issue?
- Make sure you've generated sensor data with "Generate Data" button
- The /predict endpoint needs a previous sensor reading to work
- Check the /test endpoint output for "No readings found for this user/field"

---

## Testing Manually with curl

You can also test the endpoints manually:

```bash
# Generate test reading (requires valid userId and farmId)
curl -X POST http://localhost:5000/api/readings/generate \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "farmId": 1}'

# Test diagnostic endpoint
curl "http://localhost:5000/api/readings/test?userId=1&fieldId=1"

# Call predict endpoint directly
curl "http://localhost:5000/api/readings/predict?userId=1&fieldId=1"

# Test ML service directly
curl -X POST http://localhost:5001/api/ml/health \
  -H "Content-Type: application/json" \
  -d '{"CO2_ppm": 450, "Nitrate_ppm": 18, "pH": 6.5, "Temp_C": 24, "Moisture_pct": 55}'
```

---

## Summary

The system should now have detailed visibility at every step. If recommendations are still showing as fallback text instead of ML-generated:

1. Run the /test endpoint first
2. Check its output for what recommendations are being generated
3. Check browser console for what the frontend is receiving
4. Compare the log output from backend and frontend

This will pinpoint exactly where the chain breaks!
