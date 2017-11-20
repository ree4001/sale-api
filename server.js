import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import connection from './database'
import auth from './routes/auth'
import login from './routes/login'
import callLoopback from './routes/callLoopback'


const PORT = 3008
const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use('/', login)
app.use('/', callLoopback)

app.listen(PORT)