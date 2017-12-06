import _ from 'lodash'
import express from 'express'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import request from 'request'
import got from 'got'
import moment from 'moment'
import { API_SERVER } from '../config'
import passport from 'passport'
import passportJWT from 'passport-jwt'
import connection from '../database'

const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy

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

const resetACT = async () => {
  const headerRequest = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    body: { username: 'Sale', password: '123' },
    json: true
  }
  const result = await got.post('http://localhost:3000/api/StaffUsers/login', headerRequest)
  return result.body.id
}
const getApp = async (citizenId) => {
  const tmp = await resetACT()
  const applicationsData = await got.get(`http://localhost:3000/api/Applications/fullApps?filter={"where":{"citizenId":"${citizenId}"}}&access_token=${tmp}`, {})
  const data = JSON.parse(applicationsData.body)
  return data
}
const router = express.Router()
router.use(passport.initialize())

router.use(bodyParser.urlencoded({
  extended: true
}))

router.use(bodyParser.json())


router.post("/getOtp", async function (req, res) {
  let citizenId = ''
  let mobileNo = ''
  if (req.body.citizenId !== undefined && req.body.mobileNo !== undefined) {
    citizenId = req.body.citizenId
    mobileNo = req.body.mobileNo
  }
  const appliactions = await getApp(citizenId)
  const output = {
    status: undefined,
    message: undefined,
  }
  const OTP = parseInt(Math.random() * 1000000)
  if (appliactions.length === 0) {
    output.status = 401
    output.message = 'No User'
    res.send(output)
  } else {
    const getOTP = async (connection) => {
      return new Promise(function (resolve, reject) {
        connection.query(
          `SELECT * FROM OTP
           WHERE citizen_id = '${citizenId}'
          `,
          function (err, rows, fields) {
            resolve(rows)
          }
        )
      })
    }
    const UserByCitizenId = await getOTP(connection)
    const getTime = moment().format("YYYY-MM-DDTHH:mm:ss")
    if (UserByCitizenId.length === 0) {
      connection.query(
        `INSERT INTO OTP (otp_token, citizen_id, create_time, mobile_No)
         VALUES (${OTP.toString()}, '${citizenId}', '${getTime}', '${mobileNo}')
        `,
        async function (err, rows, fields) {
          if (err) {
            console.log(err)
          }
          // test send
          const sms = await got.get(`http://thaibulksms.com/sms_api_test.php?username=thaibulksms&password=thisispassword&message=OTP=${OTP.toString()}&msisdn=${mobileNo}`)
          // true send
          // const sms = await got.get(`http://www.thaibulksms.com/sms_api.php?username=0866651662&password=214061&message=${OTP.toString()}&msisdn=0955377875`, {})
          console.log(sms.body)
          output.status = 200
          output.message = 'Get OPT Success'
          res.send(output)
        }
      )
    } else {
      connection.query(
        `UPDATE OTP
        SET otp_token=${OTP.toString()}, create_time='${getTime}' 
        WHERE citizen_id = '${citizenId}'`,
        async function (err, rows, fields) {
          if (err) {
            console.log(err)
          }
          // test send
          const sms = await got.get(`http://thaibulksms.com/sms_api_test.php?username=thaibulksms&password=thisispassword&message='OTP=${OTP.toString()}'&msisdn=${mobileNo}`)
          // true send
          // const sms = await got.get(`http://www.thaibulksms.com/sms_api.php?username=0866651662&password=214061&message=OTP=${OTP.toString()}&msisdn=0955377875`, {})
          console.log(sms.body)
          output.status = 200
          output.message = 'Get OPT Success'
          res.send(output)
        }
      )
    }
  }
})


router.post("/sendOtp", async function (req, res) {
  const citizenId = req.body.citizenId
  console.log(citizenId)
  const OTP = parseInt(Math.random() * 1000000)
  const output = {
    status: undefined,
    message: undefined,
    token: undefined,
  }
  const getOTP = async (connection) => {
    return new Promise(function (resolve, reject) {
      connection.query(
        `SELECT * FROM OTP
         WHERE citizen_id = '${citizenId}'
        `,
        function (err, rows, fields) {
          resolve(rows)
        }
      )
    })
  }
  const UserByCitizenId = await getOTP(connection)
  const TimeLimitTosend = moment(UserByCitizenId[0].create_time).format("YYYY-MM-DDTHH:mm:ss")
  const getTime = moment().format("YYYY-MM-DDTHH:mm:ss")
  if (moment(getTime).isBefore(moment(TimeLimitTosend).add(2, 'minute'))) {
    output.status = 400
    output.message = 'badrequest'
  } else {
    connection.query(
      `UPDATE OTP
      SET otp_token=${OTP.toString()}, create_time='${getTime}' 
      WHERE citizen_id = '${citizenId}'`,
      async function (err, rows, fields) {
        if (err) {
          console.log(err)
        }
        const sms = await got.get(`http://thaibulksms.com/sms_api_test.php?username=thaibulksms&password=thisispassword&message=OTP=${OTP.toString()}&msisdn=${UserByCitizenId[0].mobile_No}`)
        // const sms = await got.get(`http://www.thaibulksms.com/sms_api.php?username=0866651662&password=214061&message=OTP=${OTP.toString()}&msisdn=${UserByCitizenId[0].mobile_No}`, {})
        console.log(sms.body)
      })
    output.status = 200
    output.message = 'send message success'
  }
  res.send(output)
})

router.post("/loginByOtp", async function (req, res) {
  const OTP = req.body.otp
  const citizenId = req.body.citizenId
  const output = {
    status: undefined,
    message: undefined,
    token: undefined,
  }
  const getOTP = async (connection) => {
    return new Promise(function (resolve, reject) {
      connection.query(
        `SELECT * FROM OTP
         WHERE citizen_id = '${citizenId}'
         AND otp_token = '${OTP}'
        `,
        function (err, rows, fields) {
          resolve(rows)
        }
      )
    })
  }
  const UserByCitizenId = await getOTP(connection)
  if (UserByCitizenId.length !== 0) {
    const LiftTimeOtp = moment(UserByCitizenId[0].create_time).format("YYYY-MM-DDTHH:mm:ss")
    const getTime = moment().format("YYYY-MM-DDTHH:mm:ss")
    if (moment(getTime).isBefore(moment(LiftTimeOtp).add(5, 'minute'))) {
      const payload = { id: UserByCitizenId[0].citizenId }
      const token = jwt.sign(payload, jwtOptions.secretOrKey)
      output.token = token
      output.status = 200
      output.message = 'Login Success'
      res.send(output)
    } else {
      output.status = 400
      output.message = 'OTP Is Time Out'
      res.send(output)
    }
  } else {
    output.status = 401
    output.message = 'OTP or CitizenId not match'
    res.send(output)
  }
})

router.post("/login", async function (req, res) {
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


export default router