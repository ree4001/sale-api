import express from 'express'
import request from 'request'
import got from 'got'
import _ from 'lodash'
import passport from 'passport'
import passportJWT from 'passport-jwt'
import connection from '../database'
import { API_SERVER } from '../config'

const router = express.Router()

router.get("/applications/customer/:filter", async function (req, res) {
  const oldToken = await getAccessToken()
  const path = `${API_SERVER}/api/Applications/fullApps?filter=${encodeURI(req.params.filter)}`
  try {
    const applicationsData = await got.get(`${path}&access_token=${oldToken}`, {})
    if (applicationsData.statusCode === 200) {
      const result = JSON.parse(applicationsData.body)
      return res.send(result)
    } 
  } catch (err) {
    console.log(err.statusCode)
    if (err.statusCode === 401) {
      return res.send(resetAccessToken(oldToken, path))
    }
  }
})

const getAccessToken = async () => {
  return new Promise(function (resolve, reject) {
    connection.query(
      `SELECT id FROM AccessToken`,
      function (err, rows, fields) {
        if (!err) {
          resolve(rows[0].id)
        } else {
          reject(err)
        }
      }
    )
  })
}

const setAccessToken = async (accessToken, oldAccessToken) => {
  return new Promise(function (resolve, reject) {
    connection.query(
      `UPDATE AccessToken
      SET id = '${accessToken}'
      WHERE id = '${oldAccessToken}'`,
      function (err, rows, fields) {
        if (!err) {
          resolve(true)
        } else {
          resolve(false)
        }
      }
    )
  })
}

const resetAccessToken = async (oldToken, path) => {
  request.post({ url: `${API_SERVER}/api/StaffUsers/login`, form: { username: 'Sale', password: '123' } }, async function (err, httpResponse, httpBody) {
    if (!err && httpResponse.statusCode == 200) {
      const token = JSON.parse(httpResponse.body)
      const update = await setAccessToken(token.id, oldToken)
      if (update) {
        const newToken = await getAccessToken()
        const Data = await got.get(`${path}&access_token=${newToken}`, {})
        if (Data.statusCode == 200) {
          const result = JSON.parse(Data.body)
          return (result)
        }
      }
    }
  })
}

export const getApplications = async (citizenId) => {
  const oldToken = await getAccessToken()
  const path = `${API_SERVER}/api/Applications/fullApps?filter={"where":{"citizenId":"${citizenId}"}}`
  try {
    const applicationsData = await got.get(`${path}&access_token=${oldToken}`, {})
    if (applicationsData.statusCode === 200) {
      const result = JSON.parse(applicationsData.body)
      return result
    }
  } catch (err) {
    if (err.statusCode === 401) {
      return res.send(resetAccessToken(oldToken, path))
    }
  }
}

export default router