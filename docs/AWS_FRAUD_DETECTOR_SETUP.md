# AWS Fraud Detector Setup Guide

## Overview
Amazon Fraud Detector is a fully managed service that uses machine learning to identify potentially fraudulent activity. This guide explains how to set it up for the KYC verification process.

## Current Status
✅ **Code Implementation**: Fully implemented with fallback to rule-based detection
⚙️ **AWS Configuration**: Requires setup in AWS Console

## Features
- Real-time fraud scoring for KYC verifications
- Machine learning models for fraud prediction
- Customizable rules and outcomes
- Automatic fallback to rule-based detection if AWS is unavailable

## Environment Variables

Add these variables to your `.env` file:

```bash
# AWS Fraud Detector Configuration
AWS_FRAUD_DETECTOR_ENABLED=true
AWS_FRAUD_DETECTOR_ID=kyc_fraud_detector
AWS_FRAUD_EVENT_TYPE=kyc_verification
```

### Variable Descriptions:

- `AWS_FRAUD_DETECTOR_ENABLED`: Set to `true` to enable AWS Fraud Detector, `false` to use only rule-based detection
- `AWS_FRAUD_DETECTOR_ID`: The ID of your fraud detector in AWS
- `AWS_FRAUD_EVENT_TYPE`: The event type name configured in AWS Fraud Detector

## AWS Setup Steps

### 1. Create Event Type

1. Go to AWS Fraud Detector Console
2. Click "Event types" → "Create event type"
3. Enter:
   - **Name**: `kyc_verification`
   - **Entity type**: `customer`
   - **Event variables**:
     - `email` (string)
     - `ip_address` (string)
     - `document_number` (string)
     - `first_name` (string)
     - `last_name` (string)
     - `date_of_birth` (string)
     - `face_match_score` (numeric)
     - `liveness_score` (numeric)

### 2. Create Model

1. Click "Models" → "Create model"
2. Select your event type: `kyc_verification`
3. Upload historical fraud data (if available)
4. Configure model settings:
   - **Model type**: Online fraud detection
   - **Training method**: Supervised learning

### 3. Create Detector

1. Click "Detectors" → "Create detector"
2. Enter:
   - **Name**: `kyc_fraud_detector`
   - **Description**: KYC verification fraud detection
3. Select your event type
4. Add your trained model

### 4. Define Rules

Create rules with outcomes:

**Rule 1: High Risk - Block**
```
$face_match_score < 70 OR $liveness_score < 60
→ Outcome: block
```

**Rule 2: Medium Risk - Review**
```
$face_match_score < 85 OR $liveness_score < 80
→ Outcome: review
```

**Rule 3: Low Risk - Approve**
```
$face_match_score >= 85 AND $liveness_score >= 80
→ Outcome: approve
```

### 5. Deploy Detector

1. Review all configurations
2. Click "Deploy detector"
3. Wait for deployment to complete

## Rule-Based Fallback

If AWS Fraud Detector is disabled or unavailable, the system uses intelligent rule-based scoring:

### Scoring Factors:

1. **Face Match Score** (0-50 points)
   - < 60%: +50 points (critical)
   - 60-70%: +40 points
   - 70-80%: +25 points
   - 80-90%: +10 points

2. **Liveness Score** (0-35 points)
   - Not performed: +20 points
   - < 60%: +35 points
   - 60-70%: +25 points
   - 70-85%: +15 points

3. **IP Address** (0-30 points)
   - Tor/Onion: +30 points
   - Private IP: +15 points
   - Unknown: +10 points

4. **Email Domain** (0-30 points)
   - Temporary mail: +30 points
   - Suspicious TLD: +20 points
   - No email: +15 points

5. **Document Data** (0-10 points)
   - Invalid document number: +10 points

6. **Name Data** (0-20 points)
   - Missing name: +15 points
   - Suspicious patterns: +20 points

7. **Age Verification** (0-30 points)
   - Under 18: +25 points
   - Over 100: +30 points
   - Invalid date: +10 points

### Risk Levels:

- **LOW**: Score < 30
- **MEDIUM**: Score 30-59
- **REVIEW**: Sent to manual review
- **HIGH**: Score ≥ 60

## Testing

### Test with AWS Fraud Detector

```bash
# Set enabled in .env
AWS_FRAUD_DETECTOR_ENABLED=true

# Perform verification
# Check logs for "Using AWS Fraud Detector"
```

### Test with Rule-Based Detection

```bash
# Set disabled in .env
AWS_FRAUD_DETECTOR_ENABLED=false

# Perform verification
# Check logs for "Using rule-based fraud detection"
```

## Monitoring

The fraud detection system logs key events:

```typescript
console.log('Using AWS Fraud Detector for verification:', verificationId);
console.log('AWS Fraud Detector result:', { fraudScore, riskLevel, reasons });
console.log('AWS Fraud Detector error, falling back to rule-based:', error);
```

Monitor these logs to ensure proper operation.

## Cost Considerations

AWS Fraud Detector pricing (as of 2024):
- **Model training**: $500 per model version
- **Predictions**: $7.50 per 1,000 predictions
- **Fraud Detector storage**: $0.025 per GB-month

Rule-based fallback has **zero AWS costs**.

## Troubleshooting

### Issue: AWS Fraud Detector errors

**Solution**: Check AWS credentials and detector deployment status

### Issue: All verifications show "rule-based" in logs

**Solution**: Verify `AWS_FRAUD_DETECTOR_ENABLED=true` in `.env`

### Issue: High fraud scores for legitimate users

**Solution**:
1. Review and adjust rules in AWS Console
2. Retrain model with more accurate data
3. Fine-tune rule-based scoring thresholds

## Security Best Practices

1. **Never commit AWS credentials** to version control
2. Use **IAM roles** with minimum required permissions
3. Enable **CloudWatch logging** for fraud events
4. Regularly **review fraud rules** and model performance
5. Implement **rate limiting** to prevent abuse

## Support

For issues or questions:
- AWS Fraud Detector Documentation: https://docs.aws.amazon.com/frauddetector/
- Internal support: Contact DevOps team
