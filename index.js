//IMPORTS//
const express = require("express");
const uuid = require("uuid");
const path = require("path");
const methodOverride = require("method-override");
const cors = require("cors");

const morgan = require("morgan");

const app = express();
(bodyParser = require("body-parser")), app.use(bodyParser.json());
app.use(cors("*"));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

let auth = require("./auth")(app);

const passport = require("./passport");

const fs = require("fs");
const mongoose = require("mongoose");
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;

// const MONGO_URL = "mongodb://localhost:27017/movies";
const MONGO_URL = "mongodb+srv://admin:admin@cluster0.vg1x4ip.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let allowedOrigins = [
'http://localhost:8080',
'http://localhost:1234',
'https://myflixapi-50jx.onrender.com',

];
//log resuests to server
app.use(morgan("common"));

//default text response when at /
app.get("/", (req, res) => {
  res.send("welcom to myFlex");
});

app.get("/users", function (req, res) {
  Users.find()
    .then(function (users) {
      res.status(201).json(users);
    })
    .catch(function (err) {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

//ES6 javascript syntax
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        console.log(movies);
        res.status(200).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

// MORGAN //////
// accessLogStream uses the fs and path modules to append "log.txt"
const accessLogStream = fs.createWriteStream(path.join(__dirname, "log.txt"), {
  flags: "a",
});

// morgan pkg logs a timestamp to "log.txt"
app.use(morgan("combined", { stream: accessLogStream }));

app.use("/documentation.html", express.static("public"));

app.use(methodOverride());

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.post("/users", (req, res) => {
  Users.findOne({ Username: req.body.Username }).then((user) => {
    if (user) {
      return res.status(400).send(req.body.Username + "already exists");
    } else {
      Users.create({
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
      })
        .then((user) => {
          res.status(201).json(user);
        })

        .catch((error) => {
          console.error(error);
          res.status(500).send("Error: " + error);
        });
    }
  });
});

// Add a movie to a user"s list of favorites
app.post("/users/:Username/movies/:MovieID", (req, res) => {
  Users.findOneAndUpdate(
    { Username: req.params.Username },
    {
      $push: { FavoriteMovies: req.params.MovieID },
    },
    { new: true }, // This line makes sure that the updated document is returned
    (err, updatedUser) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error: " + err);
      } else {
        res.json(updatedUser);
      }
    }
  );
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/documentation.html"));
  // res.send("Welcome to Movies API!");
});

// Get a single movie by title
app.get("/movies/:title", (req, res) => {
  const { title } = req.params;
  const movie = topMovies.find((movie) => movie.title === title);
  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400);
  }
});

// Get a single movie by id
app.get("/movies/id/:id", (req, res) => {
  const { id } = req.params;

  const movie = topMovies.find((movie) => movie.movied === +id);
  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(400);
  }
});

app.post("/movies", (req, res) => {
  let newMovie = req.body;
  let missingFields = [];
  console.log(newMovie);
  if (!newMovie.title) {
    missingFields.push("title");
  }
  if (!newMovie.year) {
    missingFields.push("year");
  }
  if (!newMovie.genre) {
    missingFields.push("genre");
  }
  if (!newMovie.description) {
    missingFields.push("description");
  }
  if (!newMovie.director) {
    missingFields.push("director");
  }
  if (missingFields.length > 0) {
    res
      .status(400)
      .send(
        `Missing ${
          missingFields.length > 1 ? missingFields.join(", ") : missingFields[0]
        }.`
      );
  }
  topMovies.push(newMovie);
  console.log(topMovies);
  res.status(200).send(`Successfully added ${newMovie.title}.`);
});

app.delete("/movies/:title", (req, res) => {
  const movie = topMovies.find((movie) => {
    return movie.title === req.params.title;
  });
  if (movie) {
    topMovies = topMovies.filter((m) => {
      return m.title !== movie.title;
    });
    console.log(topMovies);
    res.status(201).send("Movie" + movie.title + " was deleted.");
  }
});

app.get("/genres/:genre", (req, res) => {
  const moviesByGenre = topMovies.filter(
    (movie) => movie.genre === req.params.genre
  );
  res.status(200).json(moviesByGenre);
});

app.get("/directors/", (req, res) => {
  res.status(200).json(directors);
});

app.get("/directors/:director", (req, res) => {
  const { director } = req.params;
  const foundDirector = directors.find((person) =>
    person.name.includes(director)
  );
  if (foundDirector) {
    res.status(200).json(foundDirector);
  } else {
    res.status(400);
  }
});

app.post("/users", (req, res) => {
  const newUser = req.body;
  if (!newUser.username) {
    res.status(400).send(`Missing ${newUser.username}.`);
  }
  Users.push(newUser);
  console.log(Users);
  res.status(200).send(`Successfully added ${newUser.username}.`);
});

app.put("/users/:username", (req, res) => {
  const user = users.find((user) => {
    return user.username === req.params.username;
  });
  if (!user) {
    res.status(400).send(`User not found.`);
  }
  user.username = req.body.username;
  console.log(user);
  res.status(200).send(`Successfully updated!`);
});

app.delete("/users/:username", (req, res) => {
  const user = users.find((user) => {
    return user.username === req.params.username;
  });
  if (user) {
    users = users.filter((obj) => {
      return obj.username !== user.username;
    });
    console.log(users);
    res.status(201).send("User" + req.params.username + " was deleted.");
  }
});
// Delete a user by username
app.delete("/users/:Username", (req, res) => {
  Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(400).send(req.params.Username + " was not found");
      } else {
        res.status(200).send(req.params.Username + " was deleted.");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Error: " + err);
    });
});

app.get("/documentation", (req, res) => {
  res.sendFile("public/documentation.html", { root: __dirname });
});

// Middlewares
function errorHandler(err, req, res, next) {
  /* eslint-enable no-unused-vars */
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
}

app.use(errorHandler);

function notFound(req, res, next) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

app.use(notFound);

app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});
