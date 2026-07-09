import { DesignModule } from '@/types';

export const javascriptFundamentalsModule: DesignModule = {
  slug: 'javascript-fundamentals',
  title: 'JavaScript Fundamentals',
  description: 'Arrow functions, closures, prototype chains, and event loops — explained simply so they actually stick.',
  difficulty: 'Reference',
  companies: ['Every JS interview ever'],
  tags: ['JavaScript', 'Closures', 'Event Loop', 'Prototype'],
  estimatedMinutes: 20,
  sections: [
    {
      id: 'arrow-vs-regular',
      title: 'Arrow vs Regular Function',
      content: `The biggest difference is how **this** behaves. Everything else flows from that.

---

**Regular function — this is dynamic**
\`this\` is decided at call time — whoever calls the function sets \`this\`.
\`\`\`js
const obj = {
  name: 'Alice',
  greet: function () {
    console.log(this.name); // "Alice" — this = obj
  },
};
obj.greet();
\`\`\`

**Arrow function — this is lexical**
\`this\` is inherited from the surrounding code where the arrow was written. It never changes.
\`\`\`js
const obj = {
  name: 'Alice',
  greet: () => {
    console.log(this.name); // undefined — this = outer scope (window/global)
  },
};
obj.greet();
\`\`\`

---

**The classic trap — setTimeout**
\`\`\`js
// Broken with regular function
function Timer() {
  this.count = 0;
  setInterval(function () {
    this.count++; // this = window, not Timer
  }, 1000);
}

// Fixed with arrow function
function Timer() {
  this.count = 0;
  setInterval(() => {
    this.count++; // this = Timer instance
  }, 1000);
}
\`\`\`

---

**Other differences — quick ref**

| Feature | Regular | Arrow |
|---|---|---|
| \`this\` binding | Dynamic (call-site) | Lexical (definition-site) |
| \`arguments\` object | Yes | No — use \`...args\` instead |
| Used as constructor | Yes — \`new Fn()\` works | No — throws error |
| \`prototype\` property | Yes | No |
| Implicit return | No | Yes for single expressions |
| Method on an object | Use this | Avoid — this will be wrong |
| Callback / handler | Either works | Preferred (predictable this) |

---

**When to use which**

- Object methods that need \`this\` → **regular function**
- Callbacks, array methods (\`map\`, \`filter\`), event handlers → **arrow**
- Class methods → **regular** (class syntax handles \`this\`)
- Short one-liner transforms → **arrow** (implicit return is clean)

\`\`\`js
// Implicit return — no braces, no return keyword needed
const double = (n) => n * 2;
const getUser = (id) => ({ id, active: true }); // wrap object in ()
\`\`\``,
    },
    {
      id: 'closures',
      title: 'Closures',
      content: `A closure is a function that **remembers variables from the scope it was created in**, even after that outer function has returned.

Think of it as a function carrying a backpack of variables with it.

---

**Basic example**
\`\`\`js
function makeCounter() {
  let count = 0; // lives in makeCounter's scope

  return function () {
    count++;       // inner function remembers count
    return count;
  };
}

const counter = makeCounter();
counter(); // 1
counter(); // 2
counter(); // 3
// count is private — nobody outside can touch it directly
\`\`\`

\`makeCounter\` has returned, but \`count\` stays alive because the inner function holds a reference to it.

---

**Why closures exist**

JS functions are first-class — you can return them, pass them around. When you do, they drag their scope with them. That's just how JS works.

---

**Common real-world uses**

- **Data privacy** — hide state inside a function, expose only what you choose
- **Factory functions** — generate customised functions
- **Memoisation** — cache results of expensive calls
- **Partial application** — pre-fill some arguments

\`\`\`js
// Factory — each multiplier is independent
function multiplier(factor) {
  return (n) => n * factor;
}
const double = multiplier(2);
const triple = multiplier(3);
double(5); // 10
triple(5); // 15

// Memoisation
function memoize(fn) {
  const cache = {};
  return function (n) {
    if (cache[n] !== undefined) return cache[n];
    cache[n] = fn(n);
    return cache[n];
  };
}
\`\`\`

---

**The classic loop trap**
\`\`\`js
// Broken — all callbacks share the same i
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // prints 3, 3, 3
}

// Fixed with let (block scope creates a new binding per iteration)
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // prints 0, 1, 2
}
\`\`\`
→ \`var\` leaks to function scope. \`let\` creates a new closure per loop iteration.`,
    },
    {
      id: 'prototype-chain',
      title: 'Prototypical Chain',
      content: `Every object in JS has a hidden link to another object called its **prototype**. When you access a property, JS walks this chain until it finds it — or hits \`null\`.

---

**How property lookup works**
\`\`\`js
const animal = { breathes: true };
const dog = { barks: true };

Object.setPrototypeOf(dog, animal); // dog's prototype = animal

console.log(dog.barks);   // true  — found on dog directly
console.log(dog.breathes); // true  — not on dog, found on animal (walked up)
console.log(dog.flies);   // undefined — walked all the way to null, not found
\`\`\`

The chain: \`dog → animal → Object.prototype → null\`

---

**Functions have a .prototype property**

This is what powers \`new\`:
\`\`\`js
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function () {
  return 'Hi, I am ' + this.name;
};

const alice = new Person('Alice');
alice.greet(); // "Hi, I am Alice"
// alice doesn't have greet — JS found it on Person.prototype
\`\`\`

What \`new\` does under the hood:
- Creates a blank object
- Sets its \`__proto__\` to \`Person.prototype\`
- Runs \`Person\` with \`this\` = that new object
- Returns the object

---

**class is just cleaner syntax for the same thing**
\`\`\`js
class Person {
  constructor(name) { this.name = name; }
  greet() { return 'Hi, I am ' + this.name; }
}
// greet still lives on Person.prototype — class changes nothing underneath
\`\`\`

---

**.__proto__ vs .prototype**

| | What it is |
|---|---|
| \`obj.__proto__\` | The actual prototype link of an instance |
| \`Fn.prototype\` | The object assigned as \`__proto__\` when you call \`new Fn()\` |

\`\`\`js
alice.__proto__ === Person.prototype // true
\`\`\`

→ \`__proto__\` is the live link. \`prototype\` is the template. Don't confuse them.

---

**Key points**

- Property lookup walks the chain — own properties first, then prototype, then prototype's prototype
- Methods defined on \`prototype\` are shared across all instances (memory efficient)
- Properties set in the constructor are own properties (per-instance)
- \`hasOwnProperty('key')\` tells you if a property is directly on the object vs inherited
- Chain always ends at \`Object.prototype\`, then \`null\``,
    },
    {
      id: 'event-loop',
      title: 'Node.js vs Browser Event Loop',
      content: `Both run JS on a single thread and use an event loop to handle async work — but they have different environments and phases.

---

**The shared mental model**

JS can only run one thing at a time (single thread). When async work (timers, network, I/O) finishes, callbacks are queued. The event loop picks them off the queue and runs them when the call stack is empty.

\`\`\`
Call Stack          Microtask Queue       Task Queue (Macrotasks)
-----------         ---------------       -----------------------
running code  ---> Promises (.then)  --> setTimeout, setInterval,
                   queueMicrotask        I/O callbacks, UI events

Order: call stack drains → ALL microtasks run → ONE macrotask → repeat
\`\`\`

→ Microtasks always run before the next macrotask. Promise chains can starve the task queue if they keep queuing more microtasks.

---

**Browser event loop**

Managed by the browser host environment. Handles:
- DOM events (click, keydown)
- \`setTimeout\` / \`setInterval\` (via Web APIs)
- \`fetch\` / XHR callbacks
- \`requestAnimationFrame\` (runs just before repaint — its own special queue)
- \`Promise.then\` → microtask queue

\`\`\`js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');

// Output: 1, 4, 3, 2
// Why: sync runs first (1, 4), then microtasks (3), then macrotasks (2)
\`\`\`

---

**Node.js event loop**

Powered by **libuv** (C library). Has distinct phases — not just one queue:

| Phase | What runs here |
|---|---|
| Timers | \`setTimeout\` and \`setInterval\` callbacks |
| Pending I/O | I/O errors from previous loop |
| Idle / Prepare | Internal Node use |
| Poll | Fetch new I/O events, run their callbacks |
| Check | \`setImmediate\` callbacks |
| Close | Socket/handle close events |

After EACH phase, Node drains microtasks (Promises) and \`process.nextTick\` first.

\`\`\`js
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));

// Output: nextTick, promise, timeout or immediate (order of last two varies)
// nextTick runs before promises, both run before any macrotask phase
\`\`\`

→ \`process.nextTick\` is not actually a tick — it runs before Promises, before the next event loop phase. Name is misleading.

---

**Key differences**

| | Browser | Node.js |
|---|---|---|
| Async I/O handled by | Web APIs (browser built-in) | libuv (C-level thread pool) |
| Extra queue | \`requestAnimationFrame\` | \`process.nextTick\` |
| \`setImmediate\` | Not standard | Yes — runs after I/O in Check phase |
| Rendering step | After each task (before next task) | No rendering |
| Worker threads | Web Workers | \`worker_threads\` module |

---

**Quick summary — what fires in what order**

- \`process.nextTick\` (Node only) — before everything else in current phase
- Promise \`.then\` / \`queueMicrotask\` — microtask queue, runs after current task
- \`setTimeout(fn, 0)\` — next timers phase (not truly 0ms)
- \`setImmediate\` (Node only) — check phase, after I/O
- \`requestAnimationFrame\` (browser only) — before repaint`,
    },
  ],
};
