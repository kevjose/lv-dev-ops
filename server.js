var path = require('path');
var bcrypt = require('bcryptjs');
var bodyParser = require('body-parser');
var colors = require('colors');
var cors = require('cors');
var express = require('express');
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
  alexaDetails : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alexa'}]
});

var alexaSchema = new mongoose.Schema({
  globalRank: Number,
  countryRank: {
    rank: Number,
    country: String
  },
  engagement: {
    bounceRate: Number,
    dailyPageViewPerVisitor: Number,
    dailyTimeOnSite: Number 
  }
});
var Startup = mongoose.model('Startup', startupSchema);
var Alexa = mongoose.model('Alexa', alexaSchema);

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
 */
app.get('/api/startups', ensureAuthenticated, function (req, res) {
  Startup.find(function (err, startups) {
    if (err)
      return res.status(400).send({message: 'no startups found'});
    return res.send(startups);
  });
});

/**
 *Get startups with selected fields and slice array elements
 */
app.get('/api/strt',function(req,res){
  var startupProjection = {
    name: true,
    sectors:{$slice: -2} 
  };

  Startup.find({}, startupProjection, function (err, startups) {
      if (err) return res.send(err);
      res.send(startups);
  }); 
});

/**
 * Fetch startup based on _id
 */
app.get('/api/startups/:id', ensureAuthenticated, function (req, res) {
  Startup.findOne({_id: req.params.id}, function (err, startup) {
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
  Startup.update({_id:req.body.id}, $set ,function(err){
    if(err)
      return res.status(400).send({message: 'Update Failed'});
    res.status(200).send({message: 'Update values:'+JSON.stringify($set.$set)});
  });
}); 

/**
 * Get Alexa Data 
 */
app.get('/api/startup/alexa',function (req, res){
  var alexaData = require('alexa-traffic-rank');
  alexaData.AlexaWebData("letsventure.com", function(err, result) {
    if(err)
      res.send(err);
    res.send(result);
  })
});
/*
 |--------------------------------------------------------------------------
 | Start the Server
 |--------------------------------------------------------------------------
 */
app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});