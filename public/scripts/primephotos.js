var prime = {
  init: function() {
    var body = document.getElementsByTagName('body')[0]
    this.waitCount = 0
    this.currentImageIndex = 0
    this.waitSeconds = 30
    this.refreshTime = new Date().getTime()
    this.refreshInterval = 86400000
    this.setImage(this.currentImageIndex + '.jpg?r=' + this.refreshTime)
  },
  update: function() {
    this.waitCount++

    // Check to see if we should force the image refresh
    if (new Date().getTime() - this.refreshTime >= this.refreshInterval) {
      this.refreshTime = new Date().getTime()
    }

    if (this.waitCount >= this.waitSeconds) {
      this.waitCount = 0
      this.currentImageIndex++
      if (this.currentImageIndex >= 3) {
        this.currentImageIndex = 0
      }
      this.setImage(this.currentImageIndex + '.jpg?r=' + this.refreshTime)
    }
  },
  setImage: function(name) {
    var body = document.getElementsByTagName('body')[0]
    body.setAttribute('style', 'background-image: url("/photostore/' + name + '")')
  }
}
