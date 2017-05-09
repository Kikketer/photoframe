var express = require('express')
var request = require('request')
var app = express()
app.use(express.static('public'))

const port = process.env.PORT || 8080
console.log('Using city: ' + process.env.CITY_ID)

let weatherCache = {"coord":{"lon":-89.33,"lat":42.01},"weather":[{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04d"}],"base":"stations","main":{"temp":58.44,"pressure":1014,"humidity":71,"temp_min":55.4,"temp_max":60.8},"visibility":16093,"wind":{"speed":3.36,"deg":180},"clouds":{"all":90},"dt":1494362100,"sys":{"type":1,"id":974,"message":0.0288,"country":"US","sunrise":1494326518,"sunset":1494378366},"id":4904898,"name":"Oregon","cod":200}
let lastWeatherUpdate = 0

app.get('/weather', (req, res) => {
  if (!lastWeatherUpdate || lastWeatherUpdate - new Date().getTime() >= 900000) {
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
