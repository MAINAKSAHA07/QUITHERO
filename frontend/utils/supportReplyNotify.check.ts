/**
 * ponytail: pending ticket set — unread until thread opened
 */
import assert from 'assert'

const PENDING_KEY = 'smono_support_pending_tickets'
const store: Record<string, string> = {}

function read(): Set<string> {
  try {
    return new Set(JSON.parse(store[PENDING_KEY] || '[]') as string[])
  } catch {
    return new Set()
  }
}
function write(ids: Set<string>) {
  store[PENDING_KEY] = JSON.stringify([...ids].slice(-40))
}
function add(id: string) {
  const n = read()
  n.add(id)
  write(n)
}
function clear(id: string) {
  const n = read()
  n.delete(id)
  write(n)
}
function list() {
  return [...read()]
}

add('t1')
add('t2')
assert.deepEqual(list().sort(), ['t1', 't2'])
clear('t1')
assert.deepEqual(list(), ['t2'])
// Opening thread clears pending — poll can re-fire event but badge stays empty for that ticket
assert.equal(list().includes('t1'), false)
console.log('supportReplyNotify.check OK')
