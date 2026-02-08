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
    // Get or create default admin user
    let adminUser = await prisma.user.findUnique({ where: { email: 'admin@farm.local' } });

    if (!adminUser) {
      adminUser = await prisma.user.create({ data: { name: 'Admin', email: 'admin@farm.local', password: 'admin123' } });
    }

    const { farmId } = req.body || {};

    let fields = [];
    let selectedFarm = null;

    if (farmId) {
      // Find the farm and ensure it's not completed
      selectedFarm = await prisma.farm.findUnique({ where: { id: parseInt(farmId) }, include: { fields: { orderBy: { createdAt: 'asc' } } } });
      if (!selectedFarm) return res.status(404).json({ success: false, error: 'Farm not found' });
      if (selectedFarm.completed) return res.status(400).json({ success: false, error: 'Farm sampling is completed' });
      fields = selectedFarm.fields;
    } else {
      // Fetch all fields ordered by creation (round-robin) across farms
      fields = await prisma.field.findMany({ where: { userId: adminUser.id }, orderBy: { createdAt: 'asc' } });
    }

    // If no field exists → create default Farm and Field
    if (!fields || fields.length === 0) {
      let defaultFarm;
      if (!selectedFarm) {
        defaultFarm = await prisma.farm.create({ data: { name: 'Default Farm', location: 'Unknown', userId: adminUser.id } });
      } else {
        defaultFarm = selectedFarm;
      }
      const newField = await prisma.field.create({ data: { name: 'Field 1', location: 'Default Location', userId: adminUser.id, farmId: defaultFarm.id } });
      fields = [newField];
      selectedFarm = defaultFarm;
    }

    // Find last used field scoped to farm if farmId provided else global
    const lastReadingWhere = farmId ? { userId: adminUser.id, field: { farmId: parseInt(farmId) } } : { userId: adminUser.id };
    const lastReading = await prisma.sensorReading.findFirst({ where: lastReadingWhere, orderBy: { timestamp: 'desc' } });

    let nextField;

    if (!lastReading) {
      nextField = fields[0];
    } else {
      const lastIndex = fields.findIndex(f => f.id === lastReading.fieldId);
      nextField = fields[(lastIndex + 1) % fields.length];
    }

    // Generate sensor data
    const generatedReading = generateRandomReadings();

    console.log('Generating reading:', { farmId, selectedFarmId: selectedFarm?.id, nextFieldId: nextField.id, nextFieldFarmId: nextField.farmId });

    // Save reading
    const savedReading = await prisma.sensorReading.create({
      data: {
        soilMoisture: generatedReading.soilMoisture,
        temperature: generatedReading.temperature,
        co2: generatedReading.co2,
        nitrate: generatedReading.nitrate,
        ph: generatedReading.ph,
        fieldId: nextField.id,
        userId: adminUser.id,
      },
    });

    res.json({ success: true, assignedFieldId: nextField.id, reading: savedReading, farmId: selectedFarm ? selectedFarm.id : null });
  } catch (error) {
    console.error('Error generating readings:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/readings/latest?fieldId=&farmId=
 * Get latest reading (optionally field-scoped or farm-scoped)
 */
router.get('/latest', async (req, res) => {
  try {
    const { fieldId, farmId } = req.query;

    let where = {};
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
    console.error('Error fetching latest reading:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/readings/all?fieldId=&farmId=
 * Get all readings (ASC order for chart timeline)
 */
router.get('/all', async (req, res) => {
  try {
    const { fieldId, farmId } = req.query;
    const limit = parseInt(req.query.limit) || 200;
    const skip = parseInt(req.query.skip) || 0;

    let where = {};
    if (fieldId) {
      where.fieldId = parseInt(fieldId);
    } else if (farmId) {
      // Filter by farmId through field relationship
      where.field = { farmId: parseInt(farmId) };
    }

    console.log('Readings query:', { fieldId, farmId, where });

    const readings = await prisma.sensorReading.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: limit,
      skip,
      include: { field: true },
    });

    console.log('Found readings:', readings.length, readings.slice(0, 2).map(r => ({ id: r.id, fieldId: r.fieldId, field: r.field })));

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
 * POST /api/readings/predict
 * Get ML predictions and recommendations for current readings
 */
router.post('/predict', async (req, res) => {
  try {
    const latestReading = await prisma.sensorReading.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!latestReading) {
      return res.status(400).json({
        success: false,
        error: 'No readings found to predict on',
      });
    }

    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    const response = await fetch(`${mlServiceUrl}/api/ml/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CO2_ppm: latestReading.co2,
        Nitrate_ppm: latestReading.nitrate,
        pH: latestReading.ph,
        Temp_C: latestReading.temperature,
        Moisture_pct: latestReading.soilMoisture,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.statusText}`);
    }

    const predictions = await response.json();

    res.json({
      success: true,
      reading: latestReading,
      predictions: predictions.predictions,
      recommendations: predictions.recommendations,
    });
  } catch (error) {
    console.error('Error predicting:', error);
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

module.exports = router;
