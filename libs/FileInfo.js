const mongoose = require('mongoose');

var fileInfoSchema = {
    fileName : {type : String , unique : true},
    modifiedDate : { type : String , unique : true},
    relatedFiles : {type : Array}
};

const FileInfo = mongoose.model('fileInfo' fileInfoSchema);

module.exports = FileInfo;
 
