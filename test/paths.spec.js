'use strict'
const { Block } = require('@ipld/stack')
const { resolve, find, blocks } = require('../')
const { it } = require('mocha')
const assert = require('assert')
const tsame = require('tsame')

const same = (...args) => assert.ok(tsame(...args))
const test = it

const fixture = async () => {
  let db = new Map()
  let leaf = Block.encoder({ hello: 'world', sub: { blah: 1 }, arr: ['test'] }, 'dag-cbor')
  let raw = Block.encoder(Buffer.from('asdf'), 'raw')
  let _root = { one: { two: { three: { raw: await raw.cid(), leaf: await leaf.cid() } } } }
  let root = Block.encoder(_root, 'dag-cbor')
  db.set((await root.cid()).toBaseEncodedString(), root)
  for (let block of [leaf, raw, root]) {
    db.set((await block.cid()).toBaseEncodedString(), block)
  }
  return { leaf, raw, root, db, get: cid => db.get(cid.toBaseEncodedString()) }
}

test('basic find', async () => {
  let { root, get, leaf } = await fixture()
  let ret = await find('/one/two/three/leaf/hello', root, get)
  same(await leaf.cid(), await ret.block.cid())
  same(ret.value, 'world')
  same(ret.path, 'hello')
  ret = await find('/one', await root.cid(), get)
  same(await root.cid(), await ret.block.cid())
  same(Object.keys(ret.value), ['two'])
  same(ret.path, '/one')
  ret = await find('', root, get)
  same(ret.path, '')
  same(Object.keys(ret.value), ['one'])
  same(await root.cid(), await ret.block.cid())
})

test('basic resolve', async () => {
  let { root, get } = await fixture()
  let ret = await resolve('/one', root, get)
  same(Object.keys(ret), ['two'])
  ret = await resolve('/one/two/three/leaf/hello', await root.cid(), get)
  same(ret, 'world')
  ret = await resolve('', root, get)
  same(Object.keys(ret), ['one'])
})

const compact = async iter => {
  let arr = []
  for await (let block of iter) {
    arr.push(block)
  }
  return arr
}

test('basic blocks', async () => {
  let { root, get, leaf } = await fixture()
  let ret = await compact(blocks('/', root, get))
  same(ret.length, 1)
  same(await ret[0].cid(), await root.cid())
  ret = await compact(blocks('/one/two/three/leaf/hello', await root.cid(), get))
  same(ret.length, 2)
  let [_root, _leaf] = ret
  same(await _root.cid(), await root.cid())
  same(await _leaf.cid(), await leaf.cid())
})

test('errors', async () => {
  let _blocks = []
  let trytest = async (fn, msg) => {
    try {
      if (!fn.next) await fn()
      else {
        for await (let x of fn) {
          _blocks.push(x)
        }
      }
      assert(false)
    } catch (e) {
      same(e.message, msg)
    }
  }
  await trytest(() => find('/', null), 'root argument must be Block or CID')
  await trytest(() => resolve('/', null), 'root argument must be Block or CID')
  await trytest(blocks('/', null), 'root argument must be Block or CID')
  same(_blocks.length, 0)
})
