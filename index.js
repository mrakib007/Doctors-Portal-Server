const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, CURSOR_FLAGS } = require('mongodb');

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vbw8r.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const appointmentOptionCollection = client.db('doctorsPortal').collection('appointmentOptions');
        const bookingsCollection = client.db('doctorsPortal').collection('bookings');

        app.get('/appointmentOptions',async(req,res)=>{
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();
            res.send(options);
        })

        app.post('/bookings',async(req,res)=>{
            const booking = req.body;
            console.log(booking);
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })
    }
    finally{

    }
}
run().catch(console.log);

app.get('/',async(req,res)=>{
    res.send('doctors portal server');
})

app.listen(port,()=>console.log(`doctors portal on ${port}`));