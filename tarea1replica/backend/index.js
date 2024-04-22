const express = require("express");
const pool = require("./db");
const cors = require('cors');
const redis = require('redis');
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

const redisMasterClient = redis.createClient({
  host: process.env.REDIS_MASTER_HOST || 'redis-master',
  port: process.env.REDIS_MASTER_PORT || 6379
});

const redisReplicaClients = [
  redis.createClient({
    host: process.env.REDIS_REPLICA1_HOST || 'redis-replica1',
    port: process.env.REDIS_REPLICA1_PORT || 6379
  }),
  redis.createClient({
    host: process.env.REDIS_REPLICA2_HOST || 'redis-replica2',
    port: process.env.REDIS_REPLICA2_PORT || 6379
    })
];

redisMasterClient.on("error", function(error) {
  console.error(`Redis master error: ${error}`);
});

redisReplicaClients.forEach(client => {
  client.on("error", function(error) {
    console.error(`Redis replica error: ${error}`);
  });
});



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
  }
});


// BD
app.get("/query/:name?", async (req, res) => {
  try {
    console.time('ProcessingTime');
    var { name } = req.params;
    // console.log(name);
    name = name ?? "";
    const tweetsByName = await getOrSetCache(`tweetsbycontent:${name}`, async () => {
      name = '%' + name + '%';
      const getTweetsByName = await pool.query("SELECT * FROM tweets WHERE LOWER ( content ) LIKE $1 LIMIT 5000", [name]);
      return getTweetsByName;
    });
    console.timeEnd('ProcessingTime');
    res.json(tweetsByName.rows);
  } catch (error) {
    console.log(error);
  }
});
  
let currentReplicaIndex = 0;

function getOrSetCache(key, callback) {
  return new Promise((resolve, reject) => {
    const replicaClient = redisReplicaClients[currentReplicaIndex];
    currentReplicaIndex = (currentReplicaIndex + 1) % redisReplicaClients.length;
    
    replicaClient.get(key, async (error, data) => {
      if (error) {
        console.error(error);
        return reject(error);
      }
      if (data != null) {
        console.log(`${key} from redis replica ${currentReplicaIndex}`);
        return resolve(JSON.parse(data));
      }
      const freshData = await callback();

      redisMasterClient.set(key, JSON.stringify(freshData), (err) => {
        if (err) console.error(`Error setting data in Redis master: ${err}`);
      });

      resolve (freshData);
    });
  });
}


app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
