require('dotenv').config()
const express = require('express')
const request = require('request')
const fs = require('fs')
const path = require('path')
const debug = require('debug')('server')
var app = express()
app.use(express.static('public'))

const port = process.env.PORT || 8080
debug('Using city: ' + process.env.CITY_ID)

let weatherCache = {}
let lastWeatherUpdate = 0

app.get('/image', (req, res) => {
  // Snag a random image from the photostore
  const directory = path.resolve('./public/photostore')
  const files = fs.readdirSync(directory)
  const imageFiles = files.filter(fileName => fileName.match(/\.jpg$/))
  res.sendFile(path.resolve(`./public/photostore/${imageFiles[Math.floor(Math.random() * imageFiles.length)]}`))
})

app.get('/weather', (req, res) => {
  if (new Date().getTime() - lastWeatherUpdate >= 900000) {
    debug('Refreshing Weather Data!')
    request.get(
      `http://api.openweathermap.org/data/2.5/weather?id=${process.env.CITY_ID}&APPID=${
        process.env.OPEN_WEATHER_API
      }&units=imperial`,
      (err, resp, body) => {
        if (err) {
          console.error(err)
          return res.status(500).send(err)
        }
        weatherCache = JSON.parse(body)

        request.get(
          `http://api.openweathermap.org/data/2.5/forecast?id=${process.env.CITY_ID}&APPID=${
            process.env.OPEN_WEATHER_API
          }&units=imperial`,
          (err, resp, bdy) => {
            if (err) {
              console.error(err)
              return res.status(500).send(err)
            }

            // Find the high for today
            let forecast = JSON.parse(bdy)
            let high = -50
            let direction = 'stable'
            const numberOfForecasts = 2
            // numberOfForecasts is the number of forecasts for today
            for (let tm = 0; tm < numberOfForecasts; tm++) {
              if (forecast.list && forecast.list[tm].main.temp > high) {
                high = forecast.list[tm].main.temp
              }
            }

            // Check to see what the next forecast is... that's where the temp is heading
            if (forecast.list) {
              if (forecast.list[0].main.temp > weatherCache.main.temp) {
                direction = 'up'
              } else if (forecast.list[0].main.temp < weatherCache.main.temp) {
                direction = 'down'
              }
            }

            weatherCache.forecast = { temp: high, direction: direction }
            lastWeatherUpdate = new Date().getTime()
            res.send(weatherCache)
          }
        )
      }
    )
  } else {
    res.send(weatherCache)
  }
  // http://api.openweathermap.org/data/2.5/forecast?id=524901&APPID={APIKEY}
})

app.listen(port, () => {
  debug(`Android clock running on port ${port}!`)
})
