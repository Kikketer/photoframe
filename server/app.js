var express = require('express')
var request = require('request')
var app = express()
app.use(express.static('public'))

const port = process.env.PORT || 8080
console.log('Using city: ' + process.env.CITY_ID)

let weatherCache = {}
let lastWeatherUpdate = 0

app.get('/weather', (req, res) => {
  if (new Date().getTime() - lastWeatherUpdate >= 900000) {
    console.log('Refreshing Weather Data!')
    request.get(`http://api.openweathermap.org/data/2.5/weather?id=${process.env.CITY_ID}&APPID=${process.env.OPEN_WEATHER_API}&units=imperial`, (err, resp, body) => {
      if (err) {
        console.error(err)
        return res.status(500).send(err)
      }
      weatherCache = JSON.parse(body)

      request.get(`http://api.openweathermap.org/data/2.5/forecast?id=${process.env.CITY_ID}&APPID=${process.env.OPEN_WEATHER_API}&units=imperial`, (err, resp, bdy) => { 
        if (err) {
          console.error(err)
          return res.status(500).send(err)
        }

        // Find the high for today
        let forecast = JSON.parse(bdy)
        let high = -50
        // 7 is the number of forecasts for today
        for (let tm = 0; tm < 7; tm++) {
          if (forecast.list[tm].main.temp > high) {
            high = forecast.list[tm].main.temp
          }
        }


        weatherCache.forecast = {temp: high}
        lastWeatherUpdate = new Date().getTime()
        res.send(weatherCache)
      })
    })
  }
  else {
    res.send(weatherCache);
  }
  // http://api.openweathermap.org/data/2.5/forecast?id=524901&APPID={APIKEY}
})

app.get('/photourls', (req, res) => {
  res.send({
    urls: [
      'photos.jpg',
      'photoB.jpg'
    ]
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
})
