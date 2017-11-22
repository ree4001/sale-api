import _ from 'lodash'
import express from 'express'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'

import passport from 'passport'
import passportJWT from 'passport-jwt'

import connection from '../database'

const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy

const users = [
  {
    id: 1,
    name: 'jonathanmh',
    password: '%2yx4'
  },
  {
    id: 2,
    name: 'test',
    password: 'test'
  }
]

const getSale = async (connection) => {
  return new Promise(function (resolve, reject) {
    connection.query(
      `SELECT * FROM Sales`,
      function (err, rows, fields) {
        resolve(rows)
      }
    )
  })
}

const jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
jwtOptions.secretOrKey = 'tasmanianDevil'

const strategy = new JwtStrategy(jwtOptions, async function (jwt_payload, next) {
  console.log('payload received', jwt_payload)
  // usually this would be a database call:
  const sales = await getSale(connection)
  const user = sales[_.findIndex(sales, { id: jwt_payload.id })]
  if (user) {
    next(null, user)
  } else {
    next(null, false)
  }
})

passport.use(strategy)

const router = express.Router()
router.use(passport.initialize())

router.use(bodyParser.urlencoded({
  extended: true
}))

router.use(bodyParser.json())

router.get("/", function (req, res) {
  res.json({ message: "Express is up!" })
})

router.post("/login", async function (req, res) {
  console.log('login')
  let username = ''
  let password = ''
  const output = {
    status: undefined,
    message: undefined,
    id: undefined,
    rank: undefined,
    username: undefined,
    token: undefined
  }
  if (req.body.username && req.body.password) {
    username = req.body.username
    password = req.body.password
  }
  const sales = await getSale(connection)
  //usually this would be a database call:
  const user = sales[_.findIndex(sales, { sale_id: username })]
  if (!user) {
    output.status = 401
    output.message = 'Unauthorized'
    res.send(output)
    // res.status(401).json({ message: "no such user found" })
  }
  if (user !== undefined) {
    if (user.password === req.body.password) {
      // from now on we'll identify the user by the id and the id is the only personalized value that goes into our token
      if (user.leader === null) { output.rank = 'leader' }
      else { output.rank = 'sale' }
      output.status = 200
      output.message = 'success'
      output.username = user.sale_id
      output.id = user.id
      const payload = { id: user.id }
      const token = jwt.sign(payload, jwtOptions.secretOrKey)
      output.token = token
      // res.json({ message: "ok", token: token })
      res.send(output)
    } else {
      output.status = 401
      output.message = 'Unauthorized'
      res.send(output)
      // res.status(401).json({ message: "passwords did not match" })
    }
  }
})

router.get("/secret", passport.authenticate('jwt', { session: false }), function (req, res) {
  console.log('test')
  res.json({ message: "Success! You can not see this without a token" })
})

router.get("/secretDebug",
  function (req, res, next) {
    console.log(req.get('Authorization'))
    next()
  }, function (req, res) {
    res.json("debugging")
  })



export default router