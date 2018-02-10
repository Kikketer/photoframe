const fs = require('fs')
const path = require('path')
const debug = require('debug')('photo')
require('dotenv').config()

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const monthsToSeason = {
  January: 'Winter',
  February: 'Winter',
  March: 'Winter',
  April: 'Spring',
  May: 'Spring',
  June: 'Summer',
  July: 'Summer',
  August: 'Summer',
  September: 'Fall',
  October: 'Fall',
  November: 'Fall',
  December: 'Winter'
}

module.exports = class PhotoHandler {
  constructor(source, destination, odrivePython, loggingLevel = 'debug') {
    this.source = path.resolve(source)
    this.destination = destination || process.env.SYNC_DIR
    this.odrivePy = odrivePython || process.env.ODRIVE_PY
  }

  syncNewPhotos() {
    // Resulting folder is: Winter 2015:2016/December edited
    const currentMonth = months[new Date().getMonth()]
    const currentSeason = monthsToSeason[currentMonth]
    let lastYear = new Date().getFullYear() - 1
    if (currentSeason === 'Winter') {
      lastYear = `${lastYear - 1}:${lastYear}`
    }
    const picturePath = this.source
    const thisMonthsPath = `/${currentSeason} ${lastYear}/${currentMonth} edited`

    debug('Unsyncing')
    this.unsyncPhotos().then(() => {
      debug(`Syncing: ${path.join(this.source, thisMonthsPath)}`)

      PhotoHandler.syncDownToDir(
        path.join(this.source.substr(1), thisMonthsPath),
        path.join(this.source, thisMonthsPath),
        err => {
          if (err) {
            return debug(err)
          }
          // Now we pick a random set of JPG pictures to sync and copy them to a location on this server
          PhotoHandler.syncAndCopyRandomFilesFromDirectory(
            path.join(this.source, thisMonthsPath),
            this.destination,
            { odrivePy: this.odrivePy },
            3
          )
        },
        {
          odrivePy: this.odrivePy
        }
      )
    })
  }

  unsyncPhotos(cb) {
    return PhotoHandler.run_cmd('python', [this.odrivePy, 'unsync', this.source])
  }

  static syncAndCopyRandomFilesFromDirectory(directory, destination, options, numberToPick) {
    const files = fs.readdirSync(directory)
    let selectedFiles = []
    for (let i = 0; i < numberToPick; i++) {
      const theFile = files[Math.floor(Math.random() * files.length)]
      debug(`Snagging file: ${path.join(directory, theFile)}`)
      const fileName = path.join(directory, theFile)
      if (fileName.match(/\.cloud/)) {
        PhotoHandler.syncSpecificFile(fileName, options, (err, resultFileName) => {
          // We are now out of sync with the for loop, but who cares
          debug(`Finished syncing file: ${resultFileName}`)
          debug(`Placing file to: ${destination}, ${i}`)
          PhotoHandler.copyFile(resultFileName, path.resolve(destination, `${i}.jpg`))
        })
      }
    }

    // Now odrive sync these files

    return selectedFiles
  }

  static copyFile(source, target, cb = () => {}) {
    var cbCalled = false

    var rd = fs.createReadStream(source)
    rd.on('error', function(err) {
      done(err)
    })
    var wr = fs.createWriteStream(target)
    wr.on('error', function(err) {
      done(err)
    })
    wr.on('close', function(ex) {
      done()
    })
    rd.pipe(wr)

    function done(err) {
      if (!cbCalled) {
        cb(err)
        cbCalled = true
      }
    }
  }

  static syncSpecificFile(file, options, cb) {
    const fileWithoutCloud = file.match(/(.*)\.cloudf?$/)[1]
    return PhotoHandler.run_cmd('python', [options.odrivePy, 'sync', file]).then(() => {
      debug('Waiting until sync is done...')
      // wait until the sync process is done
      let status = ''
      let statusInterval = setInterval(() => {
        return PhotoHandler.run_cmd('python', [options.odrivePy, 'syncstate', fileWithoutCloud], o => {
          status += o
        }).then(() => {
          debug(`Is sync done? ${status}`)
          if (status.match(/Synced/g)) {
            clearInterval(statusInterval)
            cb(null, fileWithoutCloud)
          }
          status = ''
        })
      }, 1000)
    })
  }

  static syncDownToDir(dirName, absoluteOriginalPath, cb, options) {
    const steps = dirName.split('/')

    // Shortcut if we are done
    if (!dirName || steps.length === 0) {
      debug('Dirname is empty, done now...')
      return cb()
    }

    // Recreate the directory up to this step, sigh
    const stepName = steps[0]
    const absAsArray = absoluteOriginalPath.split('/')
    let directoryUpToThisPoint = ''
    let indexOfCurrentStep = absAsArray.indexOf(stepName)
    if (indexOfCurrentStep < 0) {
      debug('Trying with cloudf')
      indexOfCurrentStep = absAsArray.indexOf(stepName + '.cloudf')
    }
    debug(`index of current step: ${(indexOfCurrentStep, stepName)}`)
    directoryUpToThisPoint = absAsArray.slice(0, indexOfCurrentStep).join('/') || '/'

    debug(`Directory up to this point: ${directoryUpToThisPoint}`)
    // Find out if we have the step inside the directory we are in
    const files = fs.readdirSync(directoryUpToThisPoint)
    debug(`Files in dir: ${files}`)
    const fileReg = new RegExp(stepName)
    const file = files.find(f => {
      // This file isn't found, abort!
      return f.match(fileReg)
    })

    if (file && file.match(/.*\.cloudf$/)) {
      debug(`Dirname is a .cloudf, syncing: ${path.join(directoryUpToThisPoint, file)}`)
      let fileWithoutCloudF = file.match(/(.*)\.cloudf$/)[1]

      return PhotoHandler.run_cmd('python', [options.odrivePy, 'sync', path.join(directoryUpToThisPoint, file)]).then(
        () => {
          debug('Waiting until sync is done... ')
          // wait until the sync process is done
          let status = ''
          let statusInterval = setInterval(() => {
            return PhotoHandler.run_cmd(
              'python',
              [options.odrivePy, 'syncstate', path.join(directoryUpToThisPoint, fileWithoutCloudF)],
              o => {
                status += o
              }
            ).then(() => {
              debug(`Is sync done? ${status.match(/Synced/g)}`)
              if (status.match(/Synced/g)) {
                clearInterval(statusInterval)
                let pth = steps.slice()
                pth.shift()
                let asString = pth.join('/')
                debug(`Synced, moving down to: ${asString}`)
                PhotoHandler.syncDownToDir(asString, absoluteOriginalPath, cb, options)
              }
              status = ''
            })
          }, 1000)
        }
      )
    } else if (file) {
      let pth = steps.slice()
      pth.shift()
      let asString = pth.join('/')
      debug(`Synced, moving down to: ${asString}`)
      PhotoHandler.syncDownToDir(asString, absoluteOriginalPath, cb, options)
    } else {
      cb('File not found: ' + path.join(directoryUpToThisPoint, stepName))
    }
  }

  static run_cmd(cmd, args, cb = () => {}) {
    return new Promise((resolve, reject) => {
      var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this

      child.stdout.on('data', buffer => {
        // debug(buffer.toString())
        cb(buffer ? buffer.toString() : '')
      })
      child.stdout.on('end', () => {
        resolve()
      })
    })
  }
}
