const just = require("../src/just")
const qunit = require('qunit')

const inc = x => x + 1
const twice = x => x * 2

qunit.module('just')

qunit.test('should create a Just functor via #of', (assert) => {
	assert.equal(just.of(1)._inspect(), 'Just(1)')
})

qunit.test('should create a Just functor via #pure', (assert) => {
	assert.equal(just.pure(1)._inspect(), 'Just(1)')
})

qunit.test('should create a Just functor via #unit', (assert) => {
	assert.equal(just.unit(1)._inspect(), 'Just(1)')
})

qunit.test('should follow the identity law', (assert) => {
	const result = just.of(1).map(x => x)._inspect()
	assert.equal(result, 'Just(1)')
})

qunit.test('should follow the composition law', (assert) => {
	const left = just.of(1).map(inc).map(twice)._inspect()
	const right = just.of(1).map(x => twice(inc(x)))._inspect()
	assert.equal(left, right)
})
