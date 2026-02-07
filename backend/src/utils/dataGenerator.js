// Temporary data generator for sensor readings
// Generates random realistic values for soil health metrics

const sensorRanges = {
  soilMoisture: { min: 20, max: 80 },
  temperature: { min: 15, max: 35 },
  co2: { min: 300, max: 1000 },
  nitrate: { min: 5, max: 30 },
  ph: { min: 5.5, max: 7.5 },
};

/**
 * Generate random sensor readings for all sensor types
 * Returns a single reading object with all sensor values
 */
function generateRandomReadings() {
  const reading = {};

  Object.entries(sensorRanges).forEach(([sensorName, range]) => {
    let value;
    if (sensorName === 'ph') {
      // pH values should be decimal with 1 decimal place
      value = parseFloat((Math.random() * (range.max - range.min) + range.min).toFixed(1));
    } else {
      // Round other values to whole numbers
      value = Math.floor(Math.random() * (range.max - range.min + 1) + range.min);
    }
    reading[sensorName] = value;
  });

  return reading;
}

module.exports = {
  generateRandomReadings,
  sensorRanges,
};
