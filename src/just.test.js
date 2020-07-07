const just = require("./just")

const inc = x => x + 1
const twice = x => x * 2

describe('just functor', () => {
	it('should create a Just functor via #of', () => {
		expect(just.of(1)._inspect()).toBe('Just(1)')
	})

	it('should create a Just functor via #pure', () => {
		expect(just.pure(1)._inspect()).toBe('Just(1)')
	})

	it('should create a Just functor via #unit', () => {
		expect(just.unit(1)._inspect()).toBe('Just(1)')
	})

	it('should follow the identity law', () => {
		const result = just.of(1).map(x => x)._inspect()
		expect(result).toEqual('Just(1)')
	})

	it('should follow the composition law', () => {
		const left = just.of(1).map(inc).map(twice)._inspect()
		const right = just.of(1).map(x => twice(inc(x)))._inspect()
		expect(left).toEqual(right)
	})
})
