const bcrypt= require('bcryptjs')
const uuidv4 = require('uuid/v4')
const pool = require('./database.js')

var LocalStrategy = require('passport-local').Strategy

let accData = []

module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });

    passport.use('login', new LocalStrategy({
        passReqToCallback : true
    },
    function(req, username, password, done) {
        loginUser()
        async function loginUser() {
            //const pool = await pool.connect()
            try {
                //await pool.query('BEGIN')
                var accData = await JSON.stringify(pool.query('SELECT id, username, password, access1, access2, access3, access4, access5 FROM users WHERE username = $1', [username], (err, result) => {
                    if (err) {
                        return done(err)
                    }

                    if (result.rows[0] == null) {
					    return done(null, false, req.flash('message', "Incorrect username or password"))
                    } else {
                        bcrypt.compare(password, result.rows[0].password, (err, valid) => {
                            if (err) {
                                console.log("Error on password validation")
                                return done(err)
                            }
                            if (valid) {
                                //pool.query('COMMIT')
                                console.log('User [' + req.body.username + '] has logged in.')
                                return done(null, {username: result.rows[0].username, 
                                                    access1: result.rows[0].access1,
                                                    access2: result.rows[0].access2,
                                                    access3: result.rows[0].access3,
                                                    access4: result.rows[0].access4,
                                                    access5: result.rows[0].access5})
                            } else {
                                return done(null, false, req.flash('message', "Incorrect username or password"))
                            }
                        })
                    }
                }))
            }
            catch(e) {
                throw (e)
            }
        }
    }))

    passport.use('register', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true
    },
    function(req, username, password, done) {
        registerUser()
        async function registerUser() {
            //const pool = await pool.connect()
            try {
                //await pool.query('BEGIN')
                let passHash = await bcrypt.hash(req.body.password, 8)
                await JSON.stringify(pool.query('SELECT id FROM users WHERE username=($1)', [req.body.username], (err, result) => {
                    if (err) {
                        return done(err)
                    }

                    if (!testUser(req.body.username)) {
                        return done(null, false, req.flash('message', 'Please provide a valid username'))
                    }
                    else if (!testPass(req.body.password)) {
                        return done(null, false, req.flash('message', 'Please provide a valid password'))
                    } else {
                        if (result.rows[0]) {
                            return done(null, false, req.flash('message', 'Sorry, this username is already taken.'))
                        } else {
                            pool.query('INSERT INTO users (id, username, password, name, phone, email, shop_id, godown) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [uuidv4(), req.body.username, passHash, req.body.name, req.body.phone, req.body.email, req.body.shop_id, req.body.godown], (err, result) => {
                                if (err) {
                                    console.log(err)
                                }
                                else {
                                    //pool.query('COMMIT')
                                    console.log('User [' + req.body.username + '] has registered.')
                                    //console.log(result)
                                    return done(null, {username: req.body.username})
                                }
                            });
                        }
                    }
                }))
            }
            catch(e) {
                throw (e)
            }
        }
    }))

    passport.use('updatePassword', new LocalStrategy({
        usernameField : 'password',
        passwordField : 'newpass',
        passReqToCallback : true
    },
    function(req, password, newpass, done) {
        let username = (req.user.username).toLowerCase()
        updatePassword()
        async function updatePassword() {
            //const pool = await pool.connect()
            try {
                //await pool.query('BEGIN')
                let newPassHash = await bcrypt.hash(req.body.newpass, 8)
                var accData = await JSON.stringify(pool.query('SELECT id, "username", "password" FROM "users" WHERE "username"=$1', [req.user.username.toLowerCase()], (err, result) => {
                    if (err) {
                        return done(err)
                    }

                    if (!testPass(req.body.password) ) {
                        return done(null, false, req.flash('message', 'Please provide a valid password'))
                    } else if (!testPass(req.body.newpass)) {
                        return done(null, false, req.flash('message', 'Please provide a valid password'))
                    } else {
                        if(result.rows[0] == null) {
                            return done(null, false, req.flash('message', 'Error on changing password. Please try again'))
                        } else {
                            bcrypt.compare(req.body.password, result.rows[0].password, (err, valid) => {
                                if (err) {
                                    console.log("Error on current password validation")
                                    return done(err)
                                }
                                if (valid) {
                                    pool.query('UPDATE users SET password=($1) WHERE username=($2)', [newPassHash, req.user.username], (err, result) => {
                                        if (err) {
                                            console.log(err)
                                        }
                                        else {
                                            //pool.query('COMMIT')
                                            console.log('User [' + req.user.username + '] has updated their password.')
                                            //console.log(result)
                                            return done(null, {username: req.user.username}, req.flash('message', 'Your password has been updated.'))
                                        }
                                    });
                                } else {
                                    req.flash('message', "Incorrect current password entered")
                                    return done(null, false)
                                }
                            })
                        }
                    }
                }))
            }
            catch(e) {
                throw (e)
            }
        }
    }))
}

function testUser(input) {
    let format = /^[a-zA-Z0-9_-]{4,16}$/
    return format.test(input)
}
function testPass(input) {
    let format = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,128}$/
    return format.test(input)
}
