const express = require('express');
const multer = require('multer');
const app = express();
var expressMongoDb = require('express-mongo-db');
require('dotenv/config');
 
global.__basedir = __dirname;

const postRoute = require('./routes/posts');
app.use(expressMongoDb('mongodb://49.50.102.36:27017/shop'));

//Middleware
app.post('/loadProducts', function(req,res){

    // -> Multer Upload Storage
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            if (file.fieldname === "uploadimages") { // if uploading resume
                cb(null, __basedir + '/uploads/images/');
            } else { // else uploading image                
                cb(null, __basedir + '/uploads/')
            }
        },
        filename: (req, file, cb) => {
            if (file.fieldname === "uploadimages") { // if uploading resume
                cb(null, file.originalname);
            } else { // else uploading image                
                cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname)
            }            
        }
    });
    var upload = multer({ storage : storage}).fields(
        [
          { 
            name: 'uploadimages', 
            maxCount: 100 
          }, 
          { 
            name: 'uploadfile', 
            maxCount: 1 
          }
        ]
      );
    upload(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }
        var excelFilePath = req.files.uploadfile[0].path;
        if(req.files.uploadfile[0].path === undefined || excelFilePath==''){
            return res.end('Please upload a valid file');
        }

        postRoute.postRequest(req, res, excelFilePath);
    }); 
});

app.get('/loadProducts', function(req,res){
    postRoute.getRequest(req, res);
});

//Routes
app.get('/', (req, res) => {
    res.send('GET API WORKING');
});
//Listening to Port
app.listen(3000);