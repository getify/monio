# FP + Monads

If you're already comfortable with Functional Programming (FP), especially side effects and pure functions and such, you can [skip to "Expansive Intro To Monads"](#expansive-intro-to-monads) below.

## Functional Programming (FP)

FP is a topic that often carries with it a fair bit of "baggage", and that goes even more for monads. It's quite easy to get lost out in the web-of-google-searches when bombarded by the formalized terminology or math behind these topics, especially since so many FP fans believe that the formalism and math *are basically required* to get anything out of them.

Hear me on this: **you DO NOT need a CS or Math degree** to immerse yourself in FP, and further to adopt a mindset around monads. The formalism and math can offer a richer and deeper experience with the topics the further you dive into them, but you don't have to start there (unless you want to!).

Have you written code like this before?

```js
const FPBookNames = [];

for (const record of data) {
    if (record.topic == "FP") {
        FPBookNames.push(record.bookName);
    }
}
```

This is what we typically call "imperative" style code. It's comfortable and familiar to most of us. But it focuses on *how* to do a task. To understand the *what* or *why* of that code, you have to sort of mentally execute the code and infer its meaning. Only after reading it, you might realize: "that code is selecting records with a topic of 'FP' and sticking their book-name into an array".

What if your code could be more "declarative" and state the *what* and *why* more clearly at a glance, de-emphasizing the *how* as a less important implementation detail? Would being able to determine the purpose of a snippet of code more readily and effectively, make that code *more readable*? What if that code was also more resilient (less susceptible to bugs) and more testable (more isolated/pure)?

That's why FP exists.

### From Loop To Map And Filter

For example, imagine you have a single string value, and you want to uppercase the value.

```js
function uppercase(str) { return str.toUpperCase(); }

var greeting = "Hello, friend!";

console.log( uppercase(greeting) );   // HELLO, FRIEND!
```

That's pretty straightforward. But now let's say you had multiple strings to uppercase. You could manually call `uppercase(..)` for each string. But when we have multiple values, it's often more convenient to stick them in an array. Imperatively, uppercasing an array of strings would likely be done like this:

```js
// assumed: function uppercase(str) { .. }
// assumed: `listOfStrings` (array of string values)

for (let i = 0; i < listOfStrings.length; i++) {
    listOfStrings[i] = uppercase(listOfStrings[i]);
}
```

But here we modified the entries in the array by replacing each original string with its uppercase version. In FP, we generally prefer not to modify/reassign but rather to create *new* values, as a way to cut down on the chances of unexpected side-effects causing bugs in the program. So let's do that by creating a new list:

```js
// assumed: function uppercase(str) { .. }
// assumed: `listOfStrings` (array of string values)

let listOfUpperStrings = [];

for (let i = 0; i < listOfStrings.length; i++) {
    listOfUpperStrings[i] = uppercase(listOfStrings[i]);
}
```

That code is perfectly *fine*. But the first time you encounter it, to understand the overall "what", you have to mentally execute that code and infer its purpose. Afterwards, you can assert, "this code takes a list of string values and produces a new list of all the values uppercased".

Performing the same operation for each value in a list, is a pretty common task in programming. So much so that we have named this task and invented well known utilities for it, specifically `map(..)`. Let's see it:

```js
// assumed: function uppercase(str) { .. }
// assumed: `listOfStrings` (array of string values)

const listOfUpperStrings = listOfStrings.map(uppercase);
```

The array `map(..)` takes a single function as input. This function needs to receive a single value and return a value back. `uppercase(..)` fits that description, so we pass it directly. `map(..)` gives us back a new array, containing all the return values from calling the provided function (`uppercase(..)`) against the original values.

One general assertion of FP is that the mechanics of looping over a list, and calling a function against each value in the list, are so well known as to not need to be written explicitly in code. Instead, we use `map(..)`. The resulting code is more *declarative* than *imperative*. As such, the reader -- if they know what `map(..)` does, already -- can more readily glance at it and recognize, *without much mental execution*, that the outcome (the "what") of this code is a new list of uppercased strings.

FP has recognized a whole bunch of these common tasks, and named and implemented them as recognized utilities.

For example, `filter(..)` does something similar to `map(..)`, but instead of producing new values, it performs an `if` to decide if a value should be kept/included in the new list or not.

```js
// assumed: `listOfStrings` (array of string values)

function isLongEnough(str) { return str.length > 50; }

const listOfLongStrings = listOfStrings.filter(isLongEnough);
```

`listOfLongStrings` will be a new array that includes only strings from the original `listOfStrings` that are longer than 50 characters. And that outcome should be more readily discernable than if we'd written the `for` loop imperative equivalent.

And we can even "compose" (i.e., do both together) the `map(..)` and `filter(..)` operations:

```js
// assumed: function uppercase(str) { .. }
// assumed: function isLongEnough(str) { .. }
// assumed: `listOfStrings` (array of string values)

listOfStrings.filter(isLongEnough).map(uppercase);
```

Now we have a list of long-enough strings that have all been uppercased!

So that's a bit of the early mindset adoption that getting into FP brings you. It's the tip of a massive iceberg.

### Where To Learn More FP?

If you're intrigued, but new to such FP concepts, I invite you to check out -- at least the first several chapters of -- my free-to-read-online FP book: [Functional-Light JavaScript](https://github.com/getify/functional-light-js).

There are also several [high-quality video courses about FP on Frontend Masters](https://frontendmasters.com/courses/?q=functional), including:

* Bianca Gandolfo's ["From Fundamentals To Functional JS"](https://frontendmasters.com/courses/js-fundamentals-functional-v2/)

* Anjana Vakil's ["Functional JavaScript First Steps"](https://frontendmasters.com/courses/functional-first-steps/)

* My ["Functional-Light JavaScript"](https://frontendmasters.com/courses/functional-javascript-v3/) -- a companion course to [my book](https://github.com/getify/functional-light-js) of the same name

I think your first big goal should be to understand and feel comfortable with -- but not an expert on! -- the following topics:

* Side Effects
* Pure Functions
* Higher-order Functions
* Function Composition
* Currying
* Basic List Operations (filter/map/reduce)

### How Do I Know...?

How might you know if you're on the right path and comfortable enough with FP to move on to monads? There's no great way for me to answer that for all readers of this guide. But I at least want to offer a bit of a glimpse or hint instead of leaving you only with the unsatisfying, "it depends".

There are of course many ways (e.g., with `reduce(..)`) to approach the `FPBookNames` code snippet at the beginning, in FP style. I'm not going to assert that there's "one right way".

But one approach that's somewhat common in FP, which relies on chained expressions and composed (and curried!) functions, goes by the name "point-free style", and could look like this:

```js
const FPBookNames = data
    .filter( compose(
        eq("FP"),
        getProp("topic")
    ) )
    .map( getProp("bookName") );
```

Again, not to say this is the "right" way to do it, but... code like this represents the combination of ideas from FP that I think will help prepare you to take on *monads*, especially as I will present them throughout the rest of this guide.

When code like that *speaks to you*, I think it's time to dip your toes into the ocean of monads.

## Expansive Intro To Monads

In addition to the guide I present here, I recommend checking out a [recording of my conference talk, "Mo'problems, Mo'nads"](https://www.youtube.com/watch?v=bg0Wtz3sR9U).

----

*Monad* is a (small) part (formally, a Type) in a broad mathematical concept called "Category Theory". You could briefly and incompletely describe Category Theory as a way to categorize/group things based on how they behave with respect to composition and transformation.

The Monad type is a way to represent a value or operation in your program, which associates some specific behaviors with/around that (underlying) value/operation. These additional behaviors augment (i.e., improve!) the original value/operation with some "guarantees" about how it will interact predictably with other monad-represented values/operations in the program.

That definition is the *WHAT* of monads, conceptually. But you probably also want to see code.

### Simplest JS Illustration

What's the most stripped-down way we could do something like that in JS? How about this:

```js
function Identity(v) {
  return { val: v };
}

function chain(m,fn) {
  return fn(m.val);
}
```

That's it, that's a monad at its most basic. In particular, it's the "Identity" monad, which means that it will merely hold onto a value, and let you use that value untouched when you want to.

```js
const myAge = Identity(41);   // { val: 41 }
```

We put a value inside an object container only so we could recognize the value as having been represented monadically. This "container"ness is one convenient way of implementing a monad, but it's not actually required.

The `chain(..)` function provides a minimum basic capability to interact with our monad instance. For example, imagine we wanted to take the monadic representation of `41` and produce another monad instance where `41` was incremented to `42`?

```js
const myAge = Identity(41);   // { val: 41 }

const myNextAge = chain( myAge, v => Identity(v + 1) );   // { val: 42 }
```

It's important to note that even though I use the names `Identity` and `chain` here, those are just plain choices. There's nothing explicitly required by the concept of *Monad* in terms of what we name these things. But if we use names that others have regularly chosen, it helps create a familiarity that improves our communications.

That `chain(..)` function looks pretty basic, but it's really important (whatever it's called). We'll dig more into it in a bit.

I'm sure that code snippet seems pretty underwhelming to most readers. Why not just stick with `41` and `42` instead of `{ val: 41 }` and `{ val: 42 }`? The *WHY* of monads is likely not at all apparent yet. You'll have to hang with me for a bit to start to uncover the *WHY*.

But hopefully I've at least shown you that down at the very core, a monad is not a mystical or complex *thing*.

### Building Up Monads

Monads have somewhat (in)famously been described with a variety of silly-sounding metaphors, like burritos. Others call monads "wrappers" or "boxes", or "data structures" or... the truth is, all these ways of describing a monad are partial descriptions. It's like looking at a Rubik's Cube. You can look at one face of the cube, then turn it around and look at a different face, and get more of the whole thing.

A complete understanding requires being familiar with all sides. But complete understanding is not a single atomic event. It's often built up by lots of smaller bits of understanding, like looking at each face of the cube one at a time.

For now, I just want you to focus on the idea that you could take a value like `42` or an operation like `console.log("Hello, friend!")` and attach/associate additional behaviors to them which will give them super powers.

Here's another possible way of expressing monads, using capabilities provided by **Monio**:

```js
const myAge = Just(41);
```

**Monio Reference: [`Just`](MONIO.md)**

The above code shows a function called `Just(..)`, which is pretty similar to the `Identity(..)` function shown previously. It acts as a constructor (aka, "unit") of the `Just` monad.

And also...

```js
const printGreeting = IO(() => console.log("Hello, friend!"));
```

Here we see another **Monio** function called `IO(..)`, which acts as a constructor for the `IO` monad (which holds functions).

Thinking of our sketch in the previous section, you could sort of think of `myAge` as `{ val: 41 }` and `printGreeting` as `{ val: () => console.log("Hello, friend!") }`. **Monio**'s representation is more sophisticated than just an object like that. But under the covers, it's not that far different.

I'm going to use **Monio** throughout the rest of the guide. The convenient affordances are nice to use, and easier to illustrate with. But just keep in mind that under all the trappings, we could be doing something as straight-forward as making an object like `{ val: 41 }`.

#### Digging Into Map

Consider the notion of an array's `map(..)` method. Its job is to apply a mapping (value translation) operation against all the contents of the associated array.

```js
[ 1, 2, 3 ].map(v => v * 2);   // [ 2, 4, 6 ]
```

**Note:** the technical term for this capability is Functor. In fact, all monads are Functors, but don't worry too much about that term for now. Just file in the back of your head.

This mapping on arrays of course works even if our array has a single element, right?

```js
[ 41 ].map(v => v + 1);   // [ 42 ]
```

An extremely important detail there, that's easy to miss, is that the `map(..)` function didn't just give us `42` but gave us `[ 42 ]`. Why? Because `map(..)`'s job is to produce a new instance of the same type of "container" it was invoked against. In other words, if you use array's `map(..)`, you're going to always get back an array.

But what if our "container" is a monad instance, and what if there's only one underlying value, like `41` in it? Since the monad is also a functor (able to be "mapped"), we should still expect the same kind of outcome, right?

```js
const myAge = Just(41);

const myNextAge = myAge.map(v => v + 1);   // Just(42)
```

Hopefully it makes intuitive sense here that `myNextAge` should be another `Just` instance, representing the underlying number `42`.

Recall this bare-bones example from the previous section?

```js
// assumed: function Identity(val) { .. }
// assumed: myAge ==> { val: 41 }

const myNextAge = chain( myAge, v => Identity(v + 1) );   // { val: 42 }
```

Substituting **Monio**'s implementation, that looks like:

```js
const myNextAge = myAge.chain(v => Just(v + 1));
```

So what's the relationship here between the `map(..)` and `chain(..)`? Let's line the operations up next to each other, to see *it*:

```js
myAge.map(   v =>      v + 1  );    // Just(42)
myAge.chain( v => Just(v + 1) );    // Just(42)
```

Now do you see *it*? `map(..)` assumes that its returned value needs to be automatically "wrapped up" in an instance of the "container", whereas `chain(..)` expects the return value to already be "wrapped up" in the right type of "container".

The `map(..)` function doesn't at all have to be named that to satisfy the functor'ness of the monad instance. In fact, you don't even strictly *need* a `map(..)` function at all, if you have `chain(..)`, because `map(..)` can be implemented with `chain(..)`:

```js
function JustMap(m,fn) { return m.chain(v => Just(fn(v))); }

fortyOne.map(    v => v + 1);   // Just(42)
JustMap(fortyOne,v => v + 1);   // Just(42)
```

Having `map(..)` (or whatever it's called) is a convenience over using just the `chain(..)` by itself, but not strictly required.

### Monadic Chain

`chain(..)` sometimes goes by other names (in other libraries or languages), like `flatMap(..)` or `bind(..)`. In **Monio**'s monads, all three methods names are aliased to each other, so pick whichever one you prefer.

The name `flatMap(..)` can help reinforce the relationship between it and `map(..)`.

```js
Just(41).map(     v => Just(v + 1) );    // Just(Just(42)) -- oops!?

Just(41).flatMap( v => Just(v + 1) );    // Just(42) -- phew!
```

If we return a `Just` monad instance from `map(..)`, it still wraps that in another `Just`, so we end up with nesting. That is perfectly valid and sometimes desired, but often not. But if we return the same kind of value from `flatMap(..)` (again, aka `chain(..)`), there's no nesting. Essentially, the `flatMap(..)` flattens out the nesting!

I've asserted `chain(..)` (or whatever we call it!) is pretty central to something being monadic.

Even as simple as it looks to implement, it works in such a specific way that we get some guarantees about how one monad instance can interact with another monad instance. Such interactions and transformations are critical to building up a program of monads without chaos.

Another side of the **Monad** Rubik's Cube is these guarantees; they're ensured by a set of "laws" that all conforming monad implementations must satisfy:

1. Left Identity
2. Right Identity
3. Associativity

The formality and mathematical importance of these laws is not super important to immerse in right now. But to illustrate them very simply with our trivial identity monad `Just` from **Monio**:

```js
// helpers:
const inc = v => Just(v + 1);
const double = v => Just(v * 2);

// (1) "left identity" law
Just(41).chain(inc);                        // Just(42)

// (2) "right identity" law
Just(42).chain(Just);                       // Just(42)

// (3) "associativity" law
Just(20).chain(inc).chain(double);          // Just(42)
Just(20).chain(v => inc(v).chain(double));  // Just(42)
```

Notice I used the `chain(..)` method in this snippet? The laws are stated in terms of the "chain" operation, regardless of what an implementation chooses to call it.

### Back To The Core Of Monad

Boiling this all down: the *Monad* type only strictly requires two things:

1. a function (of any name) to construct an "instance" of the type (the unit constructor)
2. a function (of any name) to perform the "chain" operations shown in the 3 laws

Everything else you see in the code snippets in this guide, such as wrapper monad instances, specific method names, ["friends of monads" behaviors](#-and-friends), etc -- that's all convenient affordance provided specifically by **Monio**.

But from that narrow perspective, a monad doesn't have to be a "container" (like a wrapping object or class instance) and there doesn't even have to be a concrete "value" (like `42`) involved. While a "container wrapping a value" is one potentially helpful side of the Rubik's Cube to look at, it's not *all* that a monad is or can be. Don't get too *wrapped up* in that way of thinking!

### But... How Do I Get Something Out!?

You may still be wondering: how do we ever extract the value (like primitive number `42`) -- or indeed, whatever *thing* the monad is representing -- out/away from a monadic representation? It seems like every monadic operation just produces another monad instance. At some point, we might need the actual number `42` to print to the screen or insert in a database, right!?

One key idea of FP, and especially of monads, is to *defer* the need for the underlying values until the last possible moment. With respect to monads, we prefer to keep everything "lifted" in the monadic space as long as possible.

But yes, sometimes we *do* need to reduce a monad down to a "real" value. There are other ways of accomplishing that outcome, but here's one approach, a preview of what we'll [talk about later in the guide](#-and-friends). To "extract" the value from a monad like the `Just` identity monad, we can use a method **Monio** provides, called `fold(..)`:

```js
const identity = v => v;

const myAge = Just(41);
const myNextAge = myAge.map(birthday);

// later:
const ageIsJustANumber = myNextAge.fold(identity);
console.log(`I'm about to be ${ ageIsJustANumber } years old!`);
// I'm about to be 42 years old!
```

So yes, there's an "escape valve" (`fold(identity)`) where we can exit from our `Just` monad.

But remember: monads play best with other monads ([and their friends!](#-and-friends)), so it's better to stay in that space as much as we can. Let's hold off discarding the monad representation until (unless!) we absolutely have to.

Also keep in mind: `fold(..)` as shown here, and provided on many of **Monio**'s monads, is **NOT** a *Monad* behavior; it comes [from a *friend* called Foldable](#foldable).

### *Maybe* Something More?

**Monio Reference: [`Maybe`](MONIO.md)**

The identity monad `Just` probably doesn't seem all that amazing. It's cute and *maybe* a little clever, but it's kinda unimpressive. In practice, we'll almost never directly create `Just` monad instances.

It's foundational. It's not supposed to seem revolutionary in and of itself, as that would present too tall a cliff to climb from the get-go. If the first numbers you ever learned as a young child were not 2 or 3, but were instead √2 or π, you might have found learning basic math pretty tough in those earliest days!

If `Just` *seems* (too) simple to you, that's probably a good thing! You're likely well on your way to *getting* monads. But don't let its simplicity bore you as there not being anything worth your time; there is!

There are lots of variations/augmentations on top of this basic monad concept that get more interesting. I could spend many hours and many dozens of pages detailing even a sampling of them. But let me continue incrementally by briefly illustrating another example of monads that builds off the identity monad.

You've probably written code like this before in your imperative-style programs:

```js
const shippingLabel = (
    (record != null && record.address != null && record.address.shipping != null) ?
        formatLabel(record.address.shipping) :
        null
);
```

The `!= null` checks that we have to pepper throughout our programs are to avoid JS exceptions when we do operations against these values that expect them to be non-null'ish (`null` or `undefined`).

However, JS recently (ES2020) added an "optional chaining" operator which simplies that type of code a bit:

```js
const shippingLabel = (
    (record?.address?.shipping != null) ?
        formatLabel(record.address.shipping) :
        null
);
```

The `?.` operator (as opposed to bare `.`), right before `address` and `shipping`, is a short-circuiting operator that skips out of further expression evaluation if the preceeding element evaluates as null'ish. That means we don't need the `record != null` or `record.address != null` checks, because the `?.` operator does it for us.

We're protected now from `record` or `record.address` being null'ish, but `record.address.shipping` could still be null'ish, and we want to skip calling `formatLabel(..)` in that case; that's why we still need the final `!= null` check.

The `Maybe` monad -- sometimes referred to by different names like `Option` or `Optional` in other libraries and languages -- allows us to define a behavior that delegates these sorts of `!= null` checks completely to the monad behavior, freeing up our code from that burden.

To understand `Maybe`, let's first add another monad kind besides `Just` (identity) we discussed previously: the trivial-and-unimpressive monad we'll call `Nothing` (empty). `Nothing` does even less than `Just`: it short-circuits out of any methods you invoke on it. It's like a blackhole where operations are safely skipped as no-ops. `Nothing` is the safe, monadic equivalent of empty values like `null` or `undefined`.

`Maybe` is a *Sum Type*, in that it represents a "duality" of these two monad kinds (`Just` and `Nothing`). That's not to say a `Maybe` instance is *both* simultaneously, but rather that it can *either* be one or the other.

**Note:** Most monad implementations would not expose `Just` and `Nothing` as separate monad kinds, but rather only as part of `Maybe`. **Monio** choose to present them separately as well as combined in `Maybe`, for convenience of illustration purposes.

The way the selection between `Maybe:Just` (aka `Just`) and `Maybe:Nothing` (aka `Nothing`) occurs might be a little confusing at first. You might expect the decision itself to built into the unit constructor `Maybe(..)`. In fact, most popular monad tutorials/blog posts out there in the wild do just that, because it makes the illustration of `Maybe` much more convenient and satisfying.

That's not proper monad'ing, though. **Monio** does the more appropriate thing and externalizes the decision away from the `Maybe(..)` / `Maybe.of(..)` constructor, into a separate helper called `Maybe.from(..)`. `Maybe.from(null)` will result in a `Maybe:Nothing{}` instance, and `Maybe.from(42)` will result in a `Maybe:Just{42}` instance.

By contrast, calling `Maybe(..)` / `Maybe.of(..)` will not do any conditional selection, but only represent any non-`Maybe` value as a `Maybe:Just`.

Moreover, `Maybe.from(..)` delegates the question -- "is it empty (aka null'ish)?" -- to the static function `Nothing.isEmpty(..)`. That function by default does a `== null` null'ish check, but you could override it to re-define what value(s) you want to treat as empty/nothing for `Maybe.from(..)`'s purposes.

So we use `Maybe.from(..)` to create either the `Maybe:Just` or `Maybe:Nothing` instance. In the following snippet, the `.chain(..)` calls will thus in effect be against one or the other (with the `Maybe` itself acting merely as a thin, pass-through wrapper):

```js
const shippingLabel = (
    Maybe.from(record)
    .chain( record => Maybe.from(record.address) )
    .chain( address => Maybe.from(address.shipping) )
    .chain( shipping => Maybe.from(formatLabel(shipping)) )
);
```

Here, `shippingLabel` is an instance of the `Maybe` type. It will either represent a `Maybe:Just` holding the formatted label, or it will represent a `Maybe:Nothing` (holding no value).

But whichever one it is, that doesn't matter to the way we write our subsequent monad-aware code! If `Maybe.from(..)` produces a `Maybe:Nothing` anywhere along that chain, any subsequent `chain(..)` calls are skipped as no-ops, thus protecting our program from exceptions like property access on a null'ish value.

`Maybe` safely abstracts away our previous concerns over the conditional decision logic that protects operations from throwing exceptions.

That above code may seem a little cumbersome, so let's further clean it up with a couple of helpers:

```js
// assumed:
// function formatLabel(label) { .. }

// helpers:
const getPropSafe = prop => obj => Maybe.from(obj[prop]);
const formatLabelSafe = v => Maybe.from(formatLabel(v));

const shippingLabel = (
    Maybe.from(record)
    .chain( getPropSafe("address") )
    .chain( getPropSafe("shipping") )
    .chain( formatLabelSafe )
);
```

That's much nicer than before. And there's no `!= null` checks cluttering up our code.

Our `shippingLabel` monad is now ready to interact with other monads/monad behaviors, and will do so safely and predictably, regardless of whether it's `Maybe:Just` or `Maybe:Nothing`.

By the way, `Maybe` is also [Foldable](#foldable), so to "exit" from it (as we saw earlier with `Just`), you can use the `fold(..)` function; but since `Maybe` is a *Sum Type*, `fold(..)` here expects two functions, the first invoked for `Maybe:Nothing` and the second invoked for `Maybe:Just`. Again, more on [using Foldable and other adjacent behaviors later](#-and-friends).

You're hopefully starting to see a *little bit* more benefit to representing our values/expressions with monads rather than *just* using bare values.

### I Know, IO

**Monio Reference: [`IO` (and variants)](MONIO.md#io-monad-one-monad-to-rule-them-all)**

So far, we've seen monads that represent concrete primitive values like `42` or a shipping address object. But monads are far more than just "value wrappers".

Monads can also be thought of as "behavior wrappers", representing operations (functions), like the sort of operations that either rely on, or cause, side effects. That's what the `IO` monad is all about!

The heart of **Monio** is its `IO` monad implementation. It's designed as an uber-powerful *Sum Type* that incorporates a variety of useful behaviors, similar in spirit to [Scala's ZIO](https://zio.dev/). I claim that **Monio**'s `IO` is the "most powerful IO implementation in JS (and possibly any language)". But I know that's quite a daunting claim.

Don't worry: to continue, we're just going to focus on a small part of what `IO` can do, just so we don't get too overwhelmed.

What you put in `IO` is (typically) a function, which when executed will perform some sort of operation, (again, typically) of a side-effect nature. It doesn't *have to be* a side-effect operation; it can be static and pure, like simply returning a value.

The key idea behind the `IO` monad type is that it's lazy; it doesn't *do* anything -- like execute the function you put in it -- automatically. You have to evaluate the IO to perform the operation (and thus *apply* the side-effect to the program).

For example:

```js
const greeting = IO(() => console.log("Hello, friend!"));

// later (nothing has happened yet!)
greeting.run();
// Hello, friend!
```

An IO, once evaluated, can also produce a value:

```js
const customerName = IO(() => (
    document.getElementById("customer-name-input").value
));

customerName.run();  // "Kyle"
```

The `run(..)` method can be thought of kinda like the `fold(..)` method we saw on `Just(..)` and `Maybe(..)`. It's how you "exit" the `IO` monad, in applying its behavior (side-effects) to the surrounding program.

Like we've already asserted a few times, the "best practice" key idea is to keep all our program's side-effect operations as `IO`s, and only reduce/apply them at the last moment, when our program needs them to be applied.

Here's a more sophisticated example that chains `IO` instances together:

```js
// helpers:
const getProp = prop => obj => obj[prop];
const assignProp = prop => val => obj => obj[prop] = val;

const getElement = id => IO(() => document.getElementById(id));
const getInputValue = id => getElement(id).map( getProp("value") );
const renderTextValue = id => val => (
    getElement(id).map( assignProp("innerText")(val) )
);


const renderCustomerNameIO = (
    getInputValue("customer-name-input")
    .chain( renderTextValue("customer-name-display") )
);

// later:
renderCustomerNameIO.run();
```

As you can see, here we're composing side-effect operations together as predictably as we composed numbers and objects earlier. Monads truly are a transformative, revolutionary way of thinking about our programs.

As a convenience, `IO.of(..)` is generally the equivalent of `IO(() => ..)`; in both cases, you get a lazy IO. But take note of a nuance/gotcha: in the `IO.of(..)` case, whatever expression (the `..` here) provided is evaluated right away, whereas when you do `IO(() => ..)`, you've manually wrapped the `..` expression, whatever it is, into a function, so it won't be evaluated until that function is called (at the time the IO is evaluated).

As such, `IO.of(..)` should only be used when you already have a fixed, non-side-effecting value expression. Always use the `IO(() => ..)` form when the `..` expression is actually a side-effect.

#### But Why IO?

Why do we go to the trouble of putting all our side-effect operations into `IO` instances?

The most boiled down answer: we get a predictable interaction (and guarantees!) between the side-effect (`IO`) that comes from the `getInputValue(..)` call and the side-effect (`IO`) that comes from the `renderTextValue(..)` call.

When the side-effects are straightforward and synchronous like pulling a DOM element reference out of the DOM, or injecting its contents, it doesn't seem like the predictability/guarantees is benefitting us very much.

So really the question I want to address here is: **why Monio's `IO` in particular?**

I strongly believe the most complex side-effects in our programs come from asynchronus operations, like performing an Ajax `fetch(..)` request, running a timer, listening for an event, performing an animation, etc. An `IO` implementation like the one **Monio** provides, which can represent and model any form of asynchrony (and thus asynchronous side-effects) in our program, and thus extend our predictability and guarantees over *time*, is truly a game-changer.

**Monio**'s `IO` automatically transforms/consumes JS promises and lifts the evaluation of an `IO` chain to a promise if any asynchronous operation is encountered. And for event streams (where a single promise doesn't adequately represent the asynchrony), `IOx` is like `IO` plus Observables (e.g., `RxJS`, etc).

And if that's not enough to intrigue you, there's another challenge that programs face (whether you realize it or not) that **Monio**'s `IO` addresses like a champ: how do you isolate a set of operations from the environment (like DOM, etc) around it, so that you can provide an environment/context for the code to run against? This is critical for preventing unintended side-effects in the program, but it's also the most effective way to create **TESTABLE** side-effect code.

**Monio**'s `IO` also holds the `Reader` monad type's behavior. This means that an `IO` (no matter how long/involved the chain is) carries with it a provided "environment", passed as an argument to `run(..)`.

You could define your entire program to boil down to a single `IO` instance, and if you call `run(window)`, you're running your program in the context of the browser's DOM. But in your test suite, you could call `run(fakeDOMglobal)` on the same `IO`, and now all of the code and side-effects are automatically threaded through that alternate environment.

It's effectively passing the entire "global" (aka, universe/scope-of-concern) into your program, whatever appropriate value that is, instead of the program automatically assuming which "global" it should apply against.

But ultimately, the *real power* of **Monio**'s `IO` is not even encompassed by what we've thus far discussed. The *pièce de résistance* is that `IO` provides a bridge back to your familiar and comfortable more-imperative style coding.

Do you like to use `if` and `try..catch` and `for..of` loops? You may have noticed that FP and monads seem to throw all that stuff out the window, in favor of long chains of curried and composed function calls. What if you could get all the power of `IO` but opt-in to the more typically-imperative style of code where helpful?

`IO.do(..)` takes a JS generator, whose code looks like the `async..await` style that most JS devs are so familiar with. When you `yield` a value, if its monadic, it's automatically chained and unwrapped (just as if you had an `IO` to `chain(..)` from). And if the result is asynchronous (a promise), the code inside the generator automatically pauses to "await" the completion.

Taken together with all its facets, **Monio**'s `IO` (and `IOx` superset) is the "one monad to rule them all".

## ... And Friends

OK, if you've made it this far, take a deep breath. Seriously, maybe go for a walk to let some of this settle in. Maybe re-read it, a few times.

We've already seen a decent, if basic, illustration of the idea of monads. And we didn't cover `Either` -- another *Sum Type* like `Maybe` but which holds values on both sides. `Either` is typically used to represent synchronous `try..catch` style exception handling. We also didn't cover `AsyncEither`, which extends `Either` to operate asynchronously (over promises), the same way `IO` transforms/handles them. `AsyncEither` is essentially **Monio**'s representation of a Promise/Future type.

But compared to the expanse of Category Theory that *monad* fits in, it's a fairly narrow concept itself. There are a variety of adjacent (and somewhat related) concepts that come from Category Theory, and more specifically, "Algebraic Data Types" (ADTs) -- or are at least adapted from parts of it. These "friends" include:

* Foldable
* Concatable (aka, Semigroup)
* Applicative

There are many, many other topics out there, but these are the main three "friends" that **Monio** focuses on (and mixes with its monads).

To be clear, these three are *not* monad behaviors. I call them "friends of monads" because I find monads mixed with these other behaviors to be more useful/practical in my JS code than monads (or any of these other types) standing alone; it's the combination of these type behaviors that I think makes monads attractive and powerful solutions for our programs.

I know many in the FP space prefer to think of each type completely independently. That's OK if it works well for them. But I find the combinations much more compelling.

### Foldable

The `fold(..)` method mixed into (most of) **Monio**'s monads is implementing the "Foldable" type. Notably, `IO` and its variations are not directly Foldable, but that's because the nature of `IO` is already doing a `fold(..)` of sorts when you call `run(..)`.

We already saw `fold(..)` referenced earlier a few times. That's merely the name **Monio** provides, but just like `chain(..)` vs `flatMap(..)` vs `bind(..)`, the name itself doesn't matter, only the expected behavior.

We didn't talk about List type monads (because **Monio** doesn't provide such), but of course those can exist. Foldable in the context of such a List monad would apply the provided function across all the values in the list, progressively accumulating a single result (of any type) by folding each value into the accumulator. JS arrays have a `reduce(..)` method which is basically List's foldable.

By contrast, Foldable in the context of a single-value monad (like `Just`) executes a provided function with its single associated/underlying value. It can be thought of as a special case of the generalized List foldable, since it doesn't need to "accumulate" its result across multiple invocations.

Similarly, *Sum Types* like `Maybe` and `Either` are also Foldable in **Monio**; this is a further specialization in that `fold(..)` here takes two functions, but will execute only one of them. If the associated value is a `Maybe:Nothing`, the first function is applied, otherwise (when the associated value is a `Maybe:Just`), the second functino is applied. The same goes for `Either:Left` invoking the first function and `Either:Right` invoking the second function.

But how might we use Foldable practically?

As I implied earlier a few times in this guide, one such transformation is the sort-of "unwrapping" of the underlying/associated value from its monad, by passing the identity function (e.g., `v => v`) to `fold(..)`.

But more commonly, we use Foldable to define a natural transformation from one kind of monad to another. To illustrate, let's revisit this example from earlier:

```js
// assumed:
// function formatLabel(label) { .. }

// helpers:
const getPropSafe = prop => obj => Maybe.from(obj[prop]);
const formatLabelSafe = v => Maybe.from(formatLabel(v));

const shippingLabel = (
    Maybe.from(record)
    .chain( getPropSafe("address") )
    .chain( getPropSafe("shipping") )
    .chain( formatLabelSafe )
);
```

If we want to then render the shipping label, but only if it's actually valid/defined, and otherwise print a default notice, we can arrange our program like this:

```js
// assumed:
// function formatLabel(label) { .. }

// helpers:
const identity = v => v;
const getPropSafe = prop => obj => Maybe.from(obj[prop]);
const assignProp = prop => val => obj => (
    Maybe.from(obj).map(o => o[prop] = val)
);
const getElement = id => IO(() => document.getElementById(id));
const renderTextValue = id => val => (
    getElement(id).map(el => (
        Maybe.from(el).fold(
            IO.of,
            assignProp("innerText")(val)
        )
    ))
);
const formatLabelSafe = v => Maybe.from(formatLabel(v));


// ----

const renderShippingLabel = v => (
    v.fold(
        () => IO.of("--no address--"),
        identity
    )
    .chain( renderTextValue("customer-shipping-label") )
);

const renderIO = renderShippingLabel(
    Maybe.from(record)
    .chain( getPropSafe("address") )
    .chain( getPropSafe("shipping") )
    .chain( formatLabelSafe )
);

renderIO.run();
```

Take your time reading and analyzing that code. It's illustrating how our monad types interact in useful ways. I promise that even if at first this code seems head-spinning -- it did for me! -- eventually you will get to understanding and even preferring code like this!

A key aspect of the snippet is the `Maybe`'s `fold(..)` call, which folds down to either a fallback `IO` value if the shipping address was missing, or the computed `IO` holding the valid shipping address, and then `chain(..)`s off whichever `IO` was folded to.

Again, Foldable is distinct from monads. But I think this discussion illustrates how useful it is when paired with a monad. That's why it's an *honored friend*.

### Concatable (Semigroup)

Concatable, formally referred to as Semigroup, is another interesting friend of monads. You won't necessarily see it used explicitly all that often, but it can be useful, especially when using `foldMap(..)` (which is an abstraction over `reduce(..)`).

**Monio** choose to implement Concatable as the `concat(..)` method on its monads. That name is not required by the type, of course, it's just how **Monio** does it.

The basic idea here is that a value type is "concatable" if two or more values of it can be concatenated together. For example, primitive, non-monad value types like strings and arrays are concatable, and indeed they even expose the same `concat(..)` method name:

```js
"Hello".concat(", friend!");     // "Hello, friend!"
[ 1, 2, 3 ].concat( [ 4, 5 ] );  // [1,2,3,4,5]
```

Since all of **Monio**'s monads are Concatable, they all have the `concat(..)` method. So if any such monad instance is associated with a value that also has a conforming `concat(..)` method on it -- for example, another monad, or a non-monad value like a string or array -- then a call to the monad's `concat(..)` method will delegate to calling `concat(..)` on the associated/underlying value. This delegation to the underlying `concat(..)` is recursive all the way down.

For example:

```js
Just("Hello").concat(Just(", friend!"));        // Just("Hello, friend!")
Just([1,2,3]).concat(Just([4,5]));              // Just([1,2,3,4,5])

Just(Just([1,2,3])).concat(Just(Just([4,5])));  // Just(Just([1,2,3,4,5]))

// `fold(..)` and `foldMap(..)` provided in
// Monio's util module
fold(Just("Hello"),Just(", friend!"));          // Just("Hello, friend!")

foldMap(
    v => v.toUpperCase(),
    [
        Just("Hello"),
        Just(", friend!")
    ]
);                                              // Just("HELLO, FRIEND!")
```

**NOTE:** Despite the name overlap, the standalone `fold(..)` and `foldMap(..)` utilities provided by the `MonioUtil` module are *not* related to the [Foldable type](#foldable) and the `fold(..)` method that appears on **Monio** monad instances.

#### Monoid

Additionally, the term Monoid means a Concatable/Semigroup plus an "empty" (identity) value for the concatenation. For example, string concatenation is a monoid with the empty `""` string. Array concatenation is a monoid with the empty `[]` array. Even numeric addition is a monoid with the `0` "empty" number.

An example of extending this notion of monoid to something that wouldn't seem at first as "concatable" is with multiple booleans combined in a `&&` or `||` logical expression. For the logical-AND operation, the "empty" value is `true`, and for the logical-OR operation, the "empty" value is `false`. The "concatenation" of these values is the computed logical result (`true` or `false`).

**Monio** provides `AllIO` and `AnyIO` as `IO` variants that are monoids -- again, both an "empty" value and a `concat(..)` method. In particular, the `concat(..)` method on these two `IO` variants is designed to compute the logical-AND / logical-OR (respectively) between two boolean-resulting IOs. That makes `AllIO` and `AnyIO` easy to use with the `fold(..)` and `foldMap(..)` utilities mentioned earlier.

**Monio Reference: [`AllIO`, `AnyIO`](MONIO.md#other-helpful-io-variants)**

Here's an example of concatenating these monoids via `fold(..)` / `foldMap(..)`:

```js
const trueIO = IO.of(true);
const falseIO = IO.of(false);

fold( AllIO.fromIO(trueIO), AllIO.fromIO(falseIO) ).run();  // false
fold( AnyIO.fromIO(falseIO), AllIO.fromIO(trueIO) ).run();  // true

const IObools = [
    trueIO,
    trueIO,
    trueIO,
    falseIO,
    trueIO
];

foldMap( AllIO.fromIO, IObools ).run();   // false
foldMap( AnyIO.fromIO, IObools ).run();   // true
```

As an added convenience, **Monio**'s' `IOHelpers` module also provides `iAnd(..)` and `iOr(..)`, which automatically applies this logical-And / logical-Or `foldMap(..)` logic to two or more provided `IO` instances:

```js
const trueIO = IO.of(true);
const falseIO = IO.of(false);

iAnd( trueIO, trueIO, falseIO, trueIO ).run();  // false
iOr(  trueIO, trueIO, falseIO, trueIO ).run();  // true
```

I'm illustrating creating `IO` instances with direct `true` and `false` values, but that's not really how you'd actually use these mechanisms. Since they're all `IO` instances, the boolean results (`true` or `false`) can be computed lazily (and asynchronously!) in their respective `IO`s, even as a result of complex side-effects.

For example, you could define a list of several `IO` instances representing DOM element states, like this:

```js
// helpers:
const getElement = id => IO(() => document.getElementById(id));
const getCheckboxState = id => getElement(id).map(el => !!el.checked);

const options = [
    getCheckboxState("option-1"),
    getCheckboxState("option-2"),
    getCheckboxState("option-3")
];

const allOptionsChecked = iAnd( ...options ).run();    // true / false
const someOptionsChecked = iOr( ...options ).run();    // true / false
```

Bonus exercise: contemplate how you'd compute `noOptionsChecked` -- `true` when none of the checkboxes are checked.

### Applicative

Applicative is a bit more unusual (and less common, in my experience) than Semigroup. But occasionally it's helpful. **Monio** chooses to implement this behavior on most of its monads with the `ap(..)` method.

Applicative is a pattern for holding a function in a monad, then "applying" the value from another monad as an input to the function, returning the result back to another monad. If the function requires multiple inputs, this "application" can be performed multiple times, providing one input at a time.

But I think the best way to explain Applicative is to just show concrete code:

```js
const add = x => y => x + y;

const addThree = Just(add(3));     // Just(y => 3 + y)
const four = Just(4);              // Just(4)

addThree.ap(four);                 // Just(7)
```

If a monad is holding a function, such as the curried/partially-applied `add(..)` shown here, you can "apply" it to the value held in another monad. Note: we call `ap(..)` on the source, function-holding monad (`addThree`), not on the target value-holding monad (`four`).

These two expressions are roughly equivalent:

```js
addThree.ap(four);

four.map( addThree.fold(fn => fn) );
```

Recall from [Foldable above](#foldable) that passing the identity function into a **Monio** monad's `fold(..)`, essentially extracts the value from the monad. As shown, `ap(..)` is sort of "extracting" a mapping function held in second monad and running it (via `map(..)`) against the value held in the first monad.

Another way of expressing the above in a single expression:

```js
const add = x => y => x + y;

Just(add)               // Just(x => y => x + y)
    .ap( Just(3) )      // Just(y => 3 + y)
    .ap( Just(4) );     // Just(7)
```

We put `add(..)` by itself into a `Just`. The first `ap(..)` call "extracts" that function, passes the `3` into it, and makes another `Just` with the returned `y => 3 + x` function in it. The second `ap(..)` call then does the same as the previous snippet, extracting that `y => 3 + x` function and passing `4` into it. The final result of `4 => 3 + 4` is `7`, and that's put back into a `Just`.

All of **Monio**'s non-`IO` monads are Applicatives. Again, you may not use such behavior very frequently, but hopefully you may now be able to recognize the need when it arises.

## *Wrap*ping Up

We've now scratched the surface of monads (and several *friends*). That's by no means a complete exploration of the topic, but I hope you're starting to feel they're a little less mysterious or intimidating.

A monad is a narrow set of behavior (required by "laws") you associate with a value or operation. Category Theory yields other adjacent/related behaviors, such as Foldable and Concatable, that can augment the capabilities of this representation.

This set of behavior improves coordination/interoperation between other monad-and-friends-compliant values, such that results are more predictable. The behaviors also offer many opportunities to abstract (shift into the behavioral-definitions) certain logic that usually clutters up our imperative code, such as null'ish checks.

Monads certainly don't fix all the problems we may encounter in our code, but I think there's plenty of intriguing power to unlock by exploring them further. I hope this guide inspires you to keep digging, and perhaps in your explorations, you'll find the [Monio](https://github.com/getify/monio) library helpful.
