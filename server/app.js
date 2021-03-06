var express = require('express');
var app = express();
var path = require('path');
var sqlite3 = require('sqlite3').verbose()
const bodyParser = require("body-parser");

//easy retrieval of POST tokens
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

//returns a json object of all recipes in the database
app.get('/recipelisting', function (req, res) {
  db = new sqlite3.Database('./EasyRecipe.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
  });
  db.all("SELECT id, name, notes, created FROM recipes;", [],
      (err, recipes) => { //build recipe list
        res.send(recipes);
        db.close();
      }
    );
});

//returns a json object of all directions based on a recipe id
app.get('/getDirections/:id', function (req, res) {
  db = new sqlite3.Database('./EasyRecipe.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
  });
  db.all("SELECT step, direction FROM directions WHERE recipeid=?", [req.params.id],
      (err, directions) => { //build direction list
        res.send(JSON.stringify(directions));
      }
  );
  db.close();
});

//returns a json object of all ingredients based on a recipe id
app.get('/getIngredients/:id', function (req, res) {
  db = new sqlite3.Database('./EasyRecipe.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
  });
  db.all("SELECT step, ingredient, amount FROM ingredients WHERE recipeid=?", [req.params.id],
      (err, ingredients) => {
        res.send(JSON.stringify(ingredients));
      }
  );
  db.close();
});

//returns a json object of a recipe based on recipe id
app.get('/getRecipe/:id', function (req, res) {
  db = new sqlite3.Database('./EasyRecipe.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
  });
  db.get("SELECT name, notes, created, userid FROM recipes WHERE id=?;", [req.params.id],
      (err, recipe) => {
        res.send(JSON.stringify(recipe));
      }
    );
    db.close();
});

//submit into recipes, directions, and ingredients
app.post('/submit-recipe', function (req, res) {
  recipeName = req.body.recipename;
  recipeNotes = req.body.notes;
  directions = req.body.directions;
  ingredients = req.body.ingredients;
  amounts = req.body.amounts;
  db = new sqlite3.Database('./EasyRecipe.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
  });
  db.run("INSERT INTO recipes (userid,name,notes) VALUES ($userid,$name,$notes);", {
          $userid: 1,
          $name: recipeName,
          $notes: recipeNotes
      },
      //callback with the new recipeid
          () => {
            db.get("SELECT last_insert_rowid() as newid", [], (err, row) => {
                recipeId = row.newid;
                for(i = 0; i < directions.length; i++){
                  db.run("INSERT INTO directions (recipeid,step,direction) VALUES ($rid,$step,$dir);", {
                          $rid: recipeId,
                          $step: i,
                          $dir: directions[i]
                      });
                }
                for(i = 0; i < ingredients.length; i++){
                  db.run("INSERT INTO ingredients (recipeid,step,ingredient,amount) VALUES ($rid,$step,$ing,$amt);", {
                          $rid: recipeId,
                          $step: i,
                          $ing: ingredients[i],
                          $amt: amounts[i]
                      });
                }
              },
              () => {
                db.close(); //close db after all inserts are done
              }
            ); //end db get
            } //end insert callback
    ); //end recipe SQL insert
  res.redirect("/");
});

app.listen(3000, function () {
  console.log('Running on port 3000...');
});

//REACT SPECIAL FILES
app.get('/static/js/main.js', function (req, res) {
  res.sendFile(__dirname + '/static/js/main.js');
});
app.get('/static/js/main.js.map', function (req, res) {
  res.sendFile(__dirname + '/static/js/main.js.map');
});
app.get('/static/css/main.css', function (req, res) {
  res.sendFile(__dirname + '/static/css/main.css');
});
app.get('/static/css/main.css.map', function (req, res) {
  res.sendFile(__dirname + '/static/css/main.css.map');
});
