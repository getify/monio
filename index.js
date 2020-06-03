var Just = (function DefineJust() {
  const brand = {};

  return Object.assign(Just,{
    of: Just, pure: Just, unit: Just, is,
  });

  // **************************

  function Just(val) {
    var publicAPI = {
      map, chain, flatMap: chain, bind: chain,
      ap, concat, _inspect, _is,
      [Symbol.toStringTag]: "Just",
    };
    return publicAPI;

    // *********************

    function map(fn) {
      return Just(fn(val));
    }

    // aka: bind, flatMap
    function chain(fn) {
      return fn(val);
    }

    function ap(m) {
      return m.map(val);
    }

    function concat(m) {
      return m.map(v => val.concat(v));
    }

    function _inspect() {
      return `${publicAPI[Symbol.toStringTag]}(${
        typeof val == "string" ? JSON.stringify(val) :
        typeof val == "undefined" ? "" :
        typeof val == "function" ? (val.name || "anonymous function") :
        val && typeof val._inspect == "function" ? val._inspect() :
        val
      })`;
    }

    function _is(br) {
      return br === brand;
    }

  }

  function is(val) {
    return val && typeof val._is == "function" && val._is(brand);
  }

})();

var Nothing = (function DefineNothing() {
  const brand = {};

  return Object.assign(Nothing,{
    of: Nothing, pure: Nothing, unit: Nothing,
    is, isEmpty,
  });

  // **************************

  function Nothing() {
    var publicAPI = {
      map: noop, chain: noop, flatMap: noop, bind: noop,
      ap: noop, concat: noop, _inspect, _is,
      [Symbol.toStringTag]: "Nothing",
    };
    return publicAPI;

    // *********************

    function noop() {
      return publicAPI;
    }

    function _inspect() {
      return `${publicAPI[Symbol.toStringTag]}()`;
    }

    function _is(br) {
      return br === brand;
    }

  }

  function is(val) {
    return val && typeof val._is == "function" && val._is(brand);
  }

  // default isEmpty(), can be overidden
  function isEmpty(val) {
    return val == null; // null or undefined
  }

})();

var Maybe = (function DefineMaybe() {
  const brand = {};

  var _Just = Just;
  var _Nothing = Nothing;

  Object.assign(MaybeJust,Just);
  Object.assign(MaybeNothing,Nothing);

  return Object.assign(Maybe,{
    Just: MaybeJust, Nothing: MaybeNothing, of: Maybe,
    pure: Maybe, unit: Maybe, is, from,
  });

  // **************************

  function MaybeJust(val) {
    return Maybe(val);
  }

  function MaybeNothing() {
    return Maybe(Nothing());
  }

  function Maybe(val) {
    var mn = val;
    var isJust = _Just.is(mn);
    var isNothing = _Nothing.is(mn);

    if (!(isJust || isNothing)) {
      mn = _Just(val);
      isJust = true;
    }
    else if (isJust) {
      // intentional monad violation, to extract its value
      val = mn.chain(v => v);
    }
    // isNothing
    else {
      val = void 0;
    }

    var publicAPI = {
      map, chain, flatMap: chain, bind: chain,
      ap, fold, _inspect, _is,
      get [Symbol.toStringTag]() {
        return `Maybe:${mn[Symbol.toStringTag]}`;
      },
    };

    return publicAPI;

    // *********************

    function map(fn) {
      return (
        isJust ?
          Maybe(mn.map(fn)) :
          publicAPI
      );
    }

    function chain(fn) {
      return (
        isJust ?
          mn.chain(fn) :
          publicAPI
      );
    }

    function ap(m) {
      return (
        isJust ?
          m.map(val) :
          publicAPI
      );
    }

    function concat(m) {
      return (
        isJust ?
          m.map(v => val.concat(v)) :
          publicAPI
      );
    }

    function fold(asNothing,asJust) {
      return (
        isJust ?
          asJust(val) :
          asNothing(val)
      );
    }

    function _inspect() {
      return `${publicAPI[Symbol.toStringTag]}(${
        isJust ? (
          typeof val == "string" ? JSON.stringify(val) :
          typeof val == "undefined" ? "" :
          typeof val == "function" ? (val.name || "anonymous function") :
          val && typeof val._inspect == "function" ? val._inspect() :
          val
        ) : ""
      })`;
    }

    function _is(br) {
      return br === brand || mn._is(br);
    }

  }

  function is(val) {
    return val && typeof val._is == "function" && val._is(brand);
  }

  function from(val) {
    return _Nothing.isEmpty(val) ? Maybe(_Nothing()) : Maybe(val);
  }

})();

var Either = (function DefineEither() {
  const brand = {};

  Left.is = LeftIs;
  Right.is = RightIs;

  return Object.assign(Either,{
    Left, Right, of: Right, pure: Right,
    unit: Right, is, fromFoldable,
  });

  // **************************

  function Left(val) {
    return LeftOrRight(val,/*isRight=*/ false);
  }

  function LeftIs(val) {
    return is(val) && !val._is_right();
  }

  function Right(val) {
    return LeftOrRight(val,/*isRight=*/ true);
  }

  function RightIs(val) {
    return is(val) && val._is_right();
  }

  function Either(val) {
    return LeftOrRight(val,/*isRight=*/ true);
  }

  function LeftOrRight(val,isRight = true) {
    var publicAPI = {
      map, chain, flatMap: chain, bind: chain,
      ap, concat, fold, _inspect, _is, _is_right,
      get [Symbol.toStringTag]() {
        return `Either:${isRight ? "Right" : "Left"}`;
      },
    };
    return publicAPI;

    // *********************

    function map(fn) {
      return (
        isRight ?
          LeftOrRight(fn(val),isRight) :
          publicAPI
      );
    }

    function chain(fn) {
      return (
        isRight ?
          fn(val) :
          publicAPI
      );
    }

    function ap(m) {
      return (
        isRight ?
          m.map(val) :
          publicAPI
      );
    }

    function concat(m) {
      return (
        isRight ?
          m.map(v => val.concat(v)) :
          publicAPI
      );
    }

    function fold(asLeft,asRight) {
      return (
        isRight ?
          asRight(val) :
          asLeft(val)
      );
    }

    function _inspect() {
      return `${publicAPI[Symbol.toStringTag]}(${
        typeof val == "string" ? JSON.stringify(val) :
        typeof val == "undefined" ? "" :
        typeof val == "function" ? (val.name || "anonymous function") :
        val && typeof val._inspect == "function" ? val._inspect() :
        val
      })`;
    }

    function _is(br) {
      return br === brand;
    }

    function _is_right() {
      return isRight;
    }

  }

  function is(val) {
    return val && typeof val._is == "function" && val._is(brand);
  }

  function fromFoldable(m) {
    return m.fold(Left,Right);
  }

})();

var AsyncEither = (function defineAsyncEither() {
  const brand = {};

  return Object.assign(AsyncEither,{
    Left: AsyncLeft, Right: AsyncRight,
    of: AsyncRight, pure: AsyncRight, unit: AsyncRight,
    is, fromFoldable, fromPromise,
  });

  // **************************

  function AsyncLeft(v) {
    return AsyncEither(Either.Left(v));
  }

  function AsyncRight(v) {
    return AsyncEither(Either.Right(v));
  }

  function AsyncEither(v) {
    return fromPromise(
      _isPromise(v) ? v :
      Either.Left.is(v) ? Promise.reject(v) :
      Promise.resolve(v)
    );
  }

  function fromPromise(pr) {
    pr = _splitPromise(pr);

    var publicAPI = { map, chain, flatMap: chain, bind: chain,
      ap, concat, fold, _inspect, _is,
      [Symbol.toStringTag]: "AsyncEither",
    };
    return publicAPI;

    // *********************

    function map(v) {
      var handle = m => {
        var _doMap = fn => {
          // note: intentionally using chain() here
          var res = m.chain(fn);
          return (
            _isPromise(res) ?
              _splitPromise(res) :
              (
                m._is_right() ?
                  res :
                  Promise.reject(res)
              )
          );
        };

        return (
          _isPromise(v) ?
            v.then(_doMap) :
            _doMap(v)
        );
      };

      return AsyncEither(pr.then(handle,handle));
    }

    function chain(v) {
      var handle = m => {
        var _doChain = fn => {
          var res = m.chain(fn);
          return (
            is(res) ? res.fold(v => v,v => v) :
            Either.is(res) ? res.fold(
              e => Promise.reject(e),
              v => v
            ) :
            res
          );
        };

        return (
          _isPromise(v) ?
            v.then(_doChain) :
            _doChain(v)
        );
      };

      return AsyncEither(pr.then(handle,handle));
    }

    function ap(m) {
      return m.map(pr);
    }

    function concat(m) {
      return m.map(v => pr.then(val => val.concat(v)));
    }

    function fold(asLeft,asRight) {
      var handle = whichSide => m => m.fold(
        v => Promise.reject(whichSide(v)),
        whichSide
      );
      return pr.then(handle(asRight),handle(asLeft));
    }

    function _inspect() {
      return `${publicAPI[Symbol.toStringTag]}(Promise)`;
    }

    function _is(br) {
      return br === brand;
    }

  }

  function is(val) {
    return val && typeof val._is == "function" && val._is(brand);
  }

  function fromFoldable(m) {
    return m.fold(AsyncEither.Left,AsyncEither.Right);
  }

  function _splitPromise(pr) {
    return pr.then(
      v => (
        Either.is(v) ?
          v :
          Either.Right(v)
      ),
      v => Promise.reject(
        Either.is(v) ?
          v :
          Either.Left(v)
      )
    );
  }

  function _isPromise(v) {
    return v && typeof v.then == "function";
  }

  function _toPromise(m) {
    return new Promise((res,rej) =>
      m.fold(
        v => rej(Either.Left(v)),
        v => res(Either.Right(v))
      )
    );
  }

})();

var IO = (function DefineIO() {
  const brand = {};

  return Object.assign(IO,{ of, is, do: $do, doEither, });

  // **************************

  function IO(effect) {
    var publicAPI = {
      map, chain, flatMap: chain, bind: chain,
      ap, concat, run, _inspect, _is,
      [Symbol.toStringTag]: "IO",
    };
    return publicAPI;

    // *********************

    function map(fn) {
      return IO(v => {
        var res = effect(v);
        return (
          _isPromise(res) ?
            res.then(fn) :
            fn(res)
        );
      });
    }

    function chain(fn) {
      return IO(v => {
        var res = effect(v);
        return (
          _isPromise(res) ?
            res.then(fn).then(v2 => v2.run(v)) :
            fn(res).run(v)
        );
      });
    }

    function ap(m) {
      return m.map(effect);
    }

    function concat(m) {
      return IO(v => {
        var res = effect(v);
        var res2 = m.run(v);
        return (
          (_isPromise(res) || _isPromise(res2)) ?
            Promise.all([ res, res2 ]).then(([ v1, v2 ]) => v1.concat(v2)) :
            res.concat(res2)
        );
      });
    }

    function run(v) {
      return effect(v);
    }

    function _inspect() {
      return `${publicAPI[Symbol.toStringTag]}(${
        typeof effect == "function" ? (effect.name || "anonymous function") :
        (effect && typeof effect._inspect == "function") ? effect._inspect() :
        val
      })`;
    }

    function _is(br) {
      return br === brand;
    }

  }

  function of(v) {
    return IO(() => v);
  }

  function is(v) {
    return v && typeof v._is == "function" && v._is(brand);
  }

  function processNext(next,respVal,outerV) {
    return (new Promise(async (resv,rej) => {
      try {
        await monadFlatMap(
          (_isPromise(respVal) ? await respVal : respVal),
          v => IO(() => next(v).then(resv,rej))
        ).run(outerV);
      }
      catch (err) {
        rej(err);
      }
    }));
  }

  function $do(block) {
    return IO(outerV => {
      var it = getIterator(block,outerV);

      return (async function next(v){
        var resp = it.next(_isPromise(v) ? await v : v);
        resp = _isPromise(resp) ? await resp : resp;
        return (
          resp.done ?
            resp.value :
            processNext(next,resp.value,outerV)
        );
      })();
    });
  }

  function doEither(block) {
    return IO(outerV => {
      var it = getIterator(block,outerV);

      return (async function next(v){
        try {
          v = _isPromise(v) ? await v : v;
          let resp = (
            Either.Left.is(v) ?
              it.throw(v) :
              it.next(v)
          );
          resp = _isPromise(resp) ? await resp : resp;
          let respVal = (
            resp.done ?
              (
                (_isPromise(resp.value) ? await resp.value : resp.value)
              ) :
              resp.value
          );
          return (
            resp.done ?
              (
                Either.Right.is(respVal) ?
                  respVal :
                  Either.Right(respVal)
              ) :
              processNext(next,respVal,outerV)
              .catch(next)
          );
        }
        catch (err) {
          throw (
            Either.Left.is(err) ?
              err :
              Either.Left(err)
          );
        }
      })();
    });
  }

  function getIterator(block,v) {
    return (
      typeof block == "function" ? block(v) :
      (block && typeof block == "object" && typeof block.next == "function") ? block :
      undefined
    );
  }

  function monadFlatMap(m,fn) {
    return m[
      "flatMap" in m ? "flatMap" :
      "chain" in m ? "chain" :
      "bind"
    ](fn);
  }

  function _isPromise(v) {
    return v && typeof v.then == "function";
  }

})();

// aliases
var RIO = IO, Reader = RIO;
