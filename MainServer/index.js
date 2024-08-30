const express = require('express');
const app = express();
const kafkaTest = require('./routes/Kafka-test/producer');
const kafkaTest2  = require('./routes/Kafka-test/consumer');



// app.get('/', (req, res) => {
//     res.send("hello world "+ process.env.server);
// };
app.use(kafkaTest);
app.use(kafkaTest2);


app.listen(process.env.PORT, () => {
    console.log(process.env.PORT)
})