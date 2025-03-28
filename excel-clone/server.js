const express = require('express');
const multer = require('multer');
const cors = require('cors');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const port = 3000;

// Configure CORS
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Modify your multer config
/*const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});*/

const upload = multer({ dest: 'uploads/' });

// Serve static files from public directory
app.use(express.static('public'));

// Add at the top of server.js
const filePathFromArgs = process.argv[2];
console.log("filePathFromArgs", filePathFromArgs);
// Modify your existing route to handle pre-loaded files
app.get('/', (req, res) => {
    if (filePathFromArgs) {
        console.log("trying to load preloaded file", filePathFromArgs);
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Excel Clone</title>
                <script>
                    window.preloadedFile = '${filePathFromArgs.replace(/\\/g, '\\\\')}';
                </script>
            </head>
            <body>
                <script src="/app.js"></script>
            </body>
            </html>
        `);
    } else {
        console.log("opening start.html");
        res.sendFile(path.join(__dirname, 'public', 'start.html'));
    }
});

// Add this endpoint to server.js
app.post('/load-file', express.json(), (req, res) => {
    const filePath = req.body.path;
    console.log("trying yo load preloaded file", filePath);
    const fileExtension = path.extname(filePath).toLowerCase();

    try {
        if (fileExtension === '.csv') {
            // Process CSV file
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => results.push(row))
                .on('end', () => {
                    res.json({
                        headers: results.length > 0 ? Object.keys(results[0]) : [],
                        rows: results.map(row => Object.values(row))
                    });
                });
        } else if (fileExtension === '.xlsx') {
            // Process XLSX file
            const workbook = xlsx.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            res.json({
                headers: data.length > 0 ? data[0] : [],
                rows: data.slice(1)
            });
        }
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Error processing file.');
    }
});

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
    
    // Auto-open browser (Windows)
    if (process.platform === 'win32') {
        exec(`start http://localhost:${port}`);
    }
    // Mac/Linux support
    else if (process.platform === 'darwin') {
        exec(`open http://localhost:${port}`);
    } else {
        exec(`xdg-open http://localhost:${port}`);
    }
});