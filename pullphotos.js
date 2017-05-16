const fs = require('fs')
var imageUrls = []
var years = ['2016', '2015', '2014']
var url = 'https://www.amazon.com/photos/thisday/'

function getImageUrls() {
    var links = document.getElementsByClassName('node-link');
    return Array.prototype.map.call(links, function (element) {
        return element.href;
    });
}

function getYear(year) {
    casper.thenOpen(url + year);

    casper.then(function () {
        console.log('Getting Year: ' + year);
        this.capture('progress/2-initial-' + year + '.png')
    })

    casper.wait(10000, function () {
        console.log('Done waiting.. hopefully it\'s loaded')
    })

    casper.then(function () {
        this.echo(this.getTitle());
        this.capture('progress/3-photos-' + year + '.png');

        imageUrls = imageUrls.concat(this.evaluate(getImageUrls))
        console.log('Total Images: ', imageUrls);
    });
}

var casper = require('casper').create({
    viewportSize: { width: 1280, height: 800 },
    waitTimeout: 30000,
    verbose: true,
    logLevel: "debug"
});

var email = casper.cli.get('email');
var password = casper.cli.get('password');
var zip = casper.cli.get('zip');
var totalImages = 0

if (!email) throw 'missing email';
if (!password) throw 'missing password';
if (!zip) throw 'missing zip code';

casper.userAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36');
casper.on('step.error complete.error', function (error) {
    throw error;
});

var loginUrl = 'https://www.amazon.com/ap/signin?_encoding=UTF8&openid.assoc_handle=usflex&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.mode=checkid_setup&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.ns.pape=http%3A%2F%2Fspecs.openid.net%2Fextensions%2Fpape%2F1.0&openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fwww.amazon.com%2Fgp%2Fyourstore%2Fhome%3Fie%3DUTF8%26ref_%3Dnav_signin';

casper.start(loginUrl, function () {
    this.fill('form[name="signIn"]', {
        email: email,
        password: password
    }, true)
});

casper.wait(1000);

casper.then(function () {
    this.capture('progress/1-login.png')
});

casper.then(function () {
    var hasZipQuestion = this.evaluate(function () {
        return !!document.getElementsByName('dcq_question_subjective_1').length;
    });

    console.log('The zip question? ', hasZipQuestion);
    if (hasZipQuestion) {
        this.fill('form[name="ap_dcq_form"]', {
            dcq_question_subjective_1: zip
        }, true)
    }
});

casper.wait(1000);

casper.then(function () {
    this.capture('progress/1-zip.png')
});

casper.then(function () {
    for (var yearIndex = 0; yearIndex < years.length; yearIndex++) {
        getYear(years[yearIndex])
    }
});

casper.run(function () {
    // echo results in some pretty fashion
    this.echo(imageUrls.length + ' images found');

    fs.writeFileSync('public/primephotos/photoUrls.json', JSON.stringify(
        {
            urls: imageUrls
        }
    ))

    this.exit();
});