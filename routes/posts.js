const express = require('express');
const xlsxFile = require('read-excel-file/node');
var ObjectID = require('mongodb').ObjectID;
const fs = require('fs');

const imgDir = 'D:\\BHA\\images\\products\\';


module.exports = {
    getRequest : function(req, res){
        var filename = req.query.filepath;
        processData(filename, req, res);
    },
    postRequest : function(req, res, excelFilePath){
        var filename = excelFilePath;
        processData(filename, req, res);
    }
};

function processData(filename, req, res) {
    let filePath = filename;
    var db = req.db;
    var countRows =1;
    xlsxFile(filePath).then((rows) => {
            rows.forEach((entry) => {
                if(countRows++!=1){
                    let enabled = true;
                    let discontinued = false;
                    let stockManage = false;
                    let preOrderFlag = false;
                    let backOrderFlag = false;
                    let sku = entry[3];
                    sku=sku.replace(/[^a-zA-Z0-9-]/g, "-").toUpperCase();
                    let slug = sku.toLowerCase();
                    if(entry[15]=='TRUE'){
                        stockManage = true;
                    }
                    if(entry[16]=='TRUE'){
                        preOrderFlag = true;
                    }
                    if(entry[17]=='TRUE'){
                        backOrderFlag = true;
                    }
                    if(entry[19]=='TRUE'){
                        enabled = true;
                    }
                    if(entry[18]=='TRUE'){
                        discontinued = true;
                    }
                    let catname = entry[1];
                    let partnames = entry[2];
                    let partnamesArr = [];
                    if(partnames.indexOf(',')!=-1){
                        partnamesArr = partnames.split(',');
                    }else if(partnames!=null && partnames!=''){
                        partnamesArr.push(partnames);
                    }
                    let catid = "";
                    let parttypeids = [];
                    let imgArr=  [];
                    let imgNames=entry[13];
                    let imgNamesArray = [];
                    let imgPath=entry[14];
                    let weight= parseInt(0);
                    let stockQuantity = parseInt(0);
                    let stockExpectedDate = '';
                    let fromSaleDate = '';
                    let toSaleDate = '';
                    let regularPrice=parseFloat(0);
                    let salePrice=parseFloat(0);
                    let regPr = entry[5]+'';
                    let salePr = entry[6]+'';
                    if(regPr.indexOf('$')!=-1){
                        regPr=regPr.replace('$','');
                    }
                    if(salePr.indexOf('$')!=-1){
                        salePr=salePr.replace('$','');
                    }
                    if(salePr!=null && salePr!=''){
                        salePrice = parseFloat(salePr);
                    }
                    if(regPr!=null && regPr!=''){
                        regularPrice = parseFloat(regPr);
                    }
                    if(entry[8]!=null && entry[8]!=''){
                        toSaleDate = new Date(entry[8]);
                    }
                    if(entry[7]!=null && entry[7]!=''){
                        fromSaleDate = new Date(entry[7]);
                    }
                    if(entry[11]!=null && entry[11]!=''){
                        stockExpectedDate = new Date(entry[11]);
                    }
                    if(entry[9]!=null && entry[9]!=''){
                        stockQuantity =  parseInt(entry[9]);
                    }
                    if(entry[10]!=null && entry[10]!=''){
                        weight = parseInt(entry[10]);
                    }
                    if(imgNames==null || imgNames.trim()==''){
                        imgNames = '';
                    }
                    if(imgPath==null){
                        imgNames = '';
                    }
                    if(imgNames!=null && imgNames.trim()!=''){
                        imgNamesArray = imgNames.split(',');
                        imgNamesArray.forEach((img)=>{                    
                            let imgObj = {
                                id : new ObjectID(),
                                alt : '',
                                position : 0,
                                filename : img
                            }
                            imgArr.push(imgObj);
                        });
                    }
                    let imgDimension = {
                        length : 0,
                        width : 0,
                        height : 0
                    };
                    db.collection('productCategories').findOne({name:catname}, function(err, result) {
                        if (err) throw err;
                        if(result!=null){
                            catid = ObjectID(result._id);
                        }
                        var countArr = 0;
                        partnamesArr.forEach(partname => {       
                            countArr++;
                            db.collection('productCategories').findOne({name:partname}, function(err, docs){
                                // docs array here contains all queried docs
                                if (err) throw err;
                                if(docs!=null){
                                    parttypeids.push(ObjectID(docs._id));
                                }
                                if(countArr===partnamesArr.length){
                                    db.collection('products').updateOne(
                                        { sku: sku },
                                        { 
                                            $set: {                                                    
                                                    date_updated: new Date(), 
                                                    images: imgArr,
                                                    dimensions: imgDimension, 
                                                    name: entry[4], 
                                                    description: entry[4],
                                                    meta_description: entry[4], 
                                                    meta_title: entry[4], 
                                                    tags:[],
                                                    attributes : [],
                                                    attenabledributes : {},
                                                    enabled: enabled, 
                                                    discontinued:discontinued,
                                                    slug: slug, 
                                                    sku: sku,                                    
                                                    code : "",
                                                    tax_class : "",
                                                    related_product_ids : [],
                                                    prices : [],
                                                    cost_price : 0,
                                                    regular_price: regularPrice, 
                                                    sale_price: salePrice, 
                                                    quantity_inc: 0,
                                                    weight:weight, 
                                                    quantity_min: 0,
                                                    stock_quantity: stockQuantity,
                                                    position:0,
                                                    date_stock_expected:stockExpectedDate,
                                                    date_sale_from:fromSaleDate,
                                                    date_sale_to:toSaleDate,
                                                    stock_tracking: stockManage, 
                                                    stock_preorder: preOrderFlag, 
                                                    stock_backorder: backOrderFlag, 
                                                    category_id: catid, 
                                                    category_ids: parttypeids
                                                },
                                            $setOnInsert: { date_created: new Date() }
                                        },
                                        { upsert: true }, 
                                        function(err, docs){
                                            db.collection('products').findOne({sku:sku}, function(err, docs){
                                                if (err) throw err;
                                                if(docs!=null){
                                                    var imgId = docs._id;
                                                    var tempDir = imgDir + imgId;
                                                    if(imgNamesArray.length>0){
                                                        if (!fs.existsSync(tempDir)){
                                                            fs.mkdirSync(tempDir);
                                                        }
                                                    }
                                                    imgNamesArray.forEach((img)=>{
                                                        var destPath =  tempDir + '/' + img;
                                                        var sourcePath = __basedir + '/uploads/images/' + img;
                                                        fs.copyFile(sourcePath, destPath, (err) => {
                                                            if (err) throw err;
                                                            console.log(img + ' was copied to destination');
                                                        });
                                                    });
                                                }
                                            });
                                        }
                                    );
                                }
                            });
                        });                        
                    });
                }
            });
    });
    res.send('Data Uploaded Successfully');
}