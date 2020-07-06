const MongoClient = require('mongodb').MongoClient;

var _db;

module.exports = {

  connectToServer: function( callback ) {
    MongoClient.connect( "mongodb://49.50.102.36:27017",  { useNewUrlParser: true }, function( err, client ) {
      _db  = client.db('shop');
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  }
};
