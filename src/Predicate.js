const BN = require('bn.js')

const MAX_DISTANCE = new BN(100)
const MIN_DISTANCE = 1

class Predicate {
  constructor(params) {
    const {
      left, // <BN ...>
      right, // <BN ...>
      operator,
      pc,
    } = params
    this.left = left
    this.right = right
    this.operator = operator
    this.pc = pc
  }

  branchDistance() {
    let distance = 0
    switch (this.operator) {
      case 'GT':
      case 'SGT':
      case 'LT':
      case 'SLT':
      case 'EQ': {
        const tempVal = this.left.sub(this.right)
        distance = tempVal.gte(MAX_DISTANCE) ? MAX_DISTANCE : tempVal.mod(MAX_DISTANCE)
        distance = Math.abs(distance.toNumber()) + MIN_DISTANCE
        break
      }
      default: {
        throw new Error(`Dont know operator ${this.operator}`)
      }
    }
    return 1 - (1.001 ** (-distance))
  }
}

module.exports = Predicate
