const express = require("express")
const cors = require("cors")
const http = require("http")
const app = require("./app")






const server = http.createServer(app)

server.listen(5000,(err)=>{
    if(err)console.log("server crashed.")
    console.log("server started at port : 5000")
})

