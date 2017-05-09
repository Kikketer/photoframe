var time = {
    init: function() {
        document.getElementsByClassName('date')[0].innerHTML = moment().format('dddd, MMMM Do')
        document.getElementsByClassName('time')[0].innerHTML = moment().format('h:mm a')
    },
    update: function() {
        document.getElementsByClassName('date')[0].innerHTML = moment().format('dddd, MMMM Do')
        document.getElementsByClassName('time')[0].innerHTML = moment().format('h:mm a')
    }
}