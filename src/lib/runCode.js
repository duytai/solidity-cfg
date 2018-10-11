const BN = require('bn.js')
const opcodes = require('./opcodes')

module.exports = (p) => {
  const codeMap = {}
  const runCode = (params = {}) => {
    const { code, pc = 0, stack = [] } = params
    let programCounter = pc
    let programStack = stack
    let nodes = {}
    while (1) {
      const {
        name: opname,
        in: opIn,
        out: opOut,
        opcode,
      } = opcodes(code[programCounter])
      codeMap[programCounter] = true
      const currentCounter = programCounter
      switch (opname) {
        case 'PUSH': {
          const jumpNum = code[programCounter] - 0x5f
          const pushData = code.slice(
            programCounter + 1,
            programCounter + jumpNum + 1,
          )
          programCounter += jumpNum
          programStack.push(new BN(pushData))
          break
        }
        case 'DUP': {
          const stackPos = opcode - 0x7f
          if (stackPos > programStack.length) return nodes
          const stackItem = programStack[programStack.length - stackPos]
          programStack.push(stackItem)
          break
        }
        case 'SWAP': {
          const stackPos = opcode - 0x8f
          const swapIndex = programStack.length - stackPos - 1
          if (swapIndex < 0) return nodes
          const topIndex = programStack.length - 1
          const tmp = programStack[topIndex]
          programStack[topIndex] = programStack[swapIndex]
          programStack[swapIndex] = tmp
          break
        }
        case 'JUMP': {
          if (programStack.length > 0) {
            const address = programStack.pop()
            if (address.toBuffer().length >= 6) return nodes
            const jumpTo = opcodes(code[address.toNumber()])
            if (jumpTo.name !== 'JUMPDEST') return nodes
            nodes[programCounter] = { childs: [address.toNumber()] }
            return {
              ...nodes,
              ...runCode({ code, pc: address.toNumber(), stack: Array.from(programStack) }),
            }
          }
          break
        }
        case 'JUMPI': {
          if (programStack.length > 1) {
            const address = programStack.pop()
            if (address.toBuffer().length >= 6) return nodes
            programStack.pop()
            const jumpTo = opcodes(code[address.toNumber()])
            nodes[programCounter] = { childs: [programCounter + 1] }
            if (jumpTo.name === 'JUMPDEST') {
              nodes[programCounter].childs.push(address.toNumber())
              nodes = {
                ...nodes,
                ...runCode({ code, pc: address.toNumber(), stack: Array.from(programStack) }),
              }
            }
            nodes = {
              ...nodes,
              ...runCode({ code, pc: programCounter + 1, stack: Array.from(programStack) }),
            }
            return nodes
          }
          break
        }
        case 'STOP':
        case 'RETURN':
        case 'REVERT':
        case 'SELFDESTRUCT':
        case 'INVALID': {
          return nodes
        }
        default: {
          programStack = programStack.slice(0, programStack.length - opIn)
          programStack = programStack.concat(new Array(opOut).fill(new BN(0)))
          break
        }
      }
      programCounter += 1
      if (programCounter >= code.length) return nodes
      if (codeMap[programCounter]) {
        nodes[currentCounter] = {
          childs: [programCounter],
        }
        return nodes
      }
      nodes[currentCounter] = {
        childs: [programCounter],
      }
    }
  }
  return runCode(p)
}
