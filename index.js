const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vis12hn.mongodb.net/?appName=Cluster0&ssl=true&authSource=admin`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();

        const db = client.db('gameverse');
        const gamesCollection = db.collection('games');
        const ordersCollection = db.collection('orders');
        const dashBoardCollection = db.collection('dashBoard');
        const adminsCollection = db.collection('admins');

        // ─── ROOT ───────────────────────────────────────────────────────────────
        app.get('/', (_req, res) => res.send('Gameverse server running'));

        // ─── GAMES ──────────────────────────────────────────────────────────────
        app.get('/shop', async (_req, res) => {
            const result = await gamesCollection.find().toArray();
            res.send(result);
        });

        app.get('/shop/:id', async (req, res) => {
            try {
                const result = await gamesCollection.findOne({ _id: new ObjectId(req.params.id) });
                if (!result) return res.status(404).send({ message: 'Game not found' });
                res.send(result);
            } catch {
                res.status(400).send({ message: 'Invalid ID format' });
            }
        });

        app.post('/games', async (req, res) => {
            try {
                const result = await gamesCollection.insertOne(req.body);
                res.status(201).send(result);
            } catch (error) {
                res.status(400).send({ message: 'Failed to add game', error });
            }
        });

        app.put('/shop/:id', async (req, res) => {
            try {
                const result = await gamesCollection.updateOne(
                    { _id: new ObjectId(req.params.id) },
                    { $set: req.body }
                );
                if (result.matchedCount === 0) return res.status(404).send({ message: 'Game not found' });
                res.send(result);
            } catch {
                res.status(400).send({ message: 'Invalid ID or update data' });
            }
        });

        app.delete('/shop/:id', async (req, res) => {
            try {
                const result = await gamesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
                if (result.deletedCount === 0) return res.status(404).send({ message: 'Game not found' });
                res.send(result);
            } catch {
                res.status(400).send({ message: 'Invalid ID format' });
            }
        });

        // ─── ORDERS ─────────────────────────────────────────────────────────────
        app.get('/orders', async (req, res) => {
            const query = req.query?.email ? { email: req.query.email } : {};
            const result = await ordersCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/orders', async (req, res) => {
            try {
                const result = await ordersCollection.insertOne(req.body);
                res.status(201).send(result);
            } catch (error) {
                res.status(400).send({ message: 'Failed to add order', error });
            }
        });

        app.delete('/orders/:id', async (req, res) => {
            try {
                const result = await ordersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
                if (result.deletedCount === 0) return res.status(404).send({ message: 'Order not found' });
                res.send(result);
            } catch {
                res.status(400).send({ message: 'Invalid ID format' });
            }
        });

        // ─── DASHBOARD ──────────────────────────────────────────────────────────
        app.get('/dash_board', async (req, res) => {
            const query = req.query?.email ? { email: req.query.email } : {};
            const result = await dashBoardCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/dash_board', async (req, res) => {
            try {
                const result = await dashBoardCollection.insertOne(req.body);
                res.status(201).send(result);
            } catch (error) {
                res.status(400).send({ message: 'Failed to add dashboard entry', error });
            }
        });

        app.delete('/dash_board/:id', async (req, res) => {
            try {
                const result = await dashBoardCollection.deleteOne({ _id: new ObjectId(req.params.id) });
                if (result.deletedCount === 0) return res.status(404).send({ message: 'Entry not found' });
                res.send(result);
            } catch {
                res.status(400).send({ message: 'Invalid ID format' });
            }
        });

        // ─── ADMINS ─────────────────────────────────────────────────────────────
        // Register a new admin (called by your seed script or a super-admin UI)
        app.post('/admins/register', async (req, res) => {
            try {
                const { email } = req.body;
                if (!email) return res.status(400).send({ message: 'Email required' });
                const existing = await adminsCollection.findOne({ email });
                if (existing) return res.status(409).send({ message: 'Admin already exists' });
                const result = await adminsCollection.insertOne({ email, createdAt: new Date() });
                res.status(201).send(result);
            } catch (error) {
                res.status(500).send({ message: 'Server error', error });
            }
        });

        // Check whether an email belongs to an admin
        app.get('/admins/check', async (req, res) => {
            const { email } = req.query;
            if (!email) return res.status(400).send({ isAdmin: false });
            const admin = await adminsCollection.findOne({ email });
            res.send({ isAdmin: !!admin });
        });

        // List all admins  (protected by your own logic / secret header in production)
        app.get('/admins', async (_req, res) => {
            const result = await adminsCollection.find().toArray();
            res.send(result);
        });

        // Remove an admin
        app.delete('/admins/:id', async (req, res) => {
            try {
                const result = await adminsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
                if (result.deletedCount === 0) return res.status(404).send({ message: 'Admin not found' });
                res.send(result);
            } catch {
                res.status(400).send({ message: 'Invalid ID format' });
            }
        });

        console.log('Connected to MongoDB!');
    } catch (error) {
        console.error(error);
    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`Gameverse server running on port ${port}`);
});
