require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(express.static('public'));

app.get('/', (_, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Body parser
app.use(bodyParser.urlencoded({ extended: false }));

// User creation
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: Date },
    },
  ],
});

const User = mongoose.model('User', userSchema);

// Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create new user
app.post('/api/users', async (req, res) => {
  const newUser = await User.create({ username: req.body.username });
  if (!newUser) return console.error('Not created');
  res.json({ username: newUser.username, _id: newUser._id });
});

// Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({});
  if (!users) return console.error(err);
  res.json(users);
});

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  const newExercise = { description, duration, date };

  if (!description) console.log('Not created');
  if (!duration) console.log('Not created');
  if (!date) console.log('Not created');
  newExercise.date = new Date();

  const user = await User.findById(_id);

  if (!user) return console.error('Exercise not creates');

  user.log.push(newExercise);

  user.save();
  res.json({
    _id: user._id,
    username: user.username,
    date: new Date(newExercise.date).toDateString(),
    duration: newExercise.duration,
    description: newExercise.description,
  });
});

// Get user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const user = await User.findById(_id);
  if (!user) return console.error('User not found');
  const { log } = user;
  const { limit, from, to } = req.query;
  let filteredLog = log;
  if (from) {
    const fromDate = new Date(from);
    filteredLog = filteredLog.filter((exercise) => {
      return exercise.date >= fromDate;
    });
  }
  if (to) {
    const toDate = new Date(to);
    filteredLog = filteredLog.filter((exercise) => {
      return exercise.date <= toDate;
    });
  }
  if (limit) {
    filteredLog = filteredLog.slice(0, limit);
  }
  res.json({
    _id: user._id,
    username: user.username,
    count: filteredLog.length,
    log: filteredLog.map((exercise) => {
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      };
    }),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
