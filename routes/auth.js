import express from 'express'
import connection from '../database'

const router = express.Router()

router.get("/", function(req, res) {
    res.json({message: "Express is up!"})
}) 
router.post('/sale', async function (req, res) {
  res.send('yes')
})

export default router