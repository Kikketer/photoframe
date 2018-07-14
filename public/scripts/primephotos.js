var prime = {
  init: function() {
    this.frames = [document.getElementsByClassName('frame-0')[0], document.getElementsByClassName('frame-1')[0]]
    this.blurFrames = [document.getElementsByClassName('frame-0')[1], document.getElementsByClassName('frame-1')[1]]
    this.waitCount = 0
    this.currentImageIndex = 0
    this.waitSeconds = 30
    this.refreshTime = new Date().getTime()
    this.refreshInterval = 86400000
    this.setImage(0)
    this.setImage(1)
    this.currentFrameIndex = 0
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
      this.currentFrameIndex++

      if (this.currentImageIndex >= 3) {
        this.currentImageIndex = 0
      }

      if (this.currentFrameIndex >= 2) {
        this.currentFrameIndex = 0
      }

      var me = this

      // Swap opacity
      // TODO make this work better, but I'm watching football so it's good enough
      if (this.currentFrameIndex === 0) {
        this.frames[0].style.opacity = 0
        // this.blurFrames[0].style.opacity = 0
        setTimeout(function() {
          // Load the next image into this frame
          me.setImage(0)
        }, 1200)
      } else {
        this.frames[0].style.opacity = 1
        // this.blurFrames[0].style.opacity = 1
        setTimeout(function() {
          // Load the image in the other frame (the one now hidden under this)
          me.setImage(1)
        }, 1200)
      }
    }
  },
  setImage: function(frameIndex) {
    var rando = Math.random()
    this.frames[frameIndex].setAttribute('style', 'background-image: url("/image?r=' + rando + '")')
    // this.blurFrames[frameIndex].setAttribute('style', 'background-image: url("/image?r=' + rando + '")')
  }
}
