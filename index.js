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

app.get('/seed-games', async (_req, res) => {
    const games = [
        { image: "https://i.ibb.co.com/3hK52pm/Witcher-3-cover-art.jpg", name: "The Witcher 3: Wild Hunt", company: "CD Projekt Red", category: "RPG, Open World", short_description: "An open-world action RPG set in a richly detailed fantasy universe.", rating: 5, price: 39.99 },
        { image: "https://i.ibb.co.com/TR51WTb/red-dead-redemption-2.jpg", name: "Red Dead Redemption 2", company: "Rockstar Games", category: "Open World, Action", short_description: "A story-driven open-world game set in the dying days of the American Wild West.", rating: 5, price: 59.99 },
        { image: "https://i.ibb.co.com/SRShdY9/download.jpg", name: "The Legend of Zelda: Breath of the Wild", company: "Nintendo", category: "Open World, Adventure", short_description: "Explore the vast kingdom of Hyrule in an open-world adventure.", rating: 5, price: 59.99 },
        { image: "https://i.ibb.co.com/4Nj11BV/god-of-war.jpg", name: "God of War", company: "Santa Monica Studio", category: "Action, RPG", short_description: "Follow Kratos and his son Atreus through the realm of Norse gods.", rating: 5, price: 49.99 },
        { image: "https://i.ibb.co.com/NmZnQZx/Minecraft-cover.png", name: "Minecraft", company: "Mojang", category: "Sandbox, Open World", short_description: "A sandbox game where players build and explore infinite blocky worlds.", rating: 5, price: 26.95 },
        { image: "https://i.ibb.co.com/dcwr6R5/fortnite-ezgif-com-webp-to-jpg-converter.jpg", name: "Fortnite", company: "Epic Games", category: "Battle Royale, FPS", short_description: "A massively popular battle royale game with unique building mechanics.", rating: 4, price: 0.00 },
        { image: "https://i.ibb.co.com/sqDKW5d/cod-mw-2.jpg", name: "Call of Duty: Modern Warfare II", company: "Infinity Ward", category: "FPS, Multiplayer", short_description: "A fast-paced first-person shooter known for its multiplayer combat.", rating: 4, price: 69.99 },
        { image: "https://i.ibb.co.com/XjVd594/league-of-legends.jpg", name: "League of Legends", company: "Riot Games", category: "MOBA", short_description: "A multiplayer online battle arena game with strategic combat.", rating: 5, price: 0.00 },
        { image: "https://i.ibb.co.com/R2kPqyJ/Elden-Ring-Box-art.jpg", name: "Elden Ring", company: "FromSoftware", category: "RPG, Open World", short_description: "A challenging open-world RPG in a dark and mysterious world.", rating: 5, price: 59.99 },
        { image: "https://i.ibb.co.com/tMYS6R2/Apex-legends-cover.jpg", name: "Apex Legends", company: "Respawn Entertainment", category: "Battle Royale, FPS", short_description: "A hero-based battle royale shooter with fast-paced action.", rating: 4, price: 0.00 },
        { image: "https://i.ibb.co.com/nCSyYcs/Grand-Theft-Auto-V.png", name: "Grand Theft Auto V", company: "Rockstar Games", category: "Open World, Action", short_description: "An expansive open-world game set in the fictional city of Los Santos.", rating: 5, price: 29.99 },
        { image: "https://i.ibb.co.com/x1rdnq8/Cyberpunk-2077-box-art.jpg", name: "Cyberpunk 2077", company: "CD Projekt Red", category: "RPG, Open World", short_description: "An open-world RPG set in a dystopian future cybernetic city.", rating: 4, price: 49.99 },
        { image: "https://i.ibb.co.com/YWGK3wz/images.jpg", name: "Overwatch 2", company: "Blizzard Entertainment", category: "FPS, Team-based", short_description: "A fast-paced team shooter with a diverse cast of heroes.", rating: 4, price: 0.00 },
        { image: "https://i.ibb.co.com/wCmHpFb/among-us.jpg", name: "Among Us", company: "InnerSloth", category: "Party, Strategy", short_description: "A multiplayer game of teamwork and betrayal aboard a spaceship.", rating: 4, price: 4.99 },
        { image: "https://i.ibb.co.com/CMrh3vX/horizon.jpg", name: "Horizon Forbidden West", company: "Guerrilla Games", category: "Action, RPG", short_description: "An open-world action game following Aloy into dangerous new lands.", rating: 5, price: 69.99 },
        { image: "https://i.ibb.co.com/f49pvL7/valorant.jpg", name: "Valorant", company: "Riot Games", category: "FPS, Tactical", short_description: "A tactical first-person shooter emphasizing precise aim and strategy.", rating: 4, price: 0.00 },
        { image: "https://i.ibb.co.com/tZhb8Dp/ac-valhalla.jpg", name: "Assassin's Creed Valhalla", company: "Ubisoft", category: "Action, RPG, Open World", short_description: "An open-world action RPG set during the Viking age.", rating: 4, price: 59.99 },
        { image: "https://i.ibb.co.com/RgyHgKT/dark-souls-3.jpg", name: "Dark Souls III", company: "FromSoftware", category: "RPG, Action", short_description: "A challenging action RPG with dark atmosphere and intense combat.", rating: 5, price: 49.99 },
        { image: "https://i.ibb.co.com/Yfg96fv/genshin-impact.jpg", name: "Genshin Impact", company: "miHoYo", category: "RPG, Open World", short_description: "A free-to-play open-world RPG exploring the fantasy world of Teyvat.", rating: 4, price: 0.00 },
        { image: "https://i.ibb.co.com/gMSbh25/fifa-23.jpg", name: "FIFA 23", company: "EA Sports", category: "Sports", short_description: "A football simulation game with realistic gameplay and updated rosters.", rating: 4, price: 59.99 },
    ];
    try {
        const db = client.db('gameverse');
        const gamesCollection = db.collection('games');
        await gamesCollection.deleteMany({});
        const result = await gamesCollection.insertMany(games);
        res.send({ message: `Seeded ${result.insertedCount} games successfully!` });
    } catch (error) {
        res.status(500).send({ message: 'Seed failed', error });
    }
});

app.listen(port, () => {
    console.log(`Gameverse server running on port ${port}`);
});
