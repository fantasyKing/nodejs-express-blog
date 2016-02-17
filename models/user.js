var mongodb = require('./db');
var util = require('util');
function user(user){
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}
module.exports = user;

user.prototype.save = function(callback){
  var _user = {
    name:this.name,
    password:this.password,
    email:this.email
  };
  mongodb.open(function(err,db){
    if(err)
      return callback(err);
    db.collection('users',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.insert(_user,{safe : true},function(err,result){
        if(err){
          mongodb.close();
          return callback(err);
        }
        console.log('用户插入成功');
        callback(null,result.ops);
        mongodb.close();
      });
    });

  });
};
user.get = function(name,callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('users',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.findOne({name:name},function(err,user){
        if(err){
          return callback(err);
        }
        callback(null,user);
      });
    });
  });
};
