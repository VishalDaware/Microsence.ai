#!/usr/bin/env node

/**
 * Setup script for ML model training and deployment
 * Run this from the backend directory: node setup-ml.js
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const BACKEND_DIR = __dirname;
const CSV_PATH = path.join(BACKEND_DIR, 'soil_health_20000.csv');
const ML_MODELS_DIR = path.join(BACKEND_DIR, 'ml_models');
const ENV_FILE = path.join(BACKEND_DIR, '.env');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

function checkDependencies() {
  log('Checking dependencies...', 'info');
  
  // Check if CSV exists
  if (!fs.existsSync(CSV_PATH)) {
    log(`CSV file not found: ${CSV_PATH}`, 'error');
    return false;
  }
  log('✓ Dataset found', 'success');
  
  return true;
}

function checkPythonDependencies() {
  return new Promise((resolve) => {
    log('Checking Python dependencies...', 'info');
    
    const python = spawn('python', ['-m', 'pip', 'list'], {
      cwd: BACKEND_DIR,
      stdio: 'pipe'
    });
    
    let output = '';
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.on('close', (code) => {
      const requiredPackages = ['pandas', 'scikit-learn', 'numpy', 'flask', 'flask-cors'];
      const missingPackages = [];
      
      requiredPackages.forEach(pkg => {
        if (!output.includes(pkg)) {
          missingPackages.push(pkg);
        }
      });
      
      if (missingPackages.length > 0) {
        log(`Missing Python packages: ${missingPackages.join(', ')}`, 'warning');
        log('Installing required packages...', 'info');
        
        const install = spawn('pip', ['install', '-r', 'requirements.txt'], {
          cwd: BACKEND_DIR,
          stdio: 'inherit'
        });
        
        install.on('close', (installCode) => {
          if (installCode === 0) {
            log('✓ Python packages installed', 'success');
            resolve(true);
          } else {
            log('Failed to install Python packages', 'error');
            resolve(false);
          }
        });
      } else {
        log('✓ All Python packages installed', 'success');
        resolve(true);
      }
    });
  });
}

function trainModels() {
  return new Promise((resolve) => {
    log('Training ML models...', 'info');
    log('This may take a few minutes...', 'warning');
    
    const python = spawn('python', ['ml_model.py'], {
      cwd: BACKEND_DIR,
      stdio: 'inherit'
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        log('✓ Models trained successfully', 'success');
        resolve(true);
      } else {
        log('Model training failed', 'error');
        resolve(false);
      }
    });
  });
}

function setupEnvironment() {
  log('Setting up environment variables...', 'info');
  
  if (!fs.existsSync(ENV_FILE)) {
    const envContent = `PORT=5000
ML_SERVICE_URL=http://localhost:5001
NODE_ENV=development
`;
    fs.writeFileSync(ENV_FILE, envContent);
    log('✓ .env file created', 'success');
  } else {
    log('✓ .env file already exists', 'success');
  }
}

function createStartScripts() {
  log('Creating start scripts...', 'info');
  
  const nodeScript = `#!/bin/bash
# Start Node.js backend
node index.js
`;
  
  const pythonScript = `#!/bin/bash
# Start Python ML service
python ml_service.py
`;
  
  const bothScript = `#!/bin/bash
# Start both services
echo "Starting Node.js backend..."
node index.js &
NODE_PID=$!

echo "Starting Python ML service..."
python ml_service.py &
PYTHON_PID=$!

echo "Both services started. PID: Node=$NODE_PID, Python=$PYTHON_PID"
wait $NODE_PID $PYTHON_PID
`;
  
  try {
    fs.writeFileSync(path.join(BACKEND_DIR, 'start-node.sh'), nodeScript);
    fs.writeFileSync(path.join(BACKEND_DIR, 'start-python.sh'), pythonScript);
    fs.writeFileSync(path.join(BACKEND_DIR, 'start-both.sh'), bothScript);
    
    log('✓ Start scripts created', 'success');
  } catch (error) {
    log(`Error creating scripts: ${error.message}`, 'warning');
  }
}

function displayInstructions() {
  console.log(`
${'\x1b[36m'}═══════════════════════════════════════════════════════════${'\x1b[0m'}
${'\x1b[32m'}✓ ML Model Setup Complete!${'\x1b[0m'}
${'\x1b[36m'}═══════════════════════════════════════════════════════════${'\x1b[0m'}

${'\x1b[33m'}📋 Next Steps:${'\x1b[0m'}

1. ${'\x1b[36m'}Start the Node.js backend:${'\x1b[0m'}
   cd backend
   npm start

2. ${'\x1b[36m'}In a new terminal, start the Python ML service:${'\x1b[0m'}
   cd backend
   python ml_service.py

3. ${'\x1b[36m'}In another terminal, start the frontend:${'\x1b[0m'}
   cd dashboard
   npm run dev

${'\x1b[33m'}🔍 API Endpoints:${'\x1b[0m'}

Node.js Backend (http://localhost:5000):
  • POST   /api/readings/generate     - Generate new sensor readings
  • GET    /api/readings/latest       - Get latest readings
  • GET    /api/readings/all          - Get all readings (paginated)
  • POST   /api/readings/predict      - Get ML predictions
  • GET    /api/readings/ml-status    - Check ML model status

Python ML Service (http://localhost:5001):
  • POST   /api/ml/health             - Predict soil health
  • GET    /api/ml/status             - Get model information
  • GET    /api/ml/health-info        - Get health categories

${'\x1b[33m'}📊 ML Model Info:${'\x1b[0m'}
  • Features: CO₂ ppm, Nitrate ppm, pH, Temperature, Soil Moisture
  • Outputs: Health Score (0-10), Health Category, Category Probabilities
  • Recommendations: Based on sensor readings and health status
  
${'\x1b[36m'}═══════════════════════════════════════════════════════════${'\x1b[0m'}
`);
}

async function main() {
  console.log(`
${'\x1b[36m'}╔═════════════════════════════════════════════════════════╗${'\x1b[0m'}
${'\x1b[36m'}║     ML Model Setup for Soil Health Prediction          ║${'\x1b[0m'}
${'\x1b[36m'}╚═════════════════════════════════════════════════════════╝${'\x1b[0m'}
`);

  // Check dependencies
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  // Check Python dependencies
  if (!await checkPythonDependencies()) {
    process.exit(1);
  }
  
  // Train models
  if (!await trainModels()) {
    process.exit(1);
  }
  
  // Setup environment
  setupEnvironment();
  
  // Create start scripts
  createStartScripts();
  
  // Display instructions
  displayInstructions();
}

main().catch(error => {
  log(`Setup failed: ${error.message}`, 'error');
  process.exit(1);
});
