const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

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
        const appointmentOptionsCollection = client.db('azShakil').collection('appointmentOptions');
        const bookingsCollection = client.db('azShakil').collection('bookings');
        const usersCollection = client.db('azShakil').collection('users');

        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionsCollection.find(query).toArray();
            const bookingQuery = { appointmentDate: date };
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

            // code carefully :D
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.visa === option.name);
                const bookedSlots = optionBooked.map(book => book.slot);
                const remainningSlots = option?.slots.filter(slot => !bookedSlots.includes(slot));
                option.slots = remainningSlots;
            })
            res.send(options);
        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                appointmentDate: booking.appointmentDate,
                visa: booking.visa,
                email: booking.email
            }

            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `you already have a booking on : ${booking.appointmentDate}`;
                return res.send({ acknowledge: false, message: message });
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        app.get('/bookings', async (req, res) => {
            const { status, type } = req.query;

            const query = {
                ...(status && { status }),
                ...(type && { type })
            };
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
        });

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id.trim();
            const { status } = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { status }
            };
            console.log(id)
            const result = await bookingsCollection.updateOne(filter, updateDoc);
            res.send(result)
        });

        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id.trim();
            const result = await bookingsCollection.deleteOne({_id: new ObjectId(id)});
            res.send(result)
        });

        app.get("/users", async (req, res) => {
            const users = await usersCollection.find({}).toArray();
            res.send(users);
        })
    }
    finally {

    }
}
run().catch(console.log);

app.get('/', (req, res) => {
    res.send('Doctors Portal server is running')
})

app.listen(port, () => console.log(`Az Shakil website Server is running on port ${port}.`));