const express = require("express")
const router = express.Router();
const {Kafka} = require("kafkajs")


router.get("/producer", async(req, res) => {
       try
    {
         const kafka = new Kafka({
              clientId: "myapp",
              brokers :["kafka1:9092","kafka2:9092"]
         })

        const producer = kafka.producer();
        console.log("Connecting.....")
        await producer.connect()
        console.log("Connected!")
           let ress = undefined;
           //A-M 0 , N-Z 1 
           try {
                ress = await producer.send({
                   topic: "Photos",
                   messages: [
                       {
                           value: "hello world",
                       }
                   ]
               })
           } catch (err) {
               return res.status(400).json({ msg: err });
           }

        console.log(`Send Successfully! ${JSON.stringify(ress)}`)
           await producer.disconnect();
            return res.status(201).json({ msg: "great" });

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