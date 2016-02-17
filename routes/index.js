// var express = require('express');
// var router = express.Router();
//
// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
var crypto = require('crypto');
var multer = require('multer');
var user = require('../models/user');
var Post = require('../models/post');
var util = require('util');
var date = new Date();
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'D:/nodejs-workspace/nosejs/blog/public/images');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '_' + date.getFullYear()+'_'+(date.getMonth()+1)+'_'+date.getDate()+''+date.getHours()+':'+(date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes()));
  }
});

var upload = multer({ storage: storage });

module.exports = function(app){
  app.get('/',function(req,res){
    Post.getAll(null,function(err,posts){
      if(err){
        posts = [];
      }
      res.render('index',{
        title:'主页',
        user:req.session.user,
        posts:posts,
        success:req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.get('/reg',checkNotLogin);
  app.get('/reg',function(req,res){
    res.render('reg',{
      title:'注册',
      user:req.session.user,
      success:req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  app.post('/reg',checkNotLogin);
  app.post('/reg',function(req,res){
      var name = req.body.name,
          password = req.body.password,
          password_re = req.body['password-repeat'];
      if(password != password_re){
        req.flash('error','两次输入的密码不一致！');
        return res.redirect('/reg');
      }
      var md5 = crypto.createHash('md5');
      password = md5.update(password).digest('hex');
      var newUser = new user({
        name : name,
        password : password,
        email : req.body.email
      });
      //检查用户是否已经存在
      user.get(newUser.name,function(err,user){
        if(err){
          req.flash('error',err);
          return res.redirect('/');
        }
        if(user){
          req.flash('error','用户名以存在');
          return res.redirect('/reg');
        }
        newUser.save(function(err,user){
          if(err){
            req.flash('error',err);
            return res.redirect('/reg');
          }
          req.session.user = user;
          req.flash('success','注册成功');
          res.redirect('/');
        });
      });
  });
  app.get('/login',checkNotLogin);
  app.get('/login',function(req,res){
      res.render('login',{
        title:'登录',
        user:req.session.user,
        success:req.flash('success').toString(),
        error: req.flash('error').toString()
      });
  });
  app.post('/login',checkNotLogin);
  app.post('/login',function(req,res){
      var md5 = crypto.createHash('md5');
      var password = md5.update(req.body.password).digest('hex');
      user.get(req.body.name,function(err,user){
        if(!user){
          req.flash('error','用户不存在');
          return res.redirect('/login');
        }
        if(user.password !=password){
          req.flash('error','密码错误');
          return res.redirect('/login');
        }
        req.session.user = user;
        req.flash('success','登陆成功');
        res.redirect('/');
      });
  });
  app.get('/post',checkLogin);
  app.get('/post',function(req,res){
    res.render('post',{
      title:'发表',
      user:req.session.user,
      success:req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  app.post('/post',checkLogin);
  app.post('/post',function(req,res){
    var currentUser = req.session.user;
    var post = new Post(currentUser.name,req.body.title,req.body.post);
    post.save(function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('/');
      }
      req.flash('success','发表成功');
      res.redirect('/');
    });
  });
  app.get('/logout',checkLogin);
  app.get('/logout',function(req,res){
    req.session.user = null;
    req.flash('success','退出成功！');
    res.redirect('/');
  });

  app.get('/upload',checkLogin);
  app.get('/upload',function(req,res){
    res.render('upload',{
      title:'文件上传',
      user:req.session.user,
      success:req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });

  app.post('/upload',checkLogin);
  app.post('/upload',upload.any(),function(req,res){
    console.log(req.files[0]);
    console.log(req.body);
    req.flash('success','文件上传成功');
    res.redirect('/');
  });

  app.get('/u/:name',function(req,res){
    user.get(req.params.name,function(err,user){
      if(!user){
        req.flash('error','用户不存在');
        return res.redirect('/');
      }
      Post.getAll(user.name,function(err,posts){
        if(err){
          req.flash('err',err);
          return res.redirect('/');
        }
        res.render('user',{
          title:user.name,
          posts:posts,
          user:req.session.user,
          success:req.flash('success').toString(),
          error:req.flash('error').toString()
        });
      });
    });
  });
app.get('/u/:name/:day/:title',function(req,res){
  Post.getOne(req.params.name,req.params.day,req.params.title,function(err,post){
    if(err){
      req.flash('error',err);
      return res.redirect('/');
    }
    res.render('article',{
      title: req.params.title,
      post:post,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
});

  function checkLogin(req,res,next){
    if(!req.session.user){
      req.flash('error','未登录！');
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req,res,next){
    if(req.session.user){
      req.flash('error','已登录!');
      res.redirect('back');
    }
    next();
  }

};
