var path = require('path');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var colors = require('colors');
var cors = require('cors');
var express = require('express');
var compression = require('compression')
var logger = require('morgan');
var jwt = require('jwt-simple');
var moment = require('moment');
var mongoose = require('mongoose');
var request = require('request');

var config = require('./config');

var userSchema = new mongoose.Schema({
    email: {type: String, unique: true, lowercase: true},
    password: {type: String, select: false},
    displayName: String,
    picture: String
});

userSchema.pre('save', function (next) {
  var user = this;
  if (!user.isModified('password')) {
    return next();
  }
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(user.password, salt, function (err, hash) {
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function (password, done) {
    bcrypt.compare(password, this.password, function (err, isMatch) {
        done(err, isMatch);
    });
};

var User = mongoose.model('User', userSchema);


/*
Startup Schema
*/
var startupSchema = new mongoose.Schema({
  name: {type: String},
  createdById: String,
  createdAt: {type: Date, default: Date.now},
  description: {type: String},
  location: String,
  sectors: [String],
  twitter_handle: String,
  twitterInfo: [{ 
    name: String,
    location: String,
    description: String,
    twitterImage: String,
    url: String,
    followersCount: Number,
    friendsCount: Number,
    listedCount: Number,
    createdAt: Date,
    favouritesCount: Number,
    statusesCount: Number,
    lang: String,
    fetchedOn: {
      type: Date, default: Date.now
    }
  }],
  websiteUrl: String,
  alexaInfo: [{
    globalRank: String,
    countryRank: {
      rank: String,
      country: String
    },
    engagement: {
      bounceRate: String,
      dailyPageViewPerVisitor: String,
      dailyTimeOnSite: String 
    },
    fetchedOn: {
      type: Date, default: Date.now
    }
  }],
  facebookHandle: String,
  facebookInfo: [{
    likes: String,
    about: String,
    category: String,
    link: String,
    name: String,
    talking_about_count: String,
    username: String,
    website: String,
    were_here_count: String,
    fetchedOn: {
      type: Date, default: Date.now
    }
  }],
  googlePlayHandle: String,
  googlePlayInfo: [{
    title: String,
    url: String,
    icon: String,
    minInstalls: Number,
    maxInstalls: Number,
    score: Number,
    histogram: {},
    fetchedOn: {
      type: Date, default: Date.now
    }
  }]
});


var Startup = mongoose.model('Startup', startupSchema);

var projectSchema = new mongoose.Schema({
});

var Project = mongoose.model('Project', projectSchema)



mongoose.connect(config.MONGO_URI);
mongoose.connection.on('error', function (err) {
    console.log('Error: Could not connect to MongoDB. Did you forget to run `mongod`?'.red);
});

var app = express();

app.set('port', process.env.PORT || 8080);
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Force HTTPS on Heroku
if (app.get('env') === 'production') {
    app.use(function (req, res, next) {
        var protocol = req.get('x-forwarded-proto');
        protocol == 'https' ? next() : res.redirect('https://' + req.hostname + req.url);
    });
}
app.use(compression());
app.use(express.static(path.join(__dirname, '/public')));

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function ensureAuthenticated(req, res, next) {
    if (!req.headers.authorization) {
        return res.status(401).send({message: 'Please make sure your request has an Authorization header'});
    }
    var token = req.headers.authorization.split(' ')[1];

    var payload = null;
    try {
        payload = jwt.decode(token, config.TOKEN_SECRET);
    }
    catch (err) {
        return res.status(401).send({message: err.message});
    }

    if (payload.exp <= moment().unix()) {
        return res.status(401).send({message: 'Token has expired'});
    }
    req.user = payload.sub;
    next();
}

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createJWT(user) {
    var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
    };
    return jwt.encode(payload, config.TOKEN_SECRET);
}

/*
 |--------------------------------------------------------------------------
 | GET /api/me
 |--------------------------------------------------------------------------
 */
app.get('/api/me', ensureAuthenticated, function (req, res) {
    User.findById(req.user, function (err, user) {
        res.send(user);
    });
});

/*
 |--------------------------------------------------------------------------
 | PUT /api/me
 |--------------------------------------------------------------------------
 */
app.put('/api/me', ensureAuthenticated, function (req, res) {
  var $set = { $set: {} };
  if(req.body.displayName)
    $set.$set['displayName'] = req.body.displayName;
  if(req.body.email)
    $set.$set['email'] = req.body.email;
  User.update({_id:req.user}, $set ,function(err){
    if(err)
      return res.send(err)
    res.status(200).end();
  });
});


/*
 |--------------------------------------------------------------------------
 | Log in with Email
 |--------------------------------------------------------------------------
 */
app.post('/auth/login', function (req, res) {
    User.findOne({email: req.body.email}, '+password', function (err, user) {
        if (!user) {
            return res.status(401).send({message: 'Wrong email and/or password'});
        }
        user.comparePassword(req.body.password, function (err, isMatch) {
            if (!isMatch) {
                return res.status(401).send({message: 'Wrong email and/or password'});
            }
            res.send({token: createJWT(user)});
        });
    });
});

/*
 |--------------------------------------------------------------------------
 | Create Email and Password Account
 |--------------------------------------------------------------------------
 */
app.post('/auth/signup', function (req, res) {
    User.findOne({email: req.body.email}, function (err, existingUser) {
        if (existingUser) {
            return res.status(409).send({message: 'Email is already taken'});
        }
        var user = new User({
            displayName: req.body.displayName,
            email: req.body.email,
            password: req.body.password
        });
        user.save(function () {
            res.send({token: createJWT(user)});
        });
    });
});

/**
 * Create Startup
 */
app.post('/api/startup/create', ensureAuthenticated, function (req, res) {
  var startup = new Startup({
    name: req.body.name,
    createdById: req.user,
    description: req.body.description,
    location: req.body.location,
    sectors: req.body.sectors
  });
  startup.save(function (err, startup) {
    if (err)
      return res.status(400).send(err);
    return res.send(startup);
  });
});

/**
 * Get Startups 
  var re = new RegExp(req.params.search, 'i');

  app.User.find().or([{ 'firstName': { $regex: re }}, { 'lastName': { $regex: re }}]).sort('title', 1).exec(function(err, users) {
      res.json(JSON.stringify(users));
  });
 */
app.get('/api/startups', ensureAuthenticated, function (req, res) {
  var re = new RegExp('', 'i');
  var sortObject = {};
  var stype = req.query.sortBy||'createdAt';
  var sdir = req.query.sortDir|| 1;
  sortObject[stype] = sdir;
  var startupProjection = {
    name: true,
    description: true,
    location: true,
    sectors:true 
  };
  Startup.find()
  .or([{ 'name': { $regex: re }}, { 'description': { $regex: re }}, { 'sectors': { $regex: re }}])
  .select(startupProjection)
  .sort(sortObject)
  .exec(function(err, startups) {
    if (err)
      return res.status(400).send({message: 'no startups found'});
    return res.send(startups);
  });
});

/**
 * Fetch startup based on _id
 */
app.get('/api/startups/:id', ensureAuthenticated, function (req, res) {
  var startupProjection = {
    twitterInfo:{$slice: -1},
    alexaInfo: {$slice: -1},
    facebookInfo: {$slice: -1},
    googlePlayInfo: {$slice: -1}
  };
  Startup.findOne({_id: req.params.id}, startupProjection, function (err, startup) {
    if (err)
      return res.status(400).send({message: 'no such startup found'});
    return res.send(startup);
  });
});

/**
 * Update startup
 */
app.put('/api/startup', ensureAuthenticated, function (req, res) {
  var $set = { $set: {} };
  if(req.body.name)
    $set.$set['name'] = req.body.name;
  if(req.body.description)
    $set.$set['description'] = req.body.description;
  if(req.body.location)
    $set.$set['location'] = req.body.location;
  if(req.body.sectors)
    $set.$set['sectors'] = req.body.sectors;
  if(req.body.twitter_handle)
    $set.$set['twitter_handle'] = req.body.twitter_handle;
  if(req.body.websiteUrl)
    $set.$set['websiteUrl'] = req.body.websiteUrl;
  if(req.body.facebookHandle)
    $set.$set['facebookHandle'] = req.body.facebookHandle;
  if(req.body.googlePlayHandle)
    $set.$set['googlePlayHandle'] = req.body.googlePlayHandle;
  Startup.update({_id:req.body.id}, $set ,function(err){
    if(err)
      return res.status(400).send({message: 'Update Failed'});
    res.status(200).send({message: 'Update values:'+JSON.stringify($set.$set)});
  });
}); 

/**
 * Update twitter Info
 */

var Twitter = require('twitter-node-client').Twitter;
var twitterConfig = {
    "consumerKey": "OP1bjc2rD1Rg1kbkmpkVn6qri",
    "consumerSecret": "36k2UR5uCTNDZA8Rp5igXwMrqSY7lz2KW7wE5UCFQrgjpaUuKa",
    "accessToken": "2478478806-SrKSO0CQtHMgvmQ9Z4RFeEivmMqAQMBfykuqqJq",
    "accessTokenSecret": "aPMD1YqzFiQpnfTeO5LcQuX7b4hVf75uylVufAQkQDGl3"
}
var twitter = new Twitter(twitterConfig);
  
app.put('/api/twitter/details', ensureAuthenticated ,function(req,res){
  twitter.getUser({ screen_name: req.body.twitter_handle, include_entities: false},function(err){
    return res.send(err);
  },function(data){
    data = JSON.parse(data);
    var twitterInfo = {
      "name": data.name,
      "location": data.location,
      "description": data.description,
      "twitterImage": data.profile_image_url_https,
      "url": data.url,
      "followersCount": data.followers_count,
      "friendsCount": data.friends_count,
      "listedCount": data.listed_count,
      "createdAt": data.created_at,
      "favouritesCount": data.favourites_count,
      "statusesCount": data.statuses_count,
      "lang": data.lang,
      "fetchedOn": Date.now()
    }
    Startup.findByIdAndUpdate(
     req.body.id,
     { $push: {"twitterInfo": twitterInfo}},
     {  safe: true, upsert: true},
      function(err, model) {
        if(err){
          return res.send(err);
        }
        return res.send(twitterInfo);
      }
    );
  });
});

/**
 * Update Alexa Data 
 */
var alexaData = require('alexa-traffic-rank');
app.put('/api/alexa/details', ensureAuthenticated, function(req, res){
  alexaData.AlexaWebData(req.body.websiteUrl, function(err, result) {
    if(err)
      return res.send(err);
    Startup.findById(req.body.id, function (err, startup) {
      if(err)
        return res.send(err);
      result.fetchedOn = Date.now() 
      startup.alexaInfo.push({ 
        globalRank: result.globalRank, 
        countryRank: {
          rank: result.countryRank.rank,
          country: result.countryRank.country
        },
        engagement: {
          bounceRate: result.engagement.bounceRate,
          dailyPageViewPerVisitor: result.engagement.dailyPageViewPerVisitor,
          dailyTimeOnSite: result.engagement.dailyTimeOnSite 
        },
        fetchedOn: result.fetchedOn
      });
      startup.save(function(err, startup){
        if(err) 
          return res.send(err)
        return res.send(result);
      });
    })

  });
}); 

/**
 * Update Facebook Details
 */
app.put('/api/facebook/details', ensureAuthenticated, function(req, res){
  var detailsUrl = "https://graph.facebook.com/"+req.body.facebookHandle+"?access_token=472415586283791|a8922a99c7584e780bf09bcb789172e3&fields=likes,about,birthday,category,link,name,talking_about_count,username,website,were_here_count";
  request.get({url: detailsUrl, json: true},function(err, response, data){
    if (err)
      return res.send(err) 
    var facebookInfo = {
      likes: data.likes,
      about: data.about,
      category: data.category,
      link: data.link,
      name: data.name,
      talking_about_count: data.talking_about_count,
      username: data.username,
      website: data.website,
      were_here_count: data.were_here_count,
      fetchedOn: Date.now()
    }
    Startup.findByIdAndUpdate(
     req.body.id,
     { $push: {"facebookInfo": facebookInfo}},
     {  safe: true, upsert: true},
      function(err, model) {
        if(err){
          return res.send(err);
        }
        return res.send(facebookInfo);
      }
    );
  });
}); 

/**
 * Update goolge play Info
 */
var gplay = require('google-play-scraper');
app.put('/api/google-play/details', ensureAuthenticated, function(req, res){
  gplay.app({appId: req.body.googlePlayHandle})
  .then(function(app){
    var googlePlayInfo = {
      title: app.title,
      url: app.url,
      icon: app.icon,
      minInstalls: app.minInstalls,
      maxInstalls: app.maxInstalls,
      score: app.score,
      histogram:app.histogram,
      fetchedOn: Date.now()
    }
    Startup.findByIdAndUpdate(
     req.body.id,
     { $push: {"googlePlayInfo": googlePlayInfo}},
     { safe: true, upsert: true},
      function(err, model) {
        if(err){
          return res.send(err);
        }
        return res.send(googlePlayInfo);
      }
    );
  })
  .catch(function(e){
    return res.send(e);
  });
});


app.get('/api/projects', function (req, res) {
  Project.find({},{'_id': 0, 'school_state': 1, 'resource_type': 1, 'poverty_level': 1, 'date_posted': 1, 'total_donations': 1, 'funding_status': 1, 'grade_level': 1 }, function (err, projects) {
    if(err)
      return res.send(err);
    return res.send(projects);
  });
});
/*
 |--------------------------------------------------------------------------
 | Start the Server
 |--------------------------------------------------------------------------
 */
app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});