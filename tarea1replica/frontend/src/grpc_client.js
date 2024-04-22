// const grpc = require("@grpc/grpc-js");
// const protoLoader = require("@grpc/proto-loader");

// const PROTO_PATH = "../item.proto";

// // const options = {
// //     keepCase: true,
// //     longs: String,
// //     enums: String,
// //     defaults: true,
// //     oneofs: true,
// //   };

//   // const packageDefinition = protoLoader.loadSync(PROTO_PATH, options);
//   // const ItemService = grpc.loadPackageDefinition(packageDefinition).ItemService;
//   // const client = new ItemService("localhost:50051", grpc.credentials.createInsecure());

// // client.getItems({
// //   "name": "men"
// // }, (err, response) => {
// //   console.log("received from server");
// // }) 

// const packageDef = protoLoader.loadSync(PROTO_PATH, {});
// const grpcObject = grpc.loadPackageDefinition(packageDef);
// const itemPackage = grpcObject.itemPackage;
// const client = new itemPackage.ItemService("0.0.0.0:50051", grpc.credentials.createInsecure());

// client.getItems({
//   "name": "men"
// }, (err, response) => {
//   console.log("received from server" + JSON.stringify(err) + JSON.stringify(response));
// })

//   module.exports = client;