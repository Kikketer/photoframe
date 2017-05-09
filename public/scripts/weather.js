var weather = {
  init: function () {
    // Fetch the weather for the day
    // 5 min check
    this.intervalCount = 300
    this.currentInterval = 0
    this.fetchWeather()
  },
  update: function () {
    this.currentInterval++
    if (this.currentInterval >= this.intervalCount) {
      this.currentInterval = 0
      this.fetchWeather()
    }
  },
  fetchWeather: function () {
    var r = new XMLHttpRequest()
    var me = this
    r.open('GET', '/weather', true)
    r.onreadystatechange = function () {
        if (r.readyState != 4 || r.status != 200) return
        me.renderWeather(JSON.parse(r.responseText))
    };
    r.send()
  },
  renderWeather: function (weatherJson) {
    var iconImg = document.getElementsByClassName('weather-container')[0].getElementsByClassName('icon')[0].getElementsByTagName('img')[0]
    var temp = document.getElementsByClassName('weather-container')[0].getElementsByClassName('icon')[0].getElementsByClassName('temp')[0]
    iconImg.setAttribute('src', 'http://openweathermap.org/img/w/' + weatherJson.weather[0].icon + '.png')
    temp.innerHTML = Math.round(weatherJson.main.temp) + ' / ' + Math.round(weatherJson.forecast.temp)
  }
}