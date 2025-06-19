require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Swagger UI
app.use('/', swaggerUi.serve);
app.get('/', swaggerUi.setup(swaggerDocument));

// Routes
app.use('/movies', require('./routes/movies'));
app.use('/people', require('./routes/people'));
app.use('/user', require('./routes/user'));

// Load SSL cert and key
const options = {
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.cert')
};

// Start HTTPS server
https.createServer(options, app).listen(3000, () => {
    console.log(" HTTPS server running at https://localhost:3000");
});

