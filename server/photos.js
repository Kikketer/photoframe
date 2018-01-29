const fs = require('fs')
const path = require('path')
require('dotenv').config()

module.exports = class PhotoHandler {
  constructor() {
    this.photostore = path.resolve('./photostore')
    this.odrivePy = process.env.ODRIVE_PY
    // setInterval(() => {
    //   // this.unsyncPhotos()
    // }, 5000)
  }

  syncNewPhotos() {
    PhotoHandler.syncDownToDir(
      process.env.SYNC_DIR,
      '/' + process.env.SYNC_DIR,
      () => {
        console.log('Finally done sync!')
      },
      {
        odrivePy: this.odrivePy
      }
    )
  }

  unsyncPhotos() {
    console.log('Running')
    let out = ''
    PhotoHandler.run_cmd(
      'ls',
      ['-al'],
      buffer => {
        out += buffer.toString()
      },
      () => {
        console.log(out)
        out = ''
      }
    )
  }

  static syncDownToDir(dirName, absoluteOriginalPath, cb, options) {
    const steps = dirName.split('/')

    // Shortcut if we are done
    if (!dirName || steps.length === 0) {
      console.log('Dirname is empty, done now...')
      return cb()
    }

    // Recreate the directory up to this step, sigh
    const stepName = steps[0]
    const absAsArray = absoluteOriginalPath.split('/')
    console.log('absasarray: ', absAsArray)
    let directoryUpToThisPoint = ''
    let indexOfCurrentStep = absAsArray.indexOf(stepName)
    if (indexOfCurrentStep < 0) {
      console.log('Trying with cloudf')
      indexOfCurrentStep = absAsArray.indexOf(stepName + '.cloudf')
    }
    console.log('index of current step: ', indexOfCurrentStep, stepName)
    directoryUpToThisPoint = absAsArray.slice(0, indexOfCurrentStep + 1).join('/')

    // Find out if we have the step inside the directory we are in
    const files = fs.readdirSync(directoryUpToThisPoint)
    const fileReg = new RegExp(stepName)
    const file = files.find(file => {
      // This file isn't found, abort!
      return !!file.match(fileReg) && file
    })

    console.log('Found file in dir? ', file)

    if (file && file.match(/.*\.cloudf$/)) {
      console.log('Dirname is a .cloudf, syncing: ', options.odrivePy, directoryUpToThisPoint)

      PhotoHandler.run_cmd(
        'python',
        [options.odrivePy, 'sync', directoryUpToThisPoint],
        () => {},
        () => {
          console.log('Waiting until sync is done...')
          // TODO wait until the sync process is done
          let status = ''
          let statusInterval = setInterval(() => {
            PhotoHandler.run_cmd(
              'python',
              [options.odrivePy, 'syncstatus', directoryUpToThisPoint],
              o => {
                intermediateOutput += o.toString()
              },
              () => {
                console.log('Is sync done? ', status)
                if (status.match(/Synced/g)) {
                  clearInterval(statusInterval)
                  cb()
                }
                status = ''
              }
            )
          }, 1000)
        },
        () => {}
      )
    } else if (file) {
      let pth = steps.slice()
      pth.shift()
      let asString = pth.join('/')
      console.log('Synced, moving down to: ', asString)
      PhotoHandler.syncDownToDir(asString, absoluteOriginalPath, cb, options)
    } else {
      cb('File not found: ', directoryUpToThisPoint)
    }
  }

  static run_cmd(cmd, args, cb, end) {
    var spawn = require('child_process').spawn,
      child = spawn(cmd, args),
      me = this

    child.stdout.on('data', buffer => {
      cb(buffer)
    })
    child.stdout.on('end', end)
  }
}
