var prime = {
    init: function() {
        var body = document.getElementsByTagName('body')[0]

        var r = new XMLHttpRequest()
        var me = this
        r.open('GET', '/photoUrls', true)
        r.onreadystatechange = function () {
            if (r.readyState != 4 || r.status != 200) return
            me.imageUrls = JSON.parse(r.responseText).urls
            me.setImage(0)
        };
        r.send()

        this.waitCount = 0
        this.currentImage = 0
        this.waitSeconds = 15
    },
    update: function() {
        this.waitCount++
        if (this.waitCount >= this.waitSeconds) {
            this.waitCount = 0
            this.currentImage++
            if (this.currentImage >= this.imageUrls.length) {
                this.currentImage = 0
            }
            this.setImage(this.currentImage)
        }
    },
    setImage: function(index) {
        var body = document.getElementsByTagName('body')[0]
        body.setAttribute('style', 'background-image: url("' + this.imageUrls[index] + '")')
    }
}