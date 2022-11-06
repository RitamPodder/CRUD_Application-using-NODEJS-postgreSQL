require('dotenv').config()

const express = require('express')
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const bodyParser = require('body-parser')

const pool = require('./config/database.js')

const app = express()

var url = require('url');
var cors = require('cors');
const { Console } = require("console");
const { SSL_OP_TLS_D5_BUG } = require("constants");

//----------------for file upload---------------

var formidable = require("formidable");
var fs = require("fs");

const mv = require('mv');

app.use(express.static(__dirname + '/uploads'));

//----------------------------------------------

//----------------------------------------------

const PORT = process.env.PORT || 90

//const routes = require('./routes/index')

app.use(express.static(__dirname + '/views'));

app.set('view engine', 'ejs')
app.use(session({
    secret: 'thatsecretthinggoeshere',
    resave: false,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

app.use(function(req, res, next){
    res.locals.message = req.flash('message');
    next();
});

//app.use('/', routes)
require('./config/passport')(passport)

app.listen(PORT, () => {
    console.log(`Application server started on port: ${PORT}`)
})

//======================================================================================================//

//============================================all pages routings========================================//

app.get("/", (req, res) =>  {
  res.render("index.ejs");
});

//======================================================================================================//

//=============================================API'S START==============================================//

//-------------------------------------------Create Employee--------------------------------------------//

app.post("/add/employee", async (req, res) => {

  let { name, email, address, phone } = req.body;
  
  console.log(name, email, address, phone);

  let errors = [];

  if (!name || !email || !address || !phone) {
    errors.push({ message: "Please enter all fields" });
  }
  console.log(errors);
  if (errors.length > 0) {
    res.redirect("/");
  } else{

      pool.query(
        `INSERT INTO employee (name, email, address, phone)
        VALUES ($1, $2, $3, $4)`,
        [name, email, address, phone],
        (err, results) => {
          if (err) {
            throw err;
          }
          res.redirect("/");
        }
      );

    }
});

//------------------------------------------------------------------------------------------------------//

//---------------------------------------------Read Employee--------------------------------------------//

app.get("/employee/getdata", async (req, res) => {

  pool.query(
    `SELECT * FROM employee order by id desc`,
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      res.send(data);
    }
  );

});

app.get("/employee/getdata/by/id", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;

  pool.query(
    "select * from employee where id=$1",
    [id], 
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );

});

//------------------------------------------------------------------------------------------------------//

//-------------------------------------------Update Employee--------------------------------------------//

app.post("/update/employee", async (req, res) => {

  let { emp_id, name, email, address, phone } = req.body;
  
  console.log(emp_id, name, email, address, phone);

  let errors = [];

  if (!emp_id || !name || !email || !address || !phone) {
    errors.push({ message: "Please enter all fields" });
  }
  console.log(errors);
  if (errors.length > 0) {
    res.redirect("/");
  } else{

      pool.query(
        `UPDATE employee SET name = $1, email = $2, address = $3, phone = $4
        WHERE id = $5`,
        [name, email, address, phone, emp_id],
        (err, results) => {
          if (err) {
            throw err;
          }
          res.redirect("/");
        }
      );

    }
});

//------------------------------------------------------------------------------------------------------//

//-------------------------------------------Delete Employee--------------------------------------------//

app.get("/remove/employee", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;

  pool.query(
    "delete from employee where id=$1 returning id",
    [id], 
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      console.log(data);
      res.send(data);
    }
  );

});

app.get("/delete/mass/emp", async (req, res) => {
  
  var delete_emp = req.query.delete_emp;

  var delete_emp_sql='';

  for(i=1; i<= delete_emp.length; i++){
    if(delete_emp[i] !== undefined){
      delete_emp_sql +=  "'" + delete_emp[i] + "'";
      if(i<delete_emp.length-1){
        delete_emp_sql += ',';
      }
    }
  }

  console.log(delete_emp_sql, delete_emp);

  var query = " WHERE id in (" + delete_emp_sql + ")";
  console.log(query);

  let errors = [];

  if (errors.length > 0) {
    res.redirect("/");
  } else{

      pool.query(
        "delete from employee " + query + "",
        (err, results) => {
          if (err) {
            throw err;
          }
          res.redirect("/");
        }
      );
            
    }
});
//------------------------------------------------------------------------------------------------------//

//===============================================API'S End==============================================//