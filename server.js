require('dotenv').config();
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0',() => {
    console.log('Server listening on port ' + PORT);
})


