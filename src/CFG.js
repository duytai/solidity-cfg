const { compress, runCode, validate } = require('./lib')

class CFG {
  constructor(compactTree) {
    if (!validate(compactTree)) throw new Error('Invalid tree')
    this.compactTree = compactTree
    // nodename -> predicate
    this.predicates = {}
    // nodename ->  {count: <num>, fp: <chrom_fingerprint>}
    this.covered = {}
    // catch all posible branch paths for later use
    this.allPaths = this.findAllPaths()
    // save all covered branches
    this.branches = {}
  }

  isBranchByName(nodeName) {
    if (!this.compactTree[nodeName]) return false
    return this.compactTree[nodeName].childs.length === 2
  }

  totalBranches() {
    return 2 * Object.values(this.compactTree)
      .filter(v => v.childs.length === 2)
      .length
  }

  findShortestBranchPath(source, destination) {
    let shortestPath = null
    if (!this.isBranchByName(source)) throw new Error(`source ${source} must be a branch`)
    this.allPaths.forEach((p) => {
      const sourceIndex = p.indexOf(source)
      const destIndex = p.indexOf(destination)
      if (sourceIndex !== -1 && destIndex !== -1 && destIndex > sourceIndex) {
        const candidatePath = p.slice(sourceIndex, destIndex + 1)
        const candidateBranchPath = this.toBranchPath(candidatePath)
        if (shortestPath === null || shortestPath.length > candidateBranchPath.length) {
          shortestPath = candidateBranchPath
        }
      }
    })
    return shortestPath
  }

  approachLevel(visitedNodes, targetNode) {
    const visitedBranchNodes = visitedNodes.filter(this.isBranchByName.bind(this))
    const targetIsBranch = this.isBranchByName(targetNode)
    let minLevel = Infinity
    let node = null
    visitedBranchNodes.forEach((v) => {
      const shortestPath = this.findShortestBranchPath(v, targetNode)
      if (shortestPath !== null) {
        const level = targetIsBranch ? shortestPath.length - 2 : shortestPath.length - 1
        if (level < minLevel) {
          minLevel = level
          node = shortestPath[0]
        }
      }
    })
    return { level: minLevel, node }
  }

  objectiveValue(vistedNodes, targetNode) {
    if (!vistedNodes.length) return Infinity
    const { level, node } = this.approachLevel(vistedNodes, targetNode)
    if (!node) return Infinity
    const predicate = this.predicates[node]
    if (!predicate) {
      throw new Error(`No predicate at node ${node}`)
    }
    return level + predicate.branchDistance()
  }

  leafs() {
    return Object.values(this.compactTree)
      .reduce((r, { childs }) => r.concat(childs), [])
      .filter(n => !this.compactTree[n])
  }

  uncoveredLeafs() {
    return this.leafs().filter(l => !this.covered[l])
  }

  numCoveredBranches() {
    return Object.keys(this.branches).length
  }

  findAllPaths() {
    const traverse = (tree, path, leafs, paths = []) => {
      const [lastNode] = path.slice(-1)
      if (leafs.includes(lastNode)) return paths.push(path)
      const { childs } = tree[lastNode]
      childs.forEach((c) => {
        if (path.includes(c)) return paths.push(path)
        traverse(tree, path.concat([c]), leafs, paths)
      })
      return paths
    }
    return traverse(this.compactTree, [0], this.leafs())
  }

  toBranchPath(p) {
    return p.filter(this.isBranchByName.bind(this))
  }

  static from(byteCode) {
    const nodes = runCode({ code: byteCode })
    const compactTree = compress(nodes)
    return new CFG(compactTree)
  }
}

module.exports = CFG
