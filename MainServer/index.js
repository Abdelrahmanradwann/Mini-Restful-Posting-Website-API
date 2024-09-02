const express = require('express');
const app = express();
// const kafkaTest = require('./routes/Kafka-test/producer');
// const kafkaTest2  = require('./routes/Kafka-test/consumer');
const authRoute = require('./routes/auth');




app.use(express.json());
app.use(express.urlencoded({ extended: true }))


app.use(authRoute);





app.listen(process.env.PORT, () => {
    console.log(process.env.PORT)
})