const { Kafka } = require('kafkajs');


const kafka = new Kafka({
    "clientId": "myapp",
    "brokers" :["kafka1:9092","kafka2:9092"]
})

exports.producer = kafka.producer();
