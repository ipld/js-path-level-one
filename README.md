# IPLD Path Resolver

This library will resolve paths through links in a multi-block
graph.

All functions take three arguments.

* `path` - a string representing the target path: `/one/two/three`.
* `root` - a CID or Block instance for the root node of the graph.
* `get` - an async function that accepts a CID instance and returns a Block instance.

## async resolve(path, root, get)

Returns the value of the target path.

## async find(path, root, get)

Returns an object with the following properties:

* `value` - the value from of the target path.
* `block` - that block instance that contains the value.
* `path` - the path to the value *within* the block.

## blocks(path, root, get)

Returns and async iterator that yields Block instances for every block along the resolved path.

