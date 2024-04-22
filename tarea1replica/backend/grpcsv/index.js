const express = require("express");
const pool = require("./db");
const cors = require('cors');
const redis = require('redis');
const connectRedis =require('connect-redis');
const app = express();


const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = "./example.proto";
const items = require("./data.json");

const port = 5000;

const server = require("./grpc_server");
server.server();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Hello World! GrpcSV here!");
});

// Query BD
// http://localhost:5000/api/itemsbyname/men?
app.get("/api/itemsbyname/:name?", async (req, res) => {
  try {
    var { username } = req.params;
    username = username ?? "";    
    username = '%' + username + '%';
    const tweetsByUsername = await pool.query("SELECT * FROM tweets WHERE LOWER ( username ) LIKE $1", [username]);

    // Respuesta BD
    res.json(tweetsByUsername.rows);

  } catch (error) {
    console.log(error);
  }
});


app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
