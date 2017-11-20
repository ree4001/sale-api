import express from 'express'
import request from 'request'
import connection from '../database'
import { API_SERVER } from '../config'

const router = express.Router()
router.get("/mobile/:citizen_id/loans", async function (req, res) {
  const oldToken = await getAccessToken()
  const path = `${API_SERVER}/api/Loans/mobile/${req.params.citizen_id}/loans`
  request(`${path}?access_token=${oldToken}`, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(response.body)
      res.send(result)
    } else if (!error && response.statusCode == 500) {
      res.send(resetAccessToken(oldToken, path))
    }
  })
})

router.get("/mobile/:citizen_id/transactions", async function (req, res) {
  const oldToken = await getAccessToken()
  const path = `${API_SERVER}/api/Loans/mobile/${req.params.citizen_id}/transactions`
  request(`${path}?access_token=${oldToken}`, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(response.body)
      res.send(result)
    } else {
      res.send(resetAccessToken(oldToken))
    }
  })
})

router.get("/mobile/:citizen_id/transactions90", async function (req, res) {
  const oldToken = await getAccessToken()
  const path = `${API_SERVER}/api/Loans/mobile/${req.params.citizen_id}/transactions90`
  request(`${path}?access_token=${oldToken}`, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(response.body)
      res.send(result)
    } else {
      res.send(resetAccessToken(oldToken))
    }
  })
})

const getAccessToken = async () => {
  return new Promise(function (resolve, reject) {
    connection.query(
      `SELECT id FROM accessToken`,
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
      `UPDATE accessToken
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
  request.post({ url: `${API_SERVER}/api/StaffUsers/login`, form: { username: 'Customer', password: '1234' } }, async function (err, httpResponse, httpBody) {
    if (!err && httpResponse.statusCode == 200) {
      const token = JSON.parse(httpResponse.body)
      const update = await setAccessToken(token.id, oldToken)
      if (update) {
        const newToken = await getAccessToken()
        request(`${path}?access_token=${newToken}`, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            const result = JSON.parse(response.body)
            return (result)
          }
        })
      }
    }
  })
}

export default router