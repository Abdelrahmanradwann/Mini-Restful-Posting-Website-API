const express = require('express');
const app = express();
const kafkaTest = require('./routes/Kafka-test/producer');
const kafkaTest2  = require('./routes/Kafka-test/consumer');





app.use(kafkaTest);
app.use(kafkaTest2); 

app.use("/", (req, res) => {
    res.send("<h1>Hello world</h1>")
})


function test() {
    console.log("hello world")
}
test()

app.listen(process.env.PORT, () => {
    console.log(process.env.PORT)
})