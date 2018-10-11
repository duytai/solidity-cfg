const path = require('path')
const fs = require('fs')
const BN = require('bn.js')
const { CFG, Predicate } = require('../')

it('bnb', () => {
  const bin = fs.readFileSync(path.join(__dirname, './bnb.bin'), 'utf8')
  const cfg = CFG.from(Buffer.from(bin, 'hex'))
  expect(cfg.totalBranches()).toEqual(10)
  const shortestPath = cfg.findShortestBranchPath(12, 462)
  expect(shortestPath).toEqual([12, 360, 462])
  const visitedNodes = [12, 17, 360, 361, 427, 462, 463, 453]
  const { level, node } = cfg.approachLevel(visitedNodes, 406)
  expect(level).toEqual(1)
  expect(node).toEqual(360)
  const ops = ['GT', 'SGT', 'LT', 'SLT', 'EQ']
  const values = [
    2.019791531187325,
    2.019791531187325,
    2.019791531187325,
    2.019791531187325,
    2.019791531187325,
  ]
  // string
  const brd = new Predicate({
    left: new BN(Buffer.from('fffffffffffffffffffffffffffffffffff', 'hex')),
    right: new BN(Buffer.from('fffffffffffffffffffffffffffffffffff', 'hex')),
    operator: 'EQ',
    pc: 1000,
  }).branchDistance()
  expect(brd).toEqual(0)
  ops.forEach((op, index) => {
    cfg.predicates[360] = new Predicate({
      left: new BN(20),
      right: new BN(40),
      operator: op,
      pc: 360,
    })
    const value = cfg.objectiveValue(visitedNodes, 397)
    expect(value).toEqual(values[index])
  })
  cfg.covered[16] = ['d41d8cd98f00b204e9800998ecf8427e']
  cfg.covered[453] = ['d41d8cd98f00b204e9800998ecf8427e']
  cfg.covered[360] = ['d41d8cd98f00b204e9800998ecf8427e']
  cfg.covered[12] = ['d41d8cd98f00b204e9800998ecf8427e']
  expect(cfg.numCoveredBranches()).toEqual(0)
  expect(cfg.leafs()).toEqual([16, 311, 397, 453])
  expect(cfg.uncoveredLeafs()).toEqual([311, 397])
  // no visited nodes
  const v = cfg.objectiveValue([], 397)
  expect(v).toEqual(Infinity)
})
