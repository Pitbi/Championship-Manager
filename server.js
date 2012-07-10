//APP----------------------------------

var express = require('express');

var app = express.createServer();
app.configure(function () {
  app.use(express.logger({format: 'dev', stream: process.stdout}));
  app.use(express.bodyParser());
	app.use(express.cookieParser());              //Filtre pour cookie
  app.use(app.router);
  app.use(express.static(__dirname + '/public')); // sert les "assets" (fichiers statiques genre html, css, jpg...)
  app.set('view engine', 'ejs');
  app.set('view options', {
    layout: 'layouts/application'
  });
});



//MONGOOSE------------------------------

var mongoose = require('mongoose'),
		schema = mongoose.Schema;

mongoose.connect('mongodb://localhost/championshipmanager', function(error) {
	if (error) { throw error; }
});



//USERS COLLECTIONS
var userSchema = new mongoose.Schema({
	firstname    	: { type : String, validate: [validateName, 'Prénom incrorect'] },
	lastname     	: { type : String, validate: [validateName, 'Nom incrorect'] },
	nickname     	: { type : String, validate: [validateName, 'Pseudo incrorect'] },
	birthday			: Date,
	country				: String, 
	password  		: String,
	mail					: { type : String, validate: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ },
	createdAt : { type : Date, default : Date.now }
});

var User = mongoose.model('User', userSchema);

//CHAMPIONSHIPS COLLECTION
var championshipSchema = new mongoose.Schema({
	name					: String,
	manager				: String
});

var Championship = mongoose.model('Championship', championshipSchema);

//RACES COLLECTION
var raceSchema = new mongoose.Schema({
	name      	: { type : String, /*validate:  [validateEventName, 'nom incorect']*/ }, 
	createdAt 	: { type : Date, default : Date.now },
	date   			: { type : Date },
	location		: { type : String},
	price				: { type : Number},
	championship: { type : schema.ObjectId, ref: 'Championship'},
	description : { type : String}
});

var Race = mongoose.model('Race', raceSchema);

//APP.GET--------------------------

//INDEX
app.get('/', function(req, res) {
	if (req.cookies.userid!=null) {
		console.log(req.cookies.userid);
		res.redirect('/profil');
	} else {
	res.render('index/index');
	}
});

//PROFIL
app.get('/profil', function(req, res) {
	User.findById(req.cookies.userid).exec(function (err, user) {
		if (user) 
      res.render('profile/show', {nickname: user.nickname});
		else
			res.redirect('/');
	});
});


//LOGIN-->login.html
app.get('/login', function(req, res) {
	res.redirect('/login.html');
});

//LOGOUT
app.get('/logout', function(req,res) {
	res.clearCookie("userid");
	res.redirect('/');
});

//REGISTER-->register.html
app.get('/register', function(req, res) {
	res.redirect('/register.html');
});

//List all users
app.get('/users', function (req, res) {
  User.find(null).exec(function (err, users) {
  	res.render('users/index', {users: users});
  });
});

app.get('/users/:id', function (req, res) {
  User.findById(req.params.id, function (err, user) {
    res.render('users/show', {user: user});
  });
});

//CONSULT CHAMPIONSHIP
app.get('/manageChampionship', function (req, res) {
	User.findOne({name: req.cookies.userid}).exec(function(err, cookieId) {
		console.log(req.cookies.userid);
		res.write("<html><head><title>Manage your championship</title></head><body><h1>Your(s) Championship(s)</h1><ul>");
		Championship.find({manager : cookieId}).exec(function(err, championships) {
			if (err) {
				throw err;
			} else {
				championships.forEach(function (championship) {
					res.write("<li><a href='/championships/" + championship.id + "'>" + championship.name + "</a></li>");
				});
				res.end("</ul><p><a href='/'>Back</a> to the future.</p></body></html>");
			}
		});		
	});
});

//MANAGE CHAMPIONSHIP
app.get('/championships/:championshipId', function (req, res) {  // :xxx => variable dans l'adresse.
	Championship.findById(req.params.championshipId, function(err, championship) {  //J'ai l'ID et je veux récupérer l'obj complet. 
		res.write("<html><head><title>Manage your championship "+championship.name+"</title></head><body><h1>Your Championship : "+championship.name+"</h1><ul>");
		Race.find({championship : req.params.championshipName}).exec(function (err, races) {
			if (err) 
				throw err;
		
      races.forEach(function (race) {	
				res.write("<li><a href='/races/"+race.id+"'>"+race.name+ "</a> le " +race.date+"</li>");
			});		
			res.write("</ul><br /><br /><h2>Ajouter une course au championnat</h2><form method='post' action='/registerRace'><p>Nom de la course : <input type='text' value='' name='race[name]'></input></p><p>Date : <input type='text' value='' name='race[date]'></input></p><p>Prix : <input type='text' value='' name='race[price]'></input></p><p>Lieux : <input type='text' value='' name='race[location]'></input></p><p>Description : <input type='text' value='' name='race[description]'></input></p><p><input type='hidden' value=\""+championship.name+"\" name='championship[name]'></input></p><p><input type='submit' value='Create'> or <a href='/'>cancel</a>.</p></form>");
			res.end("<p><a href='/'>Back</a> to the future.</p></body></html>");
		});
	});
});

app.get('/races/:raceId', function (req, res) {
  Race.findById(req.params.raceId, function (err, race) {
	  res.end(race.name);
  });
});

//ADD A RACE
app.get("/createRace", function (req, res) {
	res.redirect("/createRace.html");
});

//APP.POST--------------------------

//REGISTER USER
app.post('/registerUser', function(req, res) {
	var user = new User({firstname : req.body.user.firstname, lastname : req.body.user.lastname, nickname : req.body.user.nickname, mail: req.body.user.mail, birthday : req.body.user.birthday, country : req.body.user.country, password : req.body.user.password}),
			password = req.body.user.password,
			verifiedPassword = req.body.userVerification.verifiedPassword,
			userNickname = req.body.user.nickname,
			userMail = req.body.user.mail;
	User.findOne({nickname: userNickname}).exec(function(err, foundNickname) {
		User.findOne({mail: userMail}).exec(function(err, foundMail) {
			if (foundNickname) {
				res.end("Nickname existant!");			
			} else if (foundMail) {
				res.end("Mail existant!");
			} else {
					if (password != verifiedPassword) {
						res.send('Les mots de passes entrés ne sont pas identiques');
						res.end();
					} else {
					user.save(function (err) {
						if (err) {
							res.end('Bonjour '+err+' Aurevoir');
						} else {
							res.redirect('/');
						}
					});
				}
			}
		});
	});
});

//LOG-IN + CREATION Cookie
app.post('/login', function(req, res) {
	var loginNickname=(req.body.login.nickname),
			loginPassword=(req.body.login.password);
	User.findOne({nickname: loginNickname, password: loginPassword}).exec(function(err, user) {
		if (err) {
			throw err;
		}
		if (user) {
			res.cookie('userid', user.id, { expires: new Date(Date.now() + 999900000), httpOnly: true });
			res.redirect('/profil');
		} else {
			res.end("We don't know you!");
		} 	
	});
});

//CREATE CHAMPIONSHIP
app.post('/registerChampionship', function (req, res) {
	User.findOne({name: req.cookies.userid}).exec(function(err, cookieId) {
		var championship = new Championship({name: req.body.championship.name, manager: cookieId});
		championship.save(function(err) {
			if (err) {
					res.statusCode = 500;
      		res.end("Oops, we couldn't save you (" + err + ")");
			} else {
      		res.redirect('/manageChampionship');
			}
		});
	});
});

//RESGISTER RACE IN A CHAMPIONSHIP
app.post('/registerRace', function (req, res) {
	var race = new Race({name: req.body.race.name, date: req.body.race.date, price: req.body.race.price, location: req.body.race.location, championship: req.body.championshipId , description: req.body.race.description});
	console.log(req.body.championship.name);	
	race.save(function (err) {
		if (err) {
			throw err;
		} else {
			res.redirect('/manageChampionship');
		}
	});
});



//FUNCTION-VALIDATE----------------------

function validateName(value) {
  var present = typeof(value) != 'undefined' && value != null && value != "";
  var wellFormed = /^[a-zA-Z0-9-_]{4,}$/.test(value);
  return present && wellFormed;	
}

/*
function validatePassword(password, verifiedPassword) {
	if (password == validatePassword) {	
		return true;
	} else {
		return false;
	}
}
*/

app.listen(5555);
