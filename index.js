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
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.log.push({
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date ? new Date(req.body.date) : new Date(),
    });

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      date: new Date(
        updatedUser.log[updatedUser.log.length - 1].date
      ).toDateString(),
      duration: updatedUser.log[updatedUser.log.length - 1].duration,
      description: updatedUser.log[updatedUser.log.length - 1].description,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let logs = user.log;

    if (req.query.from || req.query.to) {
      const fromDate = req.query.from ? new Date(req.query.from) : new Date(0);
      const toDate = req.query.to ? new Date(req.query.to) : new Date();

      logs = logs
        .filter((log) => {
          const logDate = new Date(log.date);
          return logDate >= fromDate && logDate <= toDate;
        })
        .map((log) => {
          return {
            description: log.description,
            duration: log.duration,
            date: log.date.toDateString(),
          };
        });
    }

    if (req.query.limit) {
      logs = logs.slice(0, req.query.limit).map((log) => {
        return {
          description: log.description,
          duration: log.duration,
          date: log.date.toDateString(),
        };
      });
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: logs.length,
      log: logs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
