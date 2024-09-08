// const express = require("express")
// const router = express.Router();
// const {Kafka} = require("kafkajs")


// router.get("/consumer", async(req, res) => {
//        try
//        {
//            console.log("hell yah")
//          const kafka = new Kafka({
//               "clientId": "myapp",
//              "brokers": ["kafka1:9092", "kafka2:9092"],
//              })
//          console.log("lalala")
//            const consumer = kafka.consumer({ "groupId": "1" }, { fetchMaxBytes: 10485760 })
//         console.log("Connecting.....")
//         await consumer.connect()
//         console.log("Connected!")
//         //A-M 0 , N-Z 1 
//         await consumer.subscribe({
//             "topic": "Photos",
//             "fromBeginning": true
//         })
        
//         await consumer.run({
//             "eachMessage": async result => {
//                 console.log(`RVD Msg ${result.message.value} on partition ${result.partition}`)
//             }
//         })

//     }
//       catch(ex)
//     {
//         console.error(`Something bad happened ${ex}`)
//     }
//     finally{
        
//     }
// })

// module.exports= router;