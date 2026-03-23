from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/api/calculate-premium', methods=['POST'])
def calculate_premium():
    try:
        data = request.get_json()
        
        zone = data.get('zone')
        vehicle_type = data.get('vehicleType')
        historical_claims = data.get('historicalClaims', 0)
        daily_earnings = data.get('dailyEarnings', 1000)
        
        # Rule-based premium calculation
        zone_multipliers = {
            'Zone A (Bandra)': 1.3,
            'Zone B (Andheri)': 1.0,
            'Zone C (Navi Mumbai)': 0.7
        }
        
        vehicle_multipliers = {
            'bike': 1.1,
            'scooter': 1.0
        }
        
        base_premium = 150
        zone_mult = zone_multipliers.get(zone, 1.0)
        vehicle_mult = vehicle_multipliers.get(vehicle_type, 1.0)
        claims_penalty = min(historical_claims * 10, 50)
        
        weekly_premium = round(base_premium * zone_mult * vehicle_mult + claims_penalty)
        
        # Calculate coverage amounts
        daily_coverage = min(daily_earnings, 800)
        weekly_coverage = daily_coverage * 5
        
        explanation = f"Base premium: ₹{base_premium} + Zone risk: {zone_mult}x + Vehicle risk: {vehicle_mult}x + Claims penalty: ₹{claims_penalty}"
        
        return jsonify({
            'success': True,
            'data': {
                'weeklyPremium': weekly_premium,
                'dailyCoverage': daily_coverage,
                'weeklyCoverage': weekly_coverage,
                'riskAssessment': {
                    'zoneRisk': 'high' if zone_mult > 1.2 else 'medium' if zone_mult > 0.9 else 'low',
                    'vehicleRisk': 'high' if vehicle_mult > 1.05 else 'medium',
                    'riskScore': round(weekly_premium / 3),
                    'explanation': explanation
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/fraud-check', methods=['POST'])
def fraud_check():
    try:
        data = request.get_json()
        
        user_zone = data.get('userZone')
        claim_zone = data.get('claimZone')
        claim_time = datetime.fromisoformat(data.get('claimTime', datetime.now().isoformat()))
        user_work_hours = data.get('userWorkHours', {'start': '09:00', 'end': '21:00'})
        monthly_claims = data.get('monthlyClaims', 0)
        claim_amount = data.get('claimAmount', 0)
        weather_data = data.get('weatherData', {})
        
        fraud_score = 0
        risk_factors = []
        anomalies = []
        
        # Location check
        if user_zone != claim_zone:
            fraud_score += 30
            risk_factors.append('location_mismatch')
            anomalies.append('Claim zone does not match user zone')
        
        # Timing check
        claim_hour = claim_time.hour
        work_start = int(user_work_hours['start'].split(':')[0])
        work_end = int(user_work_hours['end'].split(':')[0])
        
        if claim_hour < work_start or claim_hour > work_end:
            fraud_score += 25
            risk_factors.append('unusual_timing')
            anomalies.append('Claim filed outside working hours')
        
        # Frequency check
        if monthly_claims > 3:
            fraud_score += 20
            risk_factors.append('high_frequency')
            anomalies.append('High claim frequency this month')
        
        # Amount check
        if claim_amount > 800:
            fraud_score += 15
            risk_factors.append('large_amount')
            anomalies.append('Claim amount exceeds normal limits')
        
        # Weather consistency check
        if weather_data and not weather_data.get('matchesTrigger', True):
            fraud_score += 35
            risk_factors.append('weather_inconsistency')
            anomalies.append('Weather data does not support claim')
        
        status = 'flag' if fraud_score >= 50 else 'approve'
        
        return jsonify({
            'success': True,
            'data': {
                'fraudScore': min(fraud_score, 100),
                'status': status,
                'riskFactors': risk_factors,
                'anomalies': anomalies,
                'analysis': {
                    'locationMatch': user_zone == claim_zone,
                    'timingMatch': work_start <= claim_hour <= work_end,
                    'frequencyCheck': monthly_claims <= 3,
                    'explanation': f"Fraud score calculated based on location, timing, frequency, and amount consistency"
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'service': 'GuardianByte ML Service',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': {
            'premium_model': True,  # Rule-based fallback
            'fraud_model': True     # Rule-based fallback
        }
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
