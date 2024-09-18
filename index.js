const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const app = express();
const videos = require('./videos.json');
const videosData = require('./videosData.json');


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('As Shakil Website Is successfully running');
});

app.get('/videos/:id', async(req, res) => {
    const id = req.params.id;
    const video = videos.find(singleVideo => singleVideo.id === Number(id));
    res.send(video);
})

app.get('/videos/', async(req, res) => {
    res.send(videosData);
})



app.listen(port, () => console.log(`Az Shakil website Server is running on port ${port}.`));