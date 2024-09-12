const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('As Shakil Website Is successfully running');
});



app.listen(port, () => console.log(`Az Shakil website Server is running on port ${port}.`));