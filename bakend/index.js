
const express=require("express");
const mongoose =require("mongoose");
const app = express();
app.use (express.json());
require('dotenv').config()
const cors = require("cors");
app.use(cors(
  {
    origin: "http://localhost:4200",
    methods:["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }
));
app.use("/", require("./routes/login"));
const mongourl = process.env.MONGO_URL;
mongoose
  .connect(mongourl)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})
