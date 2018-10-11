const compress = (nodes) => {
  const compactTree = {}
  const candidateNodeNames = []
  const mergedNodes = []
  for (const [pc, { childs }] of Object.entries(nodes)) {
    const programCounter = parseInt(pc, 10)
    if (childs.length === 2) {
      candidateNodeNames.push(programCounter)
      candidateNodeNames.push(childs[0])
      candidateNodeNames.push(childs[1])
      compactTree[programCounter] = { childs }
    } else {
      const [child] = childs
      let mergeable = false
      for (let i = 0; i < mergedNodes.length; i += 1) {
        const mergedNode = mergedNodes[i]
        if (
          mergedNode.child === programCounter
          && !candidateNodeNames.includes(programCounter)
        ) {
          mergedNode.child = child
          mergeable = true
          break
        }
      }
      if (!mergeable) {
        mergedNodes.push({
          parent: programCounter,
          child,
        })
      }
    }
  }
  mergedNodes.forEach(
    ({ parent, child }) => (compactTree[parent] = { childs: [child] }),
  )
  return compactTree
}
module.exports = compress
