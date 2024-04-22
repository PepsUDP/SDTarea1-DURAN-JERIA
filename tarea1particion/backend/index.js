const express = require("express");
const pool = require("./db");
const cors = require('cors');
const Redis = require('ioredis');
const connectRedis =require('connect-redis');

const protoLoader = require("@grpc/proto-loader");
const PROTO_PATH = "./example.proto";

const app = express();

const port = process.env.BACKEND_PORT;

const grpc = require("@grpc/grpc-js");
const grpcc = require("./grpc_client");

const options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

app.use(cors());
app.use(express.json());

// const RedisStore =connectRedis(session);

const redisCluster = new Redis.Cluster([
  { host: 'redis-node1', port: 7000 },
  { host: 'redis-node2', port: 7001 },
  { host: 'redis-node3', port: 7002 }
], {
  redisOptions: {
    retryStrategy: times => Math.min(times * 50, 2000)
  }
});

redisCluster.on('error', (err) => console.error('Redis Cluster Error', err));




app.get("/", (req, res) => {
  res.send("Hello World!");
});


// *************
// Grpc
//**************


// http://localhost:3030/items/1?

app.get("/items/:item?", async (req, res) => {
  var { item } = req.params;
  if (item) {
    console.log("query al sv: ", item);
    grpcc.GetItem({name: item}, (error, items) => {
        console.log("query: previa");
        if (error){
            console.log(error);
            res.json({"fallo": "f"});
            return;
        } res.json(items);
        return;
    // console.log("query: paso");
    })
  }
});

const packageDefinition = protoLoader.loadSync(PROTO_PATH, options);
const ItemService = grpc.loadPackageDefinition(packageDefinition).ItemService;


// http://localhost:3030/test/1?
app.get("/test/:item?", async (req, res) => {
  var { item } = req.params;
  response = caller(item);
  res.json(response);
  return;
});

function caller(item){
  var client = new ItemService('0.0.0.0:4500',
                                       grpc.credentials.createInsecure());
  client.GetItem({name: item}, function(err, response) {
    console.log('Greeting: ', response);
    if (err){
      console.log(err);
      response = {"fallo": "f"};
      return response;
    }
  return response;
  });
}

// http://localhost:3030/lit/1?
app.get("/lit/:item?", async (req, res) => {
  var { item } = req.params;
  if (item) {
    var client = new ItemService('0.0.0.0:4500',
                                       grpc.credentials.createInsecure());
    console.log("query al sv: ", item);
    client.GetItem({name: item}, (error, items) => {
        console.log("query: lit");
        if (error){
            console.log(error);
            res.json({"fallo": "f"});
            return;
        } res.json(items);
        return;
    // console.log("query: paso");
    })
  }
});



// ******************
// Conexion BD y API
// ******************

app.get("/api/tweets", async (req, res) => {
  try {
    const tweets = await getOrSetCache("tweets", async () => {
      const getTweets = await pool.query("SELECT * FROM tweets LIMIT 5000");
      return getTweets;
    });
    res.json(tweets.rows);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});


// BD
app.get("/query/:name?", async (req, res) => {
  try {
    console.time('ProcessingTime');
    var { name } = req.params;
    name = name ?? "";
    const tweetsByName = await getOrSetCache(`tweetsbycontent:${name}`, async () => {
      name = '%' + name.toLowerCase() + '%';
      const getTweetsByName = await pool.query("SELECT * FROM tweets WHERE LOWER ( content ) LIKE $1 LIMIT 5000", [name]);
      return getTweetsByName;
    });
    console.timeEnd('ProcessingTime');
    res.json(tweetsByName.rows);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
});
  
function getOrSetCache(key, callback) {
  return new Promise((resolve, reject) => {
    redisCluster.get(key, async (error, data) => {
      if (error) {
        console.error('Redis get error: ', error);
        return reject(error);
      }
      if (data != null) {
        console.log(`${key} from redis`);
        return resolve(JSON.parse(data));
      }
      try {
        const freshData = await callback();
        redisCluster.set(key, JSON.stringify(freshData), 'EX', 3600);
        resolve (freshData);
      } catch (cbError) {
        console.error('Callback error: ', cbError);
        reject(cbError);
      }
    });
  });
}

app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
