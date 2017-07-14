var bgvideo = {
  init: function () {
    this.setImage('http://192.168.0.226/webcam/?action=stream&1500043266766')
  },
  update: function () {

  },
  setImage: function (imageUrl) {
    var body = document.getElementsByTagName('body')[0]
    var img = document.createElement('img')
    img.setAttribute('class', 'bg-video')
    img.setAttribute('src', imageUrl)
    body.appendChild(img)
  }
}