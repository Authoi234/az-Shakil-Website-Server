const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const fs = require('fs');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6iupoas.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        
    }
    finally{
        
    }
}
run().catch(console.log);

// json reader
const readJSONFile = (filename) => {
    const filePath = path.join(__dirname, 'public', filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

// middleware
app.use(cors());
app.use(express.json());

// zSdhRZFIX8Hh7zSF
// Az-Shakil-Website

app.get('/', (req, res) => {
    res.send('As Shakil Website Is successfully running');
});

app.get('/videos/:id', async (req, res) => {
    const videos = readJSONFile('videos.json');
    const id = req.params.id;
    const video = videos.find(singleVideo => singleVideo.id === Number(id));
    res.send(video);
})

app.get('/videos/', async (req, res) => {
    const videosData = readJSONFile('videosData.json');
    res.send(videosData);
})



app.listen(port, () => console.log(`Az Shakil website Server is running on port ${port}.`));