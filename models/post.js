var mongodb = require('./db');
var markdown = require('markdown').markdown;
var util = require('util');

function Post(name,head,title,tags,post){
  this.name = name;
  this.title = title;
  this.tags = tags;
  this.post = post;
  this.head = head;
}

module.exports = Post;

Post.prototype.save = function(callback){
  var date = new Date();
  var time = {
    data: date,
    year: date.getFullYear(),
    month: date.getFullYear()+'_'+(date.getMonth()+1),
    day: date.getFullYear()+'_'+(date.getMonth()+1)+'_'+date.getDate(),
    minute: date.getFullYear()+'_'+(date.getMonth()+1)+'_'+date.getDate()+''+date.getHours()+':'+(date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes())
  };
  var post = {
    name : this.name,
    head : this.head,
    time : time,
    title : this.title,
    tags : this.tags,
    post : this.post,
    comments:[],
    reprint_info:{},
    pv: 0
  };
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.insert(post,{safe:true},function(err,result){
        console.log(util.inspect(result,{depth:null}));
        mongodb.close();
        if(err){
          return callback(err);
        }
        console.log('插入文章成功');
        callback(null,result.ops);
      });
    });
  });
};

Post.getTen = function(name,page,callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      var query = {};
      if(name){
        query.name = name;
      }
    collection.count(query,function(err,total){
      collection.find(query,{
        skip:(page - 1)*10,
        limit: 10
      }).sort({
        time:-1
      }).toArray(function(err,docs){
        if(err){
          return callback(err);
        }
        docs.forEach(function(doc){
          doc.post = markdown.toHTML(doc.post);
        });
        callback(null,docs,total);
      });
    });
    });
  });
};

Post.getOne = function(name,day,title,callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.findOne({'name':name,'time.day':day,'title':title},function(err,doc){
        if(err){
          return callback(err);
        }
        if(doc){
          collection.update({
            'name':name,
            'time.day':day,
            'title':title
          },{
            $inc:{'pv':1}
          },function(err){
            mongodb.close();
            if(err){
              console.log('getOne发生错误--->>>'+err);
              return callback(err);
            }
          });
          doc.post = markdown.toHTML(doc.post);
          doc.comments.forEach(function(comment){
            comment.content = markdown.toHTML(comment.content);
          });
        }
        callback(null,doc);
      });
    });
  });
};

Post.edit = function(name,day,title,callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.findOne({
        'name': name,
        'time.day': day,
        'title':title
      },function(err,doc){
        mongodb.close();
        if(err){
          return callback(err);
        }
        callback(null,doc);
      });
    });
  });
};

Post.update = function(name,day,title,post,callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.update({
        'name': name,
        'time.day': day,
        'title': title
      },{$set:{
        post:post
      }},function(err){
        mongodb.close();
        if(err){
          return callback(err);
        }
        callback(null);
      });
    });
  });
};
Post.remove = function(name,day,title,callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.findOne({
        'name':name,
        'time.day':day,
        'title':title
      },function(err,doc){
        if(err){
          mongodb.close();
          return callback(err);
        }
        var reprint_from = '';
        if(doc.reprint_info.reprint_from){
          reprint_from = doc.reprint_info.reprint_from;
        }
        if(reprint_from !== ""){
          collection.update({
            'name':reprint_from.name,
            'time.day':reprint_from.day,
            'title':reprint_from.title
          },{
            $pull:{
              'reprint_info.reprint_to':{
                'name':name,
                'day':day,
                'title':title
              }
            }
          },function(err){
            if(err){
              mongodb.close();
              return callback(err);
            }
          });
        }
        collection.remove({
          'name':name,
          'time.day':day,
          'title':title
        },{
          w:1
        },function(err){
          mongodb.close();
          if(err){
            return callback(err);
          }
          callback(null);
        });
      });
    });
  });
};
Post.getArchive = function(callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.find({},{
        'name':1,
        'time':1,
        'title':1
      }).sort({
        time:-1
      }).toArray(function(err,docs){
        mongodb.close();
        if(err){
          return callback(err);
        }
        console.log('存档的文章--->>>>'+util.inspect(docs,{depth:null}));
        callback(null,docs);
      });
    });
  });
};

Post.getTags = function(callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err,db);
    }
    db.collection('posts',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.distinct('tags',function(err,docs){
        mongodb.close();
        if(err){
          return callback(err);
        }
        console.log('getTags中输出的tags---->>>>'+util.inspect(docs,{depth:null}));
        callback(null,docs);
      });
    });
  });
};

Post.getTag = function(tag,callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      collection.find({
        tags : tag
      },{
        'name' : 1,
        'time' : 1,
        'title' : 1
      }).sort({
        time : -1
      }).toArray(function(err,docs){
        mongodb.close();
        if(err){
          return callback(err);
        }
        console.log('getTag中的查询结果----->>>>'+util.inspect(docs,{depth:null}));
        callback(null,docs);
      });
    });
  });
};
Post.search = function(keyword,callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      var pattern = new RegExp(keyword,'i');
      collection.find({
        'title':pattern,
      },{
        'name':1,
        'time':1,
        'title':1
      }).sort({
        time:-1
      }).toArray(function(err,docs){
        mongodb.close();
        if(err){
          return callback(err);
        }
        callback(null,docs);
      });
    });
  });
};

Post.reprint = function(reprint_from,reprint_to,callback){
  mongodb.open(function(err,db){
    if(err){
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      collection.findOne({
        'name':reprint_from.name,
        'time.day':reprint_from.day,
        'title':reprint_from.title
      },function(err,doc){
        if(err){
          mongodb.close();
          return callback(err);
        }
        var date = new Date();
        var time = {
          data: date,
          year: date.getFullYear(),
          month: date.getFullYear()+'_'+(date.getMonth()+1),
          day: date.getFullYear()+'_'+(date.getMonth()+1)+'_'+date.getDate(),
          minute: date.getFullYear()+'_'+(date.getMonth()+1)+'_'+date.getDate()+''+date.getHours()+':'+(date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes())
        };
        delete doc._id;
        doc.name = reprint_to.name;
        doc.head = reprint_to.head;
        doc.time = time;
        doc.title = (doc.title.search(/[转载]/)>-1)?doc.title:"[转载]"+doc.title;
        doc.comments =[];
        doc.reprint_info = {'reprint_from':reprint_from};

        collection.update({
          'name':reprint_from.name,
          'time.day':reprint_from.day,
          'title':reprint_from.title
        },{
          $push:{
            'reprint_info.reprint_to':{
              'name':doc.name,
              'day':time.day,
              title:doc.title
            }
          }
        },function(err){
          if(err){
            mongodb.close();
            return callback(err);
          }
        });
        collection.insert(doc,{
          safe:true
        },function(err,post){
          mongodb.close();
          if(err){
            return callback(err);
          }
          callback(err,post.ops[0]);
        });
      });
    });
  });
};
