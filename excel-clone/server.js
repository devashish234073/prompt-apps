const express = require('express');
const multer = require('multer');
const cors = require('cors');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Configure CORS
app.use(cors());
app.use(express.json());

// Configure file upload
const upload = multer({ dest: 'uploads/' });

// Serve static files from public directory
app.use(express.static('public'));

// Handle file upload and processing
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    try {
        let data = [];
        
        if (fileExtension === '.csv') {
            // Process CSV file
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => results.push(row))
                .on('end', () => {
                    data = results;
                    processAndSendData();
                });
        } else if (fileExtension === '.xlsx') {
            // Process XLSX file
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            processAndSendData();
        } else {
            fs.unlinkSync(filePath);
            return res.status(400).send('Unsupported file format. Please upload a CSV or XLSX file.');
        }

        function processAndSendData() {
            // Clean up - delete the uploaded file
            fs.unlinkSync(filePath);
            
            // Convert data to a more usable format for the frontend
            const processedData = {
                headers: data.length > 0 ? Object.keys(data[0]) : [],
                rows: data.map(row => {
                    if (Array.isArray(row)) {
                        return row;
                    } else {
                        return Object.values(row);
                    }
                })
            };
            
            res.json(processedData);
        }
    } catch (error) {
        console.error('Error processing file:', error);
        fs.unlinkSync(filePath);
        res.status(500).send('Error processing file.');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});