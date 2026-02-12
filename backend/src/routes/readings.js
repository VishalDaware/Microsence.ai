// API routes for sensor readings
const express = require('express');
const prisma = require('../lib/prisma');
const { generateRandomReadings } = require('../utils/dataGenerator');

const router = express.Router();

/**
 * POST /api/readings/generate
 * Generate random sensor data using ROUND-ROBIN field assignment
 */
router.post('/generate', async (req, res) => {
  try {
    const { farmId, userId } = req.body || {};

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    let fields = [];
    let selectedFarm = null;

    if (farmId) {
      // Find the farm and ensure it belongs to the user and is not completed
      selectedFarm = await prisma.farm.findUnique({
        where: { id: parseInt(farmId) },
        include: { fields: { orderBy: { createdAt: 'asc' } } },
      });
      if (!selectedFarm) return res.status(404).json({ success: false, error: 'Farm not found' });
      if (selectedFarm.userId !== parseInt(userId)) {
        return res.status(403).json({ success: false, error: 'Unauthorized' });
      }
      if (selectedFarm.completed) {
        return res.status(400).json({ success: false, error: 'Farm sampling is completed' });
      }
      fields = selectedFarm.fields;
    } else {
      // Fetch all fields for this user ordered by creation (round-robin) across farms
      fields = await prisma.field.findMany({
        where: { userId: parseInt(userId) },
        orderBy: { createdAt: 'asc' },
      });
    }

    // If no field exists → create default Farm and Field
    if (!fields || fields.length === 0) {
      let defaultFarm;
      if (!selectedFarm) {
        defaultFarm = await prisma.farm.create({
          data: { name: 'Default Farm', location: 'Unknown', userId: parseInt(userId) },
        });
      } else {
        defaultFarm = selectedFarm;
      }
      const newField = await prisma.field.create({
        data: {
          name: 'Field 1',
          location: 'Default Location',
          userId: parseInt(userId),
          farmId: defaultFarm.id,
        },
      });
      fields = [newField];
      selectedFarm = defaultFarm;
    }

    // Find last used field scoped to farm if farmId provided else global
    const lastReadingWhere = farmId
      ? { userId: parseInt(userId), field: { farmId: parseInt(farmId) } }
      : { userId: parseInt(userId) };
    const lastReading = await prisma.sensorReading.findFirst({
      where: lastReadingWhere,
      orderBy: { timestamp: 'desc' },
    });

    let nextField;

    if (!lastReading) {
      nextField = fields[0];
    } else {
      const lastIndex = fields.findIndex((f) => f.id === lastReading.fieldId);
      nextField = fields[(lastIndex + 1) % fields.length];
    }

    // Generate sensor data
    const generatedReading = generateRandomReadings();

    console.log('Generating reading:', { farmId, userId, selectedFarmId: selectedFarm?.id, nextFieldId: nextField.id });

    // Save reading
    const savedReading = await prisma.sensorReading.create({
      data: {
        soilMoisture: generatedReading.soilMoisture,
        temperature: generatedReading.temperature,
        co2: generatedReading.co2,
        nitrate: generatedReading.nitrate,
        ph: generatedReading.ph,
        fieldId: nextField.id,
        userId: parseInt(userId),
      },
    });

    res.json({
      success: true,
      assignedFieldId: nextField.id,
      reading: savedReading,
      farmId: selectedFarm ? selectedFarm.id : null,
    });
  } catch (error) {
    console.error('Error generating readings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/readings/latest?fieldId=&farmId=&userId=
 * Get latest reading (optionally field-scoped or farm-scoped)
 */
router.get('/latest', async (req, res) => {
  try {
    const { fieldId, farmId, userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    let where = { userId: parseInt(userId) };

    if (fieldId) {
      where.fieldId = parseInt(fieldId);
    } else if (farmId) {
      // Filter by farmId through field relationship
      where.field = { farmId: parseInt(farmId) };
    }

    const latestReading = await prisma.sensorReading.findFirst({
      where,
      orderBy: { timestamp: 'desc' },
      include: { field: true },
    });

    if (!latestReading) {
      return res.json({
        success: true,
        readings: {
          soilmoisture: { value: '--', unit: '%' },
          temperature: { value: '--', unit: '°C' },
          co2: { value: '--', unit: 'ppm' },
          nitrate: { value: '--', unit: 'mg/L' },
          ph: { value: '--', unit: '' },
        },
        message: 'No readings found',
      });
    }

    const formattedReadings = {
      soilmoisture: {
        value: latestReading.soilMoisture,
        unit: '%',
        timestamp: latestReading.timestamp,
      },
      temperature: {
        value: latestReading.temperature,
        unit: '°C',
        timestamp: latestReading.timestamp,
      },
      co2: {
        value: latestReading.co2,
        unit: 'ppm',
        timestamp: latestReading.timestamp,
      },
      nitrate: {
        value: latestReading.nitrate,
        unit: 'mg/L',
        timestamp: latestReading.timestamp,
      },
      ph: {
        value: latestReading.ph,
        unit: '',
        timestamp: latestReading.timestamp,
      },
    };

    res.json({
      success: true,
      readings: formattedReadings,
      rawReading: latestReading,
    });
  } catch (error) {
    console.error('Error fetching latest:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/readings/all?fieldId=&farmId=&userId=
 * Get all readings (ASC order for chart timeline)
 */
router.get('/all', async (req, res) => {
  try {
    const { fieldId, farmId, userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const limit = parseInt(req.query.limit) || 200;
    const skip = parseInt(req.query.skip) || 0;

    let where = { userId: parseInt(userId) };

    if (fieldId) {
      where.fieldId = parseInt(fieldId);
    } else if (farmId) {
      // Filter by farmId through field relationship
      where.field = { farmId: parseInt(farmId) };
    }

    console.log('Readings query:', { fieldId, farmId, userId, where });

    const readings = await prisma.sensorReading.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: limit,
      skip,
      include: { field: true },
    });

    console.log('Found readings:', readings.length, readings.slice(0, 2).map((r) => ({ id: r.id, fieldId: r.fieldId, field: r.field })));

    const total = await prisma.sensorReading.count({
      where,
    });

    res.json({
      success: true,
      total,
      count: readings.length,
      readings,
    });
  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/readings/predict?userId=&fieldId=&farmId=
 * Get ML predictions and recommendations for current readings
 */
router.post('/predict', async (req, res) => {
  try {
    console.log('\n========== PREDICT ENDPOINT CALLED ==========');
    const { userId, fieldId, farmId } = req.query;
    console.log('📥 Query params:', { userId, fieldId, farmId });

    if (!userId) {
      console.error('❌ userId is missing or falsy:', userId);
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const userIdInt = parseInt(userId);
    console.log('✓ Parsed userId:', userIdInt);

    let where = { userId: userIdInt };

    if (fieldId) {
      where.fieldId = parseInt(fieldId);
      console.log('🔍 Filtering by fieldId:', fieldId);
    } else if (farmId) {
      where.field = { farmId: parseInt(farmId) };
      console.log('🔍 Filtering by farmId:', farmId);
    }

    console.log('📊 Query where clause:', where);

    const latestReading = await prisma.sensorReading.findFirst({
      where,
      orderBy: { timestamp: 'desc' },
      include: { field: true },
    });

    console.log('📖 Latest reading found:', latestReading ? {
      id: latestReading.id,
      soilMoisture: latestReading.soilMoisture,
      temperature: latestReading.temperature,
      co2: latestReading.co2,
      nitrate: latestReading.nitrate,
      ph: latestReading.ph,
    } : null);

    if (!latestReading) {
      console.error('❌ No reading found for user:', userIdInt);
      return res.status(400).json({
        success: false,
        error: 'No readings found to predict on',
      });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    console.log('🔗 ML Service URL:', mlServiceUrl);

    const mlPayload = {
      CO2_ppm: latestReading.co2,
      Nitrate_ppm: latestReading.nitrate,
      pH: latestReading.ph,
      Temp_C: latestReading.temperature,
      Moisture_pct: latestReading.soilMoisture,
    };

    console.log('📤 Sending to ML service:', mlPayload);

    const response = await fetch(`${mlServiceUrl}/api/ml/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mlPayload),
    });

    console.log('📥 ML Service response status:', response.status);

    let predictions;
    try {
      predictions = await response.json();
      console.log('✓ ML Response parsed successfully');
    } catch (parseErr) {
      console.error('❌ Failed to parse ML response:', parseErr.message);
      throw new Error(`Failed to parse ML service response: ${parseErr.message}`);
    }

    if (!response.ok) {
      console.error('❌ ML service error response:', predictions);
      throw new Error(`ML service error: ${predictions.error || response.statusText}`);
    }

    console.log('✨ ML Predictions:', {
      healthScore: predictions.predictions?.health_score,
      healthCategory: predictions.predictions?.health_category,
      recommendationCount: predictions.recommendations?.length,
    });

    console.log('📋 Recommendations array:', predictions.recommendations);

    const finalResponse = {
      success: true,
      reading: latestReading,
      predictions: predictions.predictions,
      recommendations: predictions.recommendations,
    };

    console.log('✅ Sending response:', {
      success: finalResponse.success,
      hasRecommendations: !!finalResponse.recommendations,
      recommendationCount: finalResponse.recommendations?.length,
    });
    console.log('========== PREDICT ENDPOINT COMPLETE ==========\n');

    res.json(finalResponse);
  } catch (error) {
    console.error('❌ Error in predict endpoint:', error.message);
    console.error('   Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/readings/ml-status
 * Get ML model status
 */
router.get('/ml-status', async (req, res) => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    const response = await fetch(`${mlServiceUrl}/api/ml/status`);

    if (!response.ok) {
      return res.json({
        success: false,
        status: 'unavailable',
        message: 'ML service not available',
      });
    }

    const status = await response.json();
    res.json({ success: true, ...status });
  } catch (error) {
    res.json({
      success: false,
      status: 'unavailable',
      error: error.message,
    });
  }
});

/**
 * GET /api/readings/report
 * Generate report for field or all fields
 */
router.get('/report', async (req, res) => {
  try {
    const { userId, fieldId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const where = { userId: parseInt(userId) };
    if (fieldId) where.fieldId = parseInt(fieldId);

    const readings = await prisma.sensorReading.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      include: { field: true },
    });

    if (readings.length === 0) {
      return res.json({
        success: true,
        totalReadings: 0,
        dateRange: 'No data',
        avgMoisture: 0,
        avgTemperature: 0,
        avgPh: 0,
        avgCo2: 0,
        avgNitrate: 0,
        healthScore: 0,
        healthAssessment: 'No data available yet',
        readings: [],
      });
    }

    const avgMoisture = readings.reduce((s, r) => s + (r.soilMoisture || 0), 0) / readings.length;
    const avgTemperature = readings.reduce((s, r) => s + (r.temperature || 0), 0) / readings.length;
    const avgPh = readings.reduce((s, r) => s + (r.ph || 0), 0) / readings.length;
    const avgCo2 = readings.reduce((s, r) => s + (r.co2 || 0), 0) / readings.length;
    const avgNitrate = readings.reduce((s, r) => s + (r.nitrate || 0), 0) / readings.length;

    let healthScore = 80;
    if (avgMoisture < 30 || avgMoisture > 70) healthScore -= 10;
    if (avgTemperature < 15 || avgTemperature > 30) healthScore -= 10;
    if (avgPh < 5.5 || avgPh > 7.5) healthScore -= 10;
    if (avgCo2 > 800) healthScore -= 5;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const dateRange = `${new Date(readings[0].timestamp).toLocaleDateString()} - ${new Date(readings[readings.length - 1].timestamp).toLocaleDateString()}`;

    res.json({
      success: true,
      totalReadings: readings.length,
      dateRange,
      avgMoisture: Number(avgMoisture.toFixed(2)),
      avgTemperature: Number(avgTemperature.toFixed(2)),
      avgPh: Number(avgPh.toFixed(2)),
      avgCo2: Number(avgCo2.toFixed(2)),
      avgNitrate: Number(avgNitrate.toFixed(2)),
      healthScore: Math.round(healthScore),
      healthAssessment: 'Auto-generated soil health summary',
      readings,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/readings/report/download
 * Download HTML report
 */
router.get('/report/download', async (req, res) => {
  try {
    const { userId, fieldId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const where = { userId: parseInt(userId) };
    if (fieldId) where.fieldId = parseInt(fieldId);

    const readings = await prisma.sensorReading.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    const html = `
      <html>
        <head><title>Soil Health Report</title></head>
        <body>
          <h1>Soil Health Report</h1>
          <p>Total Readings: ${readings.length}</p>
          <p>Generated: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="soil-health-report-${new Date().toISOString().split('T')[0]}.html"`
    );
    res.send(html);
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/readings/test
 * Test endpoint to diagnose recommendation flow
 */
router.get('/test', async (req, res) => {
  try {
    console.log('\n========== DIAGNOSTICS TEST ENDPOINT ==========');
    
    const { userId, fieldId } = req.query;
    console.log('📊 Test parameters:', { userId, fieldId });

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId required in query string',
        example: '/api/readings/test?userId=1&fieldId=1'
      });
    }

    // Step 1: Check user exists
    console.log('\n📍 Step 1: Checking user exists...');
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        userId: parseInt(userId)
      });
    }
    console.log('✓ User found:', { id: user.id, email: user.email });

    // Step 2: Get latest reading
    console.log('\n📍 Step 2: Fetching latest reading for user...');
    let where = { userId: parseInt(userId) };
    if (fieldId) {
      where.fieldId = parseInt(fieldId);
      console.log('Filtering by fieldId:', fieldId);
    }

    const latestReading = await prisma.sensorReading.findFirst({
      where,
      orderBy: { timestamp: 'desc' },
      include: { field: { include: { farm: true } } }
    });

    if (!latestReading) {
      return res.status(404).json({
        success: false,
        error: 'No readings found for this user/field',
        where,
        hint: 'Have you generated sensor data first?'
      });
    }

    console.log('✓ Latest reading found:', {
      id: latestReading.id,
      timestamp: latestReading.timestamp,
      field: latestReading.field?.name,
      farm: latestReading.field?.farm?.name
    });

    // Step 3: Prepare ML payload
    console.log('\n📍 Step 3: Preparing ML service payload...');
    const mlPayload = {
      CO2_ppm: latestReading.co2,
      Nitrate_ppm: latestReading.nitrate,
      pH: latestReading.ph,
      Temp_C: latestReading.temperature,
      Moisture_pct: latestReading.soilMoisture,
    };
    console.log('✓ ML Payload ready:', mlPayload);

    // Step 4: Call ML service
    console.log('\n📍 Step 4: Calling ML service...');
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    console.log('🔗 ML Service URL:', mlServiceUrl);

    const mlResponse = await fetch(`${mlServiceUrl}/api/ml/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mlPayload),
    });

    console.log('📥 ML Service Response Status:', mlResponse.status);

    let mlData;
    try {
      mlData = await mlResponse.json();
      console.log('✓ ML Response parsed successfully');
    } catch (e) {
      console.error('❌ Failed to parse ML response:', e.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse ML service response',
        details: e.message
      });
    }

    if (!mlResponse.ok) {
      console.error('❌ ML service returned error:', mlData);
      return res.status(500).json({
        success: false,
        error: 'ML service error',
        mlResponse: mlData
      });
    }

    // Step 5: Verify recommendations format
    console.log('\n📍 Step 5: Verifying recommendations format...');
    console.log('  - has recommendations:', 'recommendations' in mlData);
    console.log('  - is array:', Array.isArray(mlData.recommendations));
    console.log('  - length:', mlData.recommendations?.length);
    if (mlData.recommendations && mlData.recommendations.length > 0) {
      console.log('  - first item:', mlData.recommendations[0]);
      console.log('  - last item:', mlData.recommendations[mlData.recommendations.length - 1]);
    }

    console.log('\n========== DIAGNOSTICS COMPLETE ==========\n');

    // Return comprehensive diagnostic result
    return res.json({
      success: true,
      diagnostics: {
        user: {
          id: user.id,
          email: user.email
        },
        latestReading: {
          id: latestReading.id,
          timestamp: latestReading.timestamp,
          field: latestReading.field?.name,
          farm: latestReading.field?.farm?.name,
          values: {
            soilMoisture: latestReading.soilMoisture,
            temperature: latestReading.temperature,
            co2: latestReading.co2,
            nitrate: latestReading.nitrate,
            ph: latestReading.ph
          }
        },
        mlService: {
          url: mlServiceUrl,
          responseStatus: mlResponse.status,
          responseOk: mlResponse.ok,
          data: mlData
        },
        recommendations: {
          count: mlData.recommendations?.length,
          isArray: Array.isArray(mlData.recommendations),
          content: mlData.recommendations
        }
      },
      hint: 'If recommendations are showing as fallback in UI but have values here, check browser console logs'
    });

  } catch (error) {
    console.error('❌ Error in test endpoint:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
