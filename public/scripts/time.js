var time = {
  init: function() {
    document.getElementsByClassName('date')[0].innerHTML = moment().format('dddd, MMMM Do')
    document.getElementsByClassName('time')[0].innerHTML = moment().format('h:mm')
  },
  update: function() {
    document.getElementsByClassName('date')[0].innerHTML = moment().format('dddd, MMMM Do')
    document.getElementsByClassName('time')[0].innerHTML = moment().format('h:mm')

    var now = new Date()
    if (now.getHours() >= this.start && now.getHours() < this.end) {
      document.getElementsByClassName('date')[0].style.color = 'grey'
      document.getElementsByClassName('time')[0].style.color = 'grey'
    }
    else {
      document.getElementsByClassName('date')[0].style.color = 'white'
      document.getElementsByClassName('time')[0].style.color = 'white'
    }
  }
}
