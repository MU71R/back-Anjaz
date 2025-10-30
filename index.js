
const express=require("express");
const mongoose =require("mongoose");
const http = require("http");
const app = express();
const path =require("path") 
const server = http.createServer(app);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.urlencoded({ extended: true }));
require('dotenv').config()
const cors = require("cors");
app.use(cors(
  {
    origin: "*",
    methods:["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }
));
app.use('/uploads', express.static('uploads'));
app.use("/", require("./routes/login"));
app.use("/users", require("./routes/users"));
app.use("/activity", require("./routes/activity"));
app.use("/criteria", require("./routes/Criteria"));
app.use("/notifications", require("./routes/notifications"));

const mongourl = process.env.MONGO_URL;
mongoose
.connect(mongourl)
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB Connection Error:", err));
const { init } = require("./socket");
const { pdfkit } = require("pdfkit");
init(server);
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
