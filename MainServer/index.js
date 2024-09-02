const express = require('express');
const app = express();
require('dotenv').config();
// const kafkaTest = require('./routes/Kafka-test/producer');
// const kafkaTest2  = require('./routes/Kafka-test/consumer');
const authRoute = require('./routes/auth');




app.use(express.json());


app.use(authRoute);

app.use((err,req, res, next) => {
    res.status(500).json({
        errors: "Something went wrong"
    });
});



app.listen(process.env.PORT, () => {
    console.log(process.env.PORT)
})