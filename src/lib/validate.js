const validate = (compactTree) => {
  const parents = Object.keys(compactTree)
    .map(k => parseInt(k, 10))
    .filter(k => k !== 0)
  const childrens = Object.values(compactTree)
    .map(({ childs }) => childs)
    .reduce((r, n) => r.concat(n), [])
  for (let i = 0; i < parents.length; i += 1) {
    if (!childrens.includes(parents[i])) return false
  }
  return true
}

module.exports = validate
