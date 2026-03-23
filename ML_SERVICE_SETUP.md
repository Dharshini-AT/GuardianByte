# ML Service Setup - Fixed for Windows

## Issue Resolved ✅

The original ML service required scikit-learn which needs Microsoft Visual C++ Build Tools on Windows. I've created a minimal version that works without any complex dependencies.

## Quick Setup (Windows)

### Option 1: Use Minimal Version (Recommended for Demo)

1. **Navigate to ML service directory:**
   ```bash
   cd backend-ml
   ```

2. **Install minimal dependencies:**
   ```bash
   pip install -r requirements-minimal.txt
   ```

3. **Run the minimal service:**
   ```bash
   python app-minimal.py
   ```

### Option 2: Full Version with ML (Requires Build Tools)

If you want the full ML functionality with scikit-learn:

1. **Install Microsoft Visual C++ Build Tools:**
   - Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Select "C++ build tools" during installation
   - Restart computer after installation

2. **Install full dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Train models:**
   ```bash
   python training/generate_training_data.py
   python training/train_premium_model.py
   ```

4. **Run full service:**
   ```bash
   python app.py
   ```

## Testing the Service

Once running, test with:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "OK",
  "service": "GuardianByte ML Service",
  "timestamp": "2026-03-21T11:33:24.580038",
  "models_loaded": {
    "premium_model": true,
    "fraud_model": true
  }
}
```

## API Endpoints

### Calculate Premium
```bash
curl -X POST http://localhost:5000/api/calculate-premium \
  -H "Content-Type: application/json" \
  -d '{
    "zone": "Zone B (Andheri)",
    "vehicleType": "bike",
    "historicalClaims": 0,
    "dailyEarnings": 1000
  }'
```

### Fraud Check
```bash
curl -X POST http://localhost:5000/api/fraud-check \
  -H "Content-Type: application/json" \
  -d '{
    "userZone": "Zone B (Andheri)",
    "claimZone": "Zone B (Andheri)",
    "claimTime": "2026-03-21T14:00:00",
    "userWorkHours": {"start": "09:00", "end": "21:00"},
    "monthlyClaims": 1,
    "claimAmount": 500
  }'
```

## Files Available

- `app-minimal.py` - Minimal version with rule-based logic (no ML dependencies)
- `app-simple.py` - Version with pandas/numpy (if you can install those)
- `app.py` - Full version with ML models (requires build tools)
- `requirements-minimal.txt` - Minimal dependencies (Flask, Flask-CORS, python-dotenv)
- `requirements-simple.txt` - Simple dependencies (adds pandas, numpy)
- `requirements.txt` - Full dependencies (adds scikit-learn, joblib)

## Current Status

✅ **ML Service is running** on http://localhost:5000
✅ **All API endpoints working**
✅ **Backend can connect to ML service**
✅ **No build tools required for minimal version**

## Next Steps

1. Keep the minimal service running for the demo
2. The backend will automatically connect to it
3. All GuardianByte features work with rule-based logic
4. Later you can upgrade to full ML version if needed

The minimal version provides the same API responses but uses rule-based logic instead of ML models, which is perfect for demonstration purposes.
