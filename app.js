require('dotenv').config()

const Sentry = require("./libs/sentry_logging")

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var usersRouter = require('./routes/users');


var app = express();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
});

io.on('user', notif => {
  console.log(notif)
})

app.set('io', io)
app.use('/users', usersRouter);
app.get('/notification', (req, res, next) =>{
  res.render('notification')
})


Sentry.setupExpressErrorHandler(app);

app.use(function (req, res, next) {
  res.json({
    status: "error",
    message: "wrong way broo",
    data: null
  });
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};


  console.log(err)
  res.status(err.status || 500);
  res.json({
    status: "error",
    message: "Internal Server Error",
    data: null
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
