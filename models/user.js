var crypto = require('crypto');
var mongodb = require('./db');
var util = require('util');
function user(user){
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
}
module.exports = user;

user.prototype.save = function(callback){
var md5 = crypto.createHash('md5');
var email_MD5 = md5.update(this.email.toLowerCase()).digest('hex');
var head = 'http://www.gravatar.com/avatar/'+email_MD5+'?s=48';

  var _user = {
    name:this.name,
    password:this.password,
    email:this.email,
    head:head
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
        callback(null,result.ops[0]);
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
