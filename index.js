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
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();
            const bookingQuery = {appointmentDate: date};
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            options.forEach(option =>{
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map((book => book.slot));
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
                option.slots = remainingSlots; 
            })
            res.send(options);
        })

        app.get('/v2/appointmentOptions', async(req,res) =>{
            const date = req.query.date;
            const options = await appointmentOptionCollection.aggregate([
                {
                    $lookup:
                    {
                      from: 'bookings',
                      localField: 'name',
                      foreignField:  'treatment',
                      pipeline:[
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$appointmentDate',date]
                                }
                            }
                        }
                      ],
                      as: 'booked',
                    }
                },
                {
                    $project: {
                        name: 1,
                        slots: 1,
                        booked: {
                            $map:{
                                input: '$booked',
                                as: 'book', 
                                in: '$book.slot'
                            }
                        }
                    }
                },
                {
                    $project: {
                        name: 1,
                        slots: {
                            $setDifference: ['$slots','$booked']
                        }
                    }
                }
            ]).toArray();
            res.send(options);
        })

        app.post('/bookings',async(req,res)=>{
            const booking = req.body;
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();

            if(alreadyBooked.length){
                const message = `You already have a booking for ${appointmentDate}`;
                return  res.send({acknowledged: false, message});
            }

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