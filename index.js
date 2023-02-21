const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { query } = require('express');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
// middle wares;
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ctkigle.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {

  try {
    const database = client.db('wathin');
    const newsCollection = database.collection('news');


    // Get All News.
    app.get('/news', async (req, res) => {
      const query = {};
      const cursor = newsCollection.find(query);
      const news = await cursor.toArray();
      res.send(news);
    })

    // Get Single New.
    app.get('/news/:slug', async (req, res) => {
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