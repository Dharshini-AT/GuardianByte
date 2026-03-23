import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

def generate_premium_training_data():
    """Generate mock training data for premium calculation"""
    
    zones = ['Zone A (Bandra)', 'Zone B (Andheri)', 'Zone C (Navi Mumbai)']
    vehicle_types = ['bike', 'scooter']
    
    data = []
    
    for _ in range(1000):
        zone = random.choice(zones)
        vehicle_type = random.choice(vehicle_types)
        historical_claims = random.randint(0, 10)
        daily_earnings = random.randint(500, 3000)
        
        # Calculate target premium based on rules
        zone_mult = {'Zone A (Bandra)': 1.3, 'Zone B (Andheri)': 1.0, 'Zone C (Navi Mumbai)': 0.7}[zone]
        vehicle_mult = {'bike': 1.1, 'scooter': 1.0}[vehicle_type]
        
        base_premium = 150
        claims_penalty = min(historical_claims * 10, 50)
        weekly_premium = round(base_premium * zone_mult * vehicle_mult + claims_penalty)
        
        # Add some noise
        weekly_premium += random.randint(-20, 20)
        weekly_premium = max(100, min(500, weekly_premium))
        
        data.append({
            'zone_encoded': zones.index(zone),
            'vehicle_type_encoded': 0 if vehicle_type == 'bike' else 1,
            'historical_claims': historical_claims,
            'daily_earnings': daily_earnings,
            'zone_risk_score': zone_mult * 100,
            'vehicle_risk_score': vehicle_mult * 100,
            'weekly_premium': weekly_premium
        })
    
    return pd.DataFrame(data)

def generate_fraud_training_data():
    """Generate mock training data for fraud detection"""
    
    zones = ['Zone A (Bandra)', 'Zone B (Andheri)', 'Zone C (Navi Mumbai)']
    
    data = []
    
    for _ in range(2000):
        # Generate legitimate claims (70%)
        is_fraud = random.random() < 0.3
        
        user_zone = random.choice(zones)
        
        if is_fraud:
            # Fraudulent claims have more inconsistencies
            claim_zone = random.choice(zones) if random.random() < 0.7 else user_zone
            location_match = claim_zone == user_zone
            
            claim_hour = random.randint(0, 23)
            work_start, work_end = 9, 21
            timing_match = work_start <= claim_hour <= work_end
            
            monthly_claims = random.randint(0, 8) if random.random() < 0.6 else random.randint(1, 3)
            frequency_check = monthly_claims <= 3
            
            claim_amount = random.randint(200, 1200) if random.random() < 0.4 else random.randint(200, 800)
            amount_check = claim_amount <= 800
            
            weather_match = random.random() < 0.5
            
            fraud_score = 0
            if not location_match: fraud_score += 30
            if not timing_match: fraud_score += 25
            if not frequency_check: fraud_score += 20
            if not amount_check: fraud_score += 15
            if not weather_match: fraud_score += 35
            
            is_fraud_label = fraud_score >= 50
            
        else:
            # Legitimate claims
            claim_zone = user_zone
            location_match = True
            
            claim_hour = random.randint(9, 21)
            timing_match = True
            
            monthly_claims = random.randint(0, 3)
            frequency_check = True
            
            claim_amount = random.randint(200, 800)
            amount_check = True
            
            weather_match = True
            fraud_score = random.randint(0, 30)
            is_fraud_label = False
        
        data.append({
            'location_match': int(location_match),
            'timing_match': int(timing_match),
            'frequency_check': int(frequency_check),
            'amount_check': int(amount_check),
            'weather_match': int(weather_match),
            'claim_hour': claim_hour,
            'monthly_claims': monthly_claims,
            'claim_amount': claim_amount,
            'zone_encoded': zones.index(user_zone),
            'fraud_score': fraud_score,
            'is_fraud': int(is_fraud_label)
        })
    
    return pd.DataFrame(data)

if __name__ == '__main__':
    # Generate and save training data
    premium_data = generate_premium_training_data()
    fraud_data = generate_fraud_training_data()
    
    premium_data.to_csv('premium_training_data.csv', index=False)
    fraud_data.to_csv('fraud_training_data.csv', index=False)
    
    print("Training data generated:")
    print(f"Premium data: {len(premium_data)} samples")
    print(f"Fraud data: {len(fraud_data)} samples")
    print(f"Fraud data - Fraud cases: {fraud_data['is_fraud'].sum()} ({fraud_data['is_fraud'].sum()/len(fraud_data)*100:.1f}%)")
