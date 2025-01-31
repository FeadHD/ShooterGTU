const express = require('express');
const path = require('path');
const app = express();

// Enable CORS for local development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

// Serve static files from the docs directory
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// Serve the game files
app.use(express.static(__dirname));

// Add a route to handle documentation requests
app.get('/docs/:docName', (req, res) => {
    const docPath = path.join(__dirname, 'docs', req.params.docName);
    res.sendFile(docPath);
});

const port = 3000;
app.listen(port, () => {
    console.log(`Documentation server running at http://localhost:${port}`);
});
