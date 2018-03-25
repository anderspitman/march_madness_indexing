const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const Database = require('./database').Database

const clientDir = path.join(__dirname, '../public')

const db = new Database()

app.use(express.static(clientDir))
app.use(bodyParser.json())

app.get('/', (req, res) => res.send('Hi there'))

app.get('/latest_data', (req, res) => {
  res.json(db.getLatestGroupData())
})

app.get('/group_data', (req, res) => {
  const params = req.query
  console.log(params)
  res.json(db.getGroupData(params))
})

app.get('/group_range', (req, res) => {
  const params = req.query
  console.log(params)
  res.json(db.getGroupDataForRange(params))
})

app.get('/contributor_data', (req, res) => {
  const params = req.query
  console.log(params)
  res.json(db.getContributorData(params))
})

app.listen(8000, () => console.log('Running'))
