const PhotoHandler = require('./photos')

const odriveSource = process.argv[2]
const destination = process.argv[3]
const odrivePython = process.argv[4]

if (!odriveSource || !destination || !odrivePython) {
  throw new Error(
    'Please provide odrive source and destination and python location: node refresh-photos.js source destination'
  )
}

const photoHandler = new PhotoHandler(odriveSource, destination, odrivePython)
photoHandler.syncNewPhotos()
