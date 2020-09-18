const express = require('express');
const mongoose = require("mongoose");
const app = express();

mongoose.connect("mongodb+srv://admin:admin@cluster0.vpuqx.mongodb.net/iCrowdTaskDB?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error: '));

app.use(require('./routes/auth'));
app.use(require('./routes/worker'));
app.use(require('./routes/googleAuth'));

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8080;
}

const server = app.listen(port, function (req, res) {
    const host = server.address().address
    const port = server.address().port

  console.log("iCrowdTask app listening at http://%s:%s", host, port)
});