const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const nodemailer = require("nodemailer");
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

// nodemailer transport
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "jawadkhan.authoi@gmail.com",
        pass: process.env.GOOGLE_APP_PASSWORD, // Must be a real app password
    },
});

async function run() {
    try {
        await client.connect();

        const appointmentOptionsCollection = client.db('azShakil').collection('appointmentOptions');
        const bookingsCollection = client.db('azShakil').collection('bookings');
        const usersCollection = client.db('azShakil').collection('users');
        const blogsCollection = client.db('azShakil').collection('blogsCollection');
        const requestsCollection = client.db('azShakil').collection('requestsCollection');

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

            transporter.sendMail({
                to: `${booking.email}`,
                subject: "Apprent Booking Request send",
                html: `
                    <div style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px;">
                        <div style="max-width: 600px; background-color: #ffffff; padding: 30px; margin: auto; border: 1px solid #e0e0e0; border-radius: 6px;">
                            <h2 style="color: #004085;">Apprent - Appointment Request</h2>
                            <p>Hello,</p>
                            <p>An Appointment from <strong>${booking.client}</strong> has been requested to <strong>Apprent</strong>.</p>
                            <p>We'll let you know once it is <strong>approved</strong> or <strong>cancelled</strong>.</p>
                            <p>Thank you,<br>The Apprent Team</p>
                            <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                                &copy; 2025 Apprent. All rights reserved.
                            </div>
                        </div>
                    </div>
                `,
            }).then(() => {
                console.log("Email Sent to client")
            }).catch(err => {
                console.log(err)
            })

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        });

        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
        });

        app.get("/blogs", async (req, res) => {
            const blogs = await blogsCollection.find({}).toArray();
            res.send(blogs);
        })

        app.get("/blogs/:id", async (req, res) => {
            const id = req.params.id;
            const blog = await blogsCollection.findOne({ _id: new ObjectId(id) });
            res.send(blog);
        })

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
            const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) }).toArray();
            console.log(id)
            transporter.sendMail({
                to: `${booking.email}`,
                subject: `Apprent Booking Request ${status}`,
                html: `
                    <div style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px;">
                        <div style="max-width: 600px; background-color: #ffffff; padding: 30px; margin: auto; border: 1px solid #e0e0e0; border-radius: 6px;">
                            <h2 style="color: #004085;">Apprent - Appointment Request ${status}</h2>
                            <p>Hello,</p>
                            <p>Your Appointment request has been ${status} to <strong>Apprent</strong>.</p>
                            <p>Thank you,<br>The Apprent Team</p>
                            <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                                &copy; 2025 Apprent. All rights reserved.
                            </div>
                        </div>
                    </div>
                `,
            }).then(() => {
                console.log("Email Sent to client")
            }).catch(err => {
                console.log(err)
            })
            const result = await bookingsCollection.updateOne(filter, updateDoc);
            res.send(result)
        });


        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id.trim();
            const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result)
        });

        app.get("/users", async (req, res) => {
            const users = await usersCollection.find({}).toArray();
            res.send(users);
        });
        app.get("/user", async (req, res) => {
            const { email } = req.query;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            res.send(user);
        });
        app.post("/partnerRequest", async (req, res) => {
            const request = req.body;
            const result = await requestsCollection.insertOne(request);
            transporter.sendMail({
                to: `${request.email}`,
                subject: "Apprent Partnership Request send",
                html: `
                    <div style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px;">
                        <div style="max-width: 600px; background-color: #ffffff; padding: 30px; margin: auto; border: 1px solid #e0e0e0; border-radius: 6px;">
                            <h2 style="color: #004085;">Apprent - Appointment Request</h2>
                            <p>Hello,</p>
                            <p>An Partnership from <strong>${request.contactPerson}</strong> from <strong>${request.organizationName}</strong> has been requested to <strong>Apprent</strong>.</p>
                            <p>We'll let you know once it is <strong>Approved</strong> or <strong>Cancelled</strong>.</p>
                            <p>Thank you,<br>The Apprent Team</p>
                            <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                                &copy; 2025 Apprent. All rights reserved.
                            </div>
                        </div>
                    </div>
                `,
            }).then(() => {
                console.log("Email Sent to client")
            }).catch(err => {
                console.log(err)
            })
            res.send(result);
        });
        app.get('/partnerRequest', async (req, res) => {
            const result = await requestsCollection.find({}).toArray();
            res.send(result);
        });
        app.delete('/partnerRequest/:id', async (req, res) => {
            const id = req.params.id.trim();
            const result = await requestsCollection.deleteOne({ _id: new ObjectId(id) });
            res.send(result)
        });
        app.patch('/partnerRequest/:id', async (req, res) => {
            const id = req.params.id.trim();
            const { status } = req.body;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: { status }
            };
            console.log(id)
            const request = await requestsCollection.findOne({_id: new ObjectId(id)})
            const result = await requestsCollection.updateOne(filter, updateDoc);
            transporter.sendMail({
                to: `${request.email}`,
                subject: "Apprent Partnership Request send",
                html: `
                    <div style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px;">
                        <div style="max-width: 600px; background-color: #ffffff; padding: 30px; margin: auto; border: 1px solid #e0e0e0; border-radius: 6px;">
                            <h2 style="color: #004085;">Apprent - Appointment Request</h2>
                            <p>Hello,</p>
                            <p>An Partnership Request from <strong>${request.contactPerson}</strong> from <strong>${request.organizationName}</strong> has been ${status} to <strong>Apprent</strong>.</p>
                            <p>Thank you,<br>The Apprent Team</p>
                            <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                                &copy; 2025 Apprent. All rights reserved.
                            </div>
                        </div>
                    </div>
                `,
            }).then(() => {
                console.log("Email Sent to client")
            }).catch(err => {
                console.log(err)
            })
            res.send(result)
        });
    }
    finally {

    }
}
run().catch(console.log);

app.get('/', (req, res) => {
    res.send('Doctors Portal server is running')
})


app.listen(port, () => console.log(`Apprent is running on port ${port}.`));