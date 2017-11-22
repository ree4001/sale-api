import express from 'express'
import request from 'request'
import connection from '../database'
import { API_SERVER } from '../config'

const router = express.Router()

router.get("/commission/getBySale/:month/:year/:sale_id", async function (req, res) {
  const oldToken = await getAccessToken()
  const path = `${API_SERVER}/api/Commissions/getBySale?month=${req.params.month}&year=${req.params.year}&sale_id=${req.params.sale_id}`
  request(`${path}&access_token=${oldToken}`, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(response.body)
      res.send(result)
    } else if (!error && response.statusCode == 500) {
      res.send(resetAccessToken(oldToken, path))
    }
  })
})

router.get("/commission/summaryYear/:year/:sale_id", async function (req, res) {
  const oldToken = await getAccessToken() 
  const path = `${API_SERVER}/api/Commissions/getBySaleYear?year=${req.params.year}&sale_id=${req.params.sale_id}`
  request(`${path}&access_token=${oldToken}`, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(response.body)
      res.send(result)
    } else if (!error && response.statusCode == 500) {
      res.send(resetAccessToken(oldToken, path))
    }
  })
})

router.get("/commission/getByLeaderMonth/:month/:year/:leaderId", async function (req, res) {
  const oldToken = await getAccessToken()
  const path = `${API_SERVER}/api/Commissions/getByLeaderMonth?month=${req.params.month}&year=${req.params.year}&leaderId=${req.params.leaderId}`
  request(`${path}&access_token=${oldToken}`, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(response.body)
      res.send(result)
    } else if (!error && response.statusCode == 500) {
      res.send(resetAccessToken(oldToken, path))
    }
  })
})

router.get("/applications/sale/:filter", async function (req, res) {
  const oldToken = await getAccessToken()
  const path = `${API_SERVER}/api/Applications/fullApps?filter=${encodeURI(req.params.filter)}`
  request(`${path}&access_token=${oldToken}`, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(response.body)
      return res.send(result)
    } else if (!error && response.statusCode == 500) {
      return res.send(resetAccessToken(oldToken, path))
    }
  })
})

router.get("/applications/leader/:status/:filter/:leaderId", async function (req, res) {
  const oldToken = await getAccessToken()
  const path = `${API_SERVER}/api/Applications/getByLeader?stastus=${req.params.status}&filter=${encodeURI(req.params.filter)}&leaderId=${req.params.leaderId}`
  request(`${path}&access_token=${oldToken}`, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(response.body)
      return res.send(result)
    } else if (!error && response.statusCode == 500) {
      return res.send(resetAccessToken(oldToken, path))
    }
  })
})

router.get("/commission/getByLeaderYear/:year/:leaderId", async function (req, res) {
  const oldToken = await getAccessToken()
  const path = `${API_SERVER}/api/Commissions/getByLeaderYear?year=${req.params.year}&leaderId=${req.params.leaderId}`
  request(`${path}&access_token=${oldToken}`, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const result = JSON.parse(response.body)
      res.send(result)
    } else if (!error && response.statusCode == 500) {
      res.send(resetAccessToken(oldToken, path))
    }
  })
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
        request(`${path}&access_token=${newToken}`, function (error, response, body) {
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