const fs = require('fs')
const path = require('path')

class Database {

  constructor() {
    this._rootDir = 'database'
    this._groupDir = path.join(this._rootDir, 'group_data')
    this._contributorDir = path.join(this._rootDir, 'contributor_data')

    const dirs = [this._rootDir, this._groupDir, this._contributorDir]
   
    for (let dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdir(dir)
      }
    }
  }

  getLatestGroupData() {
    const filenames = getSortedFilenameList(this._groupDir)
    const latestFilename = filenames[filenames.length - 1]
    const p = path.join(this._groupDir, latestFilename)

    const data = fs.readFileSync(p, 'utf8')

    return data
  }

  getGroupData({ targetDatetime }) {

    const filenames = getSortedFilenameList(this._groupDir)

    let result = {}
    let bestMatchFilename = null

    // TODO: optimize for early termination
    for (let filename of filenames) {

      const datetime = this._getGroupDatetime(filename)

      if (datetime <= targetDatetime) {
        bestMatchFilename = filename
      }
      else if (datetime > targetDatetime) {
        break
      }
    }

    if (bestMatchFilename) {
      result = this._readGroupFile(bestMatchFilename)
    }

    return result
  }

  getGroupDataForRange({ fromDate, toDate }) {

    const filenames = getSortedFilenameList(this._groupDir)

    let results = []

    // TODO: optimize for early termination
    for (let filename of filenames) {
      const datetime = this._getGroupDatetime(filename)

      if (datetime > fromDate && datetime < toDate) {
        const data = this._readGroupFile(filename)  
        results.push(data)
      }
    }

    return results
  }

  // TODO: duplicated code, extract method
  getContributorData({ targetDatetime }) {

    const filenames = getSortedFilenameList(this._contributorDir)

    let result = {}
    let bestMatchFilename = null

    // TODO: optimize for early termination
    for (let filename of filenames) {

      const datetime = this._getContributorDatetime(filename)

      if (datetime <= targetDatetime) {
        bestMatchFilename = filename
      }
      else if (datetime > targetDatetime) {
        break
      }
    }

    if (bestMatchFilename) {
      result = this._readContributorFile(bestMatchFilename)
    }

    return result
  }

  _getGroupDatetime(filename) {
      return filename.slice(11).slice(0, -5)
  }

  _readGroupFile(filename) {

    const p = path.join(this._groupDir, filename)
    return this._readFile(p)
  }

  _getContributorDatetime(filename) {
      return filename.slice(17).slice(0, -5)
  }

  _readContributorFile(filename) {
    const p = path.join(this._contributorDir, filename)
    return this._readFile(p)
  }
  _readFile(filePath) {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  }
}

function getSortedFilenameList(dir) {
  const files = fs.readdirSync(dir)

  files.sort()

  return files
}
module.exports = {
  Database
}
