const fs = require('fs')
const path = require('path')
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
  constructor(source, destination, odrivePython, numberToSync) {
    this.source = path.resolve(source)
    this.destination = destination || process.env.SYNC_DIR
    this.odrivePy = odrivePython || process.env.ODRIVE_PY
    this.numberToSync = numberToSync
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

    console.log('Unsyncing')
    this.unsyncPhotos().then(() => {
      console.log(`Syncing: ${path.join(this.source, thisMonthsPath)}`)

      this.syncDownToDir(
        path.join(this.source.substr(1), thisMonthsPath),
        path.join(this.source, thisMonthsPath),
        err => {
          console.log('Finished syncing down to the directory')
          if (err) {
            return console.error(err)
          }
          // Now we pick a random set of JPG pictures to sync and copy them to a location on this server
          this.syncAndCopyRandomFilesFromDirectory(
            path.join(this.source, thisMonthsPath),
            this.destination,
            { odrivePy: this.odrivePy }
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

  something(picked) {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Resolving: ', picked)
        resolve()
      }, 1500)
    })
  }

  async syncAndCopyRandomFilesFromDirectory(directory, destination, options, numberToPick) {
    const files = fs.readdirSync(directory)
    numberToPick = numberToPick || files.length
    console.log('Finding ' + numberToPick + ' random files to pick')
    let selectedFiles = []
    let picked = 0

    while (picked < numberToPick) {
      const theFile = files[Math.floor(Math.random() * files.length)]
      // console.log(`Attempting to snag file: ${path.join(directory, theFile)}`)
      const fileName = path.join(directory, theFile)
      if (fileName.match(/\.cloud$/)) {
        // await this.something(picked)
        const resultFileName = await this.syncSpecificFile(fileName, options)
        // We are now out of sync with the for loop, but who cares
        console.log(`Finished syncing file: ${resultFileName}`)
        console.log(`Placing file to: ${destination}, ${picked}`)
        await new Promise(resolve => {
          this.copyFile(resultFileName, path.resolve(destination, `${picked}.jpg`), err => {
            console.log('Finished copying file')
            return resolve()
          })
        })
        picked++
      }
    }

    // return PhotoHandler.promiseSerial(selectedFiles)
    //   .then(() => {
    //     console.log('Done with all')
    //   })
    //   .catch(err => {
    //     console.error(err)
    //   })

    // selectedFiles.forEach(async file => {
    //   console.log(`Grabbing file: ${file}`)
    //   var fn = () => {
    //     return new Promise(resolve => {
    //       setTimeout(() => {
    //         console.log('resolving')
    //       }, 15000)
    //     })
    //   }

    //   await fn()
    //   // await PhotoHandler.syncSpecificFile(fileName, options, (err, resultFileName) => {
    //   //   // We are now out of sync with the for loop, but who cares
    //   //   console.log(`Finished syncing file: ${resultFileName}`)
    //   //   console.log(`Placing file to: ${destination}, ${picked}`)
    //   //   PhotoHandler.copyFile(resultFileName, path.resolve(destination, `${picked}.jpg`))
    //   // })
    //   console.log('Finished syncing file')
    // })

    // return selectedFiles
  }

  copyFile(source, target, cb = () => {}) {
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

  syncSpecificFile(file, options) {
    const fileWithoutCloud = file.match(/(.*)\.cloudf?$/)[1]
    return new Promise(resolve => {
      return PhotoHandler.run_cmd('python', [options.odrivePy, 'sync', file]).then(() => {
        console.log('Waiting until sync is done...')
        // wait until the sync process is done
        let status = ''
        let statusInterval = setInterval(() => {
          return PhotoHandler.run_cmd('python', [options.odrivePy, 'syncstate', fileWithoutCloud], o => {
            status += o
          }).then(() => {
            console.log(`Is sync done? ${status}`)
            if (status.match(/Synced/g)) {
              clearInterval(statusInterval)
              resolve(fileWithoutCloud)
              // cb(null, fileWithoutCloud)
            }
            status = ''
          })
        }, 1000)
      })
    })
  }

  syncDownToDir(dirName, absoluteOriginalPath, cb, options) {
    const steps = dirName.split('/')

    // Shortcut if we are done
    if (!dirName || steps.length === 0) {
      console.log('Dirname is empty, done now...')
      return cb()
    }

    // Recreate the directory up to this step, sigh
    const stepName = steps[0]
    const absAsArray = absoluteOriginalPath.split('/')
    let directoryUpToThisPoint = ''
    let indexOfCurrentStep = absAsArray.indexOf(stepName)
    if (indexOfCurrentStep < 0) {
      console.log('Trying with cloudf')
      indexOfCurrentStep = absAsArray.indexOf(stepName + '.cloudf')
    }
    console.log(`index of current step: ${(indexOfCurrentStep, stepName)}`)
    directoryUpToThisPoint = absAsArray.slice(0, indexOfCurrentStep).join('/') || '/'

    console.log(`Directory up to this point: ${directoryUpToThisPoint}`)
    // Find out if we have the step inside the directory we are in
    const files = fs.readdirSync(directoryUpToThisPoint)
    // console.log(`Files in dir: ${files}`)
    const fileReg = new RegExp(stepName)
    const file = files.find(f => {
      // This file isn't found, abort!
      return f.match(fileReg)
    })

    if (file && file.match(/.*\.cloudf$/)) {
      console.log(`Dirname is a .cloudf, syncing: ${path.join(directoryUpToThisPoint, file)}`)
      let fileWithoutCloudF = file.match(/(.*)\.cloudf$/)[1]

      return PhotoHandler.run_cmd('python', [options.odrivePy, 'sync', path.join(directoryUpToThisPoint, file)]).then(
        () => {
          console.log('Waiting until sync is done... ')
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
              console.log(`Is sync done? ${status.match(/Synced/g)}`)
              if (status.match(/Synced/g)) {
                clearInterval(statusInterval)
                let pth = steps.slice()
                pth.shift()
                let asString = pth.join('/')
                console.log(`Synced, moving down to: ${asString}`)
                this.syncDownToDir(asString, absoluteOriginalPath, cb, options)
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
      console.log(`Synced, moving down to: ${asString}`)
      this.syncDownToDir(asString, absoluteOriginalPath, cb, options)
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
        // console.log(buffer.toString())
        cb(buffer ? buffer.toString() : '')
      })
      child.stdout.on('end', () => {
        resolve()
      })
    })
  }

  static promiseSerial(funcs) {
    return funcs.reduce(
      (promise, func) => promise.then(result => func().then(Array.prototype.concat.bind(result))),
      Promise.resolve([])
    )
  }
}
