# FP + Monads

If you're already comfortable with Functional Programming (FP), especially side effects and pure functions and such, you can [skip to "Brief Intro To Monads"](#brief-intro-to-monads) below.

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

What if your code could be more "declarative" and state the *what* and *why* more clearly at a glance, de-emphasizing the *how* as a less important implementation detail? Would being able to determine the purpose of a snippet of code more readily and effectively, make that code *more readable*? What if that code was also more resiliant (less susceptible to bugs) and more testable (more isolated/pure)?

That's why FP exists.

If you're intrigued, but new to FP concepts, I invite you to check out -- at least the first several chapters -- my free-to-read-online FP book: [Functional-Light JavaScript](https://github.com/getify/functional-light-js).

There are also several [high-quality video courses about FP on Frontend Masters](https://frontendmasters.com/courses/?q=functional), including:

* Bianca Gandolfo's ["From Fundamentals To Functional JS"](https://frontendmasters.com/courses/js-fundamentals-functional-v2/)

* Anjana Vakil's ["Functional JavaScript First Steps"](https://frontendmasters.com/courses/functional-first-steps/)

* My ["Functional-Light JavaScript"](https://frontendmasters.com/courses/functional-javascript-v3/) -- a companion course to [my book](https://github.com/getify/functional-light-js) of the same name

I think your first big goal should be to understand and feel comfortable with -- not an expert on! -- the following topics:

* Side Effects
* Pure Functions
* Higher-order Functions
* Function Composition
* Currying
* Basic List Operations (filter/map/reduce)

Once you do, I think you'll be able to both read and write code in a style like this (as opposed to the previous snippet):

```js
const FPBookNames = data
    .filter( compose(
        eq("FP"),
        getProp("topic")
    ) )
    .map( getProp("bookName") );
```

If/once code like that *speaks to you*, I think you're ready to dip your toes into the ocean of monads.

## Brief Intro To Monads

In addition to the guide I present here, I recommend checking out a [recording of my conference talk, "Mo'problems, Mo'nads"](https://www.youtube.com/watch?v=bg0Wtz3sR9U).

----

*Monad* is a (small) part (formally, a Type) in a broad mathematical concept called "Category Theory". You could briefly and incompletely describe category theory as a way to categorize things based on how they behave.

The Monad type is a way to represent a value or operation in your program, which associates some specific behaviors with/around that (underlying) value/operation. These specific behaviors augment (i.e., improve!) the original value/operation with some additional "guarantees" about how it will interact predictably with other monad-represented values/operations in the program.

Monads have somewhat (in)famously been described with a variety of silly-sounding metaphors, like burritos. Others call monads "wrappers" or "boxes", or "data structures" or... the truth is, all these ways of describing a monad are partial descriptions. It's like looking at a Rubik's Cube. You can look at one face of the cube, then turn it around and look at a different face, and get more of the whole thing.

A complete understanding requires being familiar with all sides. But complete understanding is not a single atomic event. It's often built up by lots of smaller bits of understanding, like looking at each face of the cube one at a time.

For now, I just want you to focus on the idea that you could take a value like `42` or an operation like `console.log("Hello, friend!")` and attach/associate additional behaviors to them which will give them super powers.

Here's one possible way of expressing monads, which happens to use capabilities provided by **Monio**:

```js
const myAge = Just(41);

const printGreeting = IO(() => console.log("Hello, friend!"));
```

The above code implies a function called `Just(..)` that acts as a constructor (aka, "unit") of the `Just` monad type (aka, "identity" monad type). It also implies a function called `IO(..)` that acts as a constructor for the `IO` monad type (which holds functions).

What sort of benefits would this extra effort, to represent values and operations like this, get us, in these extra behaviors?

### Identity Monad (aka `Just`)

**Monio Reference: [`Just`](MONIO.md)**

Here's an example of using `Just(..)` to represent a number value monadically (`myAge`), and then produce another monadic number value `myNextAge` from it:

```js
// function birthday(age) { return age + 1 };

const myAge = Just(41);
const myNextAge = myAge.map(birthday);
```

If `myAge` had been *just* a primitive number, we could have used an operator like `+` *directly* on it to increment it to `42`. That works fine in imperative code, but it doesn't fit very well in the declarative style of code with chaining expressions and function calls together (as shown earlier in the "FP" section).

In representing `41` as a `Just` monad -- aka, the "Identity" monad -- we were able use the `map(..)` method from it, which invokes the `birthday(..)` function with the underlying value. That *indirectly* delegates to the `+` value operation inside `birthday(..)`. The result of the `map(..)` call is a new instace of `Just` that represents (i.e., "holds") the value `42` (my age after my upcoming birthday).

The ability for a monad instance to be "mapped" to another monad instance is from the Functor type, but that's **NOT** saying that all monads have to have a method named `map(..)`; `map(..)` could be implemented with the `chain(..)` method (explained later), thus you could do Functor mapping without having a `map(..)` call. It's a convenience that **Monio** provides `map(..)` for all its monads.

I should point out that "wrapping" a value with a call to `Just(..)`, as shown above, is **NOT AT ALL** the only way to express monads, even in JS. You could express a conforming monad type in JS with just one or two separate/unrelated functions. We have chosen in **Monio** to collect behaviors together into these "wrappers" like `Just` and `IO` for convenience, not out of monadic-necessity.

Other sides of the Monad Rubik's Cube include "the three laws" of monads:

1. Left Identity
2. Right Identity
3. Associativity

These "laws" are required behaviors for a value to be considered a "monad". That's what gives us the *guarantees* of how such a value or operation will interact with other monad-conforming values in the program.

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

Notice I used the `chain(..)` method in this snippet?

That's distinct from the `map(..)` method (shown earlier). The `chain(..)` method expects you to return another instance of the monad type in question, whereas `map(..)` automatically produces/wraps the return value in an instance of the associated monad type.

I asserted above that the `map(..)` method isn't required for a monad, even though monads are always Functors, which typically would have a `map(..)` method. That's because `map(..)` could alternately be implemented with `chain(..)`:

```js
// function birthday(age) { return age + 1 };

const myAge = Just(41);

// instead of:
myAge.map(birthday);        // Just(42)

// we could do:
const JustMap = fn => m => m.chain(v => m.of(fn(v)));
JustMap(birthday)(myAge);   // Just(42)
```

Again, it's important to note: *Monad* does not **require** a specific method named `chain(..)` -- indeed, many other libraries and languages use different names for it, like `bind(..)` or `flatMap(..)`; it doesn't even require it to be a method on a data structure, as ours is. *Monad* just requires that an operation, like the one `chain(..)` is performing above, is available to be used against monad-conforming values.

The name `flatMap(..)` is illustrative of the relationship between this function and `map(..)`. If you do `Just(42).map(Just.of)`, you'll get `Just(Just(42))` (nesting!) because `map(..)` always wraps the result in an instance of the monad type. By contrast, if you did `Just(42).flatMap(Just.of)`, you plainly end up with `Just(42)` (no nesting!). In essence, `flatMap(..)` "flattens" the nesting where `map(..)` does not.

**Monio**'s monads all alias `chain(..)` as `flatMap(..)` and `bind(..)`, just in case you prefer to use those method names over `chain(..)`.

----

Boiling this all down: the *Monad* type only strictly requires two things:

1. a function (of any name) to construct an "instance" of the type (the unit constructor)
2. a function (of any name) to perform the "chain" operations shown in the 3 laws

Everything else you see in the code snippets in this guide, such as wrapper monad instances, specific method names, ["friends of monads" behaviors](#-and-friends), etc -- that's all convenience affordance provided specifically by **Monio**.

----

You may also be wondering: how do we ever extract the value (like primitive number `42`) from a monadic representation? It seems like every monadic operation just produces another monad instance. At some point, we need the actual number `42` to print to the screen or insert in a database, right!?

One key idea of FP, and especially of monads, is to *defer* the need for the underlying values until the last possible moment. With respect to monads, we prefer to keep everything "lifted" in the monadic space as long as possible.

But yes, we typically do *eventually* have to reduce the monad down to a "real" value. This is a preview of what we'll [talk about later below](#-and-friends), but one way of "extracting" the value from a monad like the `Just` identity monad is with a method **Monio** calls `fold(..)`:

```js
const identity = v => v;

const myAge = Just(41);
const myNextAge = myAge.map(birthday);

// later:
const ageIsJustANumber = myNextAge.fold(identity);
console.log(`I'm about to be ${ ageIsJustANumber } years old!`);
// I'm about to be 42 years old!
```

So yes, there's an "escape valve" (`fold(identity)`) where we can exit from our `Just` monad. But monads play best with other monads, so it's better to stay in that space as much as we can. Let's defer ditching the monad until we absolutely have to!

Keep in mind: `fold(..)` as shown here, and provided on many of **Monio**'s monads, is **NOT** a monad-specific behavior; it comes [from a *friend* called Foldable](#foldable).

### *Maybe* Something More?

**Monio Reference: [`Maybe`](MONIO.md)**

The identity monad `Just` probably doesn't seem all that amazing. It's cute and *maybe* a little clever, but it's kinda unimpressive. In practice, we'll almost never directly create `Just` monad instances.

It's foundational. It's not supposed to seem revolutionary in and of itself, as that would present too tall a cliff to climb from the get-go. If the first numbers you ever learned as a young child were not 2 or 3, but were instead √2 or π, you might have found learning basic math pretty tough in those earliest days!

If `Just` *seems* (too) simple to you, that's probably a good thing! You're likely well on your way to *getting* monads. But don't let its simplicity bore you as there not being anything worth your time; there is!

There are lots of variations/augmentations on top of this basic monad concept that get more interesting. I could spend many hours and many dozens of pages detailing even a sampling of them. But let me briefly illustrate another example of monads that builds off the identity monad.

You've probably written code like this before in your imperative-style programs:

```js
const shippingLabel = (
    (record.address != null && record.address.shipping != null) ?
        formatLabel(record.address.shipping) :
        null
);
```

The `!= null` checks that we have to pepper throughout our programs are to avoid JS exceptions when we do operations against these values that expect them to be non-null'ish (`null` or `undefined`).

However, JS recently (ES2020) added an "optional chaining" operator which simplies that type of code a bit:

```js
const shippingLabel = (
    (record.address?.shipping != null) ?
        formatLabel(record.address.shipping) :
        null
);
```

The `?.` operator (as opposed to bare `.`) right before `shipping`, is a short-circuiting operator that skips out of further expression evaluation if the preceeding element evaluates as null'ish. That means we don't need the `record.address != null` check, because the `?.` operator does it for us.

We're protected now from `record.address` being null'ish, but `record.address.shipping` could still be null'ish, and we want to skip calling `formatLabel(..)` in that case; that's why we still need the final `!= null` check.

The `Maybe` monad type -- sometimes referred to by different names like `Option` or `Optional` in other libraries and languages -- allows us to define a behavior that delegates these sorts of `!= null` checks completely to the monad behavior, freeing up our code from that burden.

To understand `Maybe`, let's first add another monad type besides `Just` (identity) we discussed previously: the trivial-and-unimpressive monad type we'll call `Nothing` (empty). `Nothing` does even less than `Just`. All it does is short-circuit any behavior/methods you invoke on it. It's like a blackhole where operations are safely skipped as no-ops. `Nothing` the safe, monadic equivalent of empty values like `null` or `undefined`.

`Maybe` is a *Sum Type*, in that it represents a "duality" of these two monad types (`Just` and `Nothing`). That's not to say a `Maybe` instance is *both* simultaneously, but rather that it can *either* be one or the other.

The way the selection between `Maybe:Just` (aka `Just`) and `Maybe:Nothing` (aka `Nothing`) occurs might be a little confusing. You might expect the decision itself to built into the type (invoked by its unit constructor `Maybe(..)`). In fact, most popular monad tutorials/blog posts out there in the wild do just that, because it makes the illustration of `Maybe` much more convenient and marketable.

That's not proper monad'ing, though. **Monio** does the more appropriate thing and externalizes the decision away from the `Maybe(..)` / `Maybe.of(..)` constructor, into a separate helper called `Maybe.from(..)`. `Maybe.from(null)` will result in a `Maybe:Nothing{}` instance, and `Maybe.from(42)` will result in a `Maybe:Just{42}` instance.

Actually, `Maybe.from(..)` delegates the question ("is it empty (aka null'ish)?") to a static function `Nothing.isEmpty(..)`. That function by default does a `== null` null'ish check, but you could override that function to re-define what JS value(s) you want to treat as empty/nothing.

So we use `Maybe.from(..)` to create the `Maybe:Just` or `Maybe:Nothing` instance. In the following snippet, the `.chain(..)` calls will thus in effect be against `Just` or `Nothing` (though technically `Maybe` is acting like a pass-through wrapper for convenience sake):


```js
const shippingLabel = (
    Maybe.from(record.address)
    .chain( address => Maybe.from(address.shipping) )
    .chain( shipping => Maybe.from(formatLabel(shipping)) )
);
```

Here, `shippingLabel` is an instance of the `Maybe` type. It will either be a `Maybe:Just` holding the formatted label, or it will be a `Maybe:Nothing`. It doesn't matter to the way we write our further monad-aware code, though!

That above code is a little cumbersome, so let's further clean it up with a couple of helpers:

```js
// assumed:
// function formatLabel(label) { .. }

// helpers:
const getPropSafe = prop => obj => Maybe.from(obj[prop]);
const formatLabelSafe = v => Maybe.from(formatLabel(v));

const shippingLabel = (
    getPropSafe("address")(record)
    .chain( getPropSafe("shipping") )
    .chain( formatLabelSafe )
);
```

That's much nicer than before. And there's no `!= null` checks cluttering up our code.

Our `shippingLabel` monad is now ready to interact with other monads/monad behaviors, and will do so safely and predictably, regardless of whether it's `Maybe:Just` or `Maybe:Nothing`.

By the way, `Maybe` is also "foldable", so to "exit" from it (as we saw earlier with `Just`), you can use the `fold(..)` function; since `Maybe` is a *Sum Type*, `fold(..)` here expects two functions, the first invoked for `Maybe:Nothing` and the second invoked for `Maybe:Just`. Again, more on [using "foldable" and other adjacent behaviors later](#-and-friends).

You're hopefully starting to see a *little bit* more benefit to representing our values/expressions with monads rather than *just* as underlying primitive values.

### I Know, IO

**Monio Reference: [`IO` (and variants)](MONIO.md#io-monad-one-monad-to-rule-them-all)**

So far, we've seen monads that represent concrete primitive values like `42` or a shipping address object. But monads are far more than just "value wrappers".

Monads can also represent operations (functions), especially the sort of operations that either rely on, or cause, side effects. That's what the `IO` monad is all about!

The heart of **Monio** is the `IO` monad. It's designed and implemented here as an uber-powerful *Sum Type* that incorporates a variety of useful behaviors. I claim that **Monio**'s `IO` is the "most powerful IO implementation in JS (and possibly any language)". I know that's quite a daunting claim.

But don't worry, here we're just going to focus on a small part of what `IO` can do, just so we don't get too overwhelmed.

What you put in `IO` is (typically) a function, which when executed will perform some sort of operation, (again, typically) of a side-effect nature. It doesn't *have to be* a side-effect operation; it can be pure, like simply returning a value.

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

The `run(..)` method can sort of be thought of like the `fold(..)` method we saw on `Just(..)` and `Maybe(..)`. It's how you "exit" the monad and apply its behavior to the surrounding program.

Like we've already asserted a few times in our discussion of monads, the "best practice" key idea is to keep all our program's side-effect operations as `IO`s, and only reduce/apply them at the last moment, when our program needs them to be applied.

Here's a more sophisticated example that chains `IO` instances together:

```js
const getProp = prop => obj => obj[prop];
const assignProp = prop => val => obj => obj[prop] = val;

const getElement = id => IO(() => document.getElementById(id));
const getInputValue = id => getElement(id).map( getProp("value") );
const renderTextValue = id => val => (
    getElement(id).map( assignProp("innerText")(val) )
);


const renderCustomerNameIO = (
    getInputValue("customer-name-input")
    .map( renderTextValue("customer-name-display") )
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

However, I strongly believe, the most complex side-effects in our programs come from asynchronus operations, like performing an Ajax `fetch(..)` request, running a timer, listening for an event, performing an animation, etc. An `IO` implementation that can represent and model any form of asynchrony (and thus asynchronous side-effects) in our program, and thus extend our predictability and guarantees over *time*, is truly a game-changer.

That's exactly what **Monio**'s `IO` is. It automatically transforms/consumes JS promises and lifts the evaluation of an `IO` chain to a promise if any asynchronous operation is encountered. And for event streams (where a single promise doesn't adequately represent the asynchrony), `IOx` is like `IO` plus Observables (e.g., `RxJS`, etc).

And if that's not enough to intrigue you, there's another challenge that programs face (whether you realize it or not) that `IO` addresses like a champion: how do you isolate a set of operations from the environment (like DOM, etc) around it, so that you can provide an environment/context for the code to run against? This is critical for preventing unintended side-effects in the program, but it's also the most effective way to create **TESTABLE** side-effect code.

`IO` also holds the `Reader` monad type's behavior. This means that an `IO` (no matter how long/involved the chain is) carries with it a provided "environment" as passed as an argument to `run(..)`.

IOW, you could define your entire program to boil down to a single `IO` instance, and if you call `run(window)`, you're running your program in the context of the browser's DOM. But in your test suite, you could call `run(fakeDOMglobal)` on the same `IO`, and now all of the code and side-effects are automatically threaded through that alternate environment.

It's effectively passing the entire "global" (aka, universe/scope-of-concern) into your program, whatever appropriate value that is, instead of the program automatically assuming which "global" it should apply against.

But ultimately, the *real power* of **Monio**'s `IO` is not even encompassed by what we've thus far discussed. The *pièce de résistance* is that `IO` provides a bridge back to your familiar and comfortable more-imperative style coding.

Do you like to use `if` and `try..catch` and `for..of` loops? You may have noticed that FP and monads seem to throw all that stuff out the window, in favor of long chains of curried and composed function calls. What if you could get all the power of `IO` but opt-in to the more typically-imperative style of code where helpful?

`IO.do(..)` takes a JS generator, whose code looks like the `async..await` style that most JS devs are so familiar with. When you `yield` a value, if its monadic, it's automatically chained and unwrapped. And if it's asynchronous (a promise), the code automatically "awaits" the completion.

Taken together with all its facets, **Monio**'s `IO` (and `IOx` superset) is the "one monad to rule them all".

## ... And Friends

OK, if you've made it this far, take a deep breath. Seriously, maybe go for a walk to let some of this settle in. Maybe re-read it, a few times.

We've already seen a decent, if basic, illustration of the idea of monads. And we didn't cover `Either` -- another *Sum Type* like `Maybe` but which holds values on both sides. `Either` is typically used to represent synchronous `try..catch` style exception handling. We also didn't cover `AsyncEither`, which extends `Either` to operate asynchronously (over promises), the same way `IO` transforms/handles them. `AsyncEither` is essentially **Monio**'s representation of a Promise/Future type.

But compared to the larger space *monad* fits in, *monad* is a fairly narrow concept itself. There are a variety of adjacent (and somewhat related) type behaviors in addition to monad'ness that provide additional capabilities and guarantees. In more formal terms, "monad" sits alongside them in "Category Theory", specifically a category called "Algebraic Data Types" (ADTs).

These "friends" include:

* foldable
* concatable (aka, semigroup)
* applicative

There are many, many other topics out there, but these are the main three "Friends" that **Monio** focuses on (and mixes with its monads).

To be clear, these are *not* monad behaviors. I call them "friends of monads" because I find monads mixed with these other behaviors to be more useful/practical in my JS code than monads (or any of these other types) standing alone; it's the combination of these type behaviors that I think makes monads attractive and powerful solutions for our programs.

### Foldable

The `fold(..)` method mixed into (most of) **Monio**'s monads is implementing the "Foldable" type. Notably, `IO` and its variations are not directly Foldable, but that's because the nature of `IO` is already doing a `fold(..)` of sorts when you call `run(..)`.

We already saw `fold(..)` referenced earlier a few times. That's merely the name **Monio** provides, but just like `chain(..)` vs `flatMap(..)` vs `bind(..)`, the name itself doesn't matter, only the expected behavior.

We didn't talk about List type monads (because **Monio** doesn't provide such), but of course those can exist. Foldable in the context of such a List monad would apply the provided function across all the values in the list, progressively accumulating a single result (of any type) by folding each value into the accumulator. JS arrays have a `reduce(..)` method which is basically List's foldable.

By contrast, Foldable in the context of a single-value monad (like `Just`) executes a provided function with its single associated/underlying value. It can be thought of as a special case of the generalized List foldable, since it doesn't need to "accumulate" its result across multiple invocations.

Similarly, *Sum Types* like `Maybe` and `Either` are also Foldable in **Monio**; this is a further specialization in that `fold(..)` here takes two functions, but will execute only one of them. If the associated value is a `Maybe:Nothing` / `Either:Left`, the first function is applied. Otherwise, if the associated value is a `Maybe:Just` / `Either:Right`, the second function is applied.

How might we use Foldable practically?

As I implied earlier a few times in this guide, one such transformation is the sort-of "unwrapping" of the underlying/associated value from its monad, by passing the identity function (e.g., `v => v`) to `fold(..)`.

But more commonly, we use Foldable to define a natural transformation from one kind of monad to another. To illustrate, let's revisit this example from earlier:

```js
// assumed:
// function formatLabel(label) { .. }

// helpers:
const getPropSafe = prop => obj => Maybe.from(obj[prop]);
const formatLabelSafe = v => Maybe.from(formatLabel(v));

const shippingLabel = (
    getPropSafe("address")(record)
    .chain( getPropSafe("shipping") )
    .chain( formatLabelSafe )
);
```

If we want to render the shipping label, but only if it's actually valid/defined, and otherwise print a default notice, we can arrange our program like this:

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
    getElement(id).map( assignProp("innerText")(val) )
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
    getPropSafe("address")(record)
    .chain( getPropSafe("shipping") )
    .chain( formatLabelSafe )
);

renderIO.run();
```

Take your time reading and analyzing that code. It's illustrating how our monad types interact in useful ways. I promise that even if at first this code seems head-spinning -- it did for me! -- eventually you will get to understanding and even preferring code like this!

A key aspect of the snippet is the `Maybe`'s `fold(..)` call, which folds down to either a fallback `IO` value if the shipping address was missing, or the computed `IO` holding the valid shipping address, and then `chain(..)`s off whichever `IO` was folded to.

Again, Foldable is distinct from monads. But I think this discussion illustrates how useful it is when paired with a monad. That's why it's a *honored friend*.

### Concatable (Semigroup)

Concatable, formally referred to as Semigroup, is another interesting friend of monads. You won't necessarily see it used explicitly all that often, but it can be useful, especially when using `foldMap(..)` (which is an abstraction over `reduce(..)`).

**Monio** choosed to implement Concatable as the `concat(..)` method on its monads. That name is not required by the type, of course, it's just how **Monio** does it.

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

Yes, monad instances can even represent/hold/nest other monad instances!

#### Monoid

Additionally, the term Monoid means a Concatable/Semigroup plus an "empty" (identity) value for the concatenation. For example, a string is a monoid because it can be concatenated, and if it's concatenated with the empty `""` string, it's still the same value. An array is a monoid with the empty `[]` array.

An example of extending this notion of monoid to something that wouldn't seem at first as "concatable" is with multiple booleans combined in a `&&` or `||` style logical expression. For the logical-AND operation, the "empty" value is `true`, and for the logical-OR operation, the "empty" value is `false`. The "concatenation" of these values is the computed logical result (`true` or `false`).

**Monio** provides `AllIO` and `AnyIO` as `IO` variants that are monoids -- again, both an "empty" value and a `concat(..)` method. In particular, the `concat(..)` method on these two `IO` variants is designed to compute the logical-AND / logical-OR (respectively) between two boolean-resulting IOs. That makes `AllIO` and `AnyIO` easy to use with the `fold(..)` and `foldMap(..)` utilities.

**NOTE:** Despite the name overlap, the standalone `fold(..)` and `foldMap(..)` utilities in the `MonioUtil` module are *not* related to the Foldable type and the `fold(..)` method that appears on **Monio** monad instances.

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

As an added convenience, **Monio**'s' `IOHelpers` module provides `iAnd(..)` and `iOr(..)`, which automatically applies this logical-And / logical-Or `foldMap(..)` logic to two or more `IO` instances:

```js
const trueIO = IO.of(true);
const falseIO = IO.of(false);

iAnd( trueIO, trueIO, falseIO, trueIO ).run();  // false
iOr(  trueIO, trueIO, falseIO, trueIO ).run();  // true
```

I'm illustrating `IO` instances with direct `true` and `false` values, but that's not really how you'd actually use these capabilities. Since they're all `IO` instances, the boolean results (`true` or `false`) can be computed lazily (and asynchronously!) in their respective `IO`s, even as a result of complex side-effects.

For example, you could define a list of several `IO` instances representing DOM element states, like this:

```js
const getElement = id => IO(() => document.getElementById(id));
const getCheckboxState = id => getElement(id).map(el => !!el.checked);

const options = [
    getCheckboxState("option-1"),
    getCheckboxState("option-2"),
    getCheckboxState("option-3")
];

const allOptionsChecked = iAnd( ...options ).run();
const someOptionsChecked = iOr( ...options ).run();
```

### Applicative

Applicative is a bit more unusual (and less common, in my experience) than Semigroup. But occasionally it's helpful. **Monio** chooses to implement this behavior on most of its monads with the `ap(..)` method.

I think the best way to explain Applicative is to just show concrete code:

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

Recall from [Foldable above](#foldable) that `fold(..)` with the identity function essentially extracts the value from the monad. As shown essentially, `ap(..)` is sort of "extracting" a mapping function held in second monad and running it (via `map(..)`) against the value held in the first monad.

All of **Monio**'s non-`IO` monads are applicatives. Again, you may not use applicative behavior very frequently, but at least you're now aware of it.

## *Wrap*ping Up

We've now scratched the surface of monads (and several *friends*). That's by no means a complete exploration of the topic, but I hope you're starting to feel they're a little less mysterious or intimidating.

A monad is a narrow set of behavior (required by "laws") you associate with a value or operation. Category Theory includes other adjacent/related behaviors, such as foldable and concatable, that can augment the capabilities of this representation.

This set of behavior improves coordination/interoperation between other monad-and-friends-compliant values, such that results are more predictable. The behaviors also offer many opportunities to abstract (shift into the behavioral-definitions) certain logic that usually clutters up our imperative code, such as null'ish checks.

Monads certainly don't fix all the problems we may encounter in our code, but I think there's plenty of intriguing power to unlock by exploring them further. I hope this guide inspires you to keep digging, and perhaps in your explorations, you'll find the [Monio](https://github.com/getify/monio) library helpful.
