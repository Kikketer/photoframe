var prime = {
  init: function() {
    var body = document.getElementsByTagName('body')[0]
    this.waitCount = 0
    this.currentImage = 0
    this.waitSeconds = 30
    this.setImage(0)
  },
  update: function() {
    this.waitCount++
    if (this.waitCount >= this.waitSeconds) {
      this.waitCount = 0
      this.currentImage++
      if (this.currentImage >= 3) {
        this.currentImage = 0
      }
      this.setImage(this.currentImage)
    }
  },
  setImage: function(name) {
    var body = document.getElementsByTagName('body')[0]
    body.setAttribute('style', 'background-image: url("/photostore/' + name + '.jpg")')
  }
}
