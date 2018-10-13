var fresh = {
  start: 0,
  end: 5,
  init: function () {

  },
  update: function () {
    var now = new Date()
    if (now.getHours() >= this.start && now.getHours() < this.end) {
      // Black out the screen!  I'm using an overlay instead of display:none on all children
      document.getElementsByClassName('fresh-screen')[0].setAttribute('style', 'display:block')
    }
    else {
      document.getElementsByClassName('fresh-screen')[0].setAttribute('style', 'display:none')
    }

    // if(now.getHours() === 10 && now.getMinutes() === 0 && now.getSeconds() >= 0 && now.getSeconds() < 2) {
    //   window.location.reload()
    // }
  }
}