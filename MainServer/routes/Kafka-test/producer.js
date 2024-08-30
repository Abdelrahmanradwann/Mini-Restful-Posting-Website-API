const express = require("express")
const router = express.Router();
const {Kafka} = require("kafkajs")


router.get("/producer", async(req, res) => {
       try
    {
         const kafka = new Kafka({
              "clientId": "myapp",
              "brokers" :["kafka1:9092","kafka2:9092"]
         })

        const producer = kafka.producer();
        console.log("Connecting.....")
        await producer.connect()
        console.log("Connected!")
        //A-M 0 , N-Z 1 
        const result =  await producer.send({
            "topic": "Photos",
            "messages": [
                {
                    "value": "hello world",
                }
            ]
        })

        console.log(`Send Successfully! ${JSON.stringify(result)}`)
           await producer.disconnect();
           res.send("dummy")
    }
    catch(ex)
    {
        console.error(`Something bad happened ${ex}`)
    }
    finally{
        // process.exit(0);
    }
})

module.exports= router;