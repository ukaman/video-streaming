const express = require("express");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 8000;


app.get("/", (req, res) => {
    //add authentication layer 
    res.sendFile(__dirname + "/index.html");
});

app.get("/playVideo", (req ,res) => {
    
    //ensuring incoming req has the range specified in one of the req headers
    const range = req.headers.range;
    if(!range){
        res.status(400).send("Range header required!");
    }
    
    //get file info of video to be delivered
    const videoPath = "bigbuck.mp4";
    const videoSize = fs.statSync("bigbuck.mp4").size;

    const CHUNK_SIZE = 10 ** 6; //each sub-sequent http req streams 1MB of data
    
    //find range of the video chunk that needs to be sent in this particular http res   
    //(i.e. start and end points within the vid) 
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    //build res headers
    const contentLength = end-start+1;
    const resHeaders = {
        "Content-Range":`bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges":"bytes",
        "Content-Length":contentLength,
        "Content-Type":"video/mp4",
    };

    //http status code 206 means 'partial content'
    //browser now knows to make more http requests to stream next data chunk of the video from server when the user has finished watching from prev chunk
    res.writeHead(206, resHeaders);

    //now, we have written just the headers
    //we still need to attach the actual data to the response

    //we do this by creating a read stream of the video's current chunk as follows - 
    const videoStream = fs.createReadStream(videoPath, {start, end});

    //and piping it into the res i.e. ~append to res
    videoStream.pipe(res);
});

app.listen(port, ()=>{
    console.log("listening on port: " + port);
});