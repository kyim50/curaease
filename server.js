import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';

const app = express();
app.use(cors()); // Allow frontend requests
app.use(express.json()); // Allow JSON requests

const filePath = path.resolve('./en_medical_dialog.json');

// API endpoint to serve the dataset
app.get('/api/medical-dataset', (req, res) => {
  try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const medicalData = JSON.parse(rawData);

    res.json(medicalData);
  } catch (error) {
    console.error('Error reading dataset:', error);
    res.status(500).json({ error: 'Failed to load dataset' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
