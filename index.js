const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
var jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@hotelhaven-database.n0h5vlk.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const menuCollection = client.db("bistroDB").collection("menu");
const reviewCollection = client.db("bistroDB").collection("reviews");
const cartCollection = client.db("bistroDB").collection("carts");
const userCollection = client.db("bistroDB").collection("users");

// jwt relate api
app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "2h",
  });
  res.send({ token });
});

// verify token
const varifyToken = (req, res, next) => {
  // console.log("inside verify token", req.headers.authorization);
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "forbidden access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(401).send({ message: "forbiddeen access" });
    }
    req.decoded = decoded;
    next();
  });
  // next();
};

// varify admin use verify after varify token
const varifyAdmin =async(req,res,next)=>{
  const email=req.decoded.email;
  const query={email:email};
  const user =await userCollection.findOne(query);
  const isAdmin=user?.role === 'admin';
  if(!isAdmin){
    return res.status(403).send({message: 'forbidden access'})
  }
  next()
}


// user relate api

app.get("/users/admin/:email", varifyToken, async (req, res) => {
  const email = req.params.email;
  // console.log("email", req.params.email, req.decoded.email);
  if (email !== req.decoded.email) {
    return res.status(403).send({ message: "unauthorized access" });
  }

  const query = { email: email };
  const user = await userCollection.findOne(query);
  let admin = false;
  if (user) {
    admin = user.role === "admin";
  }
  res.send({ admin });
});

// get the user
app.get("/users", varifyToken,varifyAdmin, async (req, res) => {
  // console.log(req.headers);
  const result = await userCollection.find().toArray();
  res.send(result);
});

// user added to mongobd
app.post("/users", async (req, res) => {
  const user = req.body;
  // insert email if user doesnt exists

  // you cand do this many ways(1.email unique ,2.upsert,3.simple checking )

  const query = { email: user.email };
  const existingUser = await userCollection.findOne(query);
  if (existingUser) {
    return res.send({ message: "user already exists", insertedId: null });
  }

  const result = await userCollection.insertOne(user);
  res.send(result);
});

app.patch("/users/admin/:id",varifyToken,varifyAdmin, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const updatedDoc = {
    $set: {
      role: "admin",
    },
  };
  const result = await userCollection.updateOne(filter, updatedDoc);
  res.send(result);
});

app.delete("/users/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await userCollection.deleteOne(query);
  res.send(result);
});

// menu related api

app.get("/menu", async (req, res) => {
  const result = await menuCollection.find().toArray();
  res.send(result);
});
app.post('/menu',varifyToken,varifyAdmin ,async(req,res)=>{
  const menuItem= req.body;
  const result=await menuCollection.insertOne(menuItem);
  res.send(result)
})

app.get("/reviews", async (req, res) => {
  const result = await reviewCollection.find().toArray();
  res.send(result);
});
// add to mongodb cart api
app.post("/carts", async (req, res) => {
  const cartItem = req.body;
  const result = await cartCollection.insertOne(cartItem);
  res.send(result);
});

// delete
app.delete("/carts/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await cartCollection.deleteOne(query);
  res.send(result);
});
// get user wise carts
app.get("/carts", async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const result = await cartCollection.find(query).toArray();
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("boss is sitting");
});

app.listen(port, () => {
  console.log(`Bistro boss is sitting on port ${port}`);
});

/**
 * --------------------------------
 *      NAMING CONVENTION
 * --------------------------------
 * app.get('/users')
 * app.get('/users/:id')
 * app.post('/users')
 * app.put('/users/:id')
 * app.patch('/users/:id')
 * app.delete('/users/:id')
 *
 */
// const menuCollection = client.db("bistroDB ").collection("menu");
// const reviewCollection = client.db("bistroDB").collection("reviews");
// const cartCollection = client.db("bistroDB").collection("carts");

// app.get("/menu", async (req, res) => {
//   const result = await menuCollection.find().toArray();
//   res.send(result);
// });

// app.get("/reviews", async (req, res) => {
//   const result = await reviewCollection.find().toArray();
//   res.send(result);
// });

// app.post("/carts", async (req, res) => {
//   const cartItem = req.body;
//   const result = await cartCollection.insertOne(cartItem);
//   res.send(result);
// });
