const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


// middle wares;
app.use(cors());
app.use(express.json());

app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7kojv98.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const userTokenGenerator = (user) => {
  return jwt.sign({ user }, process.env.ACCESS_TOKEN, { expiresIn: '30d' })
}


const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Not Allow! Unauthorization Access!' })
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (error, decode) {
    if (error) {
      return res.status(403).send({ message: 'Not Allow! Forbidden Access!' })
    }

    req.decode = decode;
    next()
  })
}



async function run() {
  try {
    const database = client.db('wathin');
    const newsCollection = database.collection('news');
    const userCollection = database.collection("users");
    const projectCollection = database.collection("projects");

    // Register New User.
    app.post('/api/register', async (req, res) => {
      const { email, password, name } = req.body;

      const existingUser = await userCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email is already registered' });
      }
      const hashedPassword = await bcrypt.hashSync(password, 10);
      const user = { email, password: hashedPassword, name };
      const result = userCollection.insertOne(user);
      res.send({ success: true, message: 'User Register Successfully!', token: userTokenGenerator(user) })
    });

    // Login User
    app.post('/api/login', async (req, res) => {
      const { email, password } = req.body;
      const user = await userCollection.findOne({ email });
      if (user) {
        if (bcrypt.compareSync(password, user.password)) {
          res.send({
            _id: user._id,
            token: userTokenGenerator(user)
          });
          return;
        }
      }
      res.status(401).json({
        status: 'failed',
        message: 'User Credentail Does not match!'
      })

    })

    // Get User Info
    app.get('/api/user/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const user = await userCollection.findOne(query);
      const userInfo = {
        name: user.name,
        email: user.email
      }
      res.json(userInfo);
    });

    // Get All User Info
    app.get('/api/users', async (req, res) => {
      const query = {};
      const user = await userCollection.findOne(query);
      res.json(user);
    });


    // User Logout
    app.post('/api/logout', (req, res) => {
      res.json({ message: 'Successfully logged out' });
    });


    // Get All News.
    app.get('/api/news', async (req, res) => {
      const page = parseInt(req.query.page);
      const item = parseInt(req.query.itemPerPage);
      const query = {};
      const cursor = newsCollection.find(query);
      const news = await cursor.skip(page * item).limit(item).toArray();
      const countNews = await newsCollection.estimatedDocumentCount();
      res.send({ news, countNews });
    })

    // Get Spacifiz Author News.
    app.get('/api/auth-news', verifyJWT, async (req, res) => {
      const author = req.query.author;
      const query = { author: author };
      const cursor = newsCollection.find(query);
      const news = await cursor.toArray();
      res.send(news);
    })

    app.delete('/api/news/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const reault = await newsCollection.deleteOne(query);
      res.send(reault)
    })


    // Insert News.
    app.post('/api/add-news', verifyJWT, async (req, res) => {
      const news = req.body;
      await newsCollection.insertOne(news);
      res.send({ success: true, message: 'News Create Successfully!' })
    })

    // Create Project.
    app.post('/api/create-project', verifyJWT, async (req, res) => {
      const project = req.body;
      await projectCollection.insertOne(project);
      res.send({ success: true, message: 'News Create Successfully!' })
    })

    // Get All Projects.
    app.get('/api/projects', async (req, res) => {
      const query = {};
      const cursor = projectCollection.find(query);
      const project = await cursor.toArray();
      res.send(project);
    })


    // Get Spacifiz Author News.
    app.get('/api/auth-project', verifyJWT, async (req, res) => {
      const author = req.query.author;
      const query = { author: author };
      const cursor = projectCollection.find(query);
      const project = await cursor.toArray();
      res.send(project);
    })

    app.delete('/api/project/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const reault = await projectCollection.deleteOne(query);
      res.send(reault)
    })


    // Get Single New.
    app.get('/api/news/:slug', async (req, res) => {
      const slug = req.params.slug;
      const query = { slug: slug };

      const news = await newsCollection.findOne(query);
      res.send(news);
    })
  }
  finally {

  }
}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Wathin server is running!')
})

app.listen(port, () => {
  console.log(`Wathin server is running on ${port}`)
})