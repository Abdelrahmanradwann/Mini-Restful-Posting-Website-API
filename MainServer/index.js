const express = require('express');
const app = express();


app.get('/', (req, res) => {
    res.send("hello world "+ process.env.server);
})

app.listen(process.env.PORT, () => {
    console.log(process.env.PORT)
})