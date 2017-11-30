import express from 'express'
import _ from 'lodash'
import bodyParser from 'body-parser'
import cors from 'cors'
import passport from 'passport'
import passportJWT from 'passport-jwt'
import connection from './database'
import auth from './routes/auth'
import login from './routes/login'
import callLoopback from './routes/callLoopback'

const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy

const jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
jwtOptions.secretOrKey = 'tasmanianDevil'

const strategy = new JwtStrategy(jwtOptions, async function (jwt_payload, next) {
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
const PORT = 3008
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use('/', login)
app.use('/', passport.authenticate('jwt', { session: false }), callLoopback)

app.listen(PORT)