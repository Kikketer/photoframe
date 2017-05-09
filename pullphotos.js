var imageUrls = [];

function getImageUrls() {
    var imageUrls = document.querySelectorAll('.bg-image');
    return Array.prototype.map.call(imageUrls, function(element) {
        return element.getAttribute('style').match(/url\("(.*)"\)/)[1];
    });
}

var casper = require('casper').create({
    viewportSize: {width: 1280, height: 800},
    waitTimeout: 15000
});

var email = casper.cli.get('email');
var password = casper.cli.get('password');
var target = casper.cli.get(0);

function isUrl(text) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
			     '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
			     '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
			     '(?::\\d{2,5})?' + // port
			     '(?:/[^\\s]*)?$', 'i'); // path

    return pattern.test(text);
}

if (!email) throw 'missing email';
if (!password) throw 'missing password';
if (!target) throw 'provide a keyword to search or url of an item';

casper.userAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36');
casper.on('step.error complete.error', function(error) {
    throw error;
});

var url = 'https://www.amazon.com/ap/signin?_encoding=UTF8&openid.assoc_handle=usflex&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.mode=checkid_setup&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.ns.pape=http%3A%2F%2Fspecs.openid.net%2Fextensions%2Fpape%2F1.0&openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2Fgp%2Fyourstore%2Fhome%3Fie%3DUTF8%26ref_%3Dnav_signin';

casper.start(url, function() {
    this.fill('form[name="signIn"]', {
	email: email,
	password: password
    }, true);
});

casper.then(function() {
    this.capture('login.png');
});

if (isUrl(target)) {
    casper.thenOpen(target);
} else {
    casper.thenOpen('http://www.amazon.com/s/?sf=fedaps&keywords=' + encodeURI(target), function() {
	this.echo(this.getTitle());
	this.capture('results.png');

	this.click('#resultsCol ul li a');
    });
}

// casper.waitFor(function() {
//     return this.getTitle() === 'Prime Photos';
// })

casper.waitFor(function check() {
    console.log('Getting the loaded images')
    return this.evaluate(function() {
        // return document.querySelectorAll('.preload-image.loaded').length - 3 >= document.querySelectorAll('.preload-image').length
        return document.querySelectorAll('.preload-image.loaded').length > 2
    });
});

casper.then(function() {
    this.echo(this.getTitle());
    this.capture('public/primephotos/photos.png');

    imageUrls = imageUrls.concat(this.evaluate(getImageUrls))
});

casper.run(function() {
    // echo results in some pretty fashion
    this.echo(imageUrls.length + ' images found:');
    this.echo(' - ' + imageUrls.join('\n - ')).exit();
});