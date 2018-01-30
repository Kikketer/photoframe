require('dotenv').config()
const express = require('express')
const request = require('request')
const Photos = require('./photos')
var app = express()
app.use(express.static('public'))

const port = process.env.PORT || 8080
console.log('Using city: ' + process.env.CITY_ID)

let weatherCache = {}
let lastWeatherUpdate = 0

app.get('/weather', (req, res) => {
  if (new Date().getTime() - lastWeatherUpdate >= 900000) {
    console.log('Refreshing Weather Data!')
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

// Kick on the photo pull!
if (process.env.ODRIVE_PY) {
  console.log('Starting photo sync')
  const ph = new Photos()
  ph.startSyncTimer()
}

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
})
