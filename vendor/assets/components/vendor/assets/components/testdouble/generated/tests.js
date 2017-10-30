(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  absolutify: function absolutify() {},
  ignoreCallsFromThisFile: function ignoreCallsFromThisFile() {},
  reset: function reset() {}
};

},{}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (value instanceof ArrayBuffer) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (ArrayBuffer.isView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || string instanceof ArrayBuffer) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

},{"base64-js":2,"ieee754":59}],5:[function(require,module,exports){
'use strict';

var copy             = require('es5-ext/object/copy')
  , normalizeOptions = require('es5-ext/object/normalize-options')
  , ensureCallable   = require('es5-ext/object/valid-callable')
  , map              = require('es5-ext/object/map')
  , callable         = require('es5-ext/object/valid-callable')
  , validValue       = require('es5-ext/object/valid-value')

  , bind = Function.prototype.bind, defineProperty = Object.defineProperty
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , define;

define = function (name, desc, options) {
	var value = validValue(desc) && callable(desc.value), dgs;
	dgs = copy(desc);
	delete dgs.writable;
	delete dgs.value;
	dgs.get = function () {
		if (!options.overwriteDefinition && hasOwnProperty.call(this, name)) return value;
		desc.value = bind.call(value, options.resolveContext ? options.resolveContext(this) : this);
		defineProperty(this, name, desc);
		return this[name];
	};
	return dgs;
};

module.exports = function (props/*, options*/) {
	var options = normalizeOptions(arguments[1]);
	if (options.resolveContext != null) ensureCallable(options.resolveContext);
	return map(props, function (desc, name) { return define(name, desc, options); });
};

},{"es5-ext/object/copy":19,"es5-ext/object/map":27,"es5-ext/object/normalize-options":28,"es5-ext/object/valid-callable":33,"es5-ext/object/valid-value":34}],6:[function(require,module,exports){
'use strict';

var assign        = require('es5-ext/object/assign')
  , normalizeOpts = require('es5-ext/object/normalize-options')
  , isCallable    = require('es5-ext/object/is-callable')
  , contains      = require('es5-ext/string/#/contains')

  , d;

d = module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if ((arguments.length < 2) || (typeof dscr !== 'string')) {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== 'string') {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (get == null) {
		get = undefined;
	} else if (!isCallable(get)) {
		options = get;
		get = set = undefined;
	} else if (set == null) {
		set = undefined;
	} else if (!isCallable(set)) {
		options = set;
		set = undefined;
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":16,"es5-ext/object/is-callable":22,"es5-ext/object/normalize-options":28,"es5-ext/string/#/contains":35}],7:[function(require,module,exports){
// Inspired by Google Closure:
// http://closure-library.googlecode.com/svn/docs/
// closure_goog_array_array.js.html#goog.array.clear

'use strict';

var value = require('../../object/valid-value');

module.exports = function () {
	value(this).length = 0;
	return this;
};

},{"../../object/valid-value":34}],8:[function(require,module,exports){
'use strict';

var toPosInt = require('../../number/to-pos-integer')
  , value    = require('../../object/valid-value')

  , indexOf = Array.prototype.indexOf
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , abs = Math.abs, floor = Math.floor;

module.exports = function (searchElement/*, fromIndex*/) {
	var i, l, fromIndex, val;
	if (searchElement === searchElement) { //jslint: ignore
		return indexOf.apply(this, arguments);
	}

	l = toPosInt(value(this).length);
	fromIndex = arguments[1];
	if (isNaN(fromIndex)) fromIndex = 0;
	else if (fromIndex >= 0) fromIndex = floor(fromIndex);
	else fromIndex = toPosInt(this.length) - floor(abs(fromIndex));

	for (i = fromIndex; i < l; ++i) {
		if (hasOwnProperty.call(this, i)) {
			val = this[i];
			if (val !== val) return i; //jslint: ignore
		}
	}
	return -1;
};

},{"../../number/to-pos-integer":14,"../../object/valid-value":34}],9:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call((function () { return arguments; }()));

module.exports = function (x) { return (toString.call(x) === id); };

},{}],10:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Math.sign
	: require('./shim');

},{"./is-implemented":11,"./shim":12}],11:[function(require,module,exports){
'use strict';

module.exports = function () {
	var sign = Math.sign;
	if (typeof sign !== 'function') return false;
	return ((sign(10) === 1) && (sign(-20) === -1));
};

},{}],12:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	value = Number(value);
	if (isNaN(value) || (value === 0)) return value;
	return (value > 0) ? 1 : -1;
};

},{}],13:[function(require,module,exports){
'use strict';

var sign = require('../math/sign')

  , abs = Math.abs, floor = Math.floor;

module.exports = function (value) {
	if (isNaN(value)) return 0;
	value = Number(value);
	if ((value === 0) || !isFinite(value)) return value;
	return sign(value) * floor(abs(value));
};

},{"../math/sign":10}],14:[function(require,module,exports){
'use strict';

var toInteger = require('./to-integer')

  , max = Math.max;

module.exports = function (value) { return max(0, toInteger(value)); };

},{"./to-integer":13}],15:[function(require,module,exports){
// Internal method, used by iteration functions.
// Calls a function for each key-value pair found in object
// Optionally takes compareFn to iterate object in specific order

'use strict';

var callable = require('./valid-callable')
  , value    = require('./valid-value')

  , bind = Function.prototype.bind, call = Function.prototype.call, keys = Object.keys
  , propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = function (method, defVal) {
	return function (obj, cb/*, thisArg, compareFn*/) {
		var list, thisArg = arguments[2], compareFn = arguments[3];
		obj = Object(value(obj));
		callable(cb);

		list = keys(obj);
		if (compareFn) {
			list.sort((typeof compareFn === 'function') ? bind.call(compareFn, obj) : undefined);
		}
		if (typeof method !== 'function') method = list[method];
		return call.call(method, list, function (key, index) {
			if (!propertyIsEnumerable.call(obj, key)) return defVal;
			return call.call(cb, thisArg, obj[key], key, obj, index);
		});
	};
};

},{"./valid-callable":33,"./valid-value":34}],16:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.assign
	: require('./shim');

},{"./is-implemented":17,"./shim":18}],17:[function(require,module,exports){
'use strict';

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== 'function') return false;
	obj = { foo: 'raz' };
	assign(obj, { bar: 'dwa' }, { trzy: 'trzy' });
	return (obj.foo + obj.bar + obj.trzy) === 'razdwatrzy';
};

},{}],18:[function(require,module,exports){
'use strict';

var keys  = require('../keys')
  , value = require('../valid-value')

  , max = Math.max;

module.exports = function (dest, src/*, …srcn*/) {
	var error, i, l = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try { dest[key] = src[key]; } catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < l; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":24,"../valid-value":34}],19:[function(require,module,exports){
'use strict';

var assign = require('./assign')
  , value  = require('./valid-value');

module.exports = function (obj) {
	var copy = Object(value(obj));
	if (copy !== obj) return copy;
	return assign({}, obj);
};

},{"./assign":16,"./valid-value":34}],20:[function(require,module,exports){
// Workaround for http://code.google.com/p/v8/issues/detail?id=2804

'use strict';

var create = Object.create, shim;

if (!require('./set-prototype-of/is-implemented')()) {
	shim = require('./set-prototype-of/shim');
}

module.exports = (function () {
	var nullObject, props, desc;
	if (!shim) return create;
	if (shim.level !== 1) return create;

	nullObject = {};
	props = {};
	desc = { configurable: false, enumerable: false, writable: true,
		value: undefined };
	Object.getOwnPropertyNames(Object.prototype).forEach(function (name) {
		if (name === '__proto__') {
			props[name] = { configurable: true, enumerable: false, writable: true,
				value: undefined };
			return;
		}
		props[name] = desc;
	});
	Object.defineProperties(nullObject, props);

	Object.defineProperty(shim, 'nullPolyfill', { configurable: false,
		enumerable: false, writable: false, value: nullObject });

	return function (prototype, props) {
		return create((prototype === null) ? nullObject : prototype, props);
	};
}());

},{"./set-prototype-of/is-implemented":31,"./set-prototype-of/shim":32}],21:[function(require,module,exports){
'use strict';

module.exports = require('./_iterate')('forEach');

},{"./_iterate":15}],22:[function(require,module,exports){
// Deprecated

'use strict';

module.exports = function (obj) { return typeof obj === 'function'; };

},{}],23:[function(require,module,exports){
'use strict';

var map = { 'function': true, object: true };

module.exports = function (x) {
	return ((x != null) && map[typeof x]) || false;
};

},{}],24:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.keys
	: require('./shim');

},{"./is-implemented":25,"./shim":26}],25:[function(require,module,exports){
'use strict';

module.exports = function () {
	try {
		Object.keys('primitive');
		return true;
	} catch (e) { return false; }
};

},{}],26:[function(require,module,exports){
'use strict';

var keys = Object.keys;

module.exports = function (object) {
	return keys(object == null ? object : Object(object));
};

},{}],27:[function(require,module,exports){
'use strict';

var callable = require('./valid-callable')
  , forEach  = require('./for-each')

  , call = Function.prototype.call;

module.exports = function (obj, cb/*, thisArg*/) {
	var o = {}, thisArg = arguments[2];
	callable(cb);
	forEach(obj, function (value, key, obj, index) {
		o[key] = call.call(cb, thisArg, value, key, obj, index);
	});
	return o;
};

},{"./for-each":21,"./valid-callable":33}],28:[function(require,module,exports){
'use strict';

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

module.exports = function (options/*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (options == null) return;
		process(Object(options), result);
	});
	return result;
};

},{}],29:[function(require,module,exports){
'use strict';

var forEach = Array.prototype.forEach, create = Object.create;

module.exports = function (arg/*, …args*/) {
	var set = create(null);
	forEach.call(arguments, function (name) { set[name] = true; });
	return set;
};

},{}],30:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.setPrototypeOf
	: require('./shim');

},{"./is-implemented":31,"./shim":32}],31:[function(require,module,exports){
'use strict';

var create = Object.create, getPrototypeOf = Object.getPrototypeOf
  , x = {};

module.exports = function (/*customCreate*/) {
	var setPrototypeOf = Object.setPrototypeOf
	  , customCreate = arguments[0] || create;
	if (typeof setPrototypeOf !== 'function') return false;
	return getPrototypeOf(setPrototypeOf(customCreate(null), x)) === x;
};

},{}],32:[function(require,module,exports){
// Big thanks to @WebReflection for sorting this out
// https://gist.github.com/WebReflection/5593554

'use strict';

var isObject      = require('../is-object')
  , value         = require('../valid-value')

  , isPrototypeOf = Object.prototype.isPrototypeOf
  , defineProperty = Object.defineProperty
  , nullDesc = { configurable: true, enumerable: false, writable: true,
		value: undefined }
  , validate;

validate = function (obj, prototype) {
	value(obj);
	if ((prototype === null) || isObject(prototype)) return obj;
	throw new TypeError('Prototype must be null or an object');
};

module.exports = (function (status) {
	var fn, set;
	if (!status) return null;
	if (status.level === 2) {
		if (status.set) {
			set = status.set;
			fn = function (obj, prototype) {
				set.call(validate(obj, prototype), prototype);
				return obj;
			};
		} else {
			fn = function (obj, prototype) {
				validate(obj, prototype).__proto__ = prototype;
				return obj;
			};
		}
	} else {
		fn = function self(obj, prototype) {
			var isNullBase;
			validate(obj, prototype);
			isNullBase = isPrototypeOf.call(self.nullPolyfill, obj);
			if (isNullBase) delete self.nullPolyfill.__proto__;
			if (prototype === null) prototype = self.nullPolyfill;
			obj.__proto__ = prototype;
			if (isNullBase) defineProperty(self.nullPolyfill, '__proto__', nullDesc);
			return obj;
		};
	}
	return Object.defineProperty(fn, 'level', { configurable: false,
		enumerable: false, writable: false, value: status.level });
}((function () {
	var x = Object.create(null), y = {}, set
	  , desc = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__');

	if (desc) {
		try {
			set = desc.set; // Opera crashes at this point
			set.call(x, y);
		} catch (ignore) { }
		if (Object.getPrototypeOf(x) === y) return { set: set, level: 2 };
	}

	x.__proto__ = y;
	if (Object.getPrototypeOf(x) === y) return { level: 2 };

	x = {};
	x.__proto__ = y;
	if (Object.getPrototypeOf(x) === y) return { level: 1 };

	return false;
}())));

require('../create');

},{"../create":20,"../is-object":23,"../valid-value":34}],33:[function(require,module,exports){
'use strict';

module.exports = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

},{}],34:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	if (value == null) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{}],35:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? String.prototype.contains
	: require('./shim');

},{"./is-implemented":36,"./shim":37}],36:[function(require,module,exports){
'use strict';

var str = 'razdwatrzy';

module.exports = function () {
	if (typeof str.contains !== 'function') return false;
	return ((str.contains('dwa') === true) && (str.contains('foo') === false));
};

},{}],37:[function(require,module,exports){
'use strict';

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],38:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call('');

module.exports = function (x) {
	return (typeof x === 'string') || (x && (typeof x === 'object') &&
		((x instanceof String) || (toString.call(x) === id))) || false;
};

},{}],39:[function(require,module,exports){
'use strict';

var setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , contains       = require('es5-ext/string/#/contains')
  , d              = require('d')
  , Iterator       = require('./')

  , defineProperty = Object.defineProperty
  , ArrayIterator;

ArrayIterator = module.exports = function (arr, kind) {
	if (!(this instanceof ArrayIterator)) return new ArrayIterator(arr, kind);
	Iterator.call(this, arr);
	if (!kind) kind = 'value';
	else if (contains.call(kind, 'key+value')) kind = 'key+value';
	else if (contains.call(kind, 'key')) kind = 'key';
	else kind = 'value';
	defineProperty(this, '__kind__', d('', kind));
};
if (setPrototypeOf) setPrototypeOf(ArrayIterator, Iterator);

ArrayIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(ArrayIterator),
	_resolve: d(function (i) {
		if (this.__kind__ === 'value') return this.__list__[i];
		if (this.__kind__ === 'key+value') return [i, this.__list__[i]];
		return i;
	}),
	toString: d(function () { return '[object Array Iterator]'; })
});

},{"./":42,"d":6,"es5-ext/object/set-prototype-of":30,"es5-ext/string/#/contains":35}],40:[function(require,module,exports){
'use strict';

var isArguments = require('es5-ext/function/is-arguments')
  , callable    = require('es5-ext/object/valid-callable')
  , isString    = require('es5-ext/string/is-string')
  , get         = require('./get')

  , isArray = Array.isArray, call = Function.prototype.call
  , some = Array.prototype.some;

module.exports = function (iterable, cb/*, thisArg*/) {
	var mode, thisArg = arguments[2], result, doBreak, broken, i, l, char, code;
	if (isArray(iterable) || isArguments(iterable)) mode = 'array';
	else if (isString(iterable)) mode = 'string';
	else iterable = get(iterable);

	callable(cb);
	doBreak = function () { broken = true; };
	if (mode === 'array') {
		some.call(iterable, function (value) {
			call.call(cb, thisArg, value, doBreak);
			if (broken) return true;
		});
		return;
	}
	if (mode === 'string') {
		l = iterable.length;
		for (i = 0; i < l; ++i) {
			char = iterable[i];
			if ((i + 1) < l) {
				code = char.charCodeAt(0);
				if ((code >= 0xD800) && (code <= 0xDBFF)) char += iterable[++i];
			}
			call.call(cb, thisArg, char, doBreak);
			if (broken) break;
		}
		return;
	}
	result = iterable.next();

	while (!result.done) {
		call.call(cb, thisArg, result.value, doBreak);
		if (broken) return;
		result = iterable.next();
	}
};

},{"./get":41,"es5-ext/function/is-arguments":9,"es5-ext/object/valid-callable":33,"es5-ext/string/is-string":38}],41:[function(require,module,exports){
'use strict';

var isArguments    = require('es5-ext/function/is-arguments')
  , isString       = require('es5-ext/string/is-string')
  , ArrayIterator  = require('./array')
  , StringIterator = require('./string')
  , iterable       = require('./valid-iterable')
  , iteratorSymbol = require('es6-symbol').iterator;

module.exports = function (obj) {
	if (typeof iterable(obj)[iteratorSymbol] === 'function') return obj[iteratorSymbol]();
	if (isArguments(obj)) return new ArrayIterator(obj);
	if (isString(obj)) return new StringIterator(obj);
	return new ArrayIterator(obj);
};

},{"./array":39,"./string":44,"./valid-iterable":45,"es5-ext/function/is-arguments":9,"es5-ext/string/is-string":38,"es6-symbol":52}],42:[function(require,module,exports){
'use strict';

var clear    = require('es5-ext/array/#/clear')
  , assign   = require('es5-ext/object/assign')
  , callable = require('es5-ext/object/valid-callable')
  , value    = require('es5-ext/object/valid-value')
  , d        = require('d')
  , autoBind = require('d/auto-bind')
  , Symbol   = require('es6-symbol')

  , defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , Iterator;

module.exports = Iterator = function (list, context) {
	if (!(this instanceof Iterator)) return new Iterator(list, context);
	defineProperties(this, {
		__list__: d('w', value(list)),
		__context__: d('w', context),
		__nextIndex__: d('w', 0)
	});
	if (!context) return;
	callable(context.on);
	context.on('_add', this._onAdd);
	context.on('_delete', this._onDelete);
	context.on('_clear', this._onClear);
};

defineProperties(Iterator.prototype, assign({
	constructor: d(Iterator),
	_next: d(function () {
		var i;
		if (!this.__list__) return;
		if (this.__redo__) {
			i = this.__redo__.shift();
			if (i !== undefined) return i;
		}
		if (this.__nextIndex__ < this.__list__.length) return this.__nextIndex__++;
		this._unBind();
	}),
	next: d(function () { return this._createResult(this._next()); }),
	_createResult: d(function (i) {
		if (i === undefined) return { done: true, value: undefined };
		return { done: false, value: this._resolve(i) };
	}),
	_resolve: d(function (i) { return this.__list__[i]; }),
	_unBind: d(function () {
		this.__list__ = null;
		delete this.__redo__;
		if (!this.__context__) return;
		this.__context__.off('_add', this._onAdd);
		this.__context__.off('_delete', this._onDelete);
		this.__context__.off('_clear', this._onClear);
		this.__context__ = null;
	}),
	toString: d(function () { return '[object Iterator]'; })
}, autoBind({
	_onAdd: d(function (index) {
		if (index >= this.__nextIndex__) return;
		++this.__nextIndex__;
		if (!this.__redo__) {
			defineProperty(this, '__redo__', d('c', [index]));
			return;
		}
		this.__redo__.forEach(function (redo, i) {
			if (redo >= index) this.__redo__[i] = ++redo;
		}, this);
		this.__redo__.push(index);
	}),
	_onDelete: d(function (index) {
		var i;
		if (index >= this.__nextIndex__) return;
		--this.__nextIndex__;
		if (!this.__redo__) return;
		i = this.__redo__.indexOf(index);
		if (i !== -1) this.__redo__.splice(i, 1);
		this.__redo__.forEach(function (redo, i) {
			if (redo > index) this.__redo__[i] = --redo;
		}, this);
	}),
	_onClear: d(function () {
		if (this.__redo__) clear.call(this.__redo__);
		this.__nextIndex__ = 0;
	})
})));

defineProperty(Iterator.prototype, Symbol.iterator, d(function () {
	return this;
}));
defineProperty(Iterator.prototype, Symbol.toStringTag, d('', 'Iterator'));

},{"d":6,"d/auto-bind":5,"es5-ext/array/#/clear":7,"es5-ext/object/assign":16,"es5-ext/object/valid-callable":33,"es5-ext/object/valid-value":34,"es6-symbol":52}],43:[function(require,module,exports){
'use strict';

var isArguments    = require('es5-ext/function/is-arguments')
  , isString       = require('es5-ext/string/is-string')
  , iteratorSymbol = require('es6-symbol').iterator

  , isArray = Array.isArray;

module.exports = function (value) {
	if (value == null) return false;
	if (isArray(value)) return true;
	if (isString(value)) return true;
	if (isArguments(value)) return true;
	return (typeof value[iteratorSymbol] === 'function');
};

},{"es5-ext/function/is-arguments":9,"es5-ext/string/is-string":38,"es6-symbol":52}],44:[function(require,module,exports){
// Thanks @mathiasbynens
// http://mathiasbynens.be/notes/javascript-unicode#iterating-over-symbols

'use strict';

var setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , d              = require('d')
  , Iterator       = require('./')

  , defineProperty = Object.defineProperty
  , StringIterator;

StringIterator = module.exports = function (str) {
	if (!(this instanceof StringIterator)) return new StringIterator(str);
	str = String(str);
	Iterator.call(this, str);
	defineProperty(this, '__length__', d('', str.length));

};
if (setPrototypeOf) setPrototypeOf(StringIterator, Iterator);

StringIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(StringIterator),
	_next: d(function () {
		if (!this.__list__) return;
		if (this.__nextIndex__ < this.__length__) return this.__nextIndex__++;
		this._unBind();
	}),
	_resolve: d(function (i) {
		var char = this.__list__[i], code;
		if (this.__nextIndex__ === this.__length__) return char;
		code = char.charCodeAt(0);
		if ((code >= 0xD800) && (code <= 0xDBFF)) return char + this.__list__[this.__nextIndex__++];
		return char;
	}),
	toString: d(function () { return '[object String Iterator]'; })
});

},{"./":42,"d":6,"es5-ext/object/set-prototype-of":30}],45:[function(require,module,exports){
'use strict';

var isIterable = require('./is-iterable');

module.exports = function (value) {
	if (!isIterable(value)) throw new TypeError(value + " is not iterable");
	return value;
};

},{"./is-iterable":43}],46:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')() ? Map : require('./polyfill');

},{"./is-implemented":47,"./polyfill":51}],47:[function(require,module,exports){
'use strict';

module.exports = function () {
	var map, iterator, result;
	if (typeof Map !== 'function') return false;
	try {
		// WebKit doesn't support arguments and crashes
		map = new Map([['raz', 'one'], ['dwa', 'two'], ['trzy', 'three']]);
	} catch (e) {
		return false;
	}
	if (String(map) !== '[object Map]') return false;
	if (map.size !== 3) return false;
	if (typeof map.clear !== 'function') return false;
	if (typeof map.delete !== 'function') return false;
	if (typeof map.entries !== 'function') return false;
	if (typeof map.forEach !== 'function') return false;
	if (typeof map.get !== 'function') return false;
	if (typeof map.has !== 'function') return false;
	if (typeof map.keys !== 'function') return false;
	if (typeof map.set !== 'function') return false;
	if (typeof map.values !== 'function') return false;

	iterator = map.entries();
	result = iterator.next();
	if (result.done !== false) return false;
	if (!result.value) return false;
	if (result.value[0] !== 'raz') return false;
	if (result.value[1] !== 'one') return false;

	return true;
};

},{}],48:[function(require,module,exports){
// Exports true if environment provides native `Map` implementation,
// whatever that is.

'use strict';

module.exports = (function () {
	if (typeof Map === 'undefined') return false;
	return (Object.prototype.toString.call(new Map()) === '[object Map]');
}());

},{}],49:[function(require,module,exports){
'use strict';

module.exports = require('es5-ext/object/primitive-set')('key',
	'value', 'key+value');

},{"es5-ext/object/primitive-set":29}],50:[function(require,module,exports){
'use strict';

var setPrototypeOf    = require('es5-ext/object/set-prototype-of')
  , d                 = require('d')
  , Iterator          = require('es6-iterator')
  , toStringTagSymbol = require('es6-symbol').toStringTag
  , kinds             = require('./iterator-kinds')

  , defineProperties = Object.defineProperties
  , unBind = Iterator.prototype._unBind
  , MapIterator;

MapIterator = module.exports = function (map, kind) {
	if (!(this instanceof MapIterator)) return new MapIterator(map, kind);
	Iterator.call(this, map.__mapKeysData__, map);
	if (!kind || !kinds[kind]) kind = 'key+value';
	defineProperties(this, {
		__kind__: d('', kind),
		__values__: d('w', map.__mapValuesData__)
	});
};
if (setPrototypeOf) setPrototypeOf(MapIterator, Iterator);

MapIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(MapIterator),
	_resolve: d(function (i) {
		if (this.__kind__ === 'value') return this.__values__[i];
		if (this.__kind__ === 'key') return this.__list__[i];
		return [this.__list__[i], this.__values__[i]];
	}),
	_unBind: d(function () {
		this.__values__ = null;
		unBind.call(this);
	}),
	toString: d(function () { return '[object Map Iterator]'; })
});
Object.defineProperty(MapIterator.prototype, toStringTagSymbol,
	d('c', 'Map Iterator'));

},{"./iterator-kinds":49,"d":6,"es5-ext/object/set-prototype-of":30,"es6-iterator":42,"es6-symbol":52}],51:[function(require,module,exports){
'use strict';

var clear          = require('es5-ext/array/#/clear')
  , eIndexOf       = require('es5-ext/array/#/e-index-of')
  , setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , callable       = require('es5-ext/object/valid-callable')
  , validValue     = require('es5-ext/object/valid-value')
  , d              = require('d')
  , ee             = require('event-emitter')
  , Symbol         = require('es6-symbol')
  , iterator       = require('es6-iterator/valid-iterable')
  , forOf          = require('es6-iterator/for-of')
  , Iterator       = require('./lib/iterator')
  , isNative       = require('./is-native-implemented')

  , call = Function.prototype.call
  , defineProperties = Object.defineProperties, getPrototypeOf = Object.getPrototypeOf
  , MapPoly;

module.exports = MapPoly = function (/*iterable*/) {
	var iterable = arguments[0], keys, values, self;
	if (!(this instanceof MapPoly)) throw new TypeError('Constructor requires \'new\'');
	if (isNative && setPrototypeOf && (Map !== MapPoly)) {
		self = setPrototypeOf(new Map(), getPrototypeOf(this));
	} else {
		self = this;
	}
	if (iterable != null) iterator(iterable);
	defineProperties(self, {
		__mapKeysData__: d('c', keys = []),
		__mapValuesData__: d('c', values = [])
	});
	if (!iterable) return self;
	forOf(iterable, function (value) {
		var key = validValue(value)[0];
		value = value[1];
		if (eIndexOf.call(keys, key) !== -1) return;
		keys.push(key);
		values.push(value);
	}, self);
	return self;
};

if (isNative) {
	if (setPrototypeOf) setPrototypeOf(MapPoly, Map);
	MapPoly.prototype = Object.create(Map.prototype, {
		constructor: d(MapPoly)
	});
}

ee(defineProperties(MapPoly.prototype, {
	clear: d(function () {
		if (!this.__mapKeysData__.length) return;
		clear.call(this.__mapKeysData__);
		clear.call(this.__mapValuesData__);
		this.emit('_clear');
	}),
	delete: d(function (key) {
		var index = eIndexOf.call(this.__mapKeysData__, key);
		if (index === -1) return false;
		this.__mapKeysData__.splice(index, 1);
		this.__mapValuesData__.splice(index, 1);
		this.emit('_delete', index, key);
		return true;
	}),
	entries: d(function () { return new Iterator(this, 'key+value'); }),
	forEach: d(function (cb/*, thisArg*/) {
		var thisArg = arguments[1], iterator, result;
		callable(cb);
		iterator = this.entries();
		result = iterator._next();
		while (result !== undefined) {
			call.call(cb, thisArg, this.__mapValuesData__[result],
				this.__mapKeysData__[result], this);
			result = iterator._next();
		}
	}),
	get: d(function (key) {
		var index = eIndexOf.call(this.__mapKeysData__, key);
		if (index === -1) return;
		return this.__mapValuesData__[index];
	}),
	has: d(function (key) {
		return (eIndexOf.call(this.__mapKeysData__, key) !== -1);
	}),
	keys: d(function () { return new Iterator(this, 'key'); }),
	set: d(function (key, value) {
		var index = eIndexOf.call(this.__mapKeysData__, key), emit;
		if (index === -1) {
			index = this.__mapKeysData__.push(key) - 1;
			emit = true;
		}
		this.__mapValuesData__[index] = value;
		if (emit) this.emit('_add', index, key);
		return this;
	}),
	size: d.gs(function () { return this.__mapKeysData__.length; }),
	values: d(function () { return new Iterator(this, 'value'); }),
	toString: d(function () { return '[object Map]'; })
}));
Object.defineProperty(MapPoly.prototype, Symbol.iterator, d(function () {
	return this.entries();
}));
Object.defineProperty(MapPoly.prototype, Symbol.toStringTag, d('c', 'Map'));

},{"./is-native-implemented":48,"./lib/iterator":50,"d":6,"es5-ext/array/#/clear":7,"es5-ext/array/#/e-index-of":8,"es5-ext/object/set-prototype-of":30,"es5-ext/object/valid-callable":33,"es5-ext/object/valid-value":34,"es6-iterator/for-of":40,"es6-iterator/valid-iterable":45,"es6-symbol":52,"event-emitter":57}],52:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')() ? Symbol : require('./polyfill');

},{"./is-implemented":53,"./polyfill":55}],53:[function(require,module,exports){
'use strict';

var validTypes = { object: true, symbol: true };

module.exports = function () {
	var symbol;
	if (typeof Symbol !== 'function') return false;
	symbol = Symbol('test symbol');
	try { String(symbol); } catch (e) { return false; }

	// Return 'true' also for polyfills
	if (!validTypes[typeof Symbol.iterator]) return false;
	if (!validTypes[typeof Symbol.toPrimitive]) return false;
	if (!validTypes[typeof Symbol.toStringTag]) return false;

	return true;
};

},{}],54:[function(require,module,exports){
'use strict';

module.exports = function (x) {
	if (!x) return false;
	if (typeof x === 'symbol') return true;
	if (!x.constructor) return false;
	if (x.constructor.name !== 'Symbol') return false;
	return (x[x.constructor.toStringTag] === 'Symbol');
};

},{}],55:[function(require,module,exports){
// ES2015 Symbol polyfill for environments that do not (or partially) support it

'use strict';

var d              = require('d')
  , validateSymbol = require('./validate-symbol')

  , create = Object.create, defineProperties = Object.defineProperties
  , defineProperty = Object.defineProperty, objPrototype = Object.prototype
  , NativeSymbol, SymbolPolyfill, HiddenSymbol, globalSymbols = create(null)
  , isNativeSafe;

if (typeof Symbol === 'function') {
	NativeSymbol = Symbol;
	try {
		String(NativeSymbol());
		isNativeSafe = true;
	} catch (ignore) {}
}

var generateName = (function () {
	var created = create(null);
	return function (desc) {
		var postfix = 0, name, ie11BugWorkaround;
		while (created[desc + (postfix || '')]) ++postfix;
		desc += (postfix || '');
		created[desc] = true;
		name = '@@' + desc;
		defineProperty(objPrototype, name, d.gs(null, function (value) {
			// For IE11 issue see:
			// https://connect.microsoft.com/IE/feedbackdetail/view/1928508/
			//    ie11-broken-getters-on-dom-objects
			// https://github.com/medikoo/es6-symbol/issues/12
			if (ie11BugWorkaround) return;
			ie11BugWorkaround = true;
			defineProperty(this, name, d(value));
			ie11BugWorkaround = false;
		}));
		return name;
	};
}());

// Internal constructor (not one exposed) for creating Symbol instances.
// This one is used to ensure that `someSymbol instanceof Symbol` always return false
HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError('Symbol is not a constructor');
	return SymbolPolyfill(description);
};

// Exposed `Symbol` constructor
// (returns instances of HiddenSymbol)
module.exports = SymbolPolyfill = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError('Symbol is not a constructor');
	if (isNativeSafe) return NativeSymbol(description);
	symbol = create(HiddenSymbol.prototype);
	description = (description === undefined ? '' : String(description));
	return defineProperties(symbol, {
		__description__: d('', description),
		__name__: d('', generateName(description))
	});
};
defineProperties(SymbolPolyfill, {
	for: d(function (key) {
		if (globalSymbols[key]) return globalSymbols[key];
		return (globalSymbols[key] = SymbolPolyfill(String(key)));
	}),
	keyFor: d(function (s) {
		var key;
		validateSymbol(s);
		for (key in globalSymbols) if (globalSymbols[key] === s) return key;
	}),

	// To ensure proper interoperability with other native functions (e.g. Array.from)
	// fallback to eventual native implementation of given symbol
	hasInstance: d('', (NativeSymbol && NativeSymbol.hasInstance) || SymbolPolyfill('hasInstance')),
	isConcatSpreadable: d('', (NativeSymbol && NativeSymbol.isConcatSpreadable) ||
		SymbolPolyfill('isConcatSpreadable')),
	iterator: d('', (NativeSymbol && NativeSymbol.iterator) || SymbolPolyfill('iterator')),
	match: d('', (NativeSymbol && NativeSymbol.match) || SymbolPolyfill('match')),
	replace: d('', (NativeSymbol && NativeSymbol.replace) || SymbolPolyfill('replace')),
	search: d('', (NativeSymbol && NativeSymbol.search) || SymbolPolyfill('search')),
	species: d('', (NativeSymbol && NativeSymbol.species) || SymbolPolyfill('species')),
	split: d('', (NativeSymbol && NativeSymbol.split) || SymbolPolyfill('split')),
	toPrimitive: d('', (NativeSymbol && NativeSymbol.toPrimitive) || SymbolPolyfill('toPrimitive')),
	toStringTag: d('', (NativeSymbol && NativeSymbol.toStringTag) || SymbolPolyfill('toStringTag')),
	unscopables: d('', (NativeSymbol && NativeSymbol.unscopables) || SymbolPolyfill('unscopables'))
});

// Internal tweaks for real symbol producer
defineProperties(HiddenSymbol.prototype, {
	constructor: d(SymbolPolyfill),
	toString: d('', function () { return this.__name__; })
});

// Proper implementation of methods exposed on Symbol.prototype
// They won't be accessible on produced symbol instances as they derive from HiddenSymbol.prototype
defineProperties(SymbolPolyfill.prototype, {
	toString: d(function () { return 'Symbol (' + validateSymbol(this).__description__ + ')'; }),
	valueOf: d(function () { return validateSymbol(this); })
});
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toPrimitive, d('', function () {
	var symbol = validateSymbol(this);
	if (typeof symbol === 'symbol') return symbol;
	return symbol.toString();
}));
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d('c', 'Symbol'));

// Proper implementaton of toPrimitive and toStringTag for returned symbol instances
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toStringTag,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toStringTag]));

// Note: It's important to define `toPrimitive` as last one, as some implementations
// implement `toPrimitive` natively without implementing `toStringTag` (or other specified symbols)
// And that may invoke error in definition flow:
// See: https://github.com/medikoo/es6-symbol/issues/13#issuecomment-164146149
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toPrimitive,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive]));

},{"./validate-symbol":56,"d":6}],56:[function(require,module,exports){
'use strict';

var isSymbol = require('./is-symbol');

module.exports = function (value) {
	if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
	return value;
};

},{"./is-symbol":54}],57:[function(require,module,exports){
'use strict';

var d        = require('d')
  , callable = require('es5-ext/object/valid-callable')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , descriptor = { configurable: true, enumerable: false, writable: true }

  , on, once, off, emit, methods, descriptors, base;

on = function (type, listener) {
	var data;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) {
		data = descriptor.value = create(null);
		defineProperty(this, '__ee__', descriptor);
		descriptor.value = null;
	} else {
		data = this.__ee__;
	}
	if (!data[type]) data[type] = listener;
	else if (typeof data[type] === 'object') data[type].push(listener);
	else data[type] = [data[type], listener];

	return this;
};

once = function (type, listener) {
	var once, self;

	callable(listener);
	self = this;
	on.call(this, type, once = function () {
		off.call(self, type, once);
		apply.call(listener, this, arguments);
	});

	once.__eeOnceListener__ = listener;
	return this;
};

off = function (type, listener) {
	var data, listeners, candidate, i;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) return this;
	data = this.__ee__;
	if (!data[type]) return this;
	listeners = data[type];

	if (typeof listeners === 'object') {
		for (i = 0; (candidate = listeners[i]); ++i) {
			if ((candidate === listener) ||
					(candidate.__eeOnceListener__ === listener)) {
				if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
				else listeners.splice(i, 1);
			}
		}
	} else {
		if ((listeners === listener) ||
				(listeners.__eeOnceListener__ === listener)) {
			delete data[type];
		}
	}

	return this;
};

emit = function (type) {
	var i, l, listener, listeners, args;

	if (!hasOwnProperty.call(this, '__ee__')) return;
	listeners = this.__ee__[type];
	if (!listeners) return;

	if (typeof listeners === 'object') {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; ++i) args[i - 1] = arguments[i];

		listeners = listeners.slice();
		for (i = 0; (listener = listeners[i]); ++i) {
			apply.call(listener, this, args);
		}
	} else {
		switch (arguments.length) {
		case 1:
			call.call(listeners, this);
			break;
		case 2:
			call.call(listeners, this, arguments[1]);
			break;
		case 3:
			call.call(listeners, this, arguments[1], arguments[2]);
			break;
		default:
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}
			apply.call(listeners, this, args);
		}
	}
};

methods = {
	on: on,
	once: once,
	off: off,
	emit: emit
};

descriptors = {
	on: d(on),
	once: d(once),
	off: d(off),
	emit: d(emit)
};

base = defineProperties({}, descriptors);

module.exports = exports = function (o) {
	return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
};
exports.methods = methods;

},{"d":6,"es5-ext/object/valid-callable":33}],58:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],59:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],60:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],61:[function(require,module,exports){
/*!
 * is-number <https://github.com/jonschlinkert/is-number>
 *
 * Copyright (c) 2014-2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var typeOf = require('kind-of');

module.exports = function isNumber(num) {
  var type = typeOf(num);

  if (type === 'string') {
    if (!num.trim()) return false;
  } else if (type !== 'number') {
    return false;
  }

  return (num - num + 1) >= 0;
};

},{"kind-of":64}],62:[function(require,module,exports){
'use strict';
var toString = Object.prototype.toString;

module.exports = function (x) {
	var prototype;
	return toString.call(x) === '[object Object]' && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
};

},{}],63:[function(require,module,exports){
'use strict';
module.exports = function (re) {
	return Object.prototype.toString.call(re) === '[object RegExp]';
};

},{}],64:[function(require,module,exports){
(function (Buffer){
var isBuffer = require('is-buffer');
var toString = Object.prototype.toString;

/**
 * Get the native `typeof` a value.
 *
 * @param  {*} `val`
 * @return {*} Native javascript type
 */

module.exports = function kindOf(val) {
  // primitivies
  if (typeof val === 'undefined') {
    return 'undefined';
  }
  if (val === null) {
    return 'null';
  }
  if (val === true || val === false || val instanceof Boolean) {
    return 'boolean';
  }
  if (typeof val === 'string' || val instanceof String) {
    return 'string';
  }
  if (typeof val === 'number' || val instanceof Number) {
    return 'number';
  }

  // functions
  if (typeof val === 'function' || val instanceof Function) {
    return 'function';
  }

  // array
  if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
    return 'array';
  }

  // check for instances of RegExp and Date before calling `toString`
  if (val instanceof RegExp) {
    return 'regexp';
  }
  if (val instanceof Date) {
    return 'date';
  }

  // other objects
  var type = toString.call(val);

  if (type === '[object RegExp]') {
    return 'regexp';
  }
  if (type === '[object Date]') {
    return 'date';
  }
  if (type === '[object Arguments]') {
    return 'arguments';
  }
  if (type === '[object Error]') {
    return 'error';
  }

  // buffer
  if (typeof Buffer !== 'undefined' && isBuffer(val)) {
    return 'buffer';
  }

  // es6: Map, WeakMap, Set, WeakSet
  if (type === '[object Set]') {
    return 'set';
  }
  if (type === '[object WeakSet]') {
    return 'weakset';
  }
  if (type === '[object Map]') {
    return 'map';
  }
  if (type === '[object WeakMap]') {
    return 'weakmap';
  }
  if (type === '[object Symbol]') {
    return 'symbol';
  }

  // typed arrays
  if (type === '[object Int8Array]') {
    return 'int8array';
  }
  if (type === '[object Uint8Array]') {
    return 'uint8array';
  }
  if (type === '[object Uint8ClampedArray]') {
    return 'uint8clampedarray';
  }
  if (type === '[object Int16Array]') {
    return 'int16array';
  }
  if (type === '[object Uint16Array]') {
    return 'uint16array';
  }
  if (type === '[object Int32Array]') {
    return 'int32array';
  }
  if (type === '[object Uint32Array]') {
    return 'uint32array';
  }
  if (type === '[object Float32Array]') {
    return 'float32array';
  }
  if (type === '[object Float64Array]') {
    return 'float64array';
  }

  // must be a plain object
  return 'object';
};

}).call(this,require("buffer").Buffer)
},{"buffer":4,"is-buffer":60}],65:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var DataView = getNative(root, 'DataView');

module.exports = DataView;

},{"./_getNative":168,"./_root":214}],66:[function(require,module,exports){
var hashClear = require('./_hashClear'),
    hashDelete = require('./_hashDelete'),
    hashGet = require('./_hashGet'),
    hashHas = require('./_hashHas'),
    hashSet = require('./_hashSet');

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

module.exports = Hash;

},{"./_hashClear":177,"./_hashDelete":178,"./_hashGet":179,"./_hashHas":180,"./_hashSet":181}],67:[function(require,module,exports){
var listCacheClear = require('./_listCacheClear'),
    listCacheDelete = require('./_listCacheDelete'),
    listCacheGet = require('./_listCacheGet'),
    listCacheHas = require('./_listCacheHas'),
    listCacheSet = require('./_listCacheSet');

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

module.exports = ListCache;

},{"./_listCacheClear":193,"./_listCacheDelete":194,"./_listCacheGet":195,"./_listCacheHas":196,"./_listCacheSet":197}],68:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;

},{"./_getNative":168,"./_root":214}],69:[function(require,module,exports){
var mapCacheClear = require('./_mapCacheClear'),
    mapCacheDelete = require('./_mapCacheDelete'),
    mapCacheGet = require('./_mapCacheGet'),
    mapCacheHas = require('./_mapCacheHas'),
    mapCacheSet = require('./_mapCacheSet');

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

module.exports = MapCache;

},{"./_mapCacheClear":198,"./_mapCacheDelete":199,"./_mapCacheGet":200,"./_mapCacheHas":201,"./_mapCacheSet":202}],70:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Promise = getNative(root, 'Promise');

module.exports = Promise;

},{"./_getNative":168,"./_root":214}],71:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Set = getNative(root, 'Set');

module.exports = Set;

},{"./_getNative":168,"./_root":214}],72:[function(require,module,exports){
var MapCache = require('./_MapCache'),
    setCacheAdd = require('./_setCacheAdd'),
    setCacheHas = require('./_setCacheHas');

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;

  this.__data__ = new MapCache;
  while (++index < length) {
    this.add(values[index]);
  }
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

module.exports = SetCache;

},{"./_MapCache":69,"./_setCacheAdd":215,"./_setCacheHas":216}],73:[function(require,module,exports){
var ListCache = require('./_ListCache'),
    stackClear = require('./_stackClear'),
    stackDelete = require('./_stackDelete'),
    stackGet = require('./_stackGet'),
    stackHas = require('./_stackHas'),
    stackSet = require('./_stackSet');

/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}

// Add methods to `Stack`.
Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;

module.exports = Stack;

},{"./_ListCache":67,"./_stackClear":220,"./_stackDelete":221,"./_stackGet":222,"./_stackHas":223,"./_stackSet":224}],74:[function(require,module,exports){
var root = require('./_root');

/** Built-in value references. */
var Symbol = root.Symbol;

module.exports = Symbol;

},{"./_root":214}],75:[function(require,module,exports){
var root = require('./_root');

/** Built-in value references. */
var Uint8Array = root.Uint8Array;

module.exports = Uint8Array;

},{"./_root":214}],76:[function(require,module,exports){
var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var WeakMap = getNative(root, 'WeakMap');

module.exports = WeakMap;

},{"./_getNative":168,"./_root":214}],77:[function(require,module,exports){
/**
 * Adds the key-value `pair` to `map`.
 *
 * @private
 * @param {Object} map The map to modify.
 * @param {Array} pair The key-value pair to add.
 * @returns {Object} Returns `map`.
 */
function addMapEntry(map, pair) {
  // Don't return `map.set` because it's not chainable in IE 11.
  map.set(pair[0], pair[1]);
  return map;
}

module.exports = addMapEntry;

},{}],78:[function(require,module,exports){
/**
 * Adds `value` to `set`.
 *
 * @private
 * @param {Object} set The set to modify.
 * @param {*} value The value to add.
 * @returns {Object} Returns `set`.
 */
function addSetEntry(set, value) {
  // Don't return `set.add` because it's not chainable in IE 11.
  set.add(value);
  return set;
}

module.exports = addSetEntry;

},{}],79:[function(require,module,exports){
/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

module.exports = apply;

},{}],80:[function(require,module,exports){
/**
 * A specialized version of `baseAggregator` for arrays.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform keys.
 * @param {Object} accumulator The initial aggregated object.
 * @returns {Function} Returns `accumulator`.
 */
function arrayAggregator(array, setter, iteratee, accumulator) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    var value = array[index];
    setter(accumulator, value, iteratee(value), array);
  }
  return accumulator;
}

module.exports = arrayAggregator;

},{}],81:[function(require,module,exports){
/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

module.exports = arrayEach;

},{}],82:[function(require,module,exports){
/**
 * A specialized version of `_.every` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`.
 */
function arrayEvery(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (!predicate(array[index], index, array)) {
      return false;
    }
  }
  return true;
}

module.exports = arrayEvery;

},{}],83:[function(require,module,exports){
/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}

module.exports = arrayFilter;

},{}],84:[function(require,module,exports){
var baseTimes = require('./_baseTimes'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isBuffer = require('./isBuffer'),
    isIndex = require('./_isIndex'),
    isTypedArray = require('./isTypedArray');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = arrayLikeKeys;

},{"./_baseTimes":132,"./_isIndex":185,"./isArguments":255,"./isArray":256,"./isBuffer":259,"./isTypedArray":271}],85:[function(require,module,exports){
/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],86:[function(require,module,exports){
/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

module.exports = arrayPush;

},{}],87:[function(require,module,exports){
/**
 * A specialized version of `_.reduce` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @param {boolean} [initAccum] Specify using the first element of `array` as
 *  the initial value.
 * @returns {*} Returns the accumulated value.
 */
function arrayReduce(array, iteratee, accumulator, initAccum) {
  var index = -1,
      length = array == null ? 0 : array.length;

  if (initAccum && length) {
    accumulator = array[++index];
  }
  while (++index < length) {
    accumulator = iteratee(accumulator, array[index], index, array);
  }
  return accumulator;
}

module.exports = arrayReduce;

},{}],88:[function(require,module,exports){
/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }
  return false;
}

module.exports = arraySome;

},{}],89:[function(require,module,exports){
/**
 * Converts an ASCII `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function asciiToArray(string) {
  return string.split('');
}

module.exports = asciiToArray;

},{}],90:[function(require,module,exports){
var baseAssignValue = require('./_baseAssignValue'),
    eq = require('./eq');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
      (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

module.exports = assignValue;

},{"./_baseAssignValue":95,"./eq":240}],91:[function(require,module,exports){
var eq = require('./eq');

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

module.exports = assocIndexOf;

},{"./eq":240}],92:[function(require,module,exports){
var baseEach = require('./_baseEach');

/**
 * Aggregates elements of `collection` on `accumulator` with keys transformed
 * by `iteratee` and values set by `setter`.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} setter The function to set `accumulator` values.
 * @param {Function} iteratee The iteratee to transform keys.
 * @param {Object} accumulator The initial aggregated object.
 * @returns {Function} Returns `accumulator`.
 */
function baseAggregator(collection, setter, iteratee, accumulator) {
  baseEach(collection, function(value, key, collection) {
    setter(accumulator, value, iteratee(value), collection);
  });
  return accumulator;
}

module.exports = baseAggregator;

},{"./_baseEach":99}],93:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    keys = require('./keys');

/**
 * The base implementation of `_.assign` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssign(object, source) {
  return object && copyObject(source, keys(source), object);
}

module.exports = baseAssign;

},{"./_copyObject":149,"./keys":272}],94:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    keysIn = require('./keysIn');

/**
 * The base implementation of `_.assignIn` without support for multiple sources
 * or `customizer` functions.
 *
 * @private
 * @param {Object} object The destination object.
 * @param {Object} source The source object.
 * @returns {Object} Returns `object`.
 */
function baseAssignIn(object, source) {
  return object && copyObject(source, keysIn(source), object);
}

module.exports = baseAssignIn;

},{"./_copyObject":149,"./keysIn":273}],95:[function(require,module,exports){
var defineProperty = require('./_defineProperty');

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

module.exports = baseAssignValue;

},{"./_defineProperty":159}],96:[function(require,module,exports){
var Stack = require('./_Stack'),
    arrayEach = require('./_arrayEach'),
    assignValue = require('./_assignValue'),
    baseAssign = require('./_baseAssign'),
    baseAssignIn = require('./_baseAssignIn'),
    cloneBuffer = require('./_cloneBuffer'),
    copyArray = require('./_copyArray'),
    copySymbols = require('./_copySymbols'),
    copySymbolsIn = require('./_copySymbolsIn'),
    getAllKeys = require('./_getAllKeys'),
    getAllKeysIn = require('./_getAllKeysIn'),
    getTag = require('./_getTag'),
    initCloneArray = require('./_initCloneArray'),
    initCloneByTag = require('./_initCloneByTag'),
    initCloneObject = require('./_initCloneObject'),
    isArray = require('./isArray'),
    isBuffer = require('./isBuffer'),
    isObject = require('./isObject'),
    keys = require('./keys');

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1,
    CLONE_FLAT_FLAG = 2,
    CLONE_SYMBOLS_FLAG = 4;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values supported by `_.clone`. */
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] =
cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] =
cloneableTags[boolTag] = cloneableTags[dateTag] =
cloneableTags[float32Tag] = cloneableTags[float64Tag] =
cloneableTags[int8Tag] = cloneableTags[int16Tag] =
cloneableTags[int32Tag] = cloneableTags[mapTag] =
cloneableTags[numberTag] = cloneableTags[objectTag] =
cloneableTags[regexpTag] = cloneableTags[setTag] =
cloneableTags[stringTag] = cloneableTags[symbolTag] =
cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] =
cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] =
cloneableTags[weakMapTag] = false;

/**
 * The base implementation of `_.clone` and `_.cloneDeep` which tracks
 * traversed objects.
 *
 * @private
 * @param {*} value The value to clone.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Deep clone
 *  2 - Flatten inherited properties
 *  4 - Clone symbols
 * @param {Function} [customizer] The function to customize cloning.
 * @param {string} [key] The key of `value`.
 * @param {Object} [object] The parent object of `value`.
 * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
 * @returns {*} Returns the cloned value.
 */
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result,
      isDeep = bitmask & CLONE_DEEP_FLAG,
      isFlat = bitmask & CLONE_FLAT_FLAG,
      isFull = bitmask & CLONE_SYMBOLS_FLAG;

  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== undefined) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return copyArray(value, result);
    }
  } else {
    var tag = getTag(value),
        isFunc = tag == funcTag || tag == genTag;

    if (isBuffer(value)) {
      return cloneBuffer(value, isDeep);
    }
    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = (isFlat || isFunc) ? {} : initCloneObject(value);
      if (!isDeep) {
        return isFlat
          ? copySymbolsIn(value, baseAssignIn(result, value))
          : copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag(value, tag, baseClone, isDeep);
    }
  }
  // Check for circular references and return its corresponding clone.
  stack || (stack = new Stack);
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);

  var keysFunc = isFull
    ? (isFlat ? getAllKeysIn : getAllKeys)
    : (isFlat ? keysIn : keys);

  var props = isArr ? undefined : keysFunc(value);
  arrayEach(props || value, function(subValue, key) {
    if (props) {
      key = subValue;
      subValue = value[key];
    }
    // Recursively populate clone (susceptible to call stack limits).
    assignValue(result, key, baseClone(subValue, bitmask, customizer, key, value, stack));
  });
  return result;
}

module.exports = baseClone;

},{"./_Stack":73,"./_arrayEach":81,"./_assignValue":90,"./_baseAssign":93,"./_baseAssignIn":94,"./_cloneBuffer":141,"./_copyArray":148,"./_copySymbols":150,"./_copySymbolsIn":151,"./_getAllKeys":164,"./_getAllKeysIn":165,"./_getTag":173,"./_initCloneArray":182,"./_initCloneByTag":183,"./_initCloneObject":184,"./isArray":256,"./isBuffer":259,"./isObject":266,"./keys":272}],97:[function(require,module,exports){
var isObject = require('./isObject');

/** Built-in value references. */
var objectCreate = Object.create;

/**
 * The base implementation of `_.create` without support for assigning
 * properties to the created object.
 *
 * @private
 * @param {Object} proto The object to inherit from.
 * @returns {Object} Returns the new object.
 */
var baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object;
    object.prototype = undefined;
    return result;
  };
}());

module.exports = baseCreate;

},{"./isObject":266}],98:[function(require,module,exports){
/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * The base implementation of `_.delay` and `_.defer` which accepts `args`
 * to provide to `func`.
 *
 * @private
 * @param {Function} func The function to delay.
 * @param {number} wait The number of milliseconds to delay invocation.
 * @param {Array} args The arguments to provide to `func`.
 * @returns {number|Object} Returns the timer id or timeout object.
 */
function baseDelay(func, wait, args) {
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  return setTimeout(function() { func.apply(undefined, args); }, wait);
}

module.exports = baseDelay;

},{}],99:[function(require,module,exports){
var baseForOwn = require('./_baseForOwn'),
    createBaseEach = require('./_createBaseEach');

/**
 * The base implementation of `_.forEach` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 */
var baseEach = createBaseEach(baseForOwn);

module.exports = baseEach;

},{"./_baseForOwn":104,"./_createBaseEach":155}],100:[function(require,module,exports){
var baseEach = require('./_baseEach');

/**
 * The base implementation of `_.every` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`
 */
function baseEvery(collection, predicate) {
  var result = true;
  baseEach(collection, function(value, index, collection) {
    result = !!predicate(value, index, collection);
    return result;
  });
  return result;
}

module.exports = baseEvery;

},{"./_baseEach":99}],101:[function(require,module,exports){
var baseEach = require('./_baseEach');

/**
 * The base implementation of `_.filter` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function baseFilter(collection, predicate) {
  var result = [];
  baseEach(collection, function(value, index, collection) {
    if (predicate(value, index, collection)) {
      result.push(value);
    }
  });
  return result;
}

module.exports = baseFilter;

},{"./_baseEach":99}],102:[function(require,module,exports){
/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

module.exports = baseFindIndex;

},{}],103:[function(require,module,exports){
var createBaseFor = require('./_createBaseFor');

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

module.exports = baseFor;

},{"./_createBaseFor":156}],104:[function(require,module,exports){
var baseFor = require('./_baseFor'),
    keys = require('./keys');

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return object && baseFor(object, iteratee, keys);
}

module.exports = baseForOwn;

},{"./_baseFor":103,"./keys":272}],105:[function(require,module,exports){
var castPath = require('./_castPath'),
    toKey = require('./_toKey');

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = castPath(path, object);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return (index && index == length) ? object : undefined;
}

module.exports = baseGet;

},{"./_castPath":138,"./_toKey":228}],106:[function(require,module,exports){
var arrayPush = require('./_arrayPush'),
    isArray = require('./isArray');

/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

module.exports = baseGetAllKeys;

},{"./_arrayPush":86,"./isArray":256}],107:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    getRawTag = require('./_getRawTag'),
    objectToString = require('./_objectToString');

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? getRawTag(value)
    : objectToString(value);
}

module.exports = baseGetTag;

},{"./_Symbol":74,"./_getRawTag":170,"./_objectToString":210}],108:[function(require,module,exports){
/**
 * The base implementation of `_.hasIn` without support for deep paths.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {Array|string} key The key to check.
 * @returns {boolean} Returns `true` if `key` exists, else `false`.
 */
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}

module.exports = baseHasIn;

},{}],109:[function(require,module,exports){
var baseFindIndex = require('./_baseFindIndex'),
    baseIsNaN = require('./_baseIsNaN'),
    strictIndexOf = require('./_strictIndexOf');

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  return value === value
    ? strictIndexOf(array, value, fromIndex)
    : baseFindIndex(array, baseIsNaN, fromIndex);
}

module.exports = baseIndexOf;

},{"./_baseFindIndex":102,"./_baseIsNaN":115,"./_strictIndexOf":225}],110:[function(require,module,exports){
var apply = require('./_apply'),
    castPath = require('./_castPath'),
    last = require('./last'),
    parent = require('./_parent'),
    toKey = require('./_toKey');

/**
 * The base implementation of `_.invoke` without support for individual
 * method arguments.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the method to invoke.
 * @param {Array} args The arguments to invoke the method with.
 * @returns {*} Returns the result of the invoked method.
 */
function baseInvoke(object, path, args) {
  path = castPath(path, object);
  object = parent(object, path);
  var func = object == null ? object : object[toKey(last(path))];
  return func == null ? undefined : apply(func, object, args);
}

module.exports = baseInvoke;

},{"./_apply":79,"./_castPath":138,"./_parent":213,"./_toKey":228,"./last":274}],111:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

module.exports = baseIsArguments;

},{"./_baseGetTag":107,"./isObjectLike":267}],112:[function(require,module,exports){
var baseIsEqualDeep = require('./_baseIsEqualDeep'),
    isObjectLike = require('./isObjectLike');

/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

module.exports = baseIsEqual;

},{"./_baseIsEqualDeep":113,"./isObjectLike":267}],113:[function(require,module,exports){
var Stack = require('./_Stack'),
    equalArrays = require('./_equalArrays'),
    equalByTag = require('./_equalByTag'),
    equalObjects = require('./_equalObjects'),
    getTag = require('./_getTag'),
    isArray = require('./isArray'),
    isBuffer = require('./isBuffer'),
    isTypedArray = require('./isTypedArray');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = objIsArr ? arrayTag : getTag(object),
      othTag = othIsArr ? arrayTag : getTag(other);

  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;

  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer(object)) {
    if (!isBuffer(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack);
    return (objIsArr || isTypedArray(object))
      ? equalArrays(object, other, bitmask, customizer, equalFunc, stack)
      : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;

      stack || (stack = new Stack);
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack);
  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

module.exports = baseIsEqualDeep;

},{"./_Stack":73,"./_equalArrays":160,"./_equalByTag":161,"./_equalObjects":162,"./_getTag":173,"./isArray":256,"./isBuffer":259,"./isTypedArray":271}],114:[function(require,module,exports){
var Stack = require('./_Stack'),
    baseIsEqual = require('./_baseIsEqual');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * The base implementation of `_.isMatch` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to inspect.
 * @param {Object} source The object of property values to match.
 * @param {Array} matchData The property names, values, and compare flags to match.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if `object` is a match, else `false`.
 */
function baseIsMatch(object, source, matchData, customizer) {
  var index = matchData.length,
      length = index,
      noCustomizer = !customizer;

  if (object == null) {
    return !length;
  }
  object = Object(object);
  while (index--) {
    var data = matchData[index];
    if ((noCustomizer && data[2])
          ? data[1] !== object[data[0]]
          : !(data[0] in object)
        ) {
      return false;
    }
  }
  while (++index < length) {
    data = matchData[index];
    var key = data[0],
        objValue = object[key],
        srcValue = data[1];

    if (noCustomizer && data[2]) {
      if (objValue === undefined && !(key in object)) {
        return false;
      }
    } else {
      var stack = new Stack;
      if (customizer) {
        var result = customizer(objValue, srcValue, key, object, source, stack);
      }
      if (!(result === undefined
            ? baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG, customizer, stack)
            : result
          )) {
        return false;
      }
    }
  }
  return true;
}

module.exports = baseIsMatch;

},{"./_Stack":73,"./_baseIsEqual":112}],115:[function(require,module,exports){
/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

module.exports = baseIsNaN;

},{}],116:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isMasked = require('./_isMasked'),
    isObject = require('./isObject'),
    toSource = require('./_toSource');

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = baseIsNative;

},{"./_isMasked":189,"./_toSource":229,"./isFunction":263,"./isObject":266}],117:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var regexpTag = '[object RegExp]';

/**
 * The base implementation of `_.isRegExp` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a regexp, else `false`.
 */
function baseIsRegExp(value) {
  return isObjectLike(value) && baseGetTag(value) == regexpTag;
}

module.exports = baseIsRegExp;

},{"./_baseGetTag":107,"./isObjectLike":267}],118:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isLength = require('./isLength'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

module.exports = baseIsTypedArray;

},{"./_baseGetTag":107,"./isLength":264,"./isObjectLike":267}],119:[function(require,module,exports){
var baseMatches = require('./_baseMatches'),
    baseMatchesProperty = require('./_baseMatchesProperty'),
    identity = require('./identity'),
    isArray = require('./isArray'),
    property = require('./property');

/**
 * The base implementation of `_.iteratee`.
 *
 * @private
 * @param {*} [value=_.identity] The value to convert to an iteratee.
 * @returns {Function} Returns the iteratee.
 */
function baseIteratee(value) {
  // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
  // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
  if (typeof value == 'function') {
    return value;
  }
  if (value == null) {
    return identity;
  }
  if (typeof value == 'object') {
    return isArray(value)
      ? baseMatchesProperty(value[0], value[1])
      : baseMatches(value);
  }
  return property(value);
}

module.exports = baseIteratee;

},{"./_baseMatches":123,"./_baseMatchesProperty":124,"./identity":252,"./isArray":256,"./property":278}],120:[function(require,module,exports){
var isPrototype = require('./_isPrototype'),
    nativeKeys = require('./_nativeKeys');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

module.exports = baseKeys;

},{"./_isPrototype":190,"./_nativeKeys":207}],121:[function(require,module,exports){
var isObject = require('./isObject'),
    isPrototype = require('./_isPrototype'),
    nativeKeysIn = require('./_nativeKeysIn');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * The base implementation of `_.keysIn` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object),
      result = [];

  for (var key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}

module.exports = baseKeysIn;

},{"./_isPrototype":190,"./_nativeKeysIn":208,"./isObject":266}],122:[function(require,module,exports){
var baseEach = require('./_baseEach'),
    isArrayLike = require('./isArrayLike');

/**
 * The base implementation of `_.map` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function baseMap(collection, iteratee) {
  var index = -1,
      result = isArrayLike(collection) ? Array(collection.length) : [];

  baseEach(collection, function(value, key, collection) {
    result[++index] = iteratee(value, key, collection);
  });
  return result;
}

module.exports = baseMap;

},{"./_baseEach":99,"./isArrayLike":257}],123:[function(require,module,exports){
var baseIsMatch = require('./_baseIsMatch'),
    getMatchData = require('./_getMatchData'),
    matchesStrictComparable = require('./_matchesStrictComparable');

/**
 * The base implementation of `_.matches` which doesn't clone `source`.
 *
 * @private
 * @param {Object} source The object of property values to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatches(source) {
  var matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable(matchData[0][0], matchData[0][1]);
  }
  return function(object) {
    return object === source || baseIsMatch(object, source, matchData);
  };
}

module.exports = baseMatches;

},{"./_baseIsMatch":114,"./_getMatchData":167,"./_matchesStrictComparable":204}],124:[function(require,module,exports){
var baseIsEqual = require('./_baseIsEqual'),
    get = require('./get'),
    hasIn = require('./hasIn'),
    isKey = require('./_isKey'),
    isStrictComparable = require('./_isStrictComparable'),
    matchesStrictComparable = require('./_matchesStrictComparable'),
    toKey = require('./_toKey');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
 *
 * @private
 * @param {string} path The path of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function baseMatchesProperty(path, srcValue) {
  if (isKey(path) && isStrictComparable(srcValue)) {
    return matchesStrictComparable(toKey(path), srcValue);
  }
  return function(object) {
    var objValue = get(object, path);
    return (objValue === undefined && objValue === srcValue)
      ? hasIn(object, path)
      : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
  };
}

module.exports = baseMatchesProperty;

},{"./_baseIsEqual":112,"./_isKey":187,"./_isStrictComparable":191,"./_matchesStrictComparable":204,"./_toKey":228,"./get":249,"./hasIn":251}],125:[function(require,module,exports){
/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

module.exports = baseProperty;

},{}],126:[function(require,module,exports){
var baseGet = require('./_baseGet');

/**
 * A specialized version of `baseProperty` which supports deep paths.
 *
 * @private
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function basePropertyDeep(path) {
  return function(object) {
    return baseGet(object, path);
  };
}

module.exports = basePropertyDeep;

},{"./_baseGet":105}],127:[function(require,module,exports){
/**
 * The base implementation of `_.reduce` and `_.reduceRight`, without support
 * for iteratee shorthands, which iterates over `collection` using `eachFunc`.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {*} accumulator The initial value.
 * @param {boolean} initAccum Specify using the first or last element of
 *  `collection` as the initial value.
 * @param {Function} eachFunc The function to iterate over `collection`.
 * @returns {*} Returns the accumulated value.
 */
function baseReduce(collection, iteratee, accumulator, initAccum, eachFunc) {
  eachFunc(collection, function(value, index, collection) {
    accumulator = initAccum
      ? (initAccum = false, value)
      : iteratee(accumulator, value, index, collection);
  });
  return accumulator;
}

module.exports = baseReduce;

},{}],128:[function(require,module,exports){
var identity = require('./identity'),
    overRest = require('./_overRest'),
    setToString = require('./_setToString');

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return setToString(overRest(func, start, identity), func + '');
}

module.exports = baseRest;

},{"./_overRest":212,"./_setToString":218,"./identity":252}],129:[function(require,module,exports){
var constant = require('./constant'),
    defineProperty = require('./_defineProperty'),
    identity = require('./identity');

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !defineProperty ? identity : function(func, string) {
  return defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant(string),
    'writable': true
  });
};

module.exports = baseSetToString;

},{"./_defineProperty":159,"./constant":236,"./identity":252}],130:[function(require,module,exports){
/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

module.exports = baseSlice;

},{}],131:[function(require,module,exports){
var baseEach = require('./_baseEach');

/**
 * The base implementation of `_.some` without support for iteratee shorthands.
 *
 * @private
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function baseSome(collection, predicate) {
  var result;

  baseEach(collection, function(value, index, collection) {
    result = predicate(value, index, collection);
    return !result;
  });
  return !!result;
}

module.exports = baseSome;

},{"./_baseEach":99}],132:[function(require,module,exports){
/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

module.exports = baseTimes;

},{}],133:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    arrayMap = require('./_arrayMap'),
    isArray = require('./isArray'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return arrayMap(value, baseToString) + '';
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = baseToString;

},{"./_Symbol":74,"./_arrayMap":85,"./isArray":256,"./isSymbol":270}],134:[function(require,module,exports){
/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

module.exports = baseUnary;

},{}],135:[function(require,module,exports){
var arrayMap = require('./_arrayMap');

/**
 * The base implementation of `_.values` and `_.valuesIn` which creates an
 * array of `object` property values corresponding to the property names
 * of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the array of property values.
 */
function baseValues(object, props) {
  return arrayMap(props, function(key) {
    return object[key];
  });
}

module.exports = baseValues;

},{"./_arrayMap":85}],136:[function(require,module,exports){
/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

module.exports = cacheHas;

},{}],137:[function(require,module,exports){
var identity = require('./identity');

/**
 * Casts `value` to `identity` if it's not a function.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Function} Returns cast function.
 */
function castFunction(value) {
  return typeof value == 'function' ? value : identity;
}

module.exports = castFunction;

},{"./identity":252}],138:[function(require,module,exports){
var isArray = require('./isArray'),
    isKey = require('./_isKey'),
    stringToPath = require('./_stringToPath'),
    toString = require('./toString');

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value, object) {
  if (isArray(value)) {
    return value;
  }
  return isKey(value, object) ? [value] : stringToPath(toString(value));
}

module.exports = castPath;

},{"./_isKey":187,"./_stringToPath":227,"./isArray":256,"./toString":289}],139:[function(require,module,exports){
var baseSlice = require('./_baseSlice');

/**
 * Casts `array` to a slice if it's needed.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {number} start The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the cast slice.
 */
function castSlice(array, start, end) {
  var length = array.length;
  end = end === undefined ? length : end;
  return (!start && end >= length) ? array : baseSlice(array, start, end);
}

module.exports = castSlice;

},{"./_baseSlice":130}],140:[function(require,module,exports){
var Uint8Array = require('./_Uint8Array');

/**
 * Creates a clone of `arrayBuffer`.
 *
 * @private
 * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
 * @returns {ArrayBuffer} Returns the cloned array buffer.
 */
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

module.exports = cloneArrayBuffer;

},{"./_Uint8Array":75}],141:[function(require,module,exports){
var root = require('./_root');

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined,
    allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

/**
 * Creates a clone of  `buffer`.
 *
 * @private
 * @param {Buffer} buffer The buffer to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Buffer} Returns the cloned buffer.
 */
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length,
      result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

  buffer.copy(result);
  return result;
}

module.exports = cloneBuffer;

},{"./_root":214}],142:[function(require,module,exports){
var cloneArrayBuffer = require('./_cloneArrayBuffer');

/**
 * Creates a clone of `dataView`.
 *
 * @private
 * @param {Object} dataView The data view to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned data view.
 */
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}

module.exports = cloneDataView;

},{"./_cloneArrayBuffer":140}],143:[function(require,module,exports){
var addMapEntry = require('./_addMapEntry'),
    arrayReduce = require('./_arrayReduce'),
    mapToArray = require('./_mapToArray');

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1;

/**
 * Creates a clone of `map`.
 *
 * @private
 * @param {Object} map The map to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned map.
 */
function cloneMap(map, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(mapToArray(map), CLONE_DEEP_FLAG) : mapToArray(map);
  return arrayReduce(array, addMapEntry, new map.constructor);
}

module.exports = cloneMap;

},{"./_addMapEntry":77,"./_arrayReduce":87,"./_mapToArray":203}],144:[function(require,module,exports){
/** Used to match `RegExp` flags from their coerced string values. */
var reFlags = /\w*$/;

/**
 * Creates a clone of `regexp`.
 *
 * @private
 * @param {Object} regexp The regexp to clone.
 * @returns {Object} Returns the cloned regexp.
 */
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}

module.exports = cloneRegExp;

},{}],145:[function(require,module,exports){
var addSetEntry = require('./_addSetEntry'),
    arrayReduce = require('./_arrayReduce'),
    setToArray = require('./_setToArray');

/** Used to compose bitmasks for cloning. */
var CLONE_DEEP_FLAG = 1;

/**
 * Creates a clone of `set`.
 *
 * @private
 * @param {Object} set The set to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned set.
 */
function cloneSet(set, isDeep, cloneFunc) {
  var array = isDeep ? cloneFunc(setToArray(set), CLONE_DEEP_FLAG) : setToArray(set);
  return arrayReduce(array, addSetEntry, new set.constructor);
}

module.exports = cloneSet;

},{"./_addSetEntry":78,"./_arrayReduce":87,"./_setToArray":217}],146:[function(require,module,exports){
var Symbol = require('./_Symbol');

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * Creates a clone of the `symbol` object.
 *
 * @private
 * @param {Object} symbol The symbol object to clone.
 * @returns {Object} Returns the cloned symbol object.
 */
function cloneSymbol(symbol) {
  return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
}

module.exports = cloneSymbol;

},{"./_Symbol":74}],147:[function(require,module,exports){
var cloneArrayBuffer = require('./_cloneArrayBuffer');

/**
 * Creates a clone of `typedArray`.
 *
 * @private
 * @param {Object} typedArray The typed array to clone.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the cloned typed array.
 */
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

module.exports = cloneTypedArray;

},{"./_cloneArrayBuffer":140}],148:[function(require,module,exports){
/**
 * Copies the values of `source` to `array`.
 *
 * @private
 * @param {Array} source The array to copy values from.
 * @param {Array} [array=[]] The array to copy values to.
 * @returns {Array} Returns `array`.
 */
function copyArray(source, array) {
  var index = -1,
      length = source.length;

  array || (array = Array(length));
  while (++index < length) {
    array[index] = source[index];
  }
  return array;
}

module.exports = copyArray;

},{}],149:[function(require,module,exports){
var assignValue = require('./_assignValue'),
    baseAssignValue = require('./_baseAssignValue');

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}

module.exports = copyObject;

},{"./_assignValue":90,"./_baseAssignValue":95}],150:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    getSymbols = require('./_getSymbols');

/**
 * Copies own symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbols(source, object) {
  return copyObject(source, getSymbols(source), object);
}

module.exports = copySymbols;

},{"./_copyObject":149,"./_getSymbols":171}],151:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    getSymbolsIn = require('./_getSymbolsIn');

/**
 * Copies own and inherited symbols of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy symbols from.
 * @param {Object} [object={}] The object to copy symbols to.
 * @returns {Object} Returns `object`.
 */
function copySymbolsIn(source, object) {
  return copyObject(source, getSymbolsIn(source), object);
}

module.exports = copySymbolsIn;

},{"./_copyObject":149,"./_getSymbolsIn":172}],152:[function(require,module,exports){
var root = require('./_root');

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

module.exports = coreJsData;

},{"./_root":214}],153:[function(require,module,exports){
var arrayAggregator = require('./_arrayAggregator'),
    baseAggregator = require('./_baseAggregator'),
    baseIteratee = require('./_baseIteratee'),
    isArray = require('./isArray');

/**
 * Creates a function like `_.groupBy`.
 *
 * @private
 * @param {Function} setter The function to set accumulator values.
 * @param {Function} [initializer] The accumulator object initializer.
 * @returns {Function} Returns the new aggregator function.
 */
function createAggregator(setter, initializer) {
  return function(collection, iteratee) {
    var func = isArray(collection) ? arrayAggregator : baseAggregator,
        accumulator = initializer ? initializer() : {};

    return func(collection, setter, baseIteratee(iteratee, 2), accumulator);
  };
}

module.exports = createAggregator;

},{"./_arrayAggregator":80,"./_baseAggregator":92,"./_baseIteratee":119,"./isArray":256}],154:[function(require,module,exports){
var baseRest = require('./_baseRest'),
    isIterateeCall = require('./_isIterateeCall');

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

module.exports = createAssigner;

},{"./_baseRest":128,"./_isIterateeCall":186}],155:[function(require,module,exports){
var isArrayLike = require('./isArrayLike');

/**
 * Creates a `baseEach` or `baseEachRight` function.
 *
 * @private
 * @param {Function} eachFunc The function to iterate over a collection.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseEach(eachFunc, fromRight) {
  return function(collection, iteratee) {
    if (collection == null) {
      return collection;
    }
    if (!isArrayLike(collection)) {
      return eachFunc(collection, iteratee);
    }
    var length = collection.length,
        index = fromRight ? length : -1,
        iterable = Object(collection);

    while ((fromRight ? index-- : ++index < length)) {
      if (iteratee(iterable[index], index, iterable) === false) {
        break;
      }
    }
    return collection;
  };
}

module.exports = createBaseEach;

},{"./isArrayLike":257}],156:[function(require,module,exports){
/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

module.exports = createBaseFor;

},{}],157:[function(require,module,exports){
var castSlice = require('./_castSlice'),
    hasUnicode = require('./_hasUnicode'),
    stringToArray = require('./_stringToArray'),
    toString = require('./toString');

/**
 * Creates a function like `_.lowerFirst`.
 *
 * @private
 * @param {string} methodName The name of the `String` case method to use.
 * @returns {Function} Returns the new case function.
 */
function createCaseFirst(methodName) {
  return function(string) {
    string = toString(string);

    var strSymbols = hasUnicode(string)
      ? stringToArray(string)
      : undefined;

    var chr = strSymbols
      ? strSymbols[0]
      : string.charAt(0);

    var trailing = strSymbols
      ? castSlice(strSymbols, 1).join('')
      : string.slice(1);

    return chr[methodName]() + trailing;
  };
}

module.exports = createCaseFirst;

},{"./_castSlice":139,"./_hasUnicode":176,"./_stringToArray":226,"./toString":289}],158:[function(require,module,exports){
var baseIteratee = require('./_baseIteratee'),
    isArrayLike = require('./isArrayLike'),
    keys = require('./keys');

/**
 * Creates a `_.find` or `_.findLast` function.
 *
 * @private
 * @param {Function} findIndexFunc The function to find the collection index.
 * @returns {Function} Returns the new find function.
 */
function createFind(findIndexFunc) {
  return function(collection, predicate, fromIndex) {
    var iterable = Object(collection);
    if (!isArrayLike(collection)) {
      var iteratee = baseIteratee(predicate, 3);
      collection = keys(collection);
      predicate = function(key) { return iteratee(iterable[key], key, iterable); };
    }
    var index = findIndexFunc(collection, predicate, fromIndex);
    return index > -1 ? iterable[iteratee ? collection[index] : index] : undefined;
  };
}

module.exports = createFind;

},{"./_baseIteratee":119,"./isArrayLike":257,"./keys":272}],159:[function(require,module,exports){
var getNative = require('./_getNative');

var defineProperty = (function() {
  try {
    var func = getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

module.exports = defineProperty;

},{"./_getNative":168}],160:[function(require,module,exports){
var SetCache = require('./_SetCache'),
    arraySome = require('./_arraySome'),
    cacheHas = require('./_cacheHas');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(array);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var index = -1,
      result = true,
      seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new SetCache : undefined;

  stack.set(array, other);
  stack.set(other, array);

  // Ignore non-index properties.
  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    // Recursively compare arrays (susceptible to call stack limits).
    if (seen) {
      if (!arraySome(other, function(othValue, othIndex) {
            if (!cacheHas(seen, othIndex) &&
                (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
              return seen.push(othIndex);
            }
          })) {
        result = false;
        break;
      }
    } else if (!(
          arrValue === othValue ||
            equalFunc(arrValue, othValue, bitmask, customizer, stack)
        )) {
      result = false;
      break;
    }
  }
  stack['delete'](array);
  stack['delete'](other);
  return result;
}

module.exports = equalArrays;

},{"./_SetCache":72,"./_arraySome":88,"./_cacheHas":136}],161:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    Uint8Array = require('./_Uint8Array'),
    eq = require('./eq'),
    equalArrays = require('./_equalArrays'),
    mapToArray = require('./_mapToArray'),
    setToArray = require('./_setToArray');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]';

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if ((object.byteLength != other.byteLength) ||
          (object.byteOffset != other.byteOffset)) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if ((object.byteLength != other.byteLength) ||
          !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }
      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == (other + '');

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      }
      // Assume cyclic values are equal.
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG;

      // Recursively compare objects (susceptible to call stack limits).
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}

module.exports = equalByTag;

},{"./_Symbol":74,"./_Uint8Array":75,"./_equalArrays":160,"./_mapToArray":203,"./_setToArray":217,"./eq":240}],162:[function(require,module,exports){
var getAllKeys = require('./_getAllKeys');

/** Used to compose bitmasks for value comparisons. */
var COMPARE_PARTIAL_FLAG = 1;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      objProps = getAllKeys(object),
      objLength = objProps.length,
      othProps = getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index = objLength;
  while (index--) {
    var key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  }
  // Assume cyclic values are equal.
  var stacked = stack.get(object);
  if (stacked && stack.get(other)) {
    return stacked == other;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);

  var skipCtor = isPartial;
  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    // Recursively compare objects (susceptible to call stack limits).
    if (!(compared === undefined
          ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
          : compared
        )) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == 'constructor');
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor;

    // Non `Object` object instances with different constructors are not equal.
    if (objCtor != othCtor &&
        ('constructor' in object && 'constructor' in other) &&
        !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
          typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack['delete'](object);
  stack['delete'](other);
  return result;
}

module.exports = equalObjects;

},{"./_getAllKeys":164}],163:[function(require,module,exports){
(function (global){
/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],164:[function(require,module,exports){
var baseGetAllKeys = require('./_baseGetAllKeys'),
    getSymbols = require('./_getSymbols'),
    keys = require('./keys');

/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

module.exports = getAllKeys;

},{"./_baseGetAllKeys":106,"./_getSymbols":171,"./keys":272}],165:[function(require,module,exports){
var baseGetAllKeys = require('./_baseGetAllKeys'),
    getSymbolsIn = require('./_getSymbolsIn'),
    keysIn = require('./keysIn');

/**
 * Creates an array of own and inherited enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */
function getAllKeysIn(object) {
  return baseGetAllKeys(object, keysIn, getSymbolsIn);
}

module.exports = getAllKeysIn;

},{"./_baseGetAllKeys":106,"./_getSymbolsIn":172,"./keysIn":273}],166:[function(require,module,exports){
var isKeyable = require('./_isKeyable');

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

module.exports = getMapData;

},{"./_isKeyable":188}],167:[function(require,module,exports){
var isStrictComparable = require('./_isStrictComparable'),
    keys = require('./keys');

/**
 * Gets the property names, values, and compare flags of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the match data of `object`.
 */
function getMatchData(object) {
  var result = keys(object),
      length = result.length;

  while (length--) {
    var key = result[length],
        value = object[key];

    result[length] = [key, value, isStrictComparable(value)];
  }
  return result;
}

module.exports = getMatchData;

},{"./_isStrictComparable":191,"./keys":272}],168:[function(require,module,exports){
var baseIsNative = require('./_baseIsNative'),
    getValue = require('./_getValue');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

module.exports = getNative;

},{"./_baseIsNative":116,"./_getValue":174}],169:[function(require,module,exports){
var overArg = require('./_overArg');

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

module.exports = getPrototype;

},{"./_overArg":211}],170:[function(require,module,exports){
var Symbol = require('./_Symbol');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = Symbol ? Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;

},{"./_Symbol":74}],171:[function(require,module,exports){
var arrayFilter = require('./_arrayFilter'),
    stubArray = require('./stubArray');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbols = !nativeGetSymbols ? stubArray : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter(nativeGetSymbols(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};

module.exports = getSymbols;

},{"./_arrayFilter":83,"./stubArray":282}],172:[function(require,module,exports){
var arrayPush = require('./_arrayPush'),
    getPrototype = require('./_getPrototype'),
    getSymbols = require('./_getSymbols'),
    stubArray = require('./stubArray');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeGetSymbols = Object.getOwnPropertySymbols;

/**
 * Creates an array of the own and inherited enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */
var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
  var result = [];
  while (object) {
    arrayPush(result, getSymbols(object));
    object = getPrototype(object);
  }
  return result;
};

module.exports = getSymbolsIn;

},{"./_arrayPush":86,"./_getPrototype":169,"./_getSymbols":171,"./stubArray":282}],173:[function(require,module,exports){
var DataView = require('./_DataView'),
    Map = require('./_Map'),
    Promise = require('./_Promise'),
    Set = require('./_Set'),
    WeakMap = require('./_WeakMap'),
    baseGetTag = require('./_baseGetTag'),
    toSource = require('./_toSource');

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    setTag = '[object Set]',
    weakMapTag = '[object WeakMap]';

var dataViewTag = '[object DataView]';

/** Used to detect maps, sets, and weakmaps. */
var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);

/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
var getTag = baseGetTag;

// Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
if ((DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag) ||
    (Map && getTag(new Map) != mapTag) ||
    (Promise && getTag(Promise.resolve()) != promiseTag) ||
    (Set && getTag(new Set) != setTag) ||
    (WeakMap && getTag(new WeakMap) != weakMapTag)) {
  getTag = function(value) {
    var result = baseGetTag(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString: return dataViewTag;
        case mapCtorString: return mapTag;
        case promiseCtorString: return promiseTag;
        case setCtorString: return setTag;
        case weakMapCtorString: return weakMapTag;
      }
    }
    return result;
  };
}

module.exports = getTag;

},{"./_DataView":65,"./_Map":68,"./_Promise":70,"./_Set":71,"./_WeakMap":76,"./_baseGetTag":107,"./_toSource":229}],174:[function(require,module,exports){
/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

module.exports = getValue;

},{}],175:[function(require,module,exports){
var castPath = require('./_castPath'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isIndex = require('./_isIndex'),
    isLength = require('./isLength'),
    toKey = require('./_toKey');

/**
 * Checks if `path` exists on `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @param {Function} hasFunc The function to check properties.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 */
function hasPath(object, path, hasFunc) {
  path = castPath(path, object);

  var index = -1,
      length = path.length,
      result = false;

  while (++index < length) {
    var key = toKey(path[index]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength(length) && isIndex(key, length) &&
    (isArray(object) || isArguments(object));
}

module.exports = hasPath;

},{"./_castPath":138,"./_isIndex":185,"./_toKey":228,"./isArguments":255,"./isArray":256,"./isLength":264}],176:[function(require,module,exports){
/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f',
    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
    rsComboSymbolsRange = '\\u20d0-\\u20ff',
    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
    rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsZWJ = '\\u200d';

/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboRange + rsVarRange + ']');

/**
 * Checks if `string` contains Unicode symbols.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {boolean} Returns `true` if a symbol is found, else `false`.
 */
function hasUnicode(string) {
  return reHasUnicode.test(string);
}

module.exports = hasUnicode;

},{}],177:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

module.exports = hashClear;

},{"./_nativeCreate":206}],178:[function(require,module,exports){
/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = hashDelete;

},{}],179:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

module.exports = hashGet;

},{"./_nativeCreate":206}],180:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? (data[key] !== undefined) : hasOwnProperty.call(data, key);
}

module.exports = hashHas;

},{"./_nativeCreate":206}],181:[function(require,module,exports){
var nativeCreate = require('./_nativeCreate');

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

module.exports = hashSet;

},{"./_nativeCreate":206}],182:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Initializes an array clone.
 *
 * @private
 * @param {Array} array The array to clone.
 * @returns {Array} Returns the initialized clone.
 */
function initCloneArray(array) {
  var length = array.length,
      result = array.constructor(length);

  // Add properties assigned by `RegExp#exec`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

module.exports = initCloneArray;

},{}],183:[function(require,module,exports){
var cloneArrayBuffer = require('./_cloneArrayBuffer'),
    cloneDataView = require('./_cloneDataView'),
    cloneMap = require('./_cloneMap'),
    cloneRegExp = require('./_cloneRegExp'),
    cloneSet = require('./_cloneSet'),
    cloneSymbol = require('./_cloneSymbol'),
    cloneTypedArray = require('./_cloneTypedArray');

/** `Object#toString` result references. */
var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';

var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';

/**
 * Initializes an object clone based on its `toStringTag`.
 *
 * **Note:** This function only supports cloning values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to clone.
 * @param {string} tag The `toStringTag` of the object to clone.
 * @param {Function} cloneFunc The function to clone values.
 * @param {boolean} [isDeep] Specify a deep clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneByTag(object, tag, cloneFunc, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return cloneArrayBuffer(object);

    case boolTag:
    case dateTag:
      return new Ctor(+object);

    case dataViewTag:
      return cloneDataView(object, isDeep);

    case float32Tag: case float64Tag:
    case int8Tag: case int16Tag: case int32Tag:
    case uint8Tag: case uint8ClampedTag: case uint16Tag: case uint32Tag:
      return cloneTypedArray(object, isDeep);

    case mapTag:
      return cloneMap(object, isDeep, cloneFunc);

    case numberTag:
    case stringTag:
      return new Ctor(object);

    case regexpTag:
      return cloneRegExp(object);

    case setTag:
      return cloneSet(object, isDeep, cloneFunc);

    case symbolTag:
      return cloneSymbol(object);
  }
}

module.exports = initCloneByTag;

},{"./_cloneArrayBuffer":140,"./_cloneDataView":142,"./_cloneMap":143,"./_cloneRegExp":144,"./_cloneSet":145,"./_cloneSymbol":146,"./_cloneTypedArray":147}],184:[function(require,module,exports){
var baseCreate = require('./_baseCreate'),
    getPrototype = require('./_getPrototype'),
    isPrototype = require('./_isPrototype');

/**
 * Initializes an object clone.
 *
 * @private
 * @param {Object} object The object to clone.
 * @returns {Object} Returns the initialized clone.
 */
function initCloneObject(object) {
  return (typeof object.constructor == 'function' && !isPrototype(object))
    ? baseCreate(getPrototype(object))
    : {};
}

module.exports = initCloneObject;

},{"./_baseCreate":97,"./_getPrototype":169,"./_isPrototype":190}],185:[function(require,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

module.exports = isIndex;

},{}],186:[function(require,module,exports){
var eq = require('./eq'),
    isArrayLike = require('./isArrayLike'),
    isIndex = require('./_isIndex'),
    isObject = require('./isObject');

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike(object) && isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq(object[index], value);
  }
  return false;
}

module.exports = isIterateeCall;

},{"./_isIndex":185,"./eq":240,"./isArrayLike":257,"./isObject":266}],187:[function(require,module,exports){
var isArray = require('./isArray'),
    isSymbol = require('./isSymbol');

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

module.exports = isKey;

},{"./isArray":256,"./isSymbol":270}],188:[function(require,module,exports){
/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

module.exports = isKeyable;

},{}],189:[function(require,module,exports){
var coreJsData = require('./_coreJsData');

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

module.exports = isMasked;

},{"./_coreJsData":152}],190:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;

  return value === proto;
}

module.exports = isPrototype;

},{}],191:[function(require,module,exports){
var isObject = require('./isObject');

/**
 * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` if suitable for strict
 *  equality comparisons, else `false`.
 */
function isStrictComparable(value) {
  return value === value && !isObject(value);
}

module.exports = isStrictComparable;

},{"./isObject":266}],192:[function(require,module,exports){
/**
 * Converts `iterator` to an array.
 *
 * @private
 * @param {Object} iterator The iterator to convert.
 * @returns {Array} Returns the converted array.
 */
function iteratorToArray(iterator) {
  var data,
      result = [];

  while (!(data = iterator.next()).done) {
    result.push(data.value);
  }
  return result;
}

module.exports = iteratorToArray;

},{}],193:[function(require,module,exports){
/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

module.exports = listCacheClear;

},{}],194:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

module.exports = listCacheDelete;

},{"./_assocIndexOf":91}],195:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

module.exports = listCacheGet;

},{"./_assocIndexOf":91}],196:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

module.exports = listCacheHas;

},{"./_assocIndexOf":91}],197:[function(require,module,exports){
var assocIndexOf = require('./_assocIndexOf');

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

module.exports = listCacheSet;

},{"./_assocIndexOf":91}],198:[function(require,module,exports){
var Hash = require('./_Hash'),
    ListCache = require('./_ListCache'),
    Map = require('./_Map');

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

module.exports = mapCacheClear;

},{"./_Hash":66,"./_ListCache":67,"./_Map":68}],199:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = mapCacheDelete;

},{"./_getMapData":166}],200:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

module.exports = mapCacheGet;

},{"./_getMapData":166}],201:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

module.exports = mapCacheHas;

},{"./_getMapData":166}],202:[function(require,module,exports){
var getMapData = require('./_getMapData');

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

module.exports = mapCacheSet;

},{"./_getMapData":166}],203:[function(require,module,exports){
/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);

  map.forEach(function(value, key) {
    result[++index] = [key, value];
  });
  return result;
}

module.exports = mapToArray;

},{}],204:[function(require,module,exports){
/**
 * A specialized version of `matchesProperty` for source values suitable
 * for strict equality comparisons, i.e. `===`.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @param {*} srcValue The value to match.
 * @returns {Function} Returns the new spec function.
 */
function matchesStrictComparable(key, srcValue) {
  return function(object) {
    if (object == null) {
      return false;
    }
    return object[key] === srcValue &&
      (srcValue !== undefined || (key in Object(object)));
  };
}

module.exports = matchesStrictComparable;

},{}],205:[function(require,module,exports){
var memoize = require('./memoize');

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped(func) {
  var result = memoize(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });

  var cache = result.cache;
  return result;
}

module.exports = memoizeCapped;

},{"./memoize":276}],206:[function(require,module,exports){
var getNative = require('./_getNative');

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

module.exports = nativeCreate;

},{"./_getNative":168}],207:[function(require,module,exports){
var overArg = require('./_overArg');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

module.exports = nativeKeys;

},{"./_overArg":211}],208:[function(require,module,exports){
/**
 * This function is like
 * [`Object.keys`](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * except that it includes inherited enumerable properties.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}

module.exports = nativeKeysIn;

},{}],209:[function(require,module,exports){
var freeGlobal = require('./_freeGlobal');

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;

},{"./_freeGlobal":163}],210:[function(require,module,exports){
/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;

},{}],211:[function(require,module,exports){
/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

module.exports = overArg;

},{}],212:[function(require,module,exports){
var apply = require('./_apply');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return apply(func, this, otherArgs);
  };
}

module.exports = overRest;

},{"./_apply":79}],213:[function(require,module,exports){
var baseGet = require('./_baseGet'),
    baseSlice = require('./_baseSlice');

/**
 * Gets the parent value at `path` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} path The path to get the parent value of.
 * @returns {*} Returns the parent value.
 */
function parent(object, path) {
  return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
}

module.exports = parent;

},{"./_baseGet":105,"./_baseSlice":130}],214:[function(require,module,exports){
var freeGlobal = require('./_freeGlobal');

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;

},{"./_freeGlobal":163}],215:[function(require,module,exports){
/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

module.exports = setCacheAdd;

},{}],216:[function(require,module,exports){
/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

module.exports = setCacheHas;

},{}],217:[function(require,module,exports){
/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);

  set.forEach(function(value) {
    result[++index] = value;
  });
  return result;
}

module.exports = setToArray;

},{}],218:[function(require,module,exports){
var baseSetToString = require('./_baseSetToString'),
    shortOut = require('./_shortOut');

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = shortOut(baseSetToString);

module.exports = setToString;

},{"./_baseSetToString":129,"./_shortOut":219}],219:[function(require,module,exports){
/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800,
    HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

module.exports = shortOut;

},{}],220:[function(require,module,exports){
var ListCache = require('./_ListCache');

/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */
function stackClear() {
  this.__data__ = new ListCache;
  this.size = 0;
}

module.exports = stackClear;

},{"./_ListCache":67}],221:[function(require,module,exports){
/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);

  this.size = data.size;
  return result;
}

module.exports = stackDelete;

},{}],222:[function(require,module,exports){
/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

module.exports = stackGet;

},{}],223:[function(require,module,exports){
/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

module.exports = stackHas;

},{}],224:[function(require,module,exports){
var ListCache = require('./_ListCache'),
    Map = require('./_Map'),
    MapCache = require('./_MapCache');

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}

module.exports = stackSet;

},{"./_ListCache":67,"./_Map":68,"./_MapCache":69}],225:[function(require,module,exports){
/**
 * A specialized version of `_.indexOf` which performs strict equality
 * comparisons of values, i.e. `===`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function strictIndexOf(array, value, fromIndex) {
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = strictIndexOf;

},{}],226:[function(require,module,exports){
var asciiToArray = require('./_asciiToArray'),
    hasUnicode = require('./_hasUnicode'),
    unicodeToArray = require('./_unicodeToArray');

/**
 * Converts `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function stringToArray(string) {
  return hasUnicode(string)
    ? unicodeToArray(string)
    : asciiToArray(string);
}

module.exports = stringToArray;

},{"./_asciiToArray":89,"./_hasUnicode":176,"./_unicodeToArray":230}],227:[function(require,module,exports){
var memoizeCapped = require('./_memoizeCapped');

/** Used to match property names within property paths. */
var reLeadingDot = /^\./,
    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoizeCapped(function(string) {
  var result = [];
  if (reLeadingDot.test(string)) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

module.exports = stringToPath;

},{"./_memoizeCapped":205}],228:[function(require,module,exports){
var isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

module.exports = toKey;

},{"./isSymbol":270}],229:[function(require,module,exports){
/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

module.exports = toSource;

},{}],230:[function(require,module,exports){
/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff',
    rsComboMarksRange = '\\u0300-\\u036f',
    reComboHalfMarksRange = '\\ufe20-\\ufe2f',
    rsComboSymbolsRange = '\\u20d0-\\u20ff',
    rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange,
    rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsAstral = '[' + rsAstralRange + ']',
    rsCombo = '[' + rsComboRange + ']',
    rsFitz = '\\ud83c[\\udffb-\\udfff]',
    rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')',
    rsNonAstral = '[^' + rsAstralRange + ']',
    rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}',
    rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]',
    rsZWJ = '\\u200d';

/** Used to compose unicode regexes. */
var reOptMod = rsModifier + '?',
    rsOptVar = '[' + rsVarRange + ']?',
    rsOptJoin = '(?:' + rsZWJ + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*',
    rsSeq = rsOptVar + reOptMod + rsOptJoin,
    rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

/**
 * Converts a Unicode `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function unicodeToArray(string) {
  return string.match(reUnicode) || [];
}

module.exports = unicodeToArray;

},{}],231:[function(require,module,exports){
var assignValue = require('./_assignValue'),
    copyObject = require('./_copyObject'),
    createAssigner = require('./_createAssigner'),
    isArrayLike = require('./isArrayLike'),
    isPrototype = require('./_isPrototype'),
    keys = require('./keys');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Assigns own enumerable string keyed properties of source objects to the
 * destination object. Source objects are applied from left to right.
 * Subsequent sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object` and is loosely based on
 * [`Object.assign`](https://mdn.io/Object/assign).
 *
 * @static
 * @memberOf _
 * @since 0.10.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.assignIn
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * function Bar() {
 *   this.c = 3;
 * }
 *
 * Foo.prototype.b = 2;
 * Bar.prototype.d = 4;
 *
 * _.assign({ 'a': 0 }, new Foo, new Bar);
 * // => { 'a': 1, 'c': 3 }
 */
var assign = createAssigner(function(object, source) {
  if (isPrototype(source) || isArrayLike(source)) {
    copyObject(source, keys(source), object);
    return;
  }
  for (var key in source) {
    if (hasOwnProperty.call(source, key)) {
      assignValue(object, key, source[key]);
    }
  }
});

module.exports = assign;

},{"./_assignValue":90,"./_copyObject":149,"./_createAssigner":154,"./_isPrototype":190,"./isArrayLike":257,"./keys":272}],232:[function(require,module,exports){
var copyObject = require('./_copyObject'),
    createAssigner = require('./_createAssigner'),
    keysIn = require('./keysIn');

/**
 * This method is like `_.assign` except that it iterates over own and
 * inherited source properties.
 *
 * **Note:** This method mutates `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @alias extend
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.assign
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * function Bar() {
 *   this.c = 3;
 * }
 *
 * Foo.prototype.b = 2;
 * Bar.prototype.d = 4;
 *
 * _.assignIn({ 'a': 0 }, new Foo, new Bar);
 * // => { 'a': 1, 'b': 2, 'c': 3, 'd': 4 }
 */
var assignIn = createAssigner(function(object, source) {
  copyObject(source, keysIn(source), object);
});

module.exports = assignIn;

},{"./_copyObject":149,"./_createAssigner":154,"./keysIn":273}],233:[function(require,module,exports){
var toString = require('./toString'),
    upperFirst = require('./upperFirst');

/**
 * Converts the first character of `string` to upper case and the remaining
 * to lower case.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to capitalize.
 * @returns {string} Returns the capitalized string.
 * @example
 *
 * _.capitalize('FRED');
 * // => 'Fred'
 */
function capitalize(string) {
  return upperFirst(toString(string).toLowerCase());
}

module.exports = capitalize;

},{"./toString":289,"./upperFirst":291}],234:[function(require,module,exports){
var baseClone = require('./_baseClone');

/** Used to compose bitmasks for cloning. */
var CLONE_SYMBOLS_FLAG = 4;

/**
 * Creates a shallow clone of `value`.
 *
 * **Note:** This method is loosely based on the
 * [structured clone algorithm](https://mdn.io/Structured_clone_algorithm)
 * and supports cloning arrays, array buffers, booleans, date objects, maps,
 * numbers, `Object` objects, regexes, sets, strings, symbols, and typed
 * arrays. The own enumerable properties of `arguments` objects are cloned
 * as plain objects. An empty object is returned for uncloneable values such
 * as error objects, functions, DOM nodes, and WeakMaps.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to clone.
 * @returns {*} Returns the cloned value.
 * @see _.cloneDeep
 * @example
 *
 * var objects = [{ 'a': 1 }, { 'b': 2 }];
 *
 * var shallow = _.clone(objects);
 * console.log(shallow[0] === objects[0]);
 * // => true
 */
function clone(value) {
  return baseClone(value, CLONE_SYMBOLS_FLAG);
}

module.exports = clone;

},{"./_baseClone":96}],235:[function(require,module,exports){
/**
 * Creates an array with all falsey values removed. The values `false`, `null`,
 * `0`, `""`, `undefined`, and `NaN` are falsey.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to compact.
 * @returns {Array} Returns the new array of filtered values.
 * @example
 *
 * _.compact([0, 1, false, 2, '', 3]);
 * // => [1, 2, 3]
 */
function compact(array) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];
    if (value) {
      result[resIndex++] = value;
    }
  }
  return result;
}

module.exports = compact;

},{}],236:[function(require,module,exports){
/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

module.exports = constant;

},{}],237:[function(require,module,exports){
var baseDelay = require('./_baseDelay'),
    baseRest = require('./_baseRest');

/**
 * Defers invoking the `func` until the current call stack has cleared. Any
 * additional arguments are provided to `func` when it's invoked.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to defer.
 * @param {...*} [args] The arguments to invoke `func` with.
 * @returns {number} Returns the timer id.
 * @example
 *
 * _.defer(function(text) {
 *   console.log(text);
 * }, 'deferred');
 * // => Logs 'deferred' after one millisecond.
 */
var defer = baseRest(function(func, args) {
  return baseDelay(func, 1, args);
});

module.exports = defer;

},{"./_baseDelay":98,"./_baseRest":128}],238:[function(require,module,exports){
var baseDelay = require('./_baseDelay'),
    baseRest = require('./_baseRest'),
    toNumber = require('./toNumber');

/**
 * Invokes `func` after `wait` milliseconds. Any additional arguments are
 * provided to `func` when it's invoked.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to delay.
 * @param {number} wait The number of milliseconds to delay invocation.
 * @param {...*} [args] The arguments to invoke `func` with.
 * @returns {number} Returns the timer id.
 * @example
 *
 * _.delay(function(text) {
 *   console.log(text);
 * }, 1000, 'later');
 * // => Logs 'later' after one second.
 */
var delay = baseRest(function(func, wait, args) {
  return baseDelay(func, toNumber(wait) || 0, args);
});

module.exports = delay;

},{"./_baseDelay":98,"./_baseRest":128,"./toNumber":288}],239:[function(require,module,exports){
module.exports = require('./forEach');

},{"./forEach":248}],240:[function(require,module,exports){
/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

module.exports = eq;

},{}],241:[function(require,module,exports){
var arrayEvery = require('./_arrayEvery'),
    baseEvery = require('./_baseEvery'),
    baseIteratee = require('./_baseIteratee'),
    isArray = require('./isArray'),
    isIterateeCall = require('./_isIterateeCall');

/**
 * Checks if `predicate` returns truthy for **all** elements of `collection`.
 * Iteration is stopped once `predicate` returns falsey. The predicate is
 * invoked with three arguments: (value, index|key, collection).
 *
 * **Note:** This method returns `true` for
 * [empty collections](https://en.wikipedia.org/wiki/Empty_set) because
 * [everything is true](https://en.wikipedia.org/wiki/Vacuous_truth) of
 * elements of empty collections.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {boolean} Returns `true` if all elements pass the predicate check,
 *  else `false`.
 * @example
 *
 * _.every([true, 1, null, 'yes'], Boolean);
 * // => false
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': false },
 *   { 'user': 'fred',   'age': 40, 'active': false }
 * ];
 *
 * // The `_.matches` iteratee shorthand.
 * _.every(users, { 'user': 'barney', 'active': false });
 * // => false
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.every(users, ['active', false]);
 * // => true
 *
 * // The `_.property` iteratee shorthand.
 * _.every(users, 'active');
 * // => false
 */
function every(collection, predicate, guard) {
  var func = isArray(collection) ? arrayEvery : baseEvery;
  if (guard && isIterateeCall(collection, predicate, guard)) {
    predicate = undefined;
  }
  return func(collection, baseIteratee(predicate, 3));
}

module.exports = every;

},{"./_arrayEvery":82,"./_baseEvery":100,"./_baseIteratee":119,"./_isIterateeCall":186,"./isArray":256}],242:[function(require,module,exports){
module.exports = require('./assignIn');

},{"./assignIn":232}],243:[function(require,module,exports){
var arrayFilter = require('./_arrayFilter'),
    baseFilter = require('./_baseFilter'),
    baseIteratee = require('./_baseIteratee'),
    isArray = require('./isArray');

/**
 * Iterates over elements of `collection`, returning an array of all elements
 * `predicate` returns truthy for. The predicate is invoked with three
 * arguments: (value, index|key, collection).
 *
 * **Note:** Unlike `_.remove`, this method returns a new array.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 * @see _.reject
 * @example
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': true },
 *   { 'user': 'fred',   'age': 40, 'active': false }
 * ];
 *
 * _.filter(users, function(o) { return !o.active; });
 * // => objects for ['fred']
 *
 * // The `_.matches` iteratee shorthand.
 * _.filter(users, { 'age': 36, 'active': true });
 * // => objects for ['barney']
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.filter(users, ['active', false]);
 * // => objects for ['fred']
 *
 * // The `_.property` iteratee shorthand.
 * _.filter(users, 'active');
 * // => objects for ['barney']
 */
function filter(collection, predicate) {
  var func = isArray(collection) ? arrayFilter : baseFilter;
  return func(collection, baseIteratee(predicate, 3));
}

module.exports = filter;

},{"./_arrayFilter":83,"./_baseFilter":101,"./_baseIteratee":119,"./isArray":256}],244:[function(require,module,exports){
var createFind = require('./_createFind'),
    findIndex = require('./findIndex');

/**
 * Iterates over elements of `collection`, returning the first element
 * `predicate` returns truthy for. The predicate is invoked with three
 * arguments: (value, index|key, collection).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'age': 36, 'active': true },
 *   { 'user': 'fred',    'age': 40, 'active': false },
 *   { 'user': 'pebbles', 'age': 1,  'active': true }
 * ];
 *
 * _.find(users, function(o) { return o.age < 40; });
 * // => object for 'barney'
 *
 * // The `_.matches` iteratee shorthand.
 * _.find(users, { 'age': 1, 'active': true });
 * // => object for 'pebbles'
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.find(users, ['active', false]);
 * // => object for 'fred'
 *
 * // The `_.property` iteratee shorthand.
 * _.find(users, 'active');
 * // => object for 'barney'
 */
var find = createFind(findIndex);

module.exports = find;

},{"./_createFind":158,"./findIndex":245}],245:[function(require,module,exports){
var baseFindIndex = require('./_baseFindIndex'),
    baseIteratee = require('./_baseIteratee'),
    toInteger = require('./toInteger');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * This method is like `_.find` except that it returns the index of the first
 * element `predicate` returns truthy for instead of the element itself.
 *
 * @static
 * @memberOf _
 * @since 1.1.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {number} Returns the index of the found element, else `-1`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'active': false },
 *   { 'user': 'fred',    'active': false },
 *   { 'user': 'pebbles', 'active': true }
 * ];
 *
 * _.findIndex(users, function(o) { return o.user == 'barney'; });
 * // => 0
 *
 * // The `_.matches` iteratee shorthand.
 * _.findIndex(users, { 'user': 'fred', 'active': false });
 * // => 1
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.findIndex(users, ['active', false]);
 * // => 0
 *
 * // The `_.property` iteratee shorthand.
 * _.findIndex(users, 'active');
 * // => 2
 */
function findIndex(array, predicate, fromIndex) {
  var length = array == null ? 0 : array.length;
  if (!length) {
    return -1;
  }
  var index = fromIndex == null ? 0 : toInteger(fromIndex);
  if (index < 0) {
    index = nativeMax(length + index, 0);
  }
  return baseFindIndex(array, baseIteratee(predicate, 3), index);
}

module.exports = findIndex;

},{"./_baseFindIndex":102,"./_baseIteratee":119,"./toInteger":287}],246:[function(require,module,exports){
var createFind = require('./_createFind'),
    findLastIndex = require('./findLastIndex');

/**
 * This method is like `_.find` except that it iterates over elements of
 * `collection` from right to left.
 *
 * @static
 * @memberOf _
 * @since 2.0.0
 * @category Collection
 * @param {Array|Object} collection The collection to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=collection.length-1] The index to search from.
 * @returns {*} Returns the matched element, else `undefined`.
 * @example
 *
 * _.findLast([1, 2, 3, 4], function(n) {
 *   return n % 2 == 1;
 * });
 * // => 3
 */
var findLast = createFind(findLastIndex);

module.exports = findLast;

},{"./_createFind":158,"./findLastIndex":247}],247:[function(require,module,exports){
var baseFindIndex = require('./_baseFindIndex'),
    baseIteratee = require('./_baseIteratee'),
    toInteger = require('./toInteger');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max,
    nativeMin = Math.min;

/**
 * This method is like `_.findIndex` except that it iterates over elements
 * of `collection` from right to left.
 *
 * @static
 * @memberOf _
 * @since 2.0.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param {number} [fromIndex=array.length-1] The index to search from.
 * @returns {number} Returns the index of the found element, else `-1`.
 * @example
 *
 * var users = [
 *   { 'user': 'barney',  'active': true },
 *   { 'user': 'fred',    'active': false },
 *   { 'user': 'pebbles', 'active': false }
 * ];
 *
 * _.findLastIndex(users, function(o) { return o.user == 'pebbles'; });
 * // => 2
 *
 * // The `_.matches` iteratee shorthand.
 * _.findLastIndex(users, { 'user': 'barney', 'active': true });
 * // => 0
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.findLastIndex(users, ['active', false]);
 * // => 2
 *
 * // The `_.property` iteratee shorthand.
 * _.findLastIndex(users, 'active');
 * // => 0
 */
function findLastIndex(array, predicate, fromIndex) {
  var length = array == null ? 0 : array.length;
  if (!length) {
    return -1;
  }
  var index = length - 1;
  if (fromIndex !== undefined) {
    index = toInteger(fromIndex);
    index = fromIndex < 0
      ? nativeMax(length + index, 0)
      : nativeMin(index, length - 1);
  }
  return baseFindIndex(array, baseIteratee(predicate, 3), index, true);
}

module.exports = findLastIndex;

},{"./_baseFindIndex":102,"./_baseIteratee":119,"./toInteger":287}],248:[function(require,module,exports){
var arrayEach = require('./_arrayEach'),
    baseEach = require('./_baseEach'),
    castFunction = require('./_castFunction'),
    isArray = require('./isArray');

/**
 * Iterates over elements of `collection` and invokes `iteratee` for each element.
 * The iteratee is invoked with three arguments: (value, index|key, collection).
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * **Note:** As with other "Collections" methods, objects with a "length"
 * property are iterated like arrays. To avoid this behavior use `_.forIn`
 * or `_.forOwn` for object iteration.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @alias each
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array|Object} Returns `collection`.
 * @see _.forEachRight
 * @example
 *
 * _.forEach([1, 2], function(value) {
 *   console.log(value);
 * });
 * // => Logs `1` then `2`.
 *
 * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
 *   console.log(key);
 * });
 * // => Logs 'a' then 'b' (iteration order is not guaranteed).
 */
function forEach(collection, iteratee) {
  var func = isArray(collection) ? arrayEach : baseEach;
  return func(collection, castFunction(iteratee));
}

module.exports = forEach;

},{"./_arrayEach":81,"./_baseEach":99,"./_castFunction":137,"./isArray":256}],249:[function(require,module,exports){
var baseGet = require('./_baseGet');

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

module.exports = get;

},{"./_baseGet":105}],250:[function(require,module,exports){
var baseAssignValue = require('./_baseAssignValue'),
    createAggregator = require('./_createAggregator');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Creates an object composed of keys generated from the results of running
 * each element of `collection` thru `iteratee`. The order of grouped values
 * is determined by the order they occur in `collection`. The corresponding
 * value of each key is an array of elements responsible for generating the
 * key. The iteratee is invoked with one argument: (value).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The iteratee to transform keys.
 * @returns {Object} Returns the composed aggregate object.
 * @example
 *
 * _.groupBy([6.1, 4.2, 6.3], Math.floor);
 * // => { '4': [4.2], '6': [6.1, 6.3] }
 *
 * // The `_.property` iteratee shorthand.
 * _.groupBy(['one', 'two', 'three'], 'length');
 * // => { '3': ['one', 'two'], '5': ['three'] }
 */
var groupBy = createAggregator(function(result, value, key) {
  if (hasOwnProperty.call(result, key)) {
    result[key].push(value);
  } else {
    baseAssignValue(result, key, [value]);
  }
});

module.exports = groupBy;

},{"./_baseAssignValue":95,"./_createAggregator":153}],251:[function(require,module,exports){
var baseHasIn = require('./_baseHasIn'),
    hasPath = require('./_hasPath');

/**
 * Checks if `path` is a direct or inherited property of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path to check.
 * @returns {boolean} Returns `true` if `path` exists, else `false`.
 * @example
 *
 * var object = _.create({ 'a': _.create({ 'b': 2 }) });
 *
 * _.hasIn(object, 'a');
 * // => true
 *
 * _.hasIn(object, 'a.b');
 * // => true
 *
 * _.hasIn(object, ['a', 'b']);
 * // => true
 *
 * _.hasIn(object, 'b');
 * // => false
 */
function hasIn(object, path) {
  return object != null && hasPath(object, path, baseHasIn);
}

module.exports = hasIn;

},{"./_baseHasIn":108,"./_hasPath":175}],252:[function(require,module,exports){
/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

module.exports = identity;

},{}],253:[function(require,module,exports){
var baseIndexOf = require('./_baseIndexOf'),
    isArrayLike = require('./isArrayLike'),
    isString = require('./isString'),
    toInteger = require('./toInteger'),
    values = require('./values');

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/**
 * Checks if `value` is in `collection`. If `collection` is a string, it's
 * checked for a substring of `value`, otherwise
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * is used for equality comparisons. If `fromIndex` is negative, it's used as
 * the offset from the end of `collection`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object|string} collection The collection to inspect.
 * @param {*} value The value to search for.
 * @param {number} [fromIndex=0] The index to search from.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
 * @returns {boolean} Returns `true` if `value` is found, else `false`.
 * @example
 *
 * _.includes([1, 2, 3], 1);
 * // => true
 *
 * _.includes([1, 2, 3], 1, 2);
 * // => false
 *
 * _.includes({ 'a': 1, 'b': 2 }, 1);
 * // => true
 *
 * _.includes('abcd', 'bc');
 * // => true
 */
function includes(collection, value, fromIndex, guard) {
  collection = isArrayLike(collection) ? collection : values(collection);
  fromIndex = (fromIndex && !guard) ? toInteger(fromIndex) : 0;

  var length = collection.length;
  if (fromIndex < 0) {
    fromIndex = nativeMax(length + fromIndex, 0);
  }
  return isString(collection)
    ? (fromIndex <= length && collection.indexOf(value, fromIndex) > -1)
    : (!!length && baseIndexOf(collection, value, fromIndex) > -1);
}

module.exports = includes;

},{"./_baseIndexOf":109,"./isArrayLike":257,"./isString":269,"./toInteger":287,"./values":292}],254:[function(require,module,exports){
var baseInvoke = require('./_baseInvoke'),
    baseRest = require('./_baseRest');

/**
 * Invokes the method at `path` of `object`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the method to invoke.
 * @param {...*} [args] The arguments to invoke the method with.
 * @returns {*} Returns the result of the invoked method.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': [1, 2, 3, 4] } }] };
 *
 * _.invoke(object, 'a[0].b.c.slice', 1, 3);
 * // => [2, 3]
 */
var invoke = baseRest(baseInvoke);

module.exports = invoke;

},{"./_baseInvoke":110,"./_baseRest":128}],255:[function(require,module,exports){
var baseIsArguments = require('./_baseIsArguments'),
    isObjectLike = require('./isObjectLike');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

module.exports = isArguments;

},{"./_baseIsArguments":111,"./isObjectLike":267}],256:[function(require,module,exports){
/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

module.exports = isArray;

},{}],257:[function(require,module,exports){
var isFunction = require('./isFunction'),
    isLength = require('./isLength');

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

module.exports = isArrayLike;

},{"./isFunction":263,"./isLength":264}],258:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var boolTag = '[object Boolean]';

/**
 * Checks if `value` is classified as a boolean primitive or object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a boolean, else `false`.
 * @example
 *
 * _.isBoolean(false);
 * // => true
 *
 * _.isBoolean(null);
 * // => false
 */
function isBoolean(value) {
  return value === true || value === false ||
    (isObjectLike(value) && baseGetTag(value) == boolTag);
}

module.exports = isBoolean;

},{"./_baseGetTag":107,"./isObjectLike":267}],259:[function(require,module,exports){
var root = require('./_root'),
    stubFalse = require('./stubFalse');

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

module.exports = isBuffer;

},{"./_root":214,"./stubFalse":283}],260:[function(require,module,exports){
var baseKeys = require('./_baseKeys'),
    getTag = require('./_getTag'),
    isArguments = require('./isArguments'),
    isArray = require('./isArray'),
    isArrayLike = require('./isArrayLike'),
    isBuffer = require('./isBuffer'),
    isPrototype = require('./_isPrototype'),
    isTypedArray = require('./isTypedArray');

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    setTag = '[object Set]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if `value` is an empty object, collection, map, or set.
 *
 * Objects are considered empty if they have no own enumerable string keyed
 * properties.
 *
 * Array-like values such as `arguments` objects, arrays, buffers, strings, or
 * jQuery-like collections are considered empty if they have a `length` of `0`.
 * Similarly, maps and sets are considered empty if they have a `size` of `0`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * _.isEmpty(null);
 * // => true
 *
 * _.isEmpty(true);
 * // => true
 *
 * _.isEmpty(1);
 * // => true
 *
 * _.isEmpty([1, 2, 3]);
 * // => false
 *
 * _.isEmpty({ 'a': 1 });
 * // => false
 */
function isEmpty(value) {
  if (value == null) {
    return true;
  }
  if (isArrayLike(value) &&
      (isArray(value) || typeof value == 'string' || typeof value.splice == 'function' ||
        isBuffer(value) || isTypedArray(value) || isArguments(value))) {
    return !value.length;
  }
  var tag = getTag(value);
  if (tag == mapTag || tag == setTag) {
    return !value.size;
  }
  if (isPrototype(value)) {
    return !baseKeys(value).length;
  }
  for (var key in value) {
    if (hasOwnProperty.call(value, key)) {
      return false;
    }
  }
  return true;
}

module.exports = isEmpty;

},{"./_baseKeys":120,"./_getTag":173,"./_isPrototype":190,"./isArguments":255,"./isArray":256,"./isArrayLike":257,"./isBuffer":259,"./isTypedArray":271}],261:[function(require,module,exports){
var baseIsEqual = require('./_baseIsEqual');

/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent.
 *
 * **Note:** This method supports comparing arrays, array buffers, booleans,
 * date objects, error objects, maps, numbers, `Object` objects, regexes,
 * sets, strings, symbols, and typed arrays. `Object` objects are compared
 * by their own, not inherited, enumerable properties. Functions and DOM
 * nodes are compared by strict equality, i.e. `===`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.isEqual(object, other);
 * // => true
 *
 * object === other;
 * // => false
 */
function isEqual(value, other) {
  return baseIsEqual(value, other);
}

module.exports = isEqual;

},{"./_baseIsEqual":112}],262:[function(require,module,exports){
var baseIsEqual = require('./_baseIsEqual');

/**
 * This method is like `_.isEqual` except that it accepts `customizer` which
 * is invoked to compare values. If `customizer` returns `undefined`, comparisons
 * are handled by the method instead. The `customizer` is invoked with up to
 * six arguments: (objValue, othValue [, index|key, object, other, stack]).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {Function} [customizer] The function to customize comparisons.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * function isGreeting(value) {
 *   return /^h(?:i|ello)$/.test(value);
 * }
 *
 * function customizer(objValue, othValue) {
 *   if (isGreeting(objValue) && isGreeting(othValue)) {
 *     return true;
 *   }
 * }
 *
 * var array = ['hello', 'goodbye'];
 * var other = ['hi', 'goodbye'];
 *
 * _.isEqualWith(array, other, customizer);
 * // => true
 */
function isEqualWith(value, other, customizer) {
  customizer = typeof customizer == 'function' ? customizer : undefined;
  var result = customizer ? customizer(value, other) : undefined;
  return result === undefined ? baseIsEqual(value, other, undefined, customizer) : !!result;
}

module.exports = isEqualWith;

},{"./_baseIsEqual":112}],263:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObject = require('./isObject');

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

module.exports = isFunction;

},{"./_baseGetTag":107,"./isObject":266}],264:[function(require,module,exports){
/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

},{}],265:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var numberTag = '[object Number]';

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are
 * classified as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a number, else `false`.
 * @example
 *
 * _.isNumber(3);
 * // => true
 *
 * _.isNumber(Number.MIN_VALUE);
 * // => true
 *
 * _.isNumber(Infinity);
 * // => true
 *
 * _.isNumber('3');
 * // => false
 */
function isNumber(value) {
  return typeof value == 'number' ||
    (isObjectLike(value) && baseGetTag(value) == numberTag);
}

module.exports = isNumber;

},{"./_baseGetTag":107,"./isObjectLike":267}],266:[function(require,module,exports){
/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],267:[function(require,module,exports){
/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

module.exports = isObjectLike;

},{}],268:[function(require,module,exports){
var baseIsRegExp = require('./_baseIsRegExp'),
    baseUnary = require('./_baseUnary'),
    nodeUtil = require('./_nodeUtil');

/* Node.js helper references. */
var nodeIsRegExp = nodeUtil && nodeUtil.isRegExp;

/**
 * Checks if `value` is classified as a `RegExp` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a regexp, else `false`.
 * @example
 *
 * _.isRegExp(/abc/);
 * // => true
 *
 * _.isRegExp('/abc/');
 * // => false
 */
var isRegExp = nodeIsRegExp ? baseUnary(nodeIsRegExp) : baseIsRegExp;

module.exports = isRegExp;

},{"./_baseIsRegExp":117,"./_baseUnary":134,"./_nodeUtil":209}],269:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isArray = require('./isArray'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var stringTag = '[object String]';

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString(value) {
  return typeof value == 'string' ||
    (!isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag);
}

module.exports = isString;

},{"./_baseGetTag":107,"./isArray":256,"./isObjectLike":267}],270:[function(require,module,exports){
var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

module.exports = isSymbol;

},{"./_baseGetTag":107,"./isObjectLike":267}],271:[function(require,module,exports){
var baseIsTypedArray = require('./_baseIsTypedArray'),
    baseUnary = require('./_baseUnary'),
    nodeUtil = require('./_nodeUtil');

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

module.exports = isTypedArray;

},{"./_baseIsTypedArray":118,"./_baseUnary":134,"./_nodeUtil":209}],272:[function(require,module,exports){
var arrayLikeKeys = require('./_arrayLikeKeys'),
    baseKeys = require('./_baseKeys'),
    isArrayLike = require('./isArrayLike');

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

module.exports = keys;

},{"./_arrayLikeKeys":84,"./_baseKeys":120,"./isArrayLike":257}],273:[function(require,module,exports){
var arrayLikeKeys = require('./_arrayLikeKeys'),
    baseKeysIn = require('./_baseKeysIn'),
    isArrayLike = require('./isArrayLike');

/**
 * Creates an array of the own and inherited enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keysIn(new Foo);
 * // => ['a', 'b', 'c'] (iteration order is not guaranteed)
 */
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

module.exports = keysIn;

},{"./_arrayLikeKeys":84,"./_baseKeysIn":121,"./isArrayLike":257}],274:[function(require,module,exports){
/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array == null ? 0 : array.length;
  return length ? array[length - 1] : undefined;
}

module.exports = last;

},{}],275:[function(require,module,exports){
var arrayMap = require('./_arrayMap'),
    baseIteratee = require('./_baseIteratee'),
    baseMap = require('./_baseMap'),
    isArray = require('./isArray');

/**
 * Creates an array of values by running each element in `collection` thru
 * `iteratee`. The iteratee is invoked with three arguments:
 * (value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.every`, `_.filter`, `_.map`, `_.mapValues`, `_.reject`, and `_.some`.
 *
 * The guarded methods are:
 * `ary`, `chunk`, `curry`, `curryRight`, `drop`, `dropRight`, `every`,
 * `fill`, `invert`, `parseInt`, `random`, `range`, `rangeRight`, `repeat`,
 * `sampleSize`, `slice`, `some`, `sortBy`, `split`, `take`, `takeRight`,
 * `template`, `trim`, `trimEnd`, `trimStart`, and `words`
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 * @example
 *
 * function square(n) {
 *   return n * n;
 * }
 *
 * _.map([4, 8], square);
 * // => [16, 64]
 *
 * _.map({ 'a': 4, 'b': 8 }, square);
 * // => [16, 64] (iteration order is not guaranteed)
 *
 * var users = [
 *   { 'user': 'barney' },
 *   { 'user': 'fred' }
 * ];
 *
 * // The `_.property` iteratee shorthand.
 * _.map(users, 'user');
 * // => ['barney', 'fred']
 */
function map(collection, iteratee) {
  var func = isArray(collection) ? arrayMap : baseMap;
  return func(collection, baseIteratee(iteratee, 3));
}

module.exports = map;

},{"./_arrayMap":85,"./_baseIteratee":119,"./_baseMap":122,"./isArray":256}],276:[function(require,module,exports){
var MapCache = require('./_MapCache');

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Expose `MapCache`.
memoize.Cache = MapCache;

module.exports = memoize;

},{"./_MapCache":69}],277:[function(require,module,exports){
/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that negates the result of the predicate `func`. The
 * `func` predicate is invoked with the `this` binding and arguments of the
 * created function.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Function
 * @param {Function} predicate The predicate to negate.
 * @returns {Function} Returns the new negated function.
 * @example
 *
 * function isEven(n) {
 *   return n % 2 == 0;
 * }
 *
 * _.filter([1, 2, 3, 4, 5, 6], _.negate(isEven));
 * // => [1, 3, 5]
 */
function negate(predicate) {
  if (typeof predicate != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  return function() {
    var args = arguments;
    switch (args.length) {
      case 0: return !predicate.call(this);
      case 1: return !predicate.call(this, args[0]);
      case 2: return !predicate.call(this, args[0], args[1]);
      case 3: return !predicate.call(this, args[0], args[1], args[2]);
    }
    return !predicate.apply(this, args);
  };
}

module.exports = negate;

},{}],278:[function(require,module,exports){
var baseProperty = require('./_baseProperty'),
    basePropertyDeep = require('./_basePropertyDeep'),
    isKey = require('./_isKey'),
    toKey = require('./_toKey');

/**
 * Creates a function that returns the value at `path` of a given object.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {Array|string} path The path of the property to get.
 * @returns {Function} Returns the new accessor function.
 * @example
 *
 * var objects = [
 *   { 'a': { 'b': 2 } },
 *   { 'a': { 'b': 1 } }
 * ];
 *
 * _.map(objects, _.property('a.b'));
 * // => [2, 1]
 *
 * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
 * // => [1, 2]
 */
function property(path) {
  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

module.exports = property;

},{"./_baseProperty":125,"./_basePropertyDeep":126,"./_isKey":187,"./_toKey":228}],279:[function(require,module,exports){
var arrayReduce = require('./_arrayReduce'),
    baseEach = require('./_baseEach'),
    baseIteratee = require('./_baseIteratee'),
    baseReduce = require('./_baseReduce'),
    isArray = require('./isArray');

/**
 * Reduces `collection` to a value which is the accumulated result of running
 * each element in `collection` thru `iteratee`, where each successive
 * invocation is supplied the return value of the previous. If `accumulator`
 * is not given, the first element of `collection` is used as the initial
 * value. The iteratee is invoked with four arguments:
 * (accumulator, value, index|key, collection).
 *
 * Many lodash methods are guarded to work as iteratees for methods like
 * `_.reduce`, `_.reduceRight`, and `_.transform`.
 *
 * The guarded methods are:
 * `assign`, `defaults`, `defaultsDeep`, `includes`, `merge`, `orderBy`,
 * and `sortBy`
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [accumulator] The initial value.
 * @returns {*} Returns the accumulated value.
 * @see _.reduceRight
 * @example
 *
 * _.reduce([1, 2], function(sum, n) {
 *   return sum + n;
 * }, 0);
 * // => 3
 *
 * _.reduce({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
 *   (result[value] || (result[value] = [])).push(key);
 *   return result;
 * }, {});
 * // => { '1': ['a', 'c'], '2': ['b'] } (iteration order is not guaranteed)
 */
function reduce(collection, iteratee, accumulator) {
  var func = isArray(collection) ? arrayReduce : baseReduce,
      initAccum = arguments.length < 3;

  return func(collection, baseIteratee(iteratee, 4), accumulator, initAccum, baseEach);
}

module.exports = reduce;

},{"./_arrayReduce":87,"./_baseEach":99,"./_baseIteratee":119,"./_baseReduce":127,"./isArray":256}],280:[function(require,module,exports){
var arrayFilter = require('./_arrayFilter'),
    baseFilter = require('./_baseFilter'),
    baseIteratee = require('./_baseIteratee'),
    isArray = require('./isArray'),
    negate = require('./negate');

/**
 * The opposite of `_.filter`; this method returns the elements of `collection`
 * that `predicate` does **not** return truthy for.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 * @see _.filter
 * @example
 *
 * var users = [
 *   { 'user': 'barney', 'age': 36, 'active': false },
 *   { 'user': 'fred',   'age': 40, 'active': true }
 * ];
 *
 * _.reject(users, function(o) { return !o.active; });
 * // => objects for ['fred']
 *
 * // The `_.matches` iteratee shorthand.
 * _.reject(users, { 'age': 40, 'active': true });
 * // => objects for ['barney']
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.reject(users, ['active', false]);
 * // => objects for ['fred']
 *
 * // The `_.property` iteratee shorthand.
 * _.reject(users, 'active');
 * // => objects for ['barney']
 */
function reject(collection, predicate) {
  var func = isArray(collection) ? arrayFilter : baseFilter;
  return func(collection, negate(baseIteratee(predicate, 3)));
}

module.exports = reject;

},{"./_arrayFilter":83,"./_baseFilter":101,"./_baseIteratee":119,"./isArray":256,"./negate":277}],281:[function(require,module,exports){
var arraySome = require('./_arraySome'),
    baseIteratee = require('./_baseIteratee'),
    baseSome = require('./_baseSome'),
    isArray = require('./isArray'),
    isIterateeCall = require('./_isIterateeCall');

/**
 * Checks if `predicate` returns truthy for **any** element of `collection`.
 * Iteration is stopped once `predicate` returns truthy. The predicate is
 * invoked with three arguments: (value, index|key, collection).
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object} collection The collection to iterate over.
 * @param {Function} [predicate=_.identity] The function invoked per iteration.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 * @example
 *
 * _.some([null, 0, 'yes', false], Boolean);
 * // => true
 *
 * var users = [
 *   { 'user': 'barney', 'active': true },
 *   { 'user': 'fred',   'active': false }
 * ];
 *
 * // The `_.matches` iteratee shorthand.
 * _.some(users, { 'user': 'barney', 'active': false });
 * // => false
 *
 * // The `_.matchesProperty` iteratee shorthand.
 * _.some(users, ['active', false]);
 * // => true
 *
 * // The `_.property` iteratee shorthand.
 * _.some(users, 'active');
 * // => true
 */
function some(collection, predicate, guard) {
  var func = isArray(collection) ? arraySome : baseSome;
  if (guard && isIterateeCall(collection, predicate, guard)) {
    predicate = undefined;
  }
  return func(collection, baseIteratee(predicate, 3));
}

module.exports = some;

},{"./_arraySome":88,"./_baseIteratee":119,"./_baseSome":131,"./_isIterateeCall":186,"./isArray":256}],282:[function(require,module,exports){
/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

module.exports = stubArray;

},{}],283:[function(require,module,exports){
/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = stubFalse;

},{}],284:[function(require,module,exports){
/**
 * This method invokes `interceptor` and returns `value`. The interceptor
 * is invoked with one argument; (value). The purpose of this method is to
 * "tap into" a method chain sequence in order to modify intermediate results.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Seq
 * @param {*} value The value to provide to `interceptor`.
 * @param {Function} interceptor The function to invoke.
 * @returns {*} Returns `value`.
 * @example
 *
 * _([1, 2, 3])
 *  .tap(function(array) {
 *    // Mutate input array.
 *    array.pop();
 *  })
 *  .reverse()
 *  .value();
 * // => [2, 1]
 */
function tap(value, interceptor) {
  interceptor(value);
  return value;
}

module.exports = tap;

},{}],285:[function(require,module,exports){
var Symbol = require('./_Symbol'),
    copyArray = require('./_copyArray'),
    getTag = require('./_getTag'),
    isArrayLike = require('./isArrayLike'),
    isString = require('./isString'),
    iteratorToArray = require('./_iteratorToArray'),
    mapToArray = require('./_mapToArray'),
    setToArray = require('./_setToArray'),
    stringToArray = require('./_stringToArray'),
    values = require('./values');

/** `Object#toString` result references. */
var mapTag = '[object Map]',
    setTag = '[object Set]';

/** Built-in value references. */
var symIterator = Symbol ? Symbol.iterator : undefined;

/**
 * Converts `value` to an array.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {Array} Returns the converted array.
 * @example
 *
 * _.toArray({ 'a': 1, 'b': 2 });
 * // => [1, 2]
 *
 * _.toArray('abc');
 * // => ['a', 'b', 'c']
 *
 * _.toArray(1);
 * // => []
 *
 * _.toArray(null);
 * // => []
 */
function toArray(value) {
  if (!value) {
    return [];
  }
  if (isArrayLike(value)) {
    return isString(value) ? stringToArray(value) : copyArray(value);
  }
  if (symIterator && value[symIterator]) {
    return iteratorToArray(value[symIterator]());
  }
  var tag = getTag(value),
      func = tag == mapTag ? mapToArray : (tag == setTag ? setToArray : values);

  return func(value);
}

module.exports = toArray;

},{"./_Symbol":74,"./_copyArray":148,"./_getTag":173,"./_iteratorToArray":192,"./_mapToArray":203,"./_setToArray":217,"./_stringToArray":226,"./isArrayLike":257,"./isString":269,"./values":292}],286:[function(require,module,exports){
var toNumber = require('./toNumber');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_INTEGER = 1.7976931348623157e+308;

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber(value);
  if (value === INFINITY || value === -INFINITY) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}

module.exports = toFinite;

},{"./toNumber":288}],287:[function(require,module,exports){
var toFinite = require('./toFinite');

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger(value) {
  var result = toFinite(value),
      remainder = result % 1;

  return result === result ? (remainder ? result - remainder : result) : 0;
}

module.exports = toInteger;

},{"./toFinite":286}],288:[function(require,module,exports){
var isObject = require('./isObject'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

module.exports = toNumber;

},{"./isObject":266,"./isSymbol":270}],289:[function(require,module,exports){
var baseToString = require('./_baseToString');

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

module.exports = toString;

},{"./_baseToString":133}],290:[function(require,module,exports){
var arrayEach = require('./_arrayEach'),
    baseCreate = require('./_baseCreate'),
    baseForOwn = require('./_baseForOwn'),
    baseIteratee = require('./_baseIteratee'),
    getPrototype = require('./_getPrototype'),
    isArray = require('./isArray'),
    isBuffer = require('./isBuffer'),
    isFunction = require('./isFunction'),
    isObject = require('./isObject'),
    isTypedArray = require('./isTypedArray');

/**
 * An alternative to `_.reduce`; this method transforms `object` to a new
 * `accumulator` object which is the result of running each of its own
 * enumerable string keyed properties thru `iteratee`, with each invocation
 * potentially mutating the `accumulator` object. If `accumulator` is not
 * provided, a new object with the same `[[Prototype]]` will be used. The
 * iteratee is invoked with four arguments: (accumulator, value, key, object).
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @static
 * @memberOf _
 * @since 1.3.0
 * @category Object
 * @param {Object} object The object to iterate over.
 * @param {Function} [iteratee=_.identity] The function invoked per iteration.
 * @param {*} [accumulator] The custom accumulator value.
 * @returns {*} Returns the accumulated value.
 * @example
 *
 * _.transform([2, 3, 4], function(result, n) {
 *   result.push(n *= n);
 *   return n % 2 == 0;
 * }, []);
 * // => [4, 9]
 *
 * _.transform({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
 *   (result[value] || (result[value] = [])).push(key);
 * }, {});
 * // => { '1': ['a', 'c'], '2': ['b'] }
 */
function transform(object, iteratee, accumulator) {
  var isArr = isArray(object),
      isArrLike = isArr || isBuffer(object) || isTypedArray(object);

  iteratee = baseIteratee(iteratee, 4);
  if (accumulator == null) {
    var Ctor = object && object.constructor;
    if (isArrLike) {
      accumulator = isArr ? new Ctor : [];
    }
    else if (isObject(object)) {
      accumulator = isFunction(Ctor) ? baseCreate(getPrototype(object)) : {};
    }
    else {
      accumulator = {};
    }
  }
  (isArrLike ? arrayEach : baseForOwn)(object, function(value, index, object) {
    return iteratee(accumulator, value, index, object);
  });
  return accumulator;
}

module.exports = transform;

},{"./_arrayEach":81,"./_baseCreate":97,"./_baseForOwn":104,"./_baseIteratee":119,"./_getPrototype":169,"./isArray":256,"./isBuffer":259,"./isFunction":263,"./isObject":266,"./isTypedArray":271}],291:[function(require,module,exports){
var createCaseFirst = require('./_createCaseFirst');

/**
 * Converts the first character of `string` to upper case.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category String
 * @param {string} [string=''] The string to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.upperFirst('fred');
 * // => 'Fred'
 *
 * _.upperFirst('FRED');
 * // => 'FRED'
 */
var upperFirst = createCaseFirst('toUpperCase');

module.exports = upperFirst;

},{"./_createCaseFirst":157}],292:[function(require,module,exports){
var baseValues = require('./_baseValues'),
    keys = require('./keys');

/**
 * Creates an array of the own enumerable string keyed property values of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property values.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.values(new Foo);
 * // => [1, 2] (iteration order is not guaranteed)
 *
 * _.values('hi');
 * // => ['h', 'i']
 */
function values(object) {
  return object == null ? [] : baseValues(object, keys(object));
}

module.exports = values;

},{"./_baseValues":135,"./keys":272}],293:[function(require,module,exports){
// Generated by CoffeeScript 1.7.1
var Context, Mocha, MochaGivenSuite, Suite, Test, Waterfall, comparisonLookup, declareSpec, finalStatementFrom, getErrorDetails, invariantList, o, stringifyExpectation, utils, wasComparison, whenList,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

Mocha = (typeof module !== "undefined" && module !== null ? module.parent : void 0) != null ? module.parent.require('mocha') : window.Mocha;

Suite = Mocha.Suite;

Test = Mocha.Test;

utils = Mocha.utils;

Context = Mocha.Context;

Waterfall = (function() {
  function Waterfall(context, functions, finalCallback) {
    var func, _i, _len, _ref;
    this.context = context;
    if (functions == null) {
      functions = [];
    }
    this.finalCallback = finalCallback;
    this.flow = __bind(this.flow, this);
    this.invokeFinalCallbackIfNecessary = __bind(this.invokeFinalCallbackIfNecessary, this);
    this.asyncTaskCompleted = __bind(this.asyncTaskCompleted, this);
    this.functions = functions.slice(0);
    this.asyncCount = 0;
    _ref = this.functions;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      func = _ref[_i];
      if (func.length > 0) {
        this.asyncCount += 1;
      }
    }
  }

  Waterfall.prototype.asyncTaskCompleted = function() {
    this.asyncCount -= 1;
    return this.flow();
  };

  Waterfall.prototype.invokeFinalCallbackIfNecessary = function() {
    if (this.asyncCount === 0) {
      if (this.finalCallback != null) {
        this.finalCallback.apply(this.context);
      }
      return this.finalCallback = void 0;
    }
  };

  Waterfall.prototype.flow = function() {
    var func;
    if (this.functions.length === 0) {
      return this.invokeFinalCallbackIfNecessary();
    }
    func = this.functions.shift();
    if (func.length > 0) {
      return func.apply(this.context, [this.asyncTaskCompleted]);
    } else {
      func.apply(this.context);
      return this.flow();
    }
  };

  return Waterfall;

})();

comparisonLookup = {
  '===': 'to strictly equal',
  '!==': 'to strictly differ from',
  '==': 'to equal',
  '!=': 'to differ from',
  '>': 'to be bigger than',
  '>=': 'to be bigger or equal',
  '<': 'to be smaller than',
  '<=': 'to be smaller or equal'
};

whenList = [];

invariantList = [];

o = function(thing) {
  return {
    assert: function(context, args) {
      var e, exception, result;
      result = false;
      exception = void 0;
      try {
        result = thing.apply(context, args);
      } catch (_error) {
        e = _error;
        exception = e;
      }
      if (exception) {
        throw new Error(exception.message + '\n' + getErrorDetails(thing, context));
      }
      if (result === false) {
        throw new Error('return value is false\n' + getErrorDetails(thing, context));
      }
    },
    isFunction: function() {
      return Object.prototype.toString.call(thing) === '[object Function]';
    },
    isString: function() {
      return Object.prototype.toString.call(thing) === '[object String]';
    },
    isNumber: function() {
      return Object.prototype.toString.call(thing) === '[object Number]';
    },
    hasArguments: function() {
      return !thing.toString().replace(/\n/g, '').match(/^function\s?\(\)/i);
    },
    firstThat: function(test) {
      var i;
      i = 0;
      while (i < thing.length) {
        if (test(thing[i]) === true) {
          return thing[i];
        }
        i++;
      }
      return void 0;
    }
  };
};

stringifyExpectation = function(expectation) {
  var matches;
  matches = expectation.toString().replace(/\n/g, '').match(/function\s?\(.*\)\s?{\s*(return\s+)?(.*?)(;)?\s*}/i);
  if (matches && matches.length >= 3) {
    return matches[2].replace(/\s+/g, ' ').replace('void 0', 'undefined');
  } else {
    return "";
  }
};

getErrorDetails = function(fn, context) {
  var comparison, expectation, expectationString, left, right;
  expectationString = stringifyExpectation(fn);
  expectation = finalStatementFrom(expectationString);
  if (comparison = wasComparison(expectation)) {
    left = (function() {
      return eval(comparison.left);
    }).call(context);
    right = (function() {
      return eval(comparison.right);
    }).call(context);
    return "     Expected '" + left + "' " + comparisonLookup[comparison.comparator] + " '" + right + "'\n     Comparison: " + expectationString + "\n";
  } else {
    return "";
  }
};

finalStatementFrom = function(expectationString) {
  var multiStatement;
  if (multiStatement = expectationString.match(/.*return (.*)/)) {
    return multiStatement[multiStatement.length - 1];
  } else {
    return expectationString;
  }
};

wasComparison = function(expectation) {
  var comparator, comparison, left, right, s;
  if (comparison = expectation.match(/(.*) (===|!==|==|!=|>|>=|<|<=) (.*)/)) {
    s = comparison[0], left = comparison[1], comparator = comparison[2], right = comparison[3];
    return {
      left: left,
      comparator: comparator,
      right: right
    };
  }
};

declareSpec = function(specArgs, itFunc) {
  var fn, label, time, timelabel;
  label = o(specArgs).firstThat(function(arg) {
    return o(arg).isString();
  });
  fn = o(specArgs).firstThat(function(arg) {
    return o(arg).isFunction();
  });
  time = o(specArgs).firstThat(function(arg) {
    return o(arg).isNumber();
  });
  timelabel = time !== void 0 ? "after " + (time > 1e3 ? time / 1e3 : time) + " ms, " : '';
  return itFunc("then " + timelabel + (label != null ? label : stringifyExpectation(fn)), function(done) {
    var args, expectation;
    args = Array.prototype.slice.call(arguments);
    expectation = (function(_this) {
      return function() {
        o(fn).assert(_this, args);
        if (!o(fn).hasArguments()) {
          return done();
        }
      };
    })(this);
    return new Waterfall(this, [].concat(whenList, invariantList), function() {
      if (time !== void 0) {
        return setTimeout(expectation, time);
      } else {
        return expectation();
      }
    }).flow();
  });
};

MochaGivenSuite = function(suite) {
  var suites;
  suites = [suite];
  return suite.on('pre-require', function(context, file, mocha) {
    var Given, Invariant, Then, When, mostRecentlyUsed;
    suite.ctx = new Context;
    context.before = function(fn) {
      suites[0].beforeAll(fn);
    };
    context.after = function(fn) {
      suites[0].afterAll(fn);
    };
    context.beforeEach = function(fn) {
      suites[0].beforeEach(fn);
    };
    context.afterEach = function(fn) {
      suites[0].afterEach(fn);
    };
    context.describe = context.context = function(title, fn) {
      suite = Suite.create(suites[0], title);
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();
      return suite;
    };
    context.xdescribe = context.xcontext = context.describe.skip = function(title, fn) {
      suite = Suite.create(suites[0], title);
      suite.pending = true;
      suites.unshift(suite);
      fn.call(suite);
      suites.shift();
    };
    context.describe.only = function(title, fn) {
      suite = context.describe(title, fn);
      mocha.grep(suite.fullTitle());
      return suite;
    };
    context.it = context.specify = function(title, fn) {
      var test;
      suite = suites[0];
      if (suite.pending) {
        fn = null;
      }
      test = new Test(title, fn);
      suite.addTest(test);
      return test;
    };
    context.it.only = function(title, fn) {
      var reString, test;
      test = context.it(title, fn);
      reString = '^' + utils.escapeRegexp(test.fullTitle()) + '$';
      mocha.grep(new RegExp(reString));
      return test;
    };
    context.xit = context.xspecify = context.it.skip = function(title) {
      context.it(title);
    };
    mostRecentlyUsed = null;
    context.beforeEach(function() {
      var i;
      return this.currentTest.ctxKeys = (function() {
        var _results;
        _results = [];
        for (i in this.currentTest.ctx) {
          _results.push(i);
        }
        return _results;
      }).call(this);
    });
    context.afterEach(function() {
      var i, _results;
      _results = [];
      for (i in this.currentTest.ctx) {
        if (__indexOf.call(this.currentTest.ctxKeys, i) < 0) {
          _results.push(delete this.currentTest.ctx[i]);
        }
      }
      return _results;
    });
    Given = function() {
      var assignTo, fn;
      assignTo = o(arguments).firstThat(function(arg) {
        return o(arg).isString();
      });
      fn = o(arguments).firstThat(function(arg) {
        return o(arg).isFunction();
      });
      if (assignTo) {
        return context.beforeEach(function() {
          return this[assignTo] = fn.apply(this);
        });
      } else {
        return context.beforeEach.apply(this, Array.prototype.slice.call(arguments));
      }
    };
    When = function() {
      var assignTo, fn;
      assignTo = o(arguments).firstThat(function(arg) {
        return o(arg).isString();
      });
      fn = o(arguments).firstThat(function(arg) {
        return o(arg).isFunction();
      });
      if (assignTo) {
        context.beforeEach(function() {
          return whenList.push(function() {
            return this[assignTo] = fn.apply(this);
          });
        });
      } else {
        context.beforeEach(function() {
          return whenList.push(fn);
        });
      }
      return context.afterEach(function() {
        return whenList.pop();
      });
    };
    Invariant = function(fn) {
      context.beforeEach(function() {
        return invariantList.push(fn);
      });
      return context.afterEach(function() {
        return invariantList.pop();
      });
    };
    Then = function() {
      return declareSpec(arguments, context.it);
    };
    context.Given = function() {
      mostRecentlyUsed = Given;
      return Given.apply(this, Array.prototype.slice.call(arguments));
    };
    context.When = function() {
      mostRecentlyUsed = When;
      return When.apply(this, Array.prototype.slice.call(arguments));
    };
    context.Then = function() {
      mostRecentlyUsed = Then;
      return Then.apply(this, Array.prototype.slice.call(arguments));
    };
    context.Then.only = function() {
      return declareSpec(arguments, context.it.only);
    };
    context.Then.after = function() {
      mostRecentlyUsed = Then;
      return declareSpec(arguments, context.it);
    };
    context.Invariant = function() {
      mostRecentlyUsed = Invariant;
      return Invariant.apply(this, Array.prototype.slice.call(arguments));
    };
    return context.And = function() {
      return mostRecentlyUsed.apply(this, Array.prototype.slice.call(arguments));
    };
  });
};

if (typeof exports === 'object') {
  module.exports = MochaGivenSuite;
}

Mocha.interfaces['mocha-given'] = MochaGivenSuite;

},{}],294:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":296}],295:[function(require,module,exports){
(function (process){
'use strict';

var isWindows = process.platform === 'win32';

// Regex to split a windows path into three parts: [*, device, slash,
// tail] windows-only
var splitDeviceRe =
    /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

// Regex to split the tail part of the above into [*, dir, basename, ext]
var splitTailRe =
    /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

var win32 = {};

// Function to split a filename into [root, dir, basename, ext]
function win32SplitPath(filename) {
  // Separate device+slash from tail
  var result = splitDeviceRe.exec(filename),
      device = (result[1] || '') + (result[2] || ''),
      tail = result[3] || '';
  // Split the tail into dir, basename and extension
  var result2 = splitTailRe.exec(tail),
      dir = result2[1],
      basename = result2[2],
      ext = result2[3];
  return [device, dir, basename, ext];
}

win32.parse = function(pathString) {
  if (typeof pathString !== 'string') {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = win32SplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};



// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var posix = {};


function posixSplitPath(filename) {
  return splitPathRe.exec(filename).slice(1);
}


posix.parse = function(pathString) {
  if (typeof pathString !== 'string') {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = posixSplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  allParts[1] = allParts[1] || '';
  allParts[2] = allParts[2] || '';
  allParts[3] = allParts[3] || '';

  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};


if (isWindows)
  module.exports = win32.parse;
else /* posix */
  module.exports = posix.parse;

module.exports.posix = posix.parse;
module.exports.win32 = win32.parse;

}).call(this,require('_process'))
},{"_process":296}],296:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],297:[function(require,module,exports){
var core = require('./lib/core');
var async = require('./lib/async');
async.core = core;
async.isCore = function isCore(x) { return core[x]; };
async.sync = require('./lib/sync');

exports = async;
module.exports = async;

},{"./lib/async":298,"./lib/core":301,"./lib/sync":303}],298:[function(require,module,exports){
(function (process){
var core = require('./core');
var fs = require('fs');
var path = require('path');
var caller = require('./caller.js');
var nodeModulesPaths = require('./node-modules-paths.js');

module.exports = function resolve(x, options, callback) {
    var cb = callback;
    var opts = options || {};
    if (typeof opts === 'function') {
        cb = opts;
        opts = {};
    }
    if (typeof x !== 'string') {
        var err = new TypeError('Path must be a string.');
        return process.nextTick(function () {
            cb(err);
        });
    }

    var isFile = opts.isFile || function (file, cb) {
        fs.stat(file, function (err, stat) {
            if (!err) {
                return cb(null, stat.isFile() || stat.isFIFO());
            }
            if (err.code === 'ENOENT' || err.code === 'ENOTDIR') return cb(null, false);
            return cb(err);
        });
    };
    var readFile = opts.readFile || fs.readFile;

    var extensions = opts.extensions || ['.js'];
    var y = opts.basedir || path.dirname(caller());

    opts.paths = opts.paths || [];

    if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(x)) {
        var res = path.resolve(y, x);
        if (x === '..' || x.slice(-1) === '/') res += '/';
        if (/\/$/.test(x) && res === y) {
            loadAsDirectory(res, opts.package, onfile);
        } else loadAsFile(res, opts.package, onfile);
    } else loadNodeModules(x, y, function (err, n, pkg) {
        if (err) cb(err);
        else if (n) cb(null, n, pkg);
        else if (core[x]) return cb(null, x);
        else {
            var moduleError = new Error("Cannot find module '" + x + "' from '" + y + "'");
            moduleError.code = 'MODULE_NOT_FOUND';
            cb(moduleError);
        }
    });

    function onfile(err, m, pkg) {
        if (err) cb(err);
        else if (m) cb(null, m, pkg);
        else loadAsDirectory(res, function (err, d, pkg) {
            if (err) cb(err);
            else if (d) cb(null, d, pkg);
            else {
                var moduleError = new Error("Cannot find module '" + x + "' from '" + y + "'");
                moduleError.code = 'MODULE_NOT_FOUND';
                cb(moduleError);
            }
        });
    }

    function loadAsFile(x, thePackage, callback) {
        var loadAsFilePackage = thePackage;
        var cb = callback;
        if (typeof loadAsFilePackage === 'function') {
            cb = loadAsFilePackage;
            loadAsFilePackage = undefined;
        }

        var exts = [''].concat(extensions);
        load(exts, x, loadAsFilePackage);

        function load(exts, x, loadPackage) {
            if (exts.length === 0) return cb(null, undefined, loadPackage);
            var file = x + exts[0];

            var pkg = loadPackage;
            if (pkg) onpkg(null, pkg);
            else loadpkg(path.dirname(file), onpkg);

            function onpkg(err, pkg_, dir) {
                pkg = pkg_;
                if (err) return cb(err);
                if (dir && pkg && opts.pathFilter) {
                    var rfile = path.relative(dir, file);
                    var rel = rfile.slice(0, rfile.length - exts[0].length);
                    var r = opts.pathFilter(pkg, x, rel);
                    if (r) return load(
                        [''].concat(extensions.slice()),
                        path.resolve(dir, r),
                        pkg
                    );
                }
                isFile(file, onex);
            }
            function onex(err, ex) {
                if (err) return cb(err);
                if (ex) return cb(null, file, pkg);
                load(exts.slice(1), x, pkg);
            }
        }
    }

    function loadpkg(dir, cb) {
        if (dir === '' || dir === '/') return cb(null);
        if (process.platform === 'win32' && (/^\w:[/\\]*$/).test(dir)) {
            return cb(null);
        }
        if (/[/\\]node_modules[/\\]*$/.test(dir)) return cb(null);

        var pkgfile = path.join(dir, 'package.json');
        isFile(pkgfile, function (err, ex) {
            // on err, ex is false
            if (!ex) return loadpkg(path.dirname(dir), cb);

            readFile(pkgfile, function (err, body) {
                if (err) cb(err);
                try { var pkg = JSON.parse(body); } catch (jsonErr) {}

                if (pkg && opts.packageFilter) {
                    pkg = opts.packageFilter(pkg, pkgfile);
                }
                cb(null, pkg, dir);
            });
        });
    }

    function loadAsDirectory(x, loadAsDirectoryPackage, callback) {
        var cb = callback;
        var fpkg = loadAsDirectoryPackage;
        if (typeof fpkg === 'function') {
            cb = fpkg;
            fpkg = opts.package;
        }

        var pkgfile = path.join(x, 'package.json');
        isFile(pkgfile, function (err, ex) {
            if (err) return cb(err);
            if (!ex) return loadAsFile(path.join(x, 'index'), fpkg, cb);

            readFile(pkgfile, function (err, body) {
                if (err) return cb(err);
                try {
                    var pkg = JSON.parse(body);
                } catch (jsonErr) {}

                if (opts.packageFilter) {
                    pkg = opts.packageFilter(pkg, pkgfile);
                }

                if (pkg.main) {
                    if (pkg.main === '.' || pkg.main === './') {
                        pkg.main = 'index';
                    }
                    loadAsFile(path.resolve(x, pkg.main), pkg, function (err, m, pkg) {
                        if (err) return cb(err);
                        if (m) return cb(null, m, pkg);
                        if (!pkg) return loadAsFile(path.join(x, 'index'), pkg, cb);

                        var dir = path.resolve(x, pkg.main);
                        loadAsDirectory(dir, pkg, function (err, n, pkg) {
                            if (err) return cb(err);
                            if (n) return cb(null, n, pkg);
                            loadAsFile(path.join(x, 'index'), pkg, cb);
                        });
                    });
                    return;
                }

                loadAsFile(path.join(x, '/index'), pkg, cb);
            });
        });
    }

    function processDirs(cb, dirs) {
        if (dirs.length === 0) return cb(null, undefined);
        var dir = dirs[0];

        var file = path.join(dir, x);
        loadAsFile(file, undefined, onfile);

        function onfile(err, m, pkg) {
            if (err) return cb(err);
            if (m) return cb(null, m, pkg);
            loadAsDirectory(path.join(dir, x), undefined, ondir);
        }

        function ondir(err, n, pkg) {
            if (err) return cb(err);
            if (n) return cb(null, n, pkg);
            processDirs(cb, dirs.slice(1));
        }
    }
    function loadNodeModules(x, start, cb) {
        processDirs(cb, nodeModulesPaths(start, opts));
    }
};

}).call(this,require('_process'))
},{"./caller.js":299,"./core":301,"./node-modules-paths.js":302,"_process":296,"fs":3,"path":294}],299:[function(require,module,exports){
module.exports = function () {
    // see https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    var origPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) { return stack; };
    var stack = (new Error()).stack;
    Error.prepareStackTrace = origPrepareStackTrace;
    return stack[2].getFileName();
};

},{}],300:[function(require,module,exports){
module.exports={
    "*": [
        "assert",
        "buffer_ieee754",
        "buffer",
        "child_process",
        "cluster",
        "console",
        "constants",
        "crypto",
        "_debugger",
        "dgram",
        "dns",
        "domain",
        "events",
        "freelist",
        "fs",
        "http",
        "https",
        "_linklist",
        "module",
        "net",
        "os",
        "path",
        "punycode",
        "querystring",
        "readline",
        "repl",
        "stream",
        "string_decoder",
        "sys",
        "timers",
        "tls",
        "tty",
        "url",
        "util",
        "vm",
        "zlib"
    ],
    "0.11": [
        "_http_server"
    ],
    "1.0": [
        "process",
        "v8"
    ]
}

},{}],301:[function(require,module,exports){
(function (process){
var current = (process.versions && process.versions.node && process.versions.node.split('.')) || [];

function versionIncluded(version) {
    if (version === '*') return true;
    var versionParts = version.split('.');
    for (var i = 0; i < 3; ++i) {
        if ((current[i] || 0) >= (versionParts[i] || 0)) return true;
    }
    return false;
}

var data = require('./core.json');

var core = {};
for (var version in data) { // eslint-disable-line no-restricted-syntax
    if (Object.prototype.hasOwnProperty.call(data, version) && versionIncluded(version)) {
        for (var i = 0; i < data[version].length; ++i) {
            core[data[version][i]] = true;
        }
    }
}
module.exports = core;

}).call(this,require('_process'))
},{"./core.json":300,"_process":296}],302:[function(require,module,exports){
var path = require('path');
var parse = path.parse || require('path-parse');

module.exports = function nodeModulesPaths(start, opts) {
    var modules = opts && opts.moduleDirectory
        ? [].concat(opts.moduleDirectory)
        : ['node_modules']
    ;

    // ensure that `start` is an absolute path at this point,
    // resolving against the process' current working directory
    var absoluteStart = path.resolve(start);

    var prefix = '/';
    if (/^([A-Za-z]:)/.test(absoluteStart)) {
        prefix = '';
    } else if (/^\\\\/.test(absoluteStart)) {
        prefix = '\\\\';
    }

    var paths = [absoluteStart];
    var parsed = parse(absoluteStart);
    while (parsed.dir !== paths[paths.length - 1]) {
        paths.push(parsed.dir);
        parsed = parse(parsed.dir);
    }

    var dirs = paths.reduce(function (dirs, aPath) {
        return dirs.concat(modules.map(function (moduleDir) {
            return path.join(prefix, aPath, moduleDir);
        }));
    }, []);

    return opts && opts.paths ? dirs.concat(opts.paths) : dirs;
};

},{"path":294,"path-parse":295}],303:[function(require,module,exports){
var core = require('./core');
var fs = require('fs');
var path = require('path');
var caller = require('./caller.js');
var nodeModulesPaths = require('./node-modules-paths.js');

module.exports = function (x, options) {
    if (typeof x !== 'string') {
        throw new TypeError('Path must be a string.');
    }
    var opts = options || {};
    var isFile = opts.isFile || function (file) {
        try {
            var stat = fs.statSync(file);
        } catch (e) {
            if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return false;
            throw e;
        }
        return stat.isFile() || stat.isFIFO();
    };
    var readFileSync = opts.readFileSync || fs.readFileSync;

    var extensions = opts.extensions || ['.js'];
    var y = opts.basedir || path.dirname(caller());

    opts.paths = opts.paths || [];

    if (/^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[/\\])/.test(x)) {
        var res = path.resolve(y, x);
        if (x === '..' || x.slice(-1) === '/') res += '/';
        var m = loadAsFileSync(res) || loadAsDirectorySync(res);
        if (m) return m;
    } else {
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
    }

    if (core[x]) return x;

    var err = new Error("Cannot find module '" + x + "' from '" + y + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;

    function loadAsFileSync(x) {
        if (isFile(x)) {
            return x;
        }

        for (var i = 0; i < extensions.length; i++) {
            var file = x + extensions[i];
            if (isFile(file)) {
                return file;
            }
        }
    }

    function loadAsDirectorySync(x) {
        var pkgfile = path.join(x, '/package.json');
        if (isFile(pkgfile)) {
            var body = readFileSync(pkgfile, 'utf8');
            try {
                var pkg = JSON.parse(body);
                if (opts.packageFilter) {
                    pkg = opts.packageFilter(pkg, x);
                }

                if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                    var n = loadAsDirectorySync(path.resolve(x, pkg.main));
                    if (n) return n;
                }
            } catch (e) {}
        }

        return loadAsFileSync(path.join(x, '/index'));
    }

    function loadNodeModulesSync(x, start) {
        var dirs = nodeModulesPaths(start, opts);
        for (var i = 0; i < dirs.length; i++) {
            var dir = dirs[i];
            var m = loadAsFileSync(path.join(dir, '/', x));
            if (m) return m;
            var n = loadAsDirectorySync(path.join(dir, '/', x));
            if (n) return n;
        }
    }
};

},{"./caller.js":299,"./core":301,"./node-modules-paths.js":302,"fs":3,"path":294}],304:[function(require,module,exports){
'use strict';
var isRegexp = require('is-regexp');
var isPlainObj = require('is-plain-obj');

module.exports = function (val, opts, pad) {
	var seen = [];

	return (function stringify(val, opts, pad) {
		opts = opts || {};
		opts.indent = opts.indent || '\t';
		pad = pad || '';
		var tokens;
		if(opts.inlineCharacterLimit == void 0) {
			tokens = {
				newLine: '\n',
				newLineOrSpace: '\n',
				pad: pad,
				indent: pad + opts.indent
			};
		} else {
			tokens = {
				newLine: '@@__STRINGIFY_OBJECT_NEW_LINE__@@',
				newLineOrSpace: '@@__STRINGIFY_OBJECT_NEW_LINE_OR_SPACE__@@',
				pad: '@@__STRINGIFY_OBJECT_PAD__@@',
				indent: '@@__STRINGIFY_OBJECT_INDENT__@@'
			}
		}
		var expandWhiteSpace = function(string) {
			if (opts.inlineCharacterLimit == void 0) { return string; }
			var oneLined = string.
				replace(new RegExp(tokens.newLine, 'g'), '').
				replace(new RegExp(tokens.newLineOrSpace, 'g'), ' ').
				replace(new RegExp(tokens.pad + '|' + tokens.indent, 'g'), '');

			if(oneLined.length <= opts.inlineCharacterLimit) {
				return oneLined;
			} else {
				return string.
					replace(new RegExp(tokens.newLine + '|' + tokens.newLineOrSpace, 'g'), '\n').
					replace(new RegExp(tokens.pad, 'g'), pad).
					replace(new RegExp(tokens.indent, 'g'), pad + opts.indent);
			}
		};

		if (seen.indexOf(val) !== -1) {
			return '"[Circular]"';
		}

		if (val === null ||
			val === undefined ||
			typeof val === 'number' ||
			typeof val === 'boolean' ||
			typeof val === 'function' ||
			isRegexp(val)) {
			return String(val);
		}

		if (val instanceof Date) {
			return 'new Date(\'' + val.toISOString() + '\')';
		}

		if (Array.isArray(val)) {
			if (val.length === 0) {
				return '[]';
			}

			seen.push(val);

			var ret = '[' + tokens.newLine + val.map(function (el, i) {
				var eol = val.length - 1 === i ? tokens.newLine : ',' + tokens.newLineOrSpace;
				var value = stringify(el, opts, pad + opts.indent);
				if (opts.transform) {
					value = opts.transform(val, i, value);
				}
				return tokens.indent + value + eol;
			}).join('') + tokens.pad + ']';

			seen.pop(val);

			return expandWhiteSpace(ret);
		}

		if (isPlainObj(val)) {
			var objKeys = Object.keys(val);

			if (objKeys.length === 0) {
				return '{}';
			}

			seen.push(val);

			var ret = '{' + tokens.newLine + objKeys.map(function (el, i) {
				if (opts.filter && !opts.filter(val, el)) {
					return '';
				}

				var eol = objKeys.length - 1 === i ? tokens.newLine : ',' + tokens.newLineOrSpace;
				var key = /^[a-z$_][a-z$_0-9]*$/i.test(el) ? el : stringify(el, opts);
				var value = stringify(val[el], opts, pad + opts.indent);
				if (opts.transform) {
					value = opts.transform(val, el, value);
				}
				return tokens.indent + String(key) + ': ' + value + eol;
			}).join('') + tokens.pad + '}';

			seen.pop(val);

			return expandWhiteSpace(ret);
		}

		val = String(val).replace(/[\r\n]/g, function (x) {
			return x === '\n' ? '\\n' : '\\r';
		});

		if (opts.singleQuotes === false) {
			return '"' + val.replace(/"/g, '\\\"') + '"';
		}

		return '\'' + val.replace(/'/g, '\\\'') + '\'';
	})(val, opts, pad);
};

},{"is-plain-obj":62,"is-regexp":63}],305:[function(require,module,exports){
module.exports={
  "name": "testdouble",
  "version": "3.2.6",
  "description": "A minimal test double library for TDD with JavaScript",
  "homepage": "https://github.com/testdouble/testdouble.js",
  "author": {
    "name": "Justin Searls",
    "email": "justin@testdouble.com",
    "url": "http://testdouble.com"
  },
  "main": "lib/index.js",
  "config": {
    "build_file": "dist/testdouble.js",
    "test_bundle": "generated/tests.js",
    "mocha_reporter": "dot"
  },
  "scripts": {
    "clean": "rm -rf generated dist lib coverage && yarn run clean:dist",
    "clean:dist": "git checkout -- dist",
    "compile:browser": "browserify src/index.js --standalone td --outfile $npm_package_config_build_file -p headerify -t babelify",
    "compile:browser:test": "mkdir -p generated && browserify regression/browser-helper.js --outfile $npm_package_config_test_bundle -t babelify -t coffeeify --extension=\".coffee\" -t require-globify --ignore-missing",
    "compile:node": "babel src -d lib",
    "compile": "yarn run compile:node && yarn run compile:browser && yarn run compile:browser:test",
    "cover": "nyc --reporter=lcov --reporter=text-summary --require babel-core/register _mocha --ui mocha-given --reporter $npm_package_config_mocha_reporter --compilers coffee:coffee-script --recursive regression/node-helper.coffee regression/src",
    "cover:report": "codeclimate-test-reporter < coverage/lcov.info",
    "style": "standard --fix",
    "test": "mocha --ui mocha-given --reporter $npm_package_config_mocha_reporter --compilers js:babel-core/register,coffee:coffee-script --recursive regression/node-helper.coffee regression/src",
    "test:all": "yarn test:unit && yarn test && yarn run test:browser && yarn run test:example && yarn run test:typescript",
    "test:browser": "testem ci",
    "test:unit": "teenytest",
    "test:ci": "yarn run clean && yarn run compile && yarn run style && yarn run test:all && yarn run clean:dist && echo \"All done!\"",
    "test:typescript": "tsc --outDir generated/typescript -p regression/typescript && node generated/typescript/test.js",
    "test:example:webpack": "cd examples/webpack && yarn install && yarn test && cd ../..",
    "test:example:node": "cd examples/node && yarn install && yarn test && cd ../..",
    "test:example:lineman": "cd examples/lineman && yarn install && yarn test && cd ../..",
    "test:example:babel": "cd examples/babel && yarn install && yarn test && cd ../..",
    "test:example": "yarn run test:example:node && yarn run test:example:lineman && yarn run test:example:webpack && yarn run test:example:babel",
    "version:write": "echo \"export default '$npm_package_version'\" > src/version.js",
    "version:changelog": "if command -v github_changelog_generator &>/dev/null; then github_changelog_generator; git commit -m \"Changelog for $npm_package_version\" CHANGELOG.md; else echo Versioning requires you first run 'gem install github_changelog_generator' >&2; fi",
    "preversion": "git pull --rebase && yarn run test:ci",
    "version": "yarn run version:write && yarn run compile && git add dist src/version.js",
    "postversion": "git push --tags && yarn run version:changelog && git push && npm publish",
    "prepublish": "yarn run compile"
  },
  "babel": {
    "presets": [
      [
        "env",
        {
          "targets": {
            "node": "4",
            "browsers": "last 2 versions"
          }
        }
      ]
    ]
  },
  "teenytest": {
    "testLocator": "test/**/*.test.js",
    "helper": "test/helper.js"
  },
  "browser": {
    "./lib/replace/module.js": "./lib/replace/module.browser.js",
    "quibble": "./lib/quibble.browser.js"
  },
  "standard": {
    "globals": [
      "describe",
      "it",
      "expect",
      "td",
      "assert",
      "ES_SUPPORT"
    ],
    "ignore": [
      "dist",
      "examples",
      "generated",
      "lib"
    ]
  },
  "dependencies": {
    "es6-map": "^0.1.5",
    "lodash": "^4.17.4",
    "quibble": "^0.5.1",
    "resolve": "^1.3.3",
    "stringify-object-es5": "^2.5.0"
  },
  "devDependencies": {
    "@types/chai": "^4.0.0",
    "@types/mocha": "^2.2.41",
    "babel-cli": "^6.24.1",
    "babel-preset-env": "^1.5.2",
    "babel-preset-power-assert": "^1.0.0",
    "babelify": "^7.3.0",
    "browserify": "^14.4.0",
    "chai": "^3.2.0",
    "codeclimate-test-reporter": "^0.4.1",
    "coffee-script": "^1.10.0",
    "coffeeify": "^2.1.0",
    "core-assert": "^0.2.1",
    "headerify": "^1.0.1",
    "is-number": "^3.0.0",
    "mocha": "^3.2.0",
    "mocha-given": "^0.1.3",
    "nyc": "^10.1.2",
    "power-assert": "^1.4.4",
    "pryjs": "^1.0.3",
    "require-globify": "^1.4.1",
    "standard": "^10.0.2",
    "teenytest": "^5.0.2",
    "testdouble": "3.2.1",
    "testem": "^1.18.0",
    "typescript": "^2.4.1"
  },
  "directories": {
    "doc": "./docs",
    "example": "./examples",
    "lib": "./lib",
    "src": "./src"
  },
  "typings": "./index.d.ts",
  "keywords": [
    "tdd",
    "bdd",
    "mock",
    "stub",
    "spy",
    "test double",
    "double"
  ],
  "bugs": {
    "url": "https://github.com/testdouble/testdouble.js/issues"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/testdouble/testdouble.js.git"
  },
  "license": "MIT",
  "engines": {
    "node": ">= 4.0.0"
  }
}

},{}],306:[function(require,module,exports){
(function (global){
'use strict';

require('mocha-given/browser/mocha-given');
global.mocha.setup('mocha-given');
global.NODE_JS = false;

global.td = require('../src');
require('./general-helper');

// Require all the tests so they're included in the browserify build:
require('./src/config-test.js');
require('./src/args-match-test.coffee');require('./src/callback-test.coffee');require('./src/captor-test.coffee');require('./src/constructor-test.coffee');require('./src/explain-test.coffee');require('./src/function-test.coffee');require('./src/log-test.coffee');require('./src/matchers-test.coffee');require('./src/object-test.coffee');require('./src/replace/index-test.coffee');require('./src/store/index-test.coffee');require('./src/stringify/anything-test.coffee');require('./src/testdouble-test.coffee');require('./src/verify-test.coffee');require('./src/when-test.coffee');

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../src":346,"./general-helper":314,"./src/args-match-test.coffee":315,"./src/callback-test.coffee":316,"./src/captor-test.coffee":317,"./src/config-test.js":318,"./src/constructor-test.coffee":319,"./src/explain-test.coffee":320,"./src/function-test.coffee":321,"./src/log-test.coffee":322,"./src/matchers-test.coffee":323,"./src/object-test.coffee":324,"./src/replace/index-test.coffee":325,"./src/store/index-test.coffee":326,"./src/stringify/anything-test.coffee":327,"./src/testdouble-test.coffee":328,"./src/verify-test.coffee":329,"./src/when-test.coffee":330,"mocha-given/browser/mocha-given":293}],307:[function(require,module,exports){
var Passenger;

Passenger = require('./passenger');

module.exports = {
  seatPassenger: function() {
    return new Passenger().sit();
  },
  honk: require('./honk'),
  turn: require('./turn'),
  brake: require('./brake'),
  lights: require('./lights'),
  shift: require('./shift'),
  isASpeed: function(thing) {
    return require('is-number')(thing);
  }
};


},{"./brake":undefined,"./honk":309,"./lights":310,"./passenger":311,"./shift":312,"./turn":313,"is-number":61}],308:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ES6Class = function () {
  function ES6Class() {
    _classCallCheck(this, ES6Class);
  }

  _createClass(ES6Class, [{
    key: 'foo',
    value: function foo() {
      return 'og foo';
    }
  }, {
    key: 'bar',
    value: function bar() {
      return 'og bar';
    }
  }]);

  return ES6Class;
}();

module.exports = ES6Class;

},{}],309:[function(require,module,exports){
module.exports = function() {
  throw 'honk';
};


},{}],310:[function(require,module,exports){
var Brights;

module.exports = {
  count: 4,
  headlight: function() {
    throw 'headlight';
  },
  turnSignal: function() {
    throw 'turnSignal';
  },
  brights: Brights = (function() {
    function Brights() {}

    Brights.prototype.beBright = function() {
      throw 'too bright!';
    };

    return Brights;

  })()
};


},{}],311:[function(require,module,exports){
var Passenger;

module.exports = Passenger = (function() {
  function Passenger() {}

  Passenger.prototype.sit = function() {
    throw "i am sitting";
  };

  return Passenger;

})();


},{}],312:[function(require,module,exports){
'use strict';

function shift() {
  return 'Faster';
}

shift.neutral = function () {
  return 'Coast';
};

module.exports = shift;

},{}],313:[function(require,module,exports){
"use strict";

module.exports = function turn() {};

},{}],314:[function(require,module,exports){
(function (global){
var e;

global.expect = chai.expect;

global.xThen = function() {};

global.shouldNotThrow = function(func) {
  return func();
};

afterEach(function() {
  td.reset();
  return td.config.reset();
});

global.shouldThrow = function(func, expectedMessage) {
  var actualMessage, e, threw;
  threw = null;
  actualMessage = null;
  try {
    func();
    threw = false;
  } catch (error) {
    e = error;
    actualMessage = e.message;
    if (expectedMessage != null) {
      expect(actualMessage).to.eq(expectedMessage);
    }
    threw = true;
  }
  expect(threw, "Expected function to throw an error").to.be["true"];
  return actualMessage;
};

global.ES_CLASS_SUPPORT = (function() {
  try {
    eval('"use strict"; class SomeStupidButUniqueClassName {}');
    return true;
  } catch (error) {
    e = error;
    return false;
  }
})();


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],315:[function(require,module,exports){
describe('args-match', function() {
  Given(function() {
    return this.subject = require('../../src/args-match')["default"];
  });
  context('allow matchers', function() {
    When(function() {
      return this.result = this.subject([td.matchers.anything()], [5]);
    });
    return Then(function() {
      return this.result === true;
    });
  });
  return context('disallow matchers', function() {
    context('matches', function() {
      When(function() {
        return this.result = this.subject([td.matchers.anything()], [5], {
          allowMatchers: false
        });
      });
      return Then(function() {
        return this.result === false;
      });
    });
    return context('exact', function() {
      When(function() {
        return this.result = this.subject([5], [5], {
          allowMatchers: false
        });
      });
      return Then(function() {
        return this.result === true;
      });
    });
  });
});


},{"../../src/args-match":331}],316:[function(require,module,exports){
describe('td.callback', function() {
  Given(function() {
    return this.testDouble = td["function"]();
  });
  return describe('when', function() {
    context('callback is synchronous', function() {
      When(function() {
        return this.returnValue = this.testDouble('/foo', (function(_this) {
          return function(er, results) {
            _this.callbackInvoked = true;
            _this.er = er;
            return _this.results = results;
          };
        })(this));
      });
      context('VERBOSE: using td.callback() as a matcher with a thenReturn chain', function() {
        Given(function() {
          return td.when(this.testDouble('/foo', td.callback(null, 'some results'))).thenReturn('pandas');
        });
        Then(function() {
          return this.er === null;
        });
        And(function() {
          return this.results === 'some results';
        });
        return And(function() {
          return this.returnValue === 'pandas';
        });
      });
      context('TERSE: use thenCallback chain with td.callback implied as last arg', function() {
        Given(function() {
          return td.when(this.testDouble('/foo')).thenCallback(null, 'some results');
        });
        Then(function() {
          return this.callbackInvoked = true;
        });
        And(function() {
          return this.er === null;
        });
        And(function() {
          return this.results === 'some results';
        });
        return And(function() {
          return this.returnValue === void 0;
        });
      });
      context('ORDER-EXPLICIT: use td.callback as a marker with a thenCallback chain', function() {
        Given(function() {
          return td.when(this.testDouble('/foo', td.callback)).thenCallback(null, 'some results');
        });
        Then(function() {
          return this.er === null;
        });
        And(function() {
          return this.results === 'some results';
        });
        return And(function() {
          return this.returnValue === void 0;
        });
      });
      context('EDGE CASE: use td.callback() as a matcher with a thenCallback chain (callback() wins)', function() {
        Given(function() {
          return td.when(this.testDouble('/foo', td.callback('lolz'))).thenCallback(null, 'some results');
        });
        Then(function() {
          return this.er === 'lolz';
        });
        return And(function() {
          return this.results === void 0;
        });
      });
      context('EDGE CASE: Multiple td.callbacks, some markers and some matchers', function() {
        Given(function() {
          return td.when(this.testDouble('/bar', td.callback('neat'), td.callback, 'hi')).thenCallback('perfect');
        });
        When(function() {
          return this.testDouble('/bar', ((function(_this) {
            return function(cb1arg1) {
              _this.cb1arg1 = cb1arg1;
            };
          })(this)), ((function(_this) {
            return function(cb2arg1) {
              _this.cb2arg1 = cb2arg1;
            };
          })(this)), 'hi');
        });
        Then(function() {
          return this.cb1arg1 === 'neat';
        });
        return And(function() {
          return this.cb2arg1 === 'perfect';
        });
      });
      context('EDGE CASE: use td.callback as a marker with thenReturn (no-arg invocation is made)', function() {
        Given(function() {
          return td.when(this.testDouble('/foo', td.callback)).thenReturn(null);
        });
        Then(function() {
          return this.er === void 0;
        });
        And(function() {
          return this.results === void 0;
        });
        return And(function() {
          return this.callbackInvoked === true;
        });
      });
      return context('EDGE CASE: thenCallback used but not satisfied', function() {
        Given(function() {
          return td.when(this.testDouble('/bar')).thenCallback('a-ha');
        });
        Given(function() {
          return td.when(this.testDouble('/bar')).thenReturn('o_O');
        });
        When(function() {
          return this.result = this.testDouble('/bar');
        });
        return Then(function() {
          return this.result === 'o_O';
        });
      });
    });
    return context('callback is asynchronous', function() {
      describe('using the defer option', function() {
        it('does not invoke synchronously', function(done) {
          td.when(this.testDouble('/A'), {
            defer: true
          }).thenCallback(null, 'B');
          this.testDouble('/A', (function(_this) {
            return function(er, result) {
              _this.callbackInvoked = true;
              _this.result = result;
              return done();
            };
          })(this));
          if (this.result != null) {
            return this.invokedSynchronously = true;
          }
        });
        return afterEach(function() {
          expect(this.callbackInvoked).to.eq(true);
          expect(this.result).to.eq('B');
          return expect(this.invokedSynchronously).not.to.eq(true);
        });
      });
      return describe('using the delay option', function() {
        if (typeof Promise !== 'function') {
          return;
        }
        it('wraps callbacks and promises in the right order', function(done) {
          td.when(this.testDouble('/A'), {
            delay: 40
          }).thenCallback(null, 'B');
          td.when(this.testDouble('/C'), {
            delay: 20
          }).thenCallback(null, 'D');
          td.when(this.testDouble('/E'), {
            delay: 30
          }).thenResolve('F');
          td.when(this.testDouble('/G'), {
            delay: 10
          }).thenReject('H');
          this.results = [];
          this.testDouble('/A', (function(_this) {
            return function(er, result) {
              _this.results.push(result);
              if (_this.results.length === 4) {
                return done();
              }
            };
          })(this));
          this.testDouble('/C', (function(_this) {
            return function(er, result) {
              _this.results.push(result);
              if (_this.results.length === 4) {
                return done();
              }
            };
          })(this));
          this.testDouble('/E').then((function(_this) {
            return function(result) {
              _this.results.push(result);
              if (_this.results.length === 4) {
                return done();
              }
            };
          })(this));
          this.testDouble('/G')["catch"]((function(_this) {
            return function(error) {
              _this.results.push(error);
              if (_this.results.length === 4) {
                return done();
              }
            };
          })(this));
          if (this.results.length > 0) {
            return this.invokedSynchronously = true;
          }
        });
        return afterEach(function() {
          expect(this.results).to.deep.eq(['H', 'D', 'F', 'B']);
          return expect(this.invokedSynchronously).not.to.eq(true);
        });
      });
    });
  });
});


},{}],317:[function(require,module,exports){
describe('argument captors (a special sub-type of matchers)', function() {
  Given(function() {
    return this.testDouble = td["function"]();
  });
  Given(function() {
    return this.captor = td.matchers.captor();
  });
  describe('when stubbing', function() {
    Given(function() {
      return td.when(this.testDouble(this.captor.capture())).thenReturn('foobaby');
    });
    When(function() {
      return this.stubbing = this.testDouble("PANTS!");
    });
    Then(function() {
      return this.captor.value === "PANTS!";
    });
    return And(function() {
      return this.stubbing === 'foobaby';
    });
  });
  describe('when verifying', function() {
    Given(function() {
      return this.testDouble("SHIRTS!");
    });
    When(function() {
      return td.verify(this.testDouble(this.captor.capture()));
    });
    Then(function() {
      return this.captor.value === "SHIRTS!";
    });
    return And(function() {
      return expect(this.captor.values).to.deep.eq(["SHIRTS!"]);
    });
  });
  return describe('when verifying multiple', function() {
    Given(function() {
      return this.testDouble("SHIRTS!");
    });
    And(function() {
      return this.testDouble("SHIRTS AGAIN!");
    });
    When(function() {
      return td.verify(this.testDouble(this.captor.capture()));
    });
    Then(function() {
      return this.captor.value === "SHIRTS AGAIN!";
    });
    return And(function() {
      return expect(this.captor.values).to.deep.eq(["SHIRTS!", "SHIRTS AGAIN!"]);
    });
  });
});


},{}],318:[function(require,module,exports){
(function (global){
'use strict';

describe('td.config', function () {
  it('sets some ok defaults', function () {
    expect(td.config()).to.deep.equal({
      ignoreWarnings: false,
      promiseConstructor: global.Promise,
      suppressErrors: false
    });
  });

  it('overriding a real property', function () {
    var config = td.config({ ignoreWarnings: true });

    expect(config.ignoreWarnings).to.eq(true);
    expect(td.config().ignoreWarnings).to.eq(true);
  });

  it('overriding a deprecated property', function () {
    var ogWarn = console.warn;
    var warnings = [];
    console.warn = function (warning) {
      warnings.push(warning);
    };

    var config = td.config({ extendWhenReplacingConstructors: true });

    expect(config.extendWhenReplacingConstructors).to.eq(undefined);
    expect(td.config().extendWhenReplacingConstructors).to.eq(undefined);
    expect(warnings[0]).to.eq('Warning: testdouble.js - td.config - "extendWhenReplacingConstructors" is no longer a valid configuration key. Remove it from your calls to td.config() or it may throw an error in the future. For more information, try hunting around our GitHub repo for it:\n\n  https://github.com/testdouble/testdouble.js/search?q=extendWhenReplacingConstructors');

    console.warn = ogWarn;
  });

  it('overriding a non-existent property', function () {
    var error = void 0;

    try {
      td.config({ wat: 'wat?' });
    } catch (e) {
      error = e;
    }

    expect(error.message).to.eq('Error: testdouble.js - td.config - "wat" is not a valid configuration ' + 'key (valid keys are: ["ignoreWarnings", ' + '"promiseConstructor", "suppressErrors"])');
  });
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],319:[function(require,module,exports){
var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

describe('td.constructor', function() {
  describe('being given a constructor function', function() {
    var SuperThing, Thing;
    Thing = SuperThing = null;
    Given(function() {
      return SuperThing = (function() {
        function SuperThing() {}

        SuperThing.prototype.biz = function() {
          return 1;
        };

        return SuperThing;

      })();
    });
    Given(function() {
      return Thing = (function(superClass) {
        extend(Thing, superClass);

        function Thing() {
          return Thing.__super__.constructor.apply(this, arguments);
        }

        return Thing;

      })(SuperThing);
    });
    Given(function() {
      return Thing.prototype.foo = function() {
        return 2;
      };
    });
    Given(function() {
      return Thing.bar = function() {
        return 3;
      };
    });
    Given(function() {
      return Thing.prototype.instanceAttr = 'baz';
    });
    Given(function() {
      return Thing.staticAttr = 'qux';
    });
    Given(function() {
      return Object.defineProperties(Thing, {
        secretStaticFunc: {
          value: function() {},
          enumerable: false,
          writable: true
        }
      });
    });
    Given(function() {
      return Object.defineProperties(SuperThing.prototype, {
        secretFunc: {
          value: function() {},
          enumerable: false,
          writable: true
        }
      });
    });
    Given(function() {
      return this.fakeConstructor = td.constructor(Thing);
    });
    Given(function() {
      return this.fakeInstance = new this.fakeConstructor('pants');
    });
    describe('the constructor function itself', function() {
      Then(function() {
        return td.verify(new this.fakeConstructor('pants'));
      });
      return describe('stubbing it (with an error, return makes no sense)', function() {
        Given(function() {
          return td.when(new this.fakeConstructor('!')).thenThrow('¡');
        });
        Given(function() {
          return this.error = null;
        });
        When(function() {
          var e;
          try {
            return new this.fakeConstructor('!');
          } catch (error) {
            e = error;
            return this.error = e;
          }
        });
        return Then(function() {
          return this.error === '¡';
        });
      });
    });
    Then(function() {
      return td.when(this.fakeInstance.foo()).thenReturn(7)() === 7;
    });
    describe('stub method on prototype, use from any instance', function() {
      When(function() {
        return td.when(this.fakeConstructor.prototype.foo()).thenReturn(4);
      });
      Then(function() {
        return this.fakeConstructor.prototype.foo() === 4;
      });
      return Then(function() {
        return this.fakeInstance.foo() === 4;
      });
    });
    Then(function() {
      return td.when(this.fakeConstructor.bar()).thenReturn(5)() === 5;
    });
    Then(function() {
      return td.when(this.fakeInstance.biz()).thenReturn(6)() === 6;
    });
    Then(function() {
      return this.fakeConstructor.toString() === '[test double for "Thing"]';
    });
    Then(function() {
      return this.fakeConstructor.prototype.foo.toString() === '[test double for "Thing.prototype.foo"]';
    });
    Then(function() {
      return this.fakeConstructor.bar.toString() === '[test double for "Thing.bar"]';
    });
    Then(function() {
      return td.explain(this.fakeConstructor.secretStaticFunc).isTestDouble === true;
    });
    Then(function() {
      return td.explain(this.fakeInstance.secretFunc).isTestDouble === true;
    });
    Then(function() {
      return this.fakeInstance instanceof Thing;
    });
    Then(function() {
      return this.fakeConstructor.prototype.instanceAttr === 'baz';
    });
    Then(function() {
      return this.fakeInstance.instanceAttr === 'baz';
    });
    return Then(function() {
      return this.fakeConstructor.staticAttr === 'qux';
    });
  });
  describe('being given an array of function names', function() {
    Given(function() {
      return this.fakeConstructor = td.constructor(['foo', 'bar']);
    });
    Given(function() {
      return this.fakeInstance = new this.fakeConstructor('biz');
    });
    Then(function() {
      return this.fakeConstructor.prototype.foo === this.fakeInstance.foo;
    });
    And(function() {
      return td.verify(new this.fakeConstructor('biz'));
    });
    And(function() {
      return td.explain(this.fakeInstance.foo).isTestDouble === true;
    });
    And(function() {
      return td.explain(this.fakeInstance.bar).isTestDouble === true;
    });
    And(function() {
      return this.fakeConstructor.toString() === '[test double for "(unnamed constructor)"]';
    });
    And(function() {
      return this.fakeInstance.toString() === '[test double instance of constructor]';
    });
    return And(function() {
      return this.fakeInstance.foo.toString() === '[test double for "#foo"]';
    });
  });
  return describe('edge case: being given a function without prototypal methods', function() {
    Given(function() {
      return this.boringFunc = function() {};
    });
    Given(function() {
      return this.boringFunc.foo = function() {};
    });
    When(function() {
      return this.fakeFunc = td.constructor(this.boringFunc);
    });
    return Then(function() {
      return td.explain(this.fakeFunc.foo).isTestDouble === true;
    });
  });
});


},{}],320:[function(require,module,exports){
describe('.explain', function() {
  Given(function() {
    return this.testDouble = td["function"]();
  });
  When(function() {
    return this.result = td.explain(this.testDouble);
  });
  context('a brand new test double', function() {
    return Then(function() {
      return expect(this.result).to.deep.eq({
        name: void 0,
        calls: [],
        callCount: 0,
        description: "This test double has 0 stubbings and 0 invocations.",
        isTestDouble: true
      });
    });
  });
  context('a named test double', function() {
    Given(function() {
      return this.testDouble = td["function"]("foobaby");
    });
    Then(function() {
      return expect(this.result.description).to.deep.eq("This test double `foobaby` has 0 stubbings and 0 invocations.");
    });
    return And(function() {
      return this.result.name === "foobaby";
    });
  });
  context('a double with some interactions', function() {
    Given(function() {
      return td.when(this.testDouble(88)).thenReturn(5);
    });
    Given(function() {
      return td.when(this.testDouble("two things!")).thenReturn("woah", "such");
    });
    Given(function() {
      return this.testDouble(88);
    });
    Given(function() {
      return this.testDouble("not 88", 44);
    });
    return Then(function() {
      return expect(this.result).to.deep.eq({
        name: void 0,
        calls: [
          {
            context: this,
            args: [88]
          }, {
            context: this,
            args: ["not 88", 44]
          }
        ],
        callCount: 2,
        description: "This test double has 2 stubbings and 2 invocations.\n\nStubbings:\n  - when called with `(88)`, then return `5`.\n  - when called with `(\"two things!\")`, then return `\"woah\"`, then `\"such\"`.\n\nInvocations:\n  - called with `(88)`.\n  - called with `(\"not 88\", 44)`.",
        isTestDouble: true
      });
    });
  });
  context('a double with callback', function() {
    Given(function() {
      return td.when(this.testDouble(14)).thenCallback(null, 8);
    });
    return Then(function() {
      return expect(this.result).to.deep.eq({
        name: void 0,
        calls: [],
        callCount: 0,
        description: "This test double has 1 stubbings and 0 invocations.\n\nStubbings:\n  - when called with `(14, callback)`, then callback `(null, 8)`.",
        isTestDouble: true
      });
    });
  });
  context('a double with resolve', function() {
    Given(function() {
      return td.when(this.testDouble(14)).thenResolve(8);
    });
    return Then(function() {
      return expect(this.result).to.deep.eq({
        name: void 0,
        calls: [],
        callCount: 0,
        description: "This test double has 1 stubbings and 0 invocations.\n\nStubbings:\n  - when called with `(14)`, then resolve `8`.",
        isTestDouble: true
      });
    });
  });
  context('a double with reject', function() {
    Given(function() {
      return td.when(this.testDouble(14)).thenReject(8);
    });
    return Then(function() {
      return expect(this.result).to.deep.eq({
        name: void 0,
        calls: [],
        callCount: 0,
        description: "This test double has 1 stubbings and 0 invocations.\n\nStubbings:\n  - when called with `(14)`, then reject `8`.",
        isTestDouble: true
      });
    });
  });
  return context('passed a non-test double', function() {
    Given(function() {
      return this.testDouble = 42;
    });
    return Then(function() {
      return expect(this.result).to.deep.eq({
        name: void 0,
        calls: [],
        callCount: 0,
        description: "This is not a test double.",
        isTestDouble: false
      });
    });
  });
});


},{}],321:[function(require,module,exports){
var extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

describe('td.function', function() {
  context('.toString', function() {
    Then(function() {
      return td["function"]('boo!').toString() === '[test double for "boo!"]';
    });
    Then(function() {
      return td["function"]().toString() === '[test double (unnamed)]';
    });
    Then(function() {
      return td["function"](function() {}).toString() === '[test double for "(anonymous function)"]';
    });
    return Then(function() {
      var Lol;
      return td["function"](Lol = (function() {
        function Lol() {}

        return Lol;

      })()).toString() === '[test double for "Lol"]';
    });
  });
  return context('copying properties on functions', function() {
    Given(function() {
      return this.func = function() {};
    });
    Given(function() {
      return this.func.foo = function() {};
    });
    Given(function() {
      return this.func.bar = 42;
    });
    When(function() {
      return this.result = td["function"](this.func);
    });
    Then(function() {
      return this.result.toString() === '[test double for "(anonymous function)"]';
    });
    Then(function() {
      return this.result.foo.toString() === '[test double for ".foo"]';
    });
    Then(function() {
      return this.result.bar === 42;
    });
    context('inherited props too', function() {
      Given(function() {
        var Thing;
        return this.Thing = Thing = (function() {
          function Thing() {}

          return Thing;

        })();
      });
      Given(function() {
        return this.Thing.staticFunc = function() {};
      });
      Given(function() {
        return this.Thing.staticProp = 42;
      });
      Given(function() {
        var SubThing;
        return this.SubThing = SubThing = (function(superClass) {
          extend(SubThing, superClass);

          function SubThing() {
            return SubThing.__super__.constructor.apply(this, arguments);
          }

          return SubThing;

        })(this.Thing);
      });
      When(function() {
        return this.result = td.func(this.SubThing);
      });
      Then(function() {
        return td.explain(this.result.staticFunc).isTestDouble === true;
      });
      return Then(function() {
        return this.result.staticProp === 42;
      });
    });
    return context('non-enumerable props too', function() {
      Given(function() {
        return this.func = function() {};
      });
      Given(function() {
        return Object.defineProperties(this.func, {
          foo: {
            value: function() {},
            enumerable: false
          },
          bar: {
            value: 42,
            enumerable: false
          }
        });
      });
      When(function() {
        return this.result = td.func(this.func);
      });
      Then(function() {
        return td.explain(this.result.foo).isTestDouble === true;
      });
      return Then(function() {
        return this.result.bar === 42;
      });
    });
  });
});


},{}],322:[function(require,module,exports){
(function (global){
describe('log', function() {
  Given(function() {
    return this.subject = require('../../src/log')["default"];
  });
  describe('.warn', function() {
    Given(function() {
      return this.ogWarn = console.warn;
    });
    afterEach(function() {
      return console.warn = this.ogWarn;
    });
    context('when console.warn is a thing', function() {
      Given(function() {
        return this.warnings = [];
      });
      Given(function() {
        return console.warn = (function(_this) {
          return function(msg) {
            return _this.warnings.push(msg);
          };
        })(this);
      });
      context('no URL', function() {
        When(function() {
          return this.subject.warn('td.someFunc', 'ugh');
        });
        return Then(function() {
          return this.warnings[0] === 'Warning: testdouble.js - td.someFunc - ugh';
        });
      });
      context('with a documentation URL', function() {
        When(function() {
          return this.subject.warn('td.someFunc', 'ugh', 'http?');
        });
        return Then(function() {
          return this.warnings[0] === 'Warning: testdouble.js - td.someFunc - ugh (see: http? )';
        });
      });
      return context('with td.config({ignoreWarnings: true})', function() {
        Given(function() {
          return td.config({
            ignoreWarnings: true
          });
        });
        When(function() {
          return this.subject.warn('waaaarning');
        });
        return Then(function() {
          return this.warnings.length === 0;
        });
      });
    });
    context('when console.warn does not exist', function() {
      Given(function() {
        return console.warn = void 0;
      });
      When(function() {
        return this.subject.warn('lolololol', 'lol');
      });
      return Then(function() {});
    });
    return context('when console does not exist', function() {
      Given(function() {
        return this.ogConsole = console;
      });
      Given(function() {
        return delete global.console;
      });
      When(function() {
        return this.subject.warn('lolololol', 'lol');
      });
      Then(function() {});
      return afterEach(function() {
        return global.console = this.ogConsole;
      });
    });
  });
  describe('.error', function() {
    context('suppressErrors: true', function() {
      Given(function() {
        return td.config({
          suppressErrors: true
        });
      });
      When(function() {
        return this.subject.error('hi', 'hi');
      });
      return Then(function() {});
    });
    context('without url', function() {
      When(function() {
        var e;
        try {
          return this.subject.error('td.lol', 'oops');
        } catch (error) {
          e = error;
          return this.error = e;
        }
      });
      return Then(function() {
        return this.error.message = "Error: testdouble.js - td.lol - oops";
      });
    });
    return context('with url', function() {
      When(function() {
        var e;
        try {
          return this.subject.error('td.lol', 'oops', 'ftp:');
        } catch (error) {
          e = error;
          return this.error = e;
        }
      });
      return Then(function() {
        return this.error.message = "Error: testdouble.js - td.lol - oops (see: ftp:)";
      });
    });
  });
  return describe('.fail', function() {
    When(function() {
      var e;
      try {
        return this.subject.fail('boom. failed.');
      } catch (error) {
        e = error;
        return this.error = e;
      }
    });
    return Then(function() {
      return this.error.message === 'boom. failed.';
    });
  });
});


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../src/log":347}],323:[function(require,module,exports){
var matches;

matches = function(expected, actual) {
  return require('../../src/args-match')["default"]([expected], [actual], {});
};

describe('.matchers', function() {
  Given(function() {
    return this.matches = matches;
  });
  describe('.create', function() {
    Given(function() {
      return this.matcher = td.matchers.create({
        name: 'isSame',
        matches: function(matcherArgs, actual) {
          return matcherArgs[0] === actual;
        },
        onCreate: function(matcherInstance, matcherArgs) {
          return matcherInstance.__args = matcherArgs;
        }
      });
    });
    When(function() {
      return this.matcherInstance = this.matcher('foo');
    });
    Then(function() {
      return this.matcherInstance.__name === 'isSame("foo")';
    });
    And(function() {
      return this.matcherInstance.__matches('foo') === true;
    });
    And(function() {
      return this.matcherInstance.__matches('bar') === false;
    });
    And(function() {
      return expect(this.matcherInstance.__args).to.deep.eq(['foo']);
    });
    context('name is a function', function() {
      Given(function() {
        return this.matcher = td.matchers.create({
          name: function(matcherArgs) {
            return "isThing(" + matcherArgs[0].name + ")";
          },
          matches: function() {
            return true;
          }
        });
      });
      When(function() {
        return this.matcherInstance = this.matcher(String);
      });
      return Then(function() {
        return this.matcherInstance.__name === 'isThing(String)';
      });
    });
    return context('no name or onCreate given', function() {
      Given(function() {
        return this.matcher = td.matchers.create({
          matches: function() {
            return true;
          }
        });
      });
      When(function() {
        return this.matcherInstance = this.matcher('bar');
      });
      return Then(function() {
        return this.matcherInstance.__name === '[Matcher for ("bar")]';
      });
    });
  });
  describe('.isA', function() {
    context('numbers', function() {
      Given(function() {
        return this.matcher = td.matchers.isA(Number);
      });
      Then(function() {
        return this.matches(this.matcher, 5) === true;
      });
      Then(function() {
        return this.matches(this.matcher, new Number(5)) === true;
      });
      Then(function() {
        return this.matches(this.matcher, Number(5)) === true;
      });
      Then(function() {
        return this.matches(this.matcher, Number("foo")) === true;
      });
      return Then(function() {
        return this.matches(this.matcher, "foo") === false;
      });
    });
    context('strings', function() {
      Given(function() {
        return this.matcher = td.matchers.isA(String);
      });
      Then(function() {
        return this.matches(this.matcher, 5) === false;
      });
      Then(function() {
        return this.matches(this.matcher, "plop") === true;
      });
      Then(function() {
        return this.matches(this.matcher, String("plop")) === true;
      });
      return Then(function() {
        return this.matches(this.matcher, new String("plop")) === true;
      });
    });
    context('booleans', function() {
      Given(function() {
        return this.matcher = td.matchers.isA(Boolean);
      });
      Then(function() {
        return this.matches(this.matcher, false) === true;
      });
      Then(function() {
        return this.matches(this.matcher, true) === true;
      });
      Then(function() {
        return this.matches(this.matcher, Boolean(false)) === true;
      });
      Then(function() {
        return this.matches(this.matcher, new Boolean(false)) === true;
      });
      Then(function() {
        return this.matches(this.matcher, "false") === false;
      });
      return Then(function() {
        return this.matches(this.matcher, void 0) === false;
      });
    });
    context('other junk', function() {
      Then(function() {
        return this.matches(td.matchers.isA(Array), []) === true;
      });
      Then(function() {
        return this.matches(td.matchers.isA(Object), []) === true;
      });
      Then(function() {
        return this.matches(td.matchers.isA(Date), new Date()) === true;
      });
      return Then(function() {
        return this.matches(td.matchers.isA(Date), new Object()) === false;
      });
    });
    return context('names', function() {
      Then(function() {
        return td.matchers.isA({
          name: 'Poo'
        }).__name === 'isA(Poo)';
      });
      return Then(function() {
        return td.matchers.isA({
          nope: 'foo'
        }).__name === 'isA({nope: "foo"})';
      });
    });
  });
  describe('.anything', function() {
    Then(function() {
      return this.matches(td.matchers.anything(), null) === true;
    });
    Then(function() {
      return this.matches(td.matchers.anything(), void 0) === true;
    });
    Then(function() {
      return this.matches(td.matchers.anything(), new Date()) === true;
    });
    return Then(function() {
      return this.matches(td.matchers.anything(), {
        a: 'foo',
        b: 'bar'
      }) === true;
    });
  });
  describe('.contains', function() {
    context('strings', function() {
      Then(function() {
        return this.matches(td.matchers.contains('bar'), 'foobarbaz') === true;
      });
      return Then(function() {
        return this.matches(td.matchers.contains('biz'), 'foobarbaz') === false;
      });
    });
    context('arrays', function() {
      Then(function() {
        return this.matches(td.matchers.contains('a'), ['a', 'b', 'c']) === true;
      });
      Then(function() {
        return this.matches(td.matchers.contains('a', 'c'), ['a', 'b', 'c']) === true;
      });
      Then(function() {
        return this.matches(td.matchers.contains(['a', 'c']), ['a', 'b', 'c']) === false;
      });
      Then(function() {
        return this.matches(td.matchers.contains(['a', 'c']), [1, ['a', 'c'], 4]) === true;
      });
      Then(function() {
        return this.matches(td.matchers.contains(['a', 'c']), ['a', 'b', 'z']) === false;
      });
      Then(function() {
        return this.matches(td.matchers.contains(true, 5, null, void 0), [true, 5, void 0, null]) === true;
      });
      return Then(function() {
        return this.matches(td.matchers.contains(true, 5, null, void 0), [true, 5, null]) === false;
      });
    });
    context('objects', function() {
      Then(function() {
        return this.matches(td.matchers.contains({
          foo: 'bar',
          baz: 42
        }), {
          foo: 'bar',
          baz: 42,
          stuff: this
        }) === true;
      });
      Then(function() {
        return this.matches(td.matchers.contains({
          foo: 'bar',
          lol: 42
        }), {
          foo: 'bar',
          baz: 42
        }) === false;
      });
      Then(function() {
        return this.matches(td.matchers.contains({
          lol: {
            deep: [4, 2]
          }
        }), {
          lol: {
            deep: [4, 2],
            other: "stuff"
          }
        }) === true;
      });
      Then(function() {
        return this.matches(td.matchers.contains({
          deep: {
            thing: 'stuff'
          }
        }), {}) === false;
      });
      Then(function() {
        return this.matches(td.matchers.contains({
          deep: {
            thing: 'stuff'
          }
        }), {
          deep: {
            thing: 'stuff',
            shallow: 5
          }
        }) === true;
      });
      return Then(function() {
        return this.matches(td.matchers.contains({
          container: {
            size: 'S'
          }
        }), {
          ingredient: 'beans',
          container: {
            type: 'cup',
            size: 'S'
          }
        }) === true;
      });
    });
    context('regexp', function() {
      Then(function() {
        return this.matches(td.matchers.contains(/abc/), 'abc') === true;
      });
      Then(function() {
        return this.matches(td.matchers.contains(/abc/), {
          foo: 'bar'
        }) === false;
      });
      return Then(function() {
        return this.matches(td.matchers.contains(/abc/), ['foo', 'bar']) === false;
      });
    });
    return context('nonsense', function() {
      Then(function() {
        return this.matches(td.matchers.contains(42), 42) === false;
      });
      Then(function() {
        return this.matches(td.matchers.contains(null), 'shoo') === false;
      });
      Then(function() {
        return this.matches(td.matchers.contains(), 'shoo') === false;
      });
      return Then(function() {
        return this.matches(td.matchers.contains({}), void 0) === false;
      });
    });
  });
  describe('argThat', function() {
    Then(function() {
      return this.matches(td.matchers.argThat(function(arg) {
        return arg > 5;
      }), 6) === true;
    });
    return Then(function() {
      return this.matches(td.matchers.argThat(function(arg) {
        return arg > 5;
      }), 5) === false;
    });
  });
  return describe('not', function() {
    Then(function() {
      return this.matches(td.matchers.not(5), 6) === true;
    });
    Then(function() {
      return this.matches(td.matchers.not(5), 5) === false;
    });
    return Then(function() {
      return this.matches(td.matchers.not(['hi']), ['hi']) === false;
    });
  });
});


},{"../../src/args-match":331}],324:[function(require,module,exports){
(function (global){
describe('td.object', function() {
  describe('making a test double based on a plain object funcbag', function() {
    Given(function() {
      return this.funcBag = {
        lol: function() {},
        kek: function() {},
        now: function() {},
        otherThing: 8
      };
    });
    Given(function() {
      return this.testDouble = td.object(this.funcBag);
    });
    When(function() {
      return td.when(this.testDouble.kek()).thenReturn('nay!');
    });
    Then(function() {
      return this.testDouble.kek() === 'nay!';
    });
    And(function() {
      return this.testDouble.toString() === '[test double object]';
    });
    And(function() {
      return this.testDouble.now.toString() === '[test double for ".now"]';
    });
    return And(function() {
      return this.testDouble.otherThing === 8;
    });
  });
  describe('creating an object that is an instance of a prototypal thing', function() {
    Given(function() {
      var Thing;
      return this.type = Thing = (function() {
        function Thing() {}

        Thing.prototype.foo = function() {
          return 'bar';
        };

        return Thing;

      })();
    });
    When(function() {
      return this.testDouble = td.object(new this.type());
    });
    return Then(function() {
      return td.explain(this.testDouble.foo).isTestDouble === true;
    });
  });
  describe('making a test double based on an array of strings', function() {
    Given(function() {
      return this.testDouble = td.object(['biz', 'bam', 'boo']);
    });
    When(function() {
      return td.when(this.testDouble.biz()).thenReturn('zing!');
    });
    Then(function() {
      return this.testDouble.biz() === 'zing!';
    });
    And(function() {
      return this.testDouble.toString() === '[test double object]';
    });
    return And(function() {
      return this.testDouble.bam.toString() === '[test double for ".bam"]';
    });
  });
  describe('passing a function to td.object erroneously (1.x)', function() {
    When(function() {
      var e;
      try {
        return td.object(function() {});
      } catch (error1) {
        e = error1;
        return this.result = e;
      }
    });
    return Then(function() {
      return expect(this.result.message).to.contain("Please use `td.function()` or `td.constructor()` instead");
    });
  });
  describe('passing an Object.create()d thing', function() {
    When(function() {
      return this.testDouble = td.object(Object.create({
        respond: function() {
          return 'no';
        }
      }));
    });
    return Then(function() {
      return td.explain(this.testDouble.respond).isTestDouble === true;
    });
  });
  if (global.Proxy != null) {
    return describe('creating a proxy object (ES2015; only supported in FF + Edge atm)', function() {
      Given(function() {
        return this.testDouble = td.object('thing');
      });
      Given(function() {
        return this.testDouble.magic('sauce');
      });
      When(function() {
        return td.when(this.testDouble.whateverYouWant()).thenReturn('YESS');
      });
      Then(function() {
        return td.verify(this.testDouble.magic('sauce'));
      });
      And(function() {
        return this.testDouble.whateverYouWant() === 'YESS';
      });
      And(function() {
        return this.testDouble.toString() === '[test double object for "thing"]';
      });
      And(function() {
        return this.testDouble.foo.toString() === '[test double for "thing.foo"]';
      });
      context('with custom excludeMethods definitions', function() {
        Given(function() {
          return this.testDouble = td.object('Stuff', {
            excludeMethods: ['then', 'fun']
          });
        });
        return Then(function() {
          return this.testDouble.fun === void 0;
        });
      });
      return context('unnamed double', function() {
        Given(function() {
          return this.testDouble = td.object();
        });
        Then(function() {
          return this.testDouble.toString() === '[test double object]';
        });
        return Then(function() {
          return this.testDouble.lol.toString() === '[test double for ".lol"]';
        });
      });
    });
  } else {
    return describe('getting an error message', function() {
      When(function() {
        var error;
        try {
          return td.object('Woah');
        } catch (error1) {
          error = error1;
          return this.error = error;
        }
      });
      return Then(function() {
        return this.error.message === "Error: testdouble.js - td.object - The current runtime does not have Proxy support, which is what\ntestdouble.js depends on when a string name is passed to `td.object()`.\n\nMore details here:\n  https://github.com/testdouble/testdouble.js/blob/master/docs/4-creating-test-doubles.md#objectobjectname\n\nDid you mean `td.object(['Woah'])`?";
      });
    });
  }
});


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],325:[function(require,module,exports){
describe('td.replace', function() {
  describe('Replacing properties on objects and restoring them with reset', function() {
    Given(function() {
      var Thing;
      return this.dependency = {
        honk: function() {
          return 'og honk';
        },
        thingConstructor: Thing = (function() {
          function Thing() {}

          Thing.prototype.foo = function() {
            return 'og foo';
          };

          Thing.prototype.bar = function() {
            return 'og bar';
          };

          return Thing;

        })()
      };
    });
    describe('Replacing a function', function() {
      When(function() {
        return this.double = td.replace(this.dependency, 'honk');
      });
      Then(function() {
        return td.explain(this.double).isTestDouble === true;
      });
      And(function() {
        return this.double === this.dependency.honk;
      });
      return describe('reset restores it', function() {
        When(function() {
          return td.reset();
        });
        Then(function() {
          return td.explain(this.double).isTestDouble === false;
        });
        return And(function() {
          return this.dependency.honk() === 'og honk';
        });
      });
    });
    describe('Replacing a constructor function', function() {
      When(function() {
        return this.fakeConstructor = td.replace(this.dependency, 'thingConstructor');
      });
      Then(function() {
        return td.explain(this.fakeConstructor.prototype.foo).isTestDouble === true;
      });
      Then(function() {
        return td.explain(this.fakeConstructor.prototype.bar).isTestDouble === true;
      });
      And(function() {
        return this.fakeConstructor.prototype.foo === new this.dependency.thingConstructor().foo;
      });
      And(function() {
        return this.fakeConstructor.prototype.bar === new this.dependency.thingConstructor().bar;
      });
      return describe('reset restores it', function() {
        When(function() {
          return td.reset();
        });
        Then(function() {
          return td.explain(new this.dependency.thingConstructor().foo).isTestDouble === false;
        });
        return And(function() {
          return new this.dependency.thingConstructor().foo() === 'og foo';
        });
      });
    });
    describe('Replacing an ES6 constructor function', function() {
      if (!ES_CLASS_SUPPORT) {
        return;
      }
      Given(function() {
        return this.dependency.es6constructor = require('../../fixtures/es6class');
      });
      Given(function() {
        return this.fakeConstructor = td.replace(this.dependency, 'es6constructor');
      });
      Given(function() {
        return this.es6Thing = new this.dependency.es6constructor();
      });
      Then(function() {
        return td.explain(this.fakeConstructor.prototype.foo).isTestDouble === true;
      });
      Then(function() {
        return td.explain(this.fakeConstructor.prototype.bar).isTestDouble === true;
      });
      Then(function() {
        return this.fakeConstructor.prototype.foo === this.es6Thing.foo;
      });
      Then(function() {
        return this.fakeConstructor.prototype.bar === this.es6Thing.bar;
      });
      describe('the member td functions actually work', function() {
        Given(function() {
          return td.when(this.fakeConstructor.prototype.foo('cat')).thenReturn('dog');
        });
        return Then(function() {
          return this.es6Thing.foo('cat') === 'dog';
        });
      });
      return describe('reset restores it', function() {
        When(function() {
          return td.reset();
        });
        Then(function() {
          return td.explain(new this.dependency.es6constructor().foo).isTestDouble === false;
        });
        return And(function() {
          return new this.dependency.es6constructor().foo() === 'og foo';
        });
      });
    });
    describe('Replacing a method on an object instantiated with `new`', function() {
      Given(function() {
        return this.thing = new this.dependency.thingConstructor();
      });
      When(function() {
        return this.doubleFoo = td.replace(this.thing, 'foo');
      });
      Then(function() {
        return td.explain(this.thing.foo).isTestDouble === true;
      });
      And(function() {
        return this.thing.foo() === void 0;
      });
      return describe('reset restores it', function() {
        When(function() {
          return td.reset();
        });
        Then(function() {
          return td.explain(this.thing.foo).isTestDouble === false;
        });
        return And(function() {
          return this.thing.foo() === 'og foo';
        });
      });
    });
    describe('Replacing an object / function bag', function() {
      Given(function() {
        return this.horseClass = function() {};
      });
      Given(function() {
        return this.horseClass.prototype.nay = function() {
          return 'nay';
        };
      });
      Given(function() {
        return this.dependency.animals = {
          bark: function() {
            return 'og bark';
          },
          woof: function() {
            return 'og woof';
          },
          age: 18,
          horse: this.horseClass
        };
      });
      When(function() {
        return this.doubleBag = td.replace(this.dependency, 'animals');
      });
      Then(function() {
        return td.explain(this.doubleBag.bark).isTestDouble === true;
      });
      Then(function() {
        return td.explain(this.doubleBag.woof).isTestDouble === true;
      });
      And(function() {
        return this.doubleBag.bark === this.dependency.animals.bark;
      });
      And(function() {
        return this.doubleBag.woof === this.dependency.animals.woof;
      });
      And(function() {
        return this.doubleBag.age === 18;
      });
      return describe('instantiable types work too', function() {
        When(function() {
          return td.when(this.doubleBag.horse.prototype.nay('hay')).thenReturn('no way');
        });
        return Then(function() {
          return (new this.dependency.animals.horse()).nay('hay') === 'no way';
        });
      });
    });
    describe('Replacing an object with Object.create', function() {
      Given(function() {
        return this.dependency = {
          foo: Object.create({
            bar: function() {}
          })
        };
      });
      When(function() {
        return td.replace(this.dependency, 'foo');
      });
      return Then(function() {
        return td.explain(this.dependency.foo.bar).isTestDouble === true;
      });
    });
    describe('Replacing a property that is not an object/function', function() {
      When(function() {
        return this.result = td.replace(this.dependency, 'badType');
      });
      context('a number', function() {
        Given(function() {
          return this.dependency.badType = 5;
        });
        return Then(function() {
          return this.result === 5;
        });
      });
      context('a string', function() {
        Given(function() {
          return this.dependency.badType = "hello";
        });
        return Then(function() {
          return this.result === "hello";
        });
      });
      context('null', function() {
        Given(function() {
          return this.dependency.badType = null;
        });
        return Then(function() {
          return this.result === null;
        });
      });
      return context('undefined', function() {
        Given(function() {
          return this.dependency.badType = void 0;
        });
        return Then(function() {
          return this.result === void 0;
        });
      });
    });
    describe('Replacing a non-existent property', function() {
      context('using automatic replacement', function() {
        When(function() {
          var e;
          try {
            return td.replace(this.dependency, 'notAThing');
          } catch (error) {
            e = error;
            return this.error = e;
          }
        });
        return Then(function() {
          return this.error.message === 'Error: testdouble.js - td.replace - No "notAThing" property was found.';
        });
      });
      return context('with manual replacement', function() {
        Given(function() {
          return this.myFake = td.replace(this.dependency, 'notAThing', 'MY FAKE');
        });
        Then(function() {
          return this.myFake === 'MY FAKE';
        });
        And(function() {
          return this.myFake === this.dependency.notAThing;
        });
        return context('is deleted following a reset', function() {
          Given(function() {
            return td.reset();
          });
          return Then(function() {
            return this.dependency.hasOwnProperty('notAThing') === false;
          });
        });
      });
    });
    return describe('Manually specifying the override', function() {
      Given(function() {
        return this.ogWarn = console.warn;
      });
      Given(function() {
        return this.warnings = [];
      });
      Given(function() {
        return console.warn = (function(_this) {
          return function(msg) {
            return _this.warnings.push(msg);
          };
        })(this);
      });
      afterEach(function() {
        return console.warn = this.ogWarn;
      });
      context('with a matching type', function() {
        Given(function() {
          return this.originalHonk = this.dependency.honk;
        });
        When(function() {
          return this.myDouble = td.replace(this.dependency, 'honk', function() {
            return 'FAKE THING';
          });
        });
        Then(function() {
          return this.myDouble() === 'FAKE THING';
        });
        And(function() {
          return this.myDouble === this.dependency.honk;
        });
        And(function() {
          return this.warnings.length === 0;
        });
        return context('is restored following a reset', function() {
          When(function() {
            return td.reset();
          });
          return Then(function() {
            return this.dependency.honk === this.originalHonk;
          });
        });
      });
      context('with mismatched types', function() {
        Given(function() {
          return this.dependency.lol = 5;
        });
        When(function() {
          return td.replace(this.dependency, 'lol', 'foo');
        });
        return Then(function() {
          return this.warnings[0] === "Warning: testdouble.js - td.replace - property \"lol\" 5 (Number) was replaced with \"foo\", which has a different type (String).";
        });
      });
      return context('where the actual is not defined', function() {
        When(function() {
          return td.replace(this.dependency, 'naw', 'lol');
        });
        return Then(function() {
          return this.warnings.length === 0;
        });
      });
    });
  });
  return describe('Node.js-specific module replacement', function() {
    if (!NODE_JS) {
      return;
    }
    Given(function() {
      return this.passenger = td.replace('../../fixtures/passenger');
    });
    Given(function() {
      return this.honk = td.replace('../../fixtures/honk');
    });
    Given(function() {
      return this.turn = td.replace('../../fixtures/turn');
    });
    Given(function() {
      return this.shift = td.replace('../../fixtures/shift');
    });
    Given(function() {
      return this.brake = td.replace('../../fixtures/brake', 'ANYTHING I WANT');
    });
    Given(function() {
      return this.lights = td.replace('../../fixtures/lights');
    });
    Given(function() {
      return this.isNumber = td.replace('is-number');
    });
    Given(function() {
      return this.car = require('../../fixtures/car');
    });
    describe('quibbling prototypal constructors get created with td.object(Type)', function() {
      Given(function() {
        return td.when(this.passenger.prototype.sit()).thenReturn('ow');
      });
      When(function() {
        return this.result = this.car.seatPassenger();
      });
      return Then(function() {
        return this.result === 'ow';
      });
    });
    describe('quibbling plain old functions with td.function()', function() {
      return Then(function() {
        return this.car.honk.toString() === "[test double for \"../../fixtures/honk: (anonymous function)\"]";
      });
    });
    describe('naming the doubles of functions with names', function() {
      Given(function() {
        return td.when(this.car.turn()).thenReturn('wee');
      });
      Then(function() {
        return this.car.turn() === 'wee';
      });
      And(function() {
        return this.car.turn.toString() === "[test double for \"../../fixtures/turn: turn\"]";
      });
      Given(function() {
        return td.when(this.car.shift()).thenReturn('Vroom');
      });
      return Then(function() {
        return this.car.shift() === 'Vroom';
      });
    });
    describe('faking property on exported function', function() {
      Given(function() {
        return td.when(this.car.shift.neutral()).thenReturn('Clunk');
      });
      return Then(function() {
        return this.car.shift.neutral() === 'Clunk';
      });
    });
    describe('manually stubbing an entry', function() {
      return Then(function() {
        return this.car.brake === 'ANYTHING I WANT';
      });
    });
    describe('an object of funcs', function() {
      Then(function() {
        return this.car.lights.headlight.toString() === '[test double for "../../fixtures/lights: .headlight"]';
      });
      And(function() {
        return this.car.lights.turnSignal.toString() === '[test double for "../../fixtures/lights: .turnSignal"]';
      });
      And(function() {
        return this.car.lights.count === 4;
      });
      return describe('and classes on objects on funcs', function() {
        When(function() {
          return td.when(this.lights.brights.prototype.beBright(1)).thenReturn('yow');
        });
        return Then(function() {
          return (new this.car.lights.brights).beBright(1) === 'yow';
        });
      });
    });
    describe('faking a 3rd party module', function() {
      Given(function() {
        return td.when(this.isNumber('a speed')).thenReturn(true);
      });
      return Then(function() {
        return this.car.isASpeed('a speed') === true;
      });
    });
    return describe('post-reset usage', function() {
      Given(function() {
        return td.reset();
      });
      When(function() {
        var e;
        try {
          return require('../../fixtures/car');
        } catch (error) {
          e = error;
          return this.error = e;
        }
      });
      return Then(function() {
        return this.error.message === "Cannot find module './brake'";
      });
    });
  });
});


},{"../../fixtures/car":307,"../../fixtures/es6class":308}],326:[function(require,module,exports){
describe('store', function() {
  Given(function() {
    return this.subject = require('../../../src/store')["default"];
  });
  return describe('.onReset', function() {
    Given(function() {
      return this.subject.onReset((function(_this) {
        return function() {
          return _this.result = 'yay';
        };
      })(this));
    });
    When(function() {
      return this.subject.reset();
    });
    return Then(function() {
      return this.result === 'yay';
    });
  });
});


},{"../../../src/store":363}],327:[function(require,module,exports){
describe('stringify/anything', function() {
  Given(function() {
    return this.subject = require('../../../src/stringify/anything')["default"];
  });
  Then(function() {
    return this.subject(void 0) === "undefined";
  });
  And(function() {
    return this.subject(null) === "null";
  });
  And(function() {
    return this.subject(0) === "0";
  });
  And(function() {
    return this.subject("foo") === '"foo"';
  });
  And(function() {
    return this.subject(false) === 'false';
  });
  context('short strings of objects should be one-lined', function() {
    return Then(function() {
      return expect(this.subject({
        userId: 42,
        name: 'Jane'
      })).to.eq('{userId: 42, name: "Jane"}');
    });
  });
  context('matchers', function() {
    Then(function() {
      return this.subject(td.matchers.isA(Number)) === 'isA(Number)';
    });
    return Then(function() {
      return expect(this.subject({
        val: td.matchers.isA(Number)
      })).to.eq('{val: isA(Number)}');
    });
  });
  context('long strings of objects should be multi-lined', function() {
    Given(function() {
      return this.object = {
        userId: 42,
        name: 'Jane',
        details: {
          kids: ['jack', 'jill']
        }
      };
    });
    Given(function() {
      return this.object.circular = this.object;
    });
    return Then(function() {
      return expect(this.subject(this.object)).to.eq("{\n  userId: 42,\n  name: \"Jane\",\n  details: {kids: [\"jack\", \"jill\"]},\n  circular: \"[Circular]\"\n}");
    });
  });
  context('short strings should have quotes escaped', function() {
    Given(function() {
      return this.shortString = 'hey "justin"!';
    });
    return Then(function() {
      return expect(this.subject(this.shortString)).to.eq('"hey \\\"justin\\\"!"');
    });
  });
  return context('multiline strings should be heredoc-d', function() {
    Given(function() {
      return this.longString = "ojsaodjasiodjsaodijsado asj asodjaosdj asodjsaoidjsa odjasoidjasodjas\nasdojsadojdosajodsajd saoji joasdjoajsd\nasdjoj\n\nasdojasdoajsdoasjdaosjdoasjsaodjoadjoasjdojasdojsaodijsaidojojsoidjasodij\naoso";
    });
    return Then(function() {
      return expect(this.subject(this.longString)).to.eq("\"\"\"\n" + this.longString + "\n\"\"\"");
    });
  });
});


},{"../../../src/stringify/anything":365}],328:[function(require,module,exports){
describe("td.*", function() {
  return describe("where all the functions are", function() {
    Then(function() {
      return td.when === require('../../src/when')["default"];
    });
    Then(function() {
      return td.verify === require('../../src/verify')["default"];
    });
    Then(function() {
      return td["function"] === require('../../src/function')["default"];
    });
    Then(function() {
      return td.func === require('../../src/function')["default"];
    });
    Then(function() {
      return td.object === require('../../src/object')["default"];
    });
    Then(function() {
      return td.constructor === require('../../src/constructor')["default"];
    });
    Then(function() {
      return td.matchers === require('../../src/matchers')["default"];
    });
    Then(function() {
      return td.callback === require('../../src/callback')["default"];
    });
    Then(function() {
      return td.explain === require('../../src/explain')["default"];
    });
    Then(function() {
      return td.reset === require('../../src/reset')["default"];
    });
    Then(function() {
      return td.replace === require('../../src/replace')["default"];
    });
    return Then(function() {
      return td.version === require('../../package').version;
    });
  });
});


},{"../../package":305,"../../src/callback":332,"../../src/constructor":334,"../../src/explain":335,"../../src/function":336,"../../src/matchers":355,"../../src/object":357,"../../src/replace":358,"../../src/reset":361,"../../src/verify":367,"../../src/when":369}],329:[function(require,module,exports){
describe('.verify', function() {
  Given(function() {
    return this.testDouble = td["function"]();
  });
  context('a satisfied verification', function() {
    When(function() {
      return this.testDouble("dogs", "cats");
    });
    return Then(function() {
      return td.verify(this.testDouble("dogs", "cats"));
    });
  });
  context('an unsatisfied verification - no interactions', function() {
    Given(function() {
      return this.arg = {
        joe: 5,
        jill: [1, '2', 3]
      };
    });
    Given(function() {
      return this.arg.circ = this.arg;
    });
    return Then(function() {
      return shouldThrow(((function(_this) {
        return function() {
          return td.verify(_this.testDouble("WOAH", _this.arg));
        };
      })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `(\"WOAH\", {joe: 5, jill: [1, \"2\", 3], circ: \"[Circular]\"})`.\n\n  But there were no invocations of the test double.");
    });
  });
  context('unsatisfied verify - other interactions', function() {
    When(function() {
      return this.testDouble("the wrong WOAH");
    });
    return Then(function() {
      return shouldThrow(((function(_this) {
        return function() {
          return td.verify(_this.testDouble("WOAH"));
        };
      })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `(\"WOAH\")`.\n\n  All calls of the test double, in order were:\n    - called with `(\"the wrong WOAH\")`.");
    });
  });
  context('unsatisfied verify - wrong arg count', function() {
    When(function() {
      return this.testDouble("good", "bad");
    });
    return Then(function() {
      return shouldThrow(((function(_this) {
        return function() {
          return td.verify(_this.testDouble("good"));
        };
      })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `(\"good\")`.\n\n  All calls of the test double, in order were:\n    - called with `(\"good\", \"bad\")`.");
    });
  });
  context('unsatisfied verify - wrong arg count with ignored args', function() {
    When(function() {
      return this.testDouble("good", "bad", "more", "args");
    });
    return Then(function() {
      return shouldThrow(((function(_this) {
        return function() {
          return td.verify(_this.testDouble("good", "gooder"), {
            ignoreExtraArgs: true
          });
        };
      })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `(\"good\", \"gooder\")`, ignoring any additional arguments.\n\n  All calls of the test double, in order were:\n    - called with `(\"good\", \"bad\", \"more\", \"args\")`.");
    });
  });
  context('with a named double', function() {
    Given(function() {
      return this.testDouble = td["function"]("#footime");
    });
    When(function() {
      return this.result = shouldThrow((function(_this) {
        return function() {
          return td.verify(_this.testDouble());
        };
      })(this));
    });
    return Then(function() {
      return expect(this.result).to.contain("verification on test double `#footime`.");
    });
  });
  context('with a prototype-modeling double', function() {
    Given(function() {
      return this.SomeType = function Foo() {};
    });
    Given(function() {
      return this.SomeType.prototype.bar = function() {};
    });
    Given(function() {
      return this.SomeType.prototype.baz = function() {};
    });
    Given(function() {
      return this.SomeType.prototype.biz = "not a function!";
    });
    Given(function() {
      return this.testDoubleObj = td.constructor(this.SomeType);
    });
    When(function() {
      return this.result = shouldThrow((function(_this) {
        return function() {
          return td.verify(_this.testDoubleObj.prototype.baz());
        };
      })(this));
    });
    Then(function() {
      return expect(this.result).to.contain("verification on test double `Foo.prototype.baz`.");
    });
    return Then(function() {
      return this.testDoubleObj.prototype.biz === "not a function!";
    });
  });
  context('with a test double *as an arg* to another', function() {
    Given(function() {
      return this.testDouble = td["function"]();
    });
    When(function() {
      return this.result = shouldThrow((function(_this) {
        return function() {
          return td.verify(_this.testDouble(_this.someTestDoubleArg));
        };
      })(this));
    });
    context('with an unnamed double _as an arg_', function() {
      Given(function() {
        return this.someTestDoubleArg = td["function"]();
      });
      return Then(function() {
        return expect(this.result).to.contain("- called with `([test double (unnamed)])`.");
      });
    });
    return context('with a named double _as an arg_', function() {
      Given(function() {
        return this.someTestDoubleArg = td["function"]("#foo");
      });
      return Then(function() {
        return expect(this.result).to.contain("- called with `([test double for \"#foo\"])`.");
      });
    });
  });
  context('a double-free verification error', function() {
    return Then(function() {
      return shouldThrow(((function(_this) {
        return function() {
          return td.verify();
        };
      })(this)), "Error: testdouble.js - td.verify - No test double invocation detected for `verify()`.\n\n  Usage:\n    verify(myTestDouble('foo'))");
    });
  });
  context('using matchers', function() {
    When(function() {
      return this.testDouble(55);
    });
    context('satisfied', function() {
      return Then(function() {
        return shouldNotThrow((function(_this) {
          return function() {
            return td.verify(_this.testDouble(td.matchers.isA(Number)));
          };
        })(this));
      });
    });
    return context('unsatisfied', function() {
      return Then(function() {
        return shouldThrow(((function(_this) {
          return function() {
            return td.verify(_this.testDouble(td.matchers.isA(String)));
          };
        })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `(isA(String))`.\n\n  All calls of the test double, in order were:\n    - called with `(55)`.");
      });
    });
  });
  context('using deep matchers', function() {
    context('single level', function() {
      When(function() {
        return this.testDouble({
          value: 55
        });
      });
      context('satisfied', function() {
        return Then(function() {
          return shouldNotThrow((function(_this) {
            return function() {
              return td.verify(_this.testDouble({
                value: td.matchers.isA(Number)
              }));
            };
          })(this));
        });
      });
      return context('unsatisfied', function() {
        return Then(function() {
          return shouldThrow(((function(_this) {
            return function() {
              return td.verify(_this.testDouble({
                value: td.matchers.isA(String)
              }));
            };
          })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `({value: isA(String)})`.\n\n  All calls of the test double, in order were:\n    - called with `({value: 55})`.");
        });
      });
    });
    context('deeply nested', function() {
      When(function() {
        return this.testDouble({
          value: {
            value: 55
          }
        });
      });
      context('satisfied', function() {
        return Then(function() {
          return shouldNotThrow((function(_this) {
            return function() {
              return td.verify(_this.testDouble({
                value: {
                  value: td.matchers.isA(Number)
                }
              }));
            };
          })(this));
        });
      });
      return context('unsatisfied', function() {
        return Then(function() {
          return shouldThrow(((function(_this) {
            return function() {
              return td.verify(_this.testDouble({
                value: {
                  value: td.matchers.isA(String)
                }
              }));
            };
          })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `({value: {value: isA(String)}})`.\n\n  All calls of the test double, in order were:\n    - called with `({value: {value: 55}})`.");
        });
      });
    });
    return context('array values', function() {
      When(function() {
        return this.testDouble([55]);
      });
      context('satisfied', function() {
        return Then(function() {
          return shouldNotThrow((function(_this) {
            return function() {
              return td.verify(_this.testDouble([td.matchers.isA(Number)]));
            };
          })(this));
        });
      });
      return context('unsatisfied', function() {
        return Then(function() {
          return shouldThrow(((function(_this) {
            return function() {
              return td.verify(_this.testDouble([td.matchers.isA(String)]));
            };
          })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `([isA(String)])`.\n\n  All calls of the test double, in order were:\n    - called with `([55])`.");
        });
      });
    });
  });
  describe('configuration', function() {
    describe('ignoring extra arguments (more thoroughly tested via when())', function() {
      When(function() {
        return this.testDouble('matters', 'not');
      });
      return Then(function() {
        return shouldNotThrow((function(_this) {
          return function() {
            return td.verify(_this.testDouble('matters'), {
              ignoreExtraArgs: true
            });
          };
        })(this));
      });
    });
    return describe('number of times an invocation is satisfied', function() {
      context('0 times, satisfied', function() {
        return Then(function() {
          return shouldNotThrow((function(_this) {
            return function() {
              return td.verify(_this.testDouble(), {
                times: 0
              });
            };
          })(this));
        });
      });
      context('0 times, unsatisfied', function() {
        When(function() {
          return this.testDouble();
        });
        return Then(function() {
          return shouldThrow(((function(_this) {
            return function() {
              return td.verify(_this.testDouble(), {
                times: 0
              });
            };
          })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `()` 0 times.\n\n  All calls of the test double, in order were:\n    - called with `()`.");
        });
      });
      context('1 time, satisfied', function() {
        When(function() {
          return this.testDouble();
        });
        return Then(function() {
          return shouldNotThrow((function(_this) {
            return function() {
              return td.verify(_this.testDouble(), {
                times: 1
              });
            };
          })(this));
        });
      });
      context('1 time, unsatisfied (with 2)', function() {
        When(function() {
          return this.testDouble();
        });
        And(function() {
          return this.testDouble();
        });
        return Then(function() {
          return shouldThrow(((function(_this) {
            return function() {
              return td.verify(_this.testDouble(), {
                times: 1
              });
            };
          })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `()` 1 time.\n\n  All calls of the test double, in order were:\n    - called with `()`.\n    - called with `()`.");
        });
      });
      context('4 times, satisfied', function() {
        When(function() {
          return this.testDouble();
        });
        And(function() {
          return this.testDouble();
        });
        And(function() {
          return this.testDouble();
        });
        And(function() {
          return this.testDouble();
        });
        return Then(function() {
          return shouldNotThrow((function(_this) {
            return function() {
              return td.verify(_this.testDouble(), {
                times: 4
              });
            };
          })(this));
        });
      });
      context('4 times, unsatisfied (with 3)', function() {
        When(function() {
          return this.testDouble();
        });
        And(function() {
          return this.testDouble();
        });
        And(function() {
          return this.testDouble();
        });
        return Then(function() {
          return shouldThrow(((function(_this) {
            return function() {
              return td.verify(_this.testDouble(), {
                times: 4
              });
            };
          })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `()` 4 times.\n\n  3 calls that satisfied this verification:\n    - called 3 times with `()`.\n\n  All calls of the test double, in order were:\n    - called with `()`.\n    - called with `()`.\n    - called with `()`.");
        });
      });
      return context('4 times, unsatisfied (with 3)', function() {
        When(function() {
          return this.testDouble(1);
        });
        And(function() {
          return this.testDouble(2);
        });
        And(function() {
          return this.testDouble(2);
        });
        And(function() {
          return this.testDouble('x');
        });
        return Then(function() {
          return shouldThrow(((function(_this) {
            return function() {
              return td.verify(_this.testDouble(td.matchers.isA(Number)), {
                times: 4
              });
            };
          })(this)), "Unsatisfied verification on test double.\n\n  Wanted:\n    - called with `(isA(Number))` 4 times.\n\n  3 calls that satisfied this verification:\n    - called 1 time with `(1)`.\n    - called 2 times with `(2)`.\n\n  All calls of the test double, in order were:\n    - called with `(1)`.\n    - called with `(2)`.\n    - called with `(2)`.\n    - called with `(\"x\")`.");
        });
      });
    });
  });
  return describe('warning when verifying a stubbed invocation', function() {
    var afterEach;
    Given(function() {
      return this.ogWarn = console.warn;
    });
    Given(function() {
      return this.warnings = [];
    });
    Given(function() {
      return console.warn = (function(_this) {
        return function(msg) {
          return _this.warnings.push(msg);
        };
      })(this);
    });
    afterEach = console.warn = this.ogWarn;
    Given(function() {
      return this.td = td["function"]('.foo');
    });
    context('warn user for', function() {
      context('an exact match in calls', function() {
        Given(function() {
          return td.when(this.td(1)).thenReturn(5);
        });
        Given(function() {
          return this.td(1);
        });
        When(function() {
          return td.verify(this.td(1));
        });
        return Then(function() {
          return this.warnings[0] === "Warning: testdouble.js - td.verify - test double `.foo` was both stubbed and verified with arguments (1), which is redundant and probably unnecessary. (see: https://github.com/testdouble/testdouble.js/blob/master/docs/B-frequently-asked-questions.md#why-shouldnt-i-call-both-tdwhen-and-tdverify-for-a-single-interaction-with-a-test-double )";
        });
      });
      context('a match where stub ignores extra arguments', function() {
        Given(function() {
          return td.when(this.td(1), {
            ignoreExtraArgs: true
          }).thenReturn();
        });
        Given(function() {
          return this.td(1, 2, 3);
        });
        When(function() {
          return td.verify(this.td(1, 2, 3));
        });
        return Then(function() {
          return this.warnings[0] === "Warning: testdouble.js - td.verify - test double `.foo` was both stubbed and verified with arguments (1, 2, 3), which is redundant and probably unnecessary. (see: https://github.com/testdouble/testdouble.js/blob/master/docs/B-frequently-asked-questions.md#why-shouldnt-i-call-both-tdwhen-and-tdverify-for-a-single-interaction-with-a-test-double )";
        });
      });
      return context('a match where stub uses a matcher', function() {
        Given(function() {
          return td.when(this.td(td.matchers.isA(Number))).thenReturn(5);
        });
        Given(function() {
          return this.td(1);
        });
        When(function() {
          return td.verify(this.td(1));
        });
        return Then(function() {
          return this.warnings[0] === "Warning: testdouble.js - td.verify - test double `.foo` was both stubbed and verified with arguments (1), which is redundant and probably unnecessary. (see: https://github.com/testdouble/testdouble.js/blob/master/docs/B-frequently-asked-questions.md#why-shouldnt-i-call-both-tdwhen-and-tdverify-for-a-single-interaction-with-a-test-double )";
        });
      });
    });
    return context("don't warn user when", function() {
      return context("verify doesn't match the stub", function() {
        Given(function() {
          return td.when(this.td(1)).thenReturn();
        });
        Given(function() {
          return this.td();
        });
        When(function() {
          return td.verify(this.td());
        });
        return Then(function() {
          return this.warnings.length === 0;
        });
      });
    });
  });
});


},{}],330:[function(require,module,exports){
describe('when', function() {
  Given(function() {
    return this.testDouble = td["function"]();
  });
  describe('no-arg stubbing', function() {
    context('foo', function() {
      Given(function() {
        return td.when(this.testDouble()).thenReturn("foo");
      });
      return Then(function() {
        return this.testDouble() === "foo";
      });
    });
    return context('bar', function() {
      Given(function() {
        return td.when(this.testDouble()).thenReturn("bar");
      });
      return Then(function() {
        return this.testDouble() === "bar";
      });
    });
  });
  describe('last-in-wins overwriting', function() {
    Given(function() {
      return td.when(this.testDouble("something")).thenReturn("gold");
    });
    Given(function() {
      return td.when(this.testDouble("something")).thenReturn("iron");
    });
    return Then(function() {
      return this.testDouble("something") === "iron";
    });
  });
  describe('conditional stubbing', function() {
    Given(function() {
      return td.when(this.testDouble(1)).thenReturn("foo");
    });
    Given(function() {
      return td.when(this.testDouble(2)).thenReturn("bar");
    });
    Given(function() {
      return td.when(this.testDouble({
        lol: 'cheese'
      })).thenReturn('nom');
    });
    Given(function() {
      return td.when(this.testDouble({
        lol: 'fungus'
      })).thenReturn('eww');
    });
    Given(function() {
      return td.when(this.testDouble({
        lol: 'fungus'
      }, 2)).thenReturn('eww2');
    });
    Then(function() {
      return this.testDouble() === void 0;
    });
    And(function() {
      return this.testDouble(1) === "foo";
    });
    And(function() {
      return this.testDouble(2) === "bar";
    });
    And(function() {
      return this.testDouble({
        lol: 'cheese'
      }) === "nom";
    });
    And(function() {
      return this.testDouble({
        lol: 'fungus'
      }) === "eww";
    });
    return And(function() {
      return this.testDouble({
        lol: 'fungus'
      }, 2) === "eww2";
    });
  });
  describe('multiple test doubles', function() {
    Given(function() {
      return this.td1 = td.when(td["function"]()()).thenReturn("lol1");
    });
    Given(function() {
      return this.td2 = td.when(td["function"]()()).thenReturn("lol2");
    });
    Then(function() {
      return this.td1() === "lol1";
    });
    return Then(function() {
      return this.td2() === "lol2";
    });
  });
  describe('using matchers', function() {
    Given(function() {
      return td.when(this.testDouble(88, td.matchers.isA(Number))).thenReturn("yay");
    });
    Then(function() {
      return this.testDouble(88, 5) === "yay";
    });
    Then(function() {
      return this.testDouble(44, 5) === void 0;
    });
    return Then(function() {
      return this.testDouble(88, "five") === void 0;
    });
  });
  describe('using deep matchers', function() {
    context('single level', function() {
      Given(function() {
        return td.when(this.testDouble({
          key: td.matchers.isA(String)
        })).thenReturn("yay");
      });
      Then(function() {
        return this.testDouble({
          key: "testytest"
        }) === "yay";
      });
      Then(function() {
        return this.testDouble({
          key: 42
        }) === void 0;
      });
      Then(function() {
        return this.testDouble({}) === void 0;
      });
      return Then(function() {
        return this.testDouble("i am a string") === void 0;
      });
    });
    context('deeply nested', function() {
      Given(function() {
        return td.when(this.testDouble({
          a: {
            b: td.matchers.isA(String)
          }
        })).thenReturn("yay");
      });
      Then(function() {
        return this.testDouble({
          a: {
            b: "testytest"
          }
        }) === "yay";
      });
      Then(function() {
        return this.testDouble({
          a: {
            b: 42
          }
        }) === void 0;
      });
      return Then(function() {
        return this.testDouble({
          a: "testytest"
        }) === void 0;
      });
    });
    context('array values', function() {
      Given(function() {
        return td.when(this.testDouble([5, td.matchers.isA(String)])).thenReturn("yay");
      });
      Then(function() {
        return this.testDouble([5, "testytest"]) === "yay";
      });
      Then(function() {
        return this.testDouble([5, 6]) === void 0;
      });
      Then(function() {
        return this.testDouble([5]) === void 0;
      });
      return Then(function() {
        return this.testDouble([]) === void 0;
      });
    });
    return context('arguments with circular structures', function() {
      Given(function() {
        return this.arg = {
          foo: 'bar'
        };
      });
      Given(function() {
        return this.arg.baz = this.arg;
      });
      Given(function() {
        return td.when(this.testDouble(this.arg)).thenReturn("yay");
      });
      Then(function() {
        return this.testDouble(this.arg) === "yay";
      });
      return Then(function() {
        return this.testDouble('no') === void 0;
      });
    });
  });
  describe('stubbing sequential returns', function() {
    context('a single stubbing', function() {
      Given(function() {
        return td.when(this.testDouble()).thenReturn(10, 9);
      });
      When(function() {
        var ref;
        return ref = [this.testDouble(), this.testDouble(), this.testDouble()], this.first = ref[0], this.second = ref[1], this.third = ref[2], ref;
      });
      Then(function() {
        return this.first === 10;
      });
      Then(function() {
        return this.second === 9;
      });
      return Then(function() {
        return this.third === 9;
      });
    });
    return context('two overlapping stubbings', function() {
      Given(function() {
        return td.when(this.testDouble()).thenReturn('A');
      });
      Given(function() {
        return this.testDouble();
      });
      Given(function() {
        return td.when(this.testDouble()).thenReturn('B', 'C');
      });
      return Then(function() {
        return this.testDouble() === 'B';
      });
    });
  });
  describe('stubbing actions with `thenDo` instead of `thenReturn`', function() {
    Given(function() {
      return td.when(this.testDouble(55)).thenDo((function(_this) {
        return function() {
          return _this.result = 'yatta';
        };
      })(this));
    });
    When(function() {
      return this.testDouble(55);
    });
    return And(function() {
      return this.result === 'yatta';
    });
  });
  describe('stubbing actions with `thenDo` preserves function context', function() {
    Given(function() {
      return td.when(this.testDouble(55)).thenDo(function() {
        return this.result;
      });
    });
    When(function() {
      return this.result = this.testDouble.call({
        result: 'yatta'
      }, 55);
    });
    return Then(function() {
      return this.result === 'yatta';
    });
  });
  describe('stubbing actions with `thenThrow` instead of `thenReturn`', function() {
    Given(function() {
      return this.error = new Error('lol');
    });
    Given(function() {
      return td.when(this.testDouble(42)).thenThrow(this.error);
    });
    When(function() {
      var e;
      try {
        return this.testDouble(42);
      } catch (error) {
        e = error;
        return this.result = e;
      }
    });
    return Then(function() {
      return this.error === this.result;
    });
  });
  describe('stubbing promises', function() {
    context('with a native promise', function() {
      if (typeof Promise !== 'function') {
        return;
      }
      describe('td.when…thenResolve', function() {
        Given(function() {
          return td.when(this.testDouble(10)).thenResolve('pants');
        });
        When(function(done) {
          this.testDouble(10).then((function(_this) {
            return function(resolved) {
              _this.resolved = resolved;
              return done();
            };
          })(this));
          return void 0;
        });
        Then(function() {
          return this.resolved === 'pants';
        });
        return context('multiple values', function() {
          Given(function() {
            return td.when(this.testDouble(5)).thenResolve('shirts', 'ties');
          });
          When(function(done) {
            this.testDouble(5).then((function(_this) {
              return function(resolvedFirst) {
                _this.resolvedFirst = resolvedFirst;
                return done();
              };
            })(this));
            return void 0;
          });
          When(function(done) {
            this.testDouble(5).then((function(_this) {
              return function(resolvedSecond) {
                _this.resolvedSecond = resolvedSecond;
                return done();
              };
            })(this));
            return void 0;
          });
          Then(function() {
            return this.resolvedFirst === 'shirts';
          });
          return Then(function() {
            return this.resolvedSecond === 'ties';
          });
        });
      });
      return describe('td.when…thenReject', function() {
        Given(function() {
          return td.when(this.testDouble(10)).thenReject('oops');
        });
        When(function(done) {
          this.testDouble(10).then(null, (function(_this) {
            return function(rejected) {
              _this.rejected = rejected;
              return done();
            };
          })(this));
          return void 0;
        });
        Then(function() {
          return this.rejected === 'oops';
        });
        return context('multiple values', function() {
          Given(function() {
            return td.when(this.testDouble(5)).thenReject('darn', 'dang');
          });
          When(function(done) {
            this.testDouble(5).then(null, (function(_this) {
              return function(rejectedFirst) {
                _this.rejectedFirst = rejectedFirst;
                return done();
              };
            })(this));
            return void 0;
          });
          When(function(done) {
            this.testDouble(5).then(null, (function(_this) {
              return function(rejectedSecond) {
                _this.rejectedSecond = rejectedSecond;
                return done();
              };
            })(this));
            return void 0;
          });
          Then(function() {
            return this.rejectedFirst === 'darn';
          });
          return Then(function() {
            return this.rejectedSecond === 'dang';
          });
        });
      });
    });
    context('with an alternative promise constructor', function() {
      var FakePromise;
      FakePromise = (function() {
        function FakePromise(executor) {
          executor(((function(_this) {
            return function(resolved) {
              _this.resolved = resolved;
            };
          })(this)), ((function(_this) {
            return function(rejected) {
              _this.rejected = rejected;
            };
          })(this)));
        }

        FakePromise.prototype.then = function(success, failure) {
          if (this.resolved != null) {
            return success(this.resolved + '!');
          } else {
            return failure(this.rejected + '?');
          }
        };

        return FakePromise;

      })();
      Given(function() {
        return td.config({
          promiseConstructor: FakePromise
        });
      });
      describe('td.when…thenResolve', function() {
        Given(function() {
          return td.when(this.testDouble(10)).thenResolve('pants');
        });
        When(function(done) {
          return this.testDouble(10).then((function(_this) {
            return function(resolved) {
              _this.resolved = resolved;
              return done();
            };
          })(this));
        });
        return Then(function() {
          return this.resolved === 'pants!';
        });
      });
      return describe('td.when…thenReject', function() {
        Given(function() {
          return td.when(this.testDouble(10)).thenReject('oops');
        });
        When(function(done) {
          return this.testDouble(10).then(null, (function(_this) {
            return function(rejected) {
              _this.rejected = rejected;
              return done();
            };
          })(this));
        });
        return Then(function() {
          return this.rejected === 'oops?';
        });
      });
    });
    return context('with no promise constructor', function() {
      Given(function() {
        return this.warnings = [];
      });
      Given(function() {
        return this.errors = [];
      });
      Given(function() {
        return console.warn = (function(_this) {
          return function(m) {
            return _this.warnings.push(m);
          };
        })(this);
      });
      Given(function() {
        return console.error = (function(_this) {
          return function(m) {
            return _this.errors.push(m);
          };
        })(this);
      });
      Given(function() {
        return td.config({
          promiseConstructor: void 0
        });
      });
      return describe('td.when…thenResolve', function() {
        Given(function() {
          return td.when(this.testDouble(10)).thenResolve('pants');
        });
        Then(function() {
          return this.warnings[0] === "Warning: testdouble.js - td.when - no promise constructor is set, so this `thenResolve` or `thenReject` stubbing\nwill fail if it's satisfied by an invocation on the test double. You can tell\ntestdouble.js which promise constructor to use with `td.config`, like so:\n\n  td.config({\n    promiseConstructor: require('bluebird')\n  })";
        });
        return describe('actually invoking it', function() {
          When(function() {
            var e;
            try {
              return this.testDouble(10);
            } catch (error) {
              e = error;
              return this.error = e;
            }
          });
          return Then(function() {
            return this.error.message === "Error: testdouble.js - td.when - no promise constructor is set (perhaps this runtime lacks a native Promise\nfunction?), which means this stubbing can't return a promise to your\nsubject under test, resulting in this error. To resolve the issue, set\na promise constructor with `td.config`, like this:\n\n  td.config({\n    promiseConstructor: require('bluebird')\n  })";
          });
        });
      });
    });
  });
  describe('stubbing error, no invocation found', function() {
    Given(function() {
      return td.reset();
    });
    Given(function() {
      var e;
      try {
        return td.when().thenReturn('hi');
      } catch (error) {
        e = error;
        return this.error = e;
      }
    });
    return Then(function() {
      return this.error.message === "Error: testdouble.js - td.when - No test double invocation call detected for `when()`.\n\n  Usage:\n    when(myTestDouble('foo')).thenReturn('bar')";
    });
  });
  describe('config object', function() {
    describe('ignoring extra arguments', function() {
      context('for a no-arg stubbing', function() {
        Given(function() {
          return td.when(this.testDouble(), {
            ignoreExtraArgs: true
          }).thenReturn('pewpew');
        });
        When(function() {
          return this.result = this.testDouble('so', 'many', 'args');
        });
        return Then(function() {
          return this.result === 'pewpew';
        });
      });
      return context('when an initial-arg-matters', function() {
        Given(function() {
          return td.when(this.testDouble('important'), {
            ignoreExtraArgs: true
          }).thenReturn('neat');
        });
        context('satisfied without extra args', function() {
          return Then(function() {
            return this.testDouble('important') === 'neat';
          });
        });
        context('satisfied with extra args', function() {
          return Then(function() {
            return this.testDouble('important', 'not important') === 'neat';
          });
        });
        context('unsatisfied with no args', function() {
          return Then(function() {
            return this.testDouble() === void 0;
          });
        });
        return context('unsatisfied with extra args', function() {
          return Then(function() {
            return this.testDouble('unimportant', 'not important') === void 0;
          });
        });
      });
    });
    return describe('limiting times stubbing will work', function() {
      context('a single stub', function() {
        Given(function() {
          return td.when(this.testDouble(), {
            times: 2
          }).thenReturn('pants');
        });
        When(function() {
          return this.result = [this.testDouble(), this.testDouble(), this.testDouble()];
        });
        return Then(function() {
          return expect(this.result).to.deep.equal(['pants', 'pants', void 0]);
        });
      });
      return context('two overlapping stubbings', function() {
        Given(function() {
          return td.when(this.testDouble()).thenReturn('NO');
        });
        Given(function() {
          return td.when(this.testDouble(), {
            times: 1
          }).thenReturn('YES');
        });
        When(function() {
          return this.result = [this.testDouble(), this.testDouble(), this.testDouble()];
        });
        return Then(function() {
          return expect(this.result).to.deep.equal(['YES', 'NO', 'NO']);
        });
      });
    });
  });
  return describe('nested whens', function() {
    Given(function() {
      return this.knob = td["function"]();
    });
    Given(function() {
      return this.door = td["function"]();
    });
    Given(function() {
      return td.when(this.knob('twist')).thenReturn({
        door: td.when(this.door('push')).thenReturn('open')
      });
    });
    When(function() {
      return this.result = this.knob('twist').door('push');
    });
    return Then(function() {
      return this.result === 'open';
    });
  });
});


},{}],331:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('./util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _isMatcher = require('./matchers/is-matcher');

var _isMatcher2 = _interopRequireDefault(_isMatcher);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (expectedArgs, actualArgs) {
  var config = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (arityMismatch(expectedArgs, actualArgs, config)) {
    return false;
  } else if (config.allowMatchers !== false) {
    return equalsWithMatchers(expectedArgs, actualArgs);
  } else {
    return _lodashWrap2.default.isEqual(expectedArgs, actualArgs);
  }
};

var arityMismatch = function arityMismatch(expectedArgs, actualArgs, config) {
  return expectedArgs.length !== actualArgs.length && !config.ignoreExtraArgs;
};

var equalsWithMatchers = function equalsWithMatchers(expectedArgs, actualArgs) {
  return _lodashWrap2.default.every(expectedArgs, function (expectedArg, key) {
    return argumentMatchesExpectation(expectedArg, actualArgs[key]);
  });
};

var argumentMatchesExpectation = function argumentMatchesExpectation(expectedArg, actualArg) {
  if ((0, _isMatcher2.default)(expectedArg)) {
    return matcherTestFor(expectedArg)(actualArg);
  } else {
    return _lodashWrap2.default.isEqualWith(expectedArg, actualArg, function (expectedEl, actualEl) {
      if ((0, _isMatcher2.default)(expectedEl)) {
        return matcherTestFor(expectedEl)(actualEl);
      }
    });
  }
};

var matcherTestFor = function matcherTestFor(matcher) {
  return matcher.__matches;
};

},{"./matchers/is-matcher":356,"./util/lodash-wrap":370}],332:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('./util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _create = require('./matchers/create');

var _create2 = _interopRequireDefault(_create);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _lodashWrap2.default.tap((0, _create2.default)({
  name: 'callback',
  matches: function matches(matcherArgs, actual) {
    return _lodashWrap2.default.isFunction(actual);
  },
  onCreate: function onCreate(matcherInstance, matcherArgs) {
    matcherInstance.args = matcherArgs;
    matcherInstance.__testdouble_callback = true;
  }
}), function (callback) {
  // Make callback itself quack like a matcher for its non-invoked use case.
  callback.__name = 'callback';
  callback.__matches = _lodashWrap2.default.isFunction;

  callback.isCallback = function (obj) {
    return obj && (obj === callback || obj.__testdouble_callback === true);
  };
});

},{"./matchers/create":354,"./util/lodash-wrap":370}],333:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('./util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _anything = require('./stringify/anything');

var _anything2 = _interopRequireDefault(_anything);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULTS = {
  ignoreWarnings: false,
  promiseConstructor: global.Promise,
  suppressErrors: false
};
var DELETED_OPTIONS = ['extendWhenReplacingConstructors'];

var configData = _lodashWrap2.default.extend({}, DEFAULTS);

exports.default = _lodashWrap2.default.tap(function (overrides) {
  deleteDeletedOptions(overrides);
  ensureOverridesExist(overrides);
  return _lodashWrap2.default.extend(configData, overrides);
}, function (config) {
  config.reset = function () {
    configData = _lodashWrap2.default.extend({}, DEFAULTS);
  };
});


var deleteDeletedOptions = function deleteDeletedOptions(overrides) {
  _lodashWrap2.default.each(overrides, function (val, key) {
    if (_lodashWrap2.default.includes(DELETED_OPTIONS, key)) {
      _log2.default.warn('td.config', '"' + key + '" is no longer a valid configuration key. Remove it from your calls to td.config() or it may throw an error in the future. For more information, try hunting around our GitHub repo for it:\n\n  https://github.com/testdouble/testdouble.js/search?q=' + key);
      delete overrides[key];
    }
  });
};

var ensureOverridesExist = function ensureOverridesExist(overrides) {
  _lodashWrap2.default.each(overrides, function (val, key) {
    if (!configData.hasOwnProperty(key)) {
      _log2.default.error('td.config', '"' + key + '" is not a valid configuration key (valid keys are: ' + (0, _anything2.default)(_lodashWrap2.default.keys(configData)) + ')');
    }
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./log":347,"./stringify/anything":365,"./util/lodash-wrap":370}],334:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('./util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _function = require('./function');

var _function2 = _interopRequireDefault(_function);

var _imitate = require('./imitate');

var _imitate2 = _interopRequireDefault(_imitate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (typeOrNames) {
  return _lodashWrap2.default.isFunction(typeOrNames) ? (0, _imitate2.default)(typeOrNames) : fakeConstructorFromNames(typeOrNames);
};

var fakeConstructorFromNames = function fakeConstructorFromNames(funcNames) {
  return _lodashWrap2.default.tap((0, _function2.default)('(unnamed constructor)'), function (fakeConstructor) {
    fakeConstructor.prototype.toString = function () {
      return '[test double instance of constructor]';
    };

    _lodashWrap2.default.each(funcNames, function (funcName) {
      fakeConstructor.prototype[funcName] = (0, _function2.default)('#' + funcName);
    });
  });
};

},{"./function":336,"./imitate":338,"./util/lodash-wrap":370}],335:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('./util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _calls = require('./store/calls');

var _calls2 = _interopRequireDefault(_calls);

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

var _arguments = require('./stringify/arguments');

var _arguments2 = _interopRequireDefault(_arguments);

var _stubbings = require('./store/stubbings');

var _stubbings2 = _interopRequireDefault(_stubbings);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (testDouble) {
  if (_store2.default.for(testDouble, false) == null) {
    return nullDescription();
  }
  var calls = _calls2.default.for(testDouble);
  var stubs = _stubbings2.default.for(testDouble);

  return {
    name: _store2.default.for(testDouble).name,
    callCount: calls.length,
    calls: calls,
    description: testdoubleDescription(testDouble, stubs, calls) + stubbingDescription(stubs) + callDescription(calls),
    isTestDouble: true
  };
};

var nullDescription = function nullDescription() {
  return {
    name: undefined,
    callCount: 0,
    calls: [],
    description: 'This is not a test double.',
    isTestDouble: false
  };
};

var testdoubleDescription = function testdoubleDescription(testDouble, stubs, calls) {
  return 'This test double ' + stringifyName(testDouble) + 'has ' + stubs.length + ' stubbings and ' + calls.length + ' invocations.';
};

var stubbingDescription = function stubbingDescription(stubs) {
  return stubs.length > 0 ? _lodashWrap2.default.reduce(stubs, function (desc, stub) {
    return desc + ('\n  - when called with `(' + (0, _arguments2.default)(stub.args) + ')`, then ' + planFor(stub) + ' ' + argsFor(stub) + '.');
  }, '\n\nStubbings:') : '';
};

var planFor = function planFor(stub) {
  switch (stub.config.plan) {
    case 'thenCallback':
      return 'callback';
    case 'thenResolve':
      return 'resolve';
    case 'thenReject':
      return 'reject';
    default:
      return 'return';
  }
};

var argsFor = function argsFor(stub) {
  switch (stub.config.plan) {
    case 'thenCallback':
      return '`(' + (0, _arguments2.default)(stub.stubbedValues, ', ') + ')`';
    default:
      return (0, _arguments2.default)(stub.stubbedValues, ', then ', '`');
  }
};

var callDescription = function callDescription(calls) {
  return calls.length > 0 ? _lodashWrap2.default.reduce(calls, function (desc, call) {
    return desc + ('\n  - called with `(' + (0, _arguments2.default)(call.args) + ')`.');
  }, '\n\nInvocations:') : '';
};

var stringifyName = function stringifyName(testDouble) {
  var name = _store2.default.for(testDouble).name;
  return name ? '`' + name + '` ' : '';
};

},{"./store":363,"./store/calls":362,"./store/stubbings":364,"./stringify/arguments":366,"./util/lodash-wrap":370}],336:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('./util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _calls = require('./store/calls');

var _calls2 = _interopRequireDefault(_calls);

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

var _stubbings = require('./store/stubbings');

var _stubbings2 = _interopRequireDefault(_stubbings);

var _imitate = require('./imitate');

var _imitate2 = _interopRequireDefault(_imitate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (nameOrFunc, __optionalName) {
  return _lodashWrap2.default.isFunction(nameOrFunc) ? (0, _imitate2.default)(nameOrFunc) : createTestDoubleNamed(nameOrFunc || __optionalName);
};

var createTestDoubleNamed = function createTestDoubleNamed(name) {
  return _lodashWrap2.default.tap(createTestDoubleFunction(), function (testDouble) {
    var entry = _store2.default.for(testDouble, true);
    if (name != null) {
      entry.name = name;
      testDouble.toString = function () {
        return '[test double for "' + name + '"]';
      };
    } else {
      testDouble.toString = function () {
        return '[test double (unnamed)]';
      };
    }
  });
};

var createTestDoubleFunction = function createTestDoubleFunction() {
  return function testDouble() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _calls2.default.log(testDouble, args, this);
    return _stubbings2.default.invoke(testDouble, args, this);
  };
};

},{"./imitate":338,"./store":363,"./store/calls":362,"./store/stubbings":364,"./util/lodash-wrap":370}],337:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('../wrap/lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _function = require('../function');

var _function2 = _interopRequireDefault(_function);

var _isGenerator = require('./is-generator');

var _isGenerator2 = _interopRequireDefault(_isGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (original, names) {
  if (_lodash2.default.isArray(original) || _lodash2.default.isArguments(original)) {
    return [];
  } else if (_lodash2.default.isFunction(original)) {
    if ((0, _isGenerator2.default)(original)) {
      return original;
    } else {
      return (0, _function2.default)(names.join('') || '(anonymous function)');
    }
  } else {
    return _lodash2.default.clone(original);
  }
};

},{"../function":336,"../wrap/lodash":370,"./is-generator":340}],338:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = imitate;

var _es6Map = require('es6-map');

var _es6Map2 = _interopRequireDefault(_es6Map);

var _initializeNames = require('./initialize-names');

var _initializeNames2 = _interopRequireDefault(_initializeNames);

var _createImitation = require('./create-imitation');

var _createImitation2 = _interopRequireDefault(_createImitation);

var _overwriteChildren = require('./overwrite-children');

var _overwriteChildren2 = _interopRequireDefault(_overwriteChildren);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function imitate(original, names) {
  var encounteredObjects = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new _es6Map2.default();

  if (encounteredObjects.has(original)) return encounteredObjects.get(original);
  names = (0, _initializeNames2.default)(original, names);
  var target = (0, _createImitation2.default)(original, names);
  encounteredObjects.set(original, target);
  (0, _overwriteChildren2.default)(original, target, function (originalValue, name) {
    return imitate(originalValue, names.concat(name), encounteredObjects);
  });
  return target;
}

},{"./create-imitation":337,"./initialize-names":339,"./overwrite-children":344,"es6-map":46}],339:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('../wrap/lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (original, names) {
  if (names != null) return names;
  if (_lodash2.default.isFunction(original) && original.name) {
    return [original.name];
  } else {
    return [];
  }
};

},{"../wrap/lodash":370}],340:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var generatorsAreSupported = function () {
  try {
    eval('(function* () {})'); // eslint-disable-line
    return true;
  } catch (e) {
    return false;
  }
}();

var GeneratorFunction = function () {
  if (!generatorsAreSupported) return;
  var func = eval('(function* () {})'); // eslint-disable-line
  return Object.getPrototypeOf(func).constructor;
}();

exports.default = function (func) {
  return generatorsAreSupported && func.constructor === GeneratorFunction;
};

},{}],341:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('../../wrap/lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (original, target, name, originalValue, targetValue) {
  if (name !== 'prototype' || !_lodash2.default.isFunction(original)) return targetValue;

  targetValue.__proto__ = originalValue; // eslint-disable-line
  targetValue.constructor = target;
  return targetValue;
};

},{"../../wrap/lodash":370}],342:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('../../wrap/lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (target, props, visitor) {
  Object.defineProperties(target, _lodash2.default.transform(props, function (acc, descriptor, name) {
    if (propOnTargetAndNotWritable(target, name, descriptor)) {
      if (name === 'prototype') {
        // Functions' prototype is not configurable but is assignable:
        target.prototype = newValue(name, descriptor.value, visitor);
      }
    } else {
      acc[name] = {
        configurable: true,
        writable: true,
        value: newValue(name, descriptor.value, visitor),
        enumerable: descriptor.enumerable
      };
    }
  }));
};

var propOnTargetAndNotWritable = function propOnTargetAndNotWritable(target, name, originalDescriptor) {
  var targetDescriptor = Object.getOwnPropertyDescriptor(target, name);
  if (targetDescriptor && (!targetDescriptor.writable || !targetDescriptor.configurable)) {
    return true;
  }
};

var newValue = function newValue(name, value, visitor) {
  return visitor ? visitor(name, value) : value;
};

},{"../../wrap/lodash":370}],343:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('../../wrap/lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _isFakeable = require('./is-fakeable');

var _isFakeable2 = _interopRequireDefault(_isFakeable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (thing) {
  var originalThing = thing;
  var props = {};

  while ((0, _isFakeable2.default)(thing) && !isNativePrototype(thing)) {
    Object.getOwnPropertyNames(thing).forEach(function (propName) {
      if (!props[propName] && propName !== 'constructor') {
        props[propName] = Object.getOwnPropertyDescriptor(thing, propName);
      }
    });
    thing = Object.getPrototypeOf(thing);
  }
  removeAbsentProperties(props, originalThing);
  return props;
};

var isNativePrototype = function isNativePrototype(thing) {
  if (!_lodash2.default.isFunction(thing.isPrototypeOf)) return false;
  return _lodash2.default.some([Object, Function], function (nativeType) {
    return thing.isPrototypeOf(nativeType);
  });
};

var removeAbsentProperties = function removeAbsentProperties(props, originalThing) {
  _lodash2.default.each(props, function (value, name) {
    if (!(name in originalThing)) {
      delete props[name];
    }
  });
};

},{"../../wrap/lodash":370,"./is-fakeable":345}],344:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('../../wrap/lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _isFakeable = require('./is-fakeable');

var _isFakeable2 = _interopRequireDefault(_isFakeable);

var _gatherProps = require('./gather-props');

var _gatherProps2 = _interopRequireDefault(_gatherProps);

var _copyProps = require('./copy-props');

var _copyProps2 = _interopRequireDefault(_copyProps);

var _chainPrototype = require('./chain-prototype');

var _chainPrototype2 = _interopRequireDefault(_chainPrototype);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (original, target, overwriteChild) {
  if (!(0, _isFakeable2.default)(target)) return;

  if (_lodash2.default.isArray(target)) {
    _lodash2.default.each(original, function (item, index) {
      return target.push(overwriteChild(item, '[' + index + ']'));
    });
  } else {
    (0, _copyProps2.default)(target, (0, _gatherProps2.default)(original), function (name, originalValue) {
      return (0, _chainPrototype2.default)(original, target, name, originalValue, overwriteChild(originalValue, '.' + name));
    });
  }
};

},{"../../wrap/lodash":370,"./chain-prototype":341,"./copy-props":342,"./gather-props":343,"./is-fakeable":345}],345:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('../../wrap/lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _isGenerator = require('../is-generator');

var _isGenerator2 = _interopRequireDefault(_isGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (thing) {
  return !(!_lodash2.default.isObject(thing) || isBoxedType(thing) || (0, _isGenerator2.default)(thing));
};

var isBoxedType = function isBoxedType(thing) {
  return _lodash2.default.compact([Boolean, Date, Number, RegExp, String, global.Symbol]).some(function (type) {
    return thing instanceof type;
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../../wrap/lodash":370,"../is-generator":340}],346:[function(require,module,exports){
'use strict';

var _function = require('./function');

var _function2 = _interopRequireDefault(_function);

var _object = require('./object');

var _object2 = _interopRequireDefault(_object);

var _constructor = require('./constructor');

var _constructor2 = _interopRequireDefault(_constructor);

var _when = require('./when');

var _when2 = _interopRequireDefault(_when);

var _verify = require('./verify');

var _verify2 = _interopRequireDefault(_verify);

var _matchers = require('./matchers');

var _matchers2 = _interopRequireDefault(_matchers);

var _replace = require('./replace');

var _replace2 = _interopRequireDefault(_replace);

var _explain = require('./explain');

var _explain2 = _interopRequireDefault(_explain);

var _reset = require('./reset');

var _reset2 = _interopRequireDefault(_reset);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _callback = require('./callback');

var _callback2 = _interopRequireDefault(_callback);

var _version = require('./version');

var _version2 = _interopRequireDefault(_version);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  function: _function2.default,
  func: _function2.default,
  object: _object2.default,
  constructor: _constructor2.default,
  when: _when2.default,
  verify: _verify2.default,
  matchers: _matchers2.default,
  replace: _replace2.default,
  explain: _explain2.default,
  reset: _reset2.default,
  config: _config2.default,
  callback: _callback2.default,
  version: _version2.default
};

},{"./callback":332,"./config":333,"./constructor":334,"./explain":335,"./function":336,"./matchers":355,"./object":357,"./replace":358,"./reset":361,"./verify":367,"./version":368,"./when":369}],347:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  warn: function warn(func, msg, url) {
    if (!(0, _config2.default)().ignoreWarnings && (typeof console === 'undefined' ? 'undefined' : _typeof(console)) === 'object' && console.warn) {
      console.warn('Warning: testdouble.js - ' + func + ' - ' + msg + withUrl(url));
    }
  },
  error: function error(func, msg, url) {
    if (!(0, _config2.default)().suppressErrors) {
      throw new Error('Error: testdouble.js - ' + func + ' - ' + msg + withUrl(url));
    }
  },
  fail: function fail(msg) {
    throw new Error(msg);
  }
};


var withUrl = function withUrl(url) {
  return url != null ? ' (see: ' + url + ' )' : '';
};

},{"./config":333}],348:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _create = require('../create');

var _create2 = _interopRequireDefault(_create);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _create2.default)({
  name: 'anything',
  matches: function matches() {
    return true;
  }
});

},{"../create":354}],349:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _create = require('../create');

var _create2 = _interopRequireDefault(_create);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _create2.default)({
  name: 'argThat',
  matches: function matches(matcherArgs, actual) {
    var predicate = matcherArgs[0];
    return predicate(actual);
  }
});

},{"../create":354}],350:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _create = require('../create');

var _create2 = _interopRequireDefault(_create);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  var captor = {
    capture: (0, _create2.default)({
      name: 'captor.capture',
      matches: function matches(matcherArgs, actual) {
        captor.values = captor.values || [];
        captor.values.push(actual);
        captor.value = actual;
        return true;
      }
    })
  };
  return captor;
};

},{"../create":354}],351:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('../../util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _create = require('../create');

var _create2 = _interopRequireDefault(_create);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _create2.default)({
  name: 'contains',
  matches: function matches(containings, actualArg) {
    if (containings.length === 0) return false;

    return _lodashWrap2.default.every(containings, function (containing) {
      if (_lodashWrap2.default.isArray(containing)) {
        return _lodashWrap2.default.some(actualArg, function (actualElement) {
          return _lodashWrap2.default.isEqual(actualElement, containing);
        });
      } else if (_lodashWrap2.default.isRegExp(containing)) {
        return containing.test(actualArg);
      } else if (_lodashWrap2.default.isObjectLike(containing) && _lodashWrap2.default.isObjectLike(actualArg)) {
        return containsAllSpecified(containing, actualArg);
      } else {
        return _lodashWrap2.default.includes(actualArg, containing);
      }
    });
  }
});


var containsAllSpecified = function containsAllSpecified(containing, actual) {
  return actual != null && _lodashWrap2.default.every(containing, function (val, key) {
    return _lodashWrap2.default.isObjectLike(val) ? containsAllSpecified(val, actual[key]) : _lodashWrap2.default.isEqual(val, actual[key]);
  });
};

},{"../../util/lodash-wrap":370,"../create":354}],352:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('../../util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _create = require('../create');

var _create2 = _interopRequireDefault(_create);

var _arguments = require('../../stringify/arguments');

var _arguments2 = _interopRequireDefault(_arguments);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _create2.default)({
  name: function name(matcherArgs) {
    var desc = _lodashWrap2.default.get(matcherArgs[0], 'name') || (0, _arguments2.default)(matcherArgs);
    return 'isA(' + desc + ')';
  },
  matches: function matches(matcherArgs, actual) {
    var type = matcherArgs[0];

    if (type === Number) {
      return _lodashWrap2.default.isNumber(actual);
    } else if (type === String) {
      return _lodashWrap2.default.isString(actual);
    } else if (type === Boolean) {
      return _lodashWrap2.default.isBoolean(actual);
    } else {
      return actual instanceof type;
    }
  }
});

},{"../../stringify/arguments":366,"../../util/lodash-wrap":370,"../create":354}],353:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('../../util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _create = require('../create');

var _create2 = _interopRequireDefault(_create);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = (0, _create2.default)({
  name: 'not',
  matches: function matches(matcherArgs, actual) {
    var expected = matcherArgs[0];
    return !_lodashWrap2.default.isEqual(expected, actual);
  }
});

},{"../../util/lodash-wrap":370,"../create":354}],354:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('../util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _arguments = require('../stringify/arguments');

var _arguments2 = _interopRequireDefault(_arguments);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (config) {
  return function () {
    for (var _len = arguments.length, matcherArgs = Array(_len), _key = 0; _key < _len; _key++) {
      matcherArgs[_key] = arguments[_key];
    }

    return _lodashWrap2.default.tap({
      __name: nameFor(config, matcherArgs),
      __matches: function __matches(actualArg) {
        return config.matches(matcherArgs, actualArg);
      }
    }, function (matcherInstance) {
      return _lodashWrap2.default.invoke(config, 'onCreate', matcherInstance, matcherArgs);
    });
  };
};

var nameFor = function nameFor(config, matcherArgs) {
  if (_lodashWrap2.default.isFunction(config.name)) {
    return config.name(matcherArgs);
  } else if (config.name != null) {
    return config.name + '(' + (0, _arguments2.default)(matcherArgs) + ')';
  } else {
    return '[Matcher for (' + (0, _arguments2.default)(matcherArgs) + ')]';
  }
};

},{"../stringify/arguments":366,"../util/lodash-wrap":370}],355:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _create = require('./create');

var _create2 = _interopRequireDefault(_create);

var _captor = require('./builtin/captor');

var _captor2 = _interopRequireDefault(_captor);

var _isA = require('./builtin/is-a');

var _isA2 = _interopRequireDefault(_isA);

var _contains = require('./builtin/contains');

var _contains2 = _interopRequireDefault(_contains);

var _anything = require('./builtin/anything');

var _anything2 = _interopRequireDefault(_anything);

var _argThat = require('./builtin/arg-that');

var _argThat2 = _interopRequireDefault(_argThat);

var _not = require('./builtin/not');

var _not2 = _interopRequireDefault(_not);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  create: _create2.default,
  captor: _captor2.default,
  isA: _isA2.default,
  anything: _anything2.default,
  contains: _contains2.default,
  argThat: _argThat2.default,
  not: _not2.default
};

},{"./builtin/anything":348,"./builtin/arg-that":349,"./builtin/captor":350,"./builtin/contains":351,"./builtin/is-a":352,"./builtin/not":353,"./create":354}],356:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (thing) {
  return thing && thing.__matches;
};

},{}],357:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('./util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _function = require('./function');

var _function2 = _interopRequireDefault(_function);

var _imitate = require('./imitate');

var _imitate2 = _interopRequireDefault(_imitate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_OPTIONS = { excludeMethods: ['then'] };

exports.default = function (nameOrType, config) {
  return _lodashWrap2.default.tap(fakeObject(nameOrType, config), function (obj) {
    addToStringToDouble(obj, nameOrType);
  });
};

var fakeObject = function fakeObject(nameOrType, config) {
  if (_lodashWrap2.default.isArray(nameOrType)) {
    return createTestDoublesForFunctionNames(nameOrType);
  } else if (_lodashWrap2.default.isObjectLike(nameOrType)) {
    return (0, _imitate2.default)(nameOrType);
  } else if (_lodashWrap2.default.isString(nameOrType) || nameOrType === undefined) {
    return createTestDoubleViaProxy(nameOrType, withDefaults(config));
  } else if (_lodashWrap2.default.isFunction(nameOrType)) {
    ensureFunctionIsNotPassed();
  } else {
    ensureOtherGarbageIsNotPassed();
  }
};

var createTestDoublesForFunctionNames = function createTestDoublesForFunctionNames(names) {
  return _lodashWrap2.default.transform(names, function (acc, funcName) {
    acc[funcName] = (0, _function2.default)('.' + funcName);
  });
};

var createTestDoubleViaProxy = function createTestDoubleViaProxy(name, config) {
  ensureProxySupport(name);
  var obj = {};
  return new Proxy(obj, {
    get: function get(target, propKey, receiver) {
      if (!obj.hasOwnProperty(propKey) && !_lodashWrap2.default.includes(config.excludeMethods, propKey)) {
        obj[propKey] = (0, _function2.default)(nameOf(name) + '.' + propKey);
      }
      return obj[propKey];
    }
  });
};

var ensureProxySupport = function ensureProxySupport(name) {
  if (typeof Proxy === 'undefined') {
    _log2.default.error('td.object', 'The current runtime does not have Proxy support, which is what\ntestdouble.js depends on when a string name is passed to `td.object()`.\n\nMore details here:\n  https://github.com/testdouble/testdouble.js/blob/master/docs/4-creating-test-doubles.md#objectobjectname\n\nDid you mean `td.object([\'' + name + '\'])`?');
  }
};

var ensureFunctionIsNotPassed = function ensureFunctionIsNotPassed() {
  return _log2.default.error('td.object', 'Functions are not valid arguments to `td.object` (as of testdouble@2.0.0). Please use `td.function()` or `td.constructor()` instead for creating fake functions.');
};

var ensureOtherGarbageIsNotPassed = function ensureOtherGarbageIsNotPassed() {
  return _log2.default.error('td.object', 'To create a fake object with td.object(), pass it a plain object that contains\nfunctions, an array of function names, or (if your runtime supports ES Proxy\nobjects) a string name.\n\nIf you passed td.object an instance of a custom type, consider passing the\ntype\'s constructor to `td.constructor()` instead.\n');
};

var withDefaults = function withDefaults(config) {
  return _lodashWrap2.default.extend({}, DEFAULT_OPTIONS, config);
};

var addToStringToDouble = function addToStringToDouble(fakeObject, nameOrType) {
  var name = nameOf(nameOrType);
  fakeObject.toString = function () {
    return '[test double object' + (name ? ' for "' + name + '"' : '') + ']';
  };
};

var nameOf = function nameOf(nameOrType) {
  return _lodashWrap2.default.isString(nameOrType) ? nameOrType : '';
};

},{"./function":336,"./imitate":338,"./log":347,"./util/lodash-wrap":370}],358:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (target) {
  if (_lodashWrap2.default.isString(target)) {
    return _module2.default.apply(undefined, arguments);
  } else {
    return _property2.default.apply(undefined, arguments);
  }
};

var _lodashWrap = require('../util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _quibble = require('quibble');

var _quibble2 = _interopRequireDefault(_quibble);

var _module = require('./module');

var _module2 = _interopRequireDefault(_module);

var _property = require('./property');

var _property2 = _interopRequireDefault(_property);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_quibble2.default.ignoreCallsFromThisFile();

},{"../util/lodash-wrap":370,"./module":359,"./property":360,"quibble":1}],359:[function(require,module,exports){
(function (process){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (path, stub) {
  if (arguments.length > 1) {
    return (0, _quibble2.default)(path, stub);
  }
  var realThing = requireAt(path);
  var fakeThing = (0, _imitate2.default)(realThing, [path + ': ' + nameFor(realThing)]);
  (0, _quibble2.default)(path, fakeThing);
  return fakeThing;
};

var _lodash = require('../wrap/lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _imitate = require('../imitate');

var _imitate2 = _interopRequireDefault(_imitate);

var _quibble = require('quibble');

var _quibble2 = _interopRequireDefault(_quibble);

var _resolve = require('resolve');

var _resolve2 = _interopRequireDefault(_resolve);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_quibble2.default.ignoreCallsFromThisFile();

var nameFor = function nameFor(realThing) {
  if (!_lodash2.default.isFunction(realThing)) return '';
  return realThing.name ? realThing.name : '(anonymous function)';
};

var requireAt = function requireAt(path) {
  try {
    // 1. Try just following quibble's inferred path
    return require(_quibble2.default.absolutify(path));
  } catch (e) {
    // 2. Try including npm packages
    return require(_resolve2.default.sync(path, { basedir: process.cwd() }));
  }
};

}).call(this,require('_process'))
},{"../imitate":338,"../wrap/lodash":370,"_process":296,"quibble":1,"resolve":297}],360:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = function (object, property, manualReplacement) {
  var isManual = arguments.length > 2;
  var realThingExists = object[property] || object.hasOwnProperty(property);

  if (isManual || realThingExists) {
    var realThing = object[property];
    return _lodashWrap2.default.tap(getFake(isManual, property, manualReplacement, realThing), function (fakeThing) {
      object[property] = fakeThing;
      _reset2.default.onNextReset(function () {
        if (realThingExists) {
          object[property] = realThing;
        } else {
          delete object[property];
        }
      });
    });
  } else {
    _log2.default.error('td.replace', 'No "' + property + '" property was found.');
  }
};

var _lodashWrap = require('../util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _imitate = require('../imitate');

var _imitate2 = _interopRequireDefault(_imitate);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

var _reset = require('../reset');

var _reset2 = _interopRequireDefault(_reset);

var _anything = require('../stringify/anything');

var _anything2 = _interopRequireDefault(_anything);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getFake = function getFake(isManual, property, manualReplacement, realThing) {
  if (isManual) {
    warnIfTypeMismatch(property, manualReplacement, realThing);
    return manualReplacement;
  } else {
    return (0, _imitate2.default)(realThing, [property]);
  }
};

var warnIfTypeMismatch = function warnIfTypeMismatch(property, fakeThing, realThing) {
  var fakeType = typeof fakeThing === 'undefined' ? 'undefined' : _typeof(fakeThing);
  var realType = typeof realThing === 'undefined' ? 'undefined' : _typeof(realThing);
  if (realThing !== undefined && fakeType !== realType) {
    _log2.default.warn('td.replace', 'property "' + property + '" ' + (0, _anything2.default)(realThing) + ' (' + _lodashWrap2.default.capitalize(realType) + ') was replaced with ' + (0, _anything2.default)(fakeThing) + ', which has a different type (' + _lodashWrap2.default.capitalize(fakeType) + ').');
  }
};

},{"../imitate":338,"../log":347,"../reset":361,"../stringify/anything":365,"../util/lodash-wrap":370}],361:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('./util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _quibble = require('quibble');

var _quibble2 = _interopRequireDefault(_quibble);

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var resetHandlers = [];

exports.default = _lodashWrap2.default.tap(function () {
  _store2.default.reset();
  _quibble2.default.reset();
  _lodashWrap2.default.each(resetHandlers, function (resetHandler) {
    return resetHandler();
  });
  resetHandlers = [];
}, function (reset) {
  reset.onNextReset = function (func) {
    return resetHandlers.push(func);
  };
});

},{"./store":363,"./util/lodash-wrap":370,"quibble":1}],362:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('../util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _argsMatch = require('../args-match');

var _argsMatch2 = _interopRequireDefault(_argsMatch);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var callHistory = []; // <-- remember this to pop our DSL of when(<call>)/verify(<call>)
_index2.default.onReset(function () {
  callHistory = [];
});

exports.default = {
  log: function log(testDouble, args, context) {
    _index2.default.for(testDouble).calls.push({ args: args, context: context });
    return callHistory.push({ testDouble: testDouble, args: args, context: context });
  },
  pop: function pop() {
    return _lodashWrap2.default.tap(callHistory.pop(), function (call) {
      if (call != null) {
        _index2.default.for(call.testDouble).calls.pop();
      }
    });
  },
  wasInvoked: function wasInvoked(testDouble, args, config) {
    var matchingInvocationCount = this.where(testDouble, args, config).length;
    if (config.times != null) {
      return matchingInvocationCount === config.times;
    } else {
      return matchingInvocationCount > 0;
    }
  },
  where: function where(testDouble, args, config) {
    return _lodashWrap2.default.filter(_index2.default.for(testDouble).calls, function (call) {
      return (0, _argsMatch2.default)(args, call.args, config);
    });
  },
  for: function _for(testDouble) {
    return _index2.default.for(testDouble).calls;
  }
};

},{"../args-match":331,"../util/lodash-wrap":370,"./index":363}],363:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('../util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _events = require('events');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var storeEmitter = new _events.EventEmitter();
var globalStore = [];

exports.default = {
  onReset: function onReset(func) {
    storeEmitter.on('reset', func);
  },
  reset: function reset() {
    globalStore = [];
    storeEmitter.emit('reset');
  },
  for: function _for(testDouble) {
    var createIfNew = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    var entry = _lodashWrap2.default.find(globalStore, { testDouble: testDouble });
    if (entry) {
      return entry;
    } else if (createIfNew) {
      return _lodashWrap2.default.tap({
        testDouble: testDouble,
        stubbings: [],
        calls: [],
        verifications: []
      }, function (newEntry) {
        return globalStore.push(newEntry);
      });
    }
  }
};

},{"../util/lodash-wrap":370,"events":58}],364:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('../util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _argsMatch = require('../args-match');

var _argsMatch2 = _interopRequireDefault(_argsMatch);

var _callback = require('../callback');

var _callback2 = _interopRequireDefault(_callback);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _log = require('../log');

var _log2 = _interopRequireDefault(_log);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

exports.default = {
  add: function add(testDouble, args, stubbedValues, config) {
    return _index2.default.for(testDouble).stubbings.push({
      callCount: 0,
      stubbedValues: stubbedValues,
      args: args,
      config: config
    });
  },
  invoke: function invoke(testDouble, actualArgs, actualContext) {
    var stubbing = stubbingFor(testDouble, actualArgs);
    if (stubbing) {
      return executePlan(stubbing, actualArgs, actualContext);
    }
  },
  for: function _for(testDouble) {
    return _index2.default.for(testDouble).stubbings;
  }
};


var stubbingFor = function stubbingFor(testDouble, actualArgs) {
  return _lodashWrap2.default.findLast(_index2.default.for(testDouble).stubbings, function (stubbing) {
    return isSatisfied(stubbing, actualArgs);
  });
};

var executePlan = function executePlan(stubbing, actualArgs, actualContext) {
  var value = stubbedValueFor(stubbing);
  stubbing.callCount += 1;
  invokeCallbackFor(stubbing, actualArgs);
  switch (stubbing.config.plan) {
    case 'thenReturn':
      return value;
    case 'thenDo':
      return value.apply(actualContext, actualArgs);
    case 'thenThrow':
      throw value;
    case 'thenResolve':
      return createPromise(stubbing, value, true);
    case 'thenReject':
      return createPromise(stubbing, value, false);
  }
};

var invokeCallbackFor = function invokeCallbackFor(stubbing, actualArgs) {
  if (_lodashWrap2.default.some(stubbing.args, _callback2.default.isCallback)) {
    _lodashWrap2.default.each(stubbing.args, function (expectedArg, i) {
      if (_callback2.default.isCallback(expectedArg)) {
        callCallback(stubbing, actualArgs[i], callbackArgs(stubbing, expectedArg));
      }
    });
  }
};

var callbackArgs = function callbackArgs(stubbing, expectedArg) {
  if (expectedArg.args != null) {
    return expectedArg.args;
  } else if (stubbing.config.plan === 'thenCallback') {
    return stubbing.stubbedValues;
  } else {
    return [];
  }
};

var callCallback = function callCallback(stubbing, callback, args) {
  if (stubbing.config.delay) {
    return _lodashWrap2.default.delay.apply(_lodashWrap2.default, [callback, stubbing.config.delay].concat(_toConsumableArray(args)));
  } else if (stubbing.config.defer) {
    return _lodashWrap2.default.defer.apply(_lodashWrap2.default, [callback].concat(_toConsumableArray(args)));
  } else {
    return callback.apply(undefined, _toConsumableArray(args)); // eslint-disable-line
  }
};

var createPromise = function createPromise(stubbing, value, willResolve) {
  var Promise = (0, _config2.default)().promiseConstructor;
  ensurePromise(Promise);
  return new Promise(function (resolve, reject) {
    callCallback(stubbing, function () {
      return willResolve ? resolve(value) : reject(value);
    }, [value]);
  });
};

var stubbedValueFor = function stubbedValueFor(stubbing) {
  return stubbing.callCount < stubbing.stubbedValues.length ? stubbing.stubbedValues[stubbing.callCount] : _lodashWrap2.default.last(stubbing.stubbedValues);
};

var isSatisfied = function isSatisfied(stubbing, actualArgs) {
  return (0, _argsMatch2.default)(stubbing.args, actualArgs, stubbing.config) && hasTimesRemaining(stubbing);
};

var hasTimesRemaining = function hasTimesRemaining(stubbing) {
  return stubbing.config.times == null ? true : stubbing.callCount < stubbing.config.times;
};

var ensurePromise = function ensurePromise(Promise) {
  if (Promise == null) {
    return _log2.default.error('td.when', 'no promise constructor is set (perhaps this runtime lacks a native Promise\nfunction?), which means this stubbing can\'t return a promise to your\nsubject under test, resulting in this error. To resolve the issue, set\na promise constructor with `td.config`, like this:\n\n  td.config({\n    promiseConstructor: require(\'bluebird\')\n  })');
  }
};

},{"../args-match":331,"../callback":332,"../config":333,"../log":347,"../util/lodash-wrap":370,"./index":363}],365:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('../util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _isMatcher = require('../matchers/is-matcher');

var _isMatcher2 = _interopRequireDefault(_isMatcher);

var _stringifyObjectEs = require('stringify-object-es5');

var _stringifyObjectEs2 = _interopRequireDefault(_stringifyObjectEs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (anything) {
  if (_lodashWrap2.default.isString(anything)) {
    return stringifyString(anything);
  } else if ((0, _isMatcher2.default)(anything)) {
    return anything.__name;
  } else {
    return (0, _stringifyObjectEs2.default)(anything, {
      indent: '  ',
      singleQuotes: false,
      inlineCharacterLimit: 65,
      transform: function transform(obj, prop, originalResult) {
        if ((0, _isMatcher2.default)(obj[prop])) {
          return obj[prop].__name;
        } else {
          return originalResult;
        }
      }
    });
  }
};

var stringifyString = function stringifyString(string) {
  return _lodashWrap2.default.includes(string, '\n') ? '"""\n' + string + '\n"""' : '"' + string.replace(new RegExp('"', 'g'), '\\"') + '"';
};

},{"../matchers/is-matcher":356,"../util/lodash-wrap":370,"stringify-object-es5":304}],366:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('../util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _anything = require('./anything');

var _anything2 = _interopRequireDefault(_anything);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (args) {
  var joiner = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : ', ';
  var wrapper = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  return _lodashWrap2.default.map(args, function (arg) {
    return '' + wrapper + (0, _anything2.default)(arg) + wrapper;
  }).join(joiner);
};

},{"../util/lodash-wrap":370,"./anything":365}],367:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('./util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _argsMatch = require('./args-match');

var _argsMatch2 = _interopRequireDefault(_argsMatch);

var _calls = require('./store/calls');

var _calls2 = _interopRequireDefault(_calls);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

var _arguments = require('./stringify/arguments');

var _arguments2 = _interopRequireDefault(_arguments);

var _stubbings = require('./store/stubbings');

var _stubbings2 = _interopRequireDefault(_stubbings);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (__userDoesRehearsalInvocationHere__) {
  var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var last = _calls2.default.pop();
  ensureRehearsalOccurred(last);
  if (_calls2.default.wasInvoked(last.testDouble, last.args, config)) {
    // Do nothing! We're verified! :-D
    warnIfStubbed(last.testDouble, last.args);
  } else {
    _log2.default.fail(unsatisfiedErrorMessage(last.testDouble, last.args, config));
  }
};

var ensureRehearsalOccurred = function ensureRehearsalOccurred(last) {
  if (!last) {
    _log2.default.error('td.verify', 'No test double invocation detected for `verify()`.\n\n  Usage:\n    verify(myTestDouble(\'foo\'))');
  }
};

var warnIfStubbed = function warnIfStubbed(testDouble, actualArgs) {
  if (_lodashWrap2.default.some(_stubbings2.default.for(testDouble), function (stubbing) {
    return (0, _argsMatch2.default)(stubbing.args, actualArgs, stubbing.config);
  })) {
    _log2.default.warn('td.verify', 'test double' + stringifyName(testDouble) + ' was both stubbed and verified with arguments (' + (0, _arguments2.default)(actualArgs) + '), which is redundant and probably unnecessary.', 'https://github.com/testdouble/testdouble.js/blob/master/docs/B-frequently-asked-questions.md#why-shouldnt-i-call-both-tdwhen-and-tdverify-for-a-single-interaction-with-a-test-double');
  }
};

var unsatisfiedErrorMessage = function unsatisfiedErrorMessage(testDouble, args, config) {
  return baseSummary(testDouble, args, config) + matchedInvocationSummary(testDouble, args, config) + invocationSummary(testDouble, args, config);
};

var stringifyName = function stringifyName(testDouble) {
  var name = _store2.default.for(testDouble).name;
  return name ? ' `' + name + '`' : '';
};

var baseSummary = function baseSummary(testDouble, args, config) {
  return 'Unsatisfied verification on test double' + stringifyName(testDouble) + '.\n\n  Wanted:\n    - called with `(' + (0, _arguments2.default)(args) + ')`' + timesMessage(config) + ignoreMessage(config) + '.';
};

var invocationSummary = function invocationSummary(testDouble, args, config) {
  var calls = _calls2.default.for(testDouble);
  if (calls.length === 0) {
    return '\n\n  But there were no invocations of the test double.';
  } else {
    return _lodashWrap2.default.reduce(calls, function (desc, call) {
      return desc + ('\n    - called with `(' + (0, _arguments2.default)(call.args) + ')`.');
    }, '\n\n  All calls of the test double, in order were:');
  }
};

var matchedInvocationSummary = function matchedInvocationSummary(testDouble, args, config) {
  var calls = _calls2.default.where(testDouble, args, config);
  var expectedCalls = config.times || 0;

  if (calls.length === 0 || calls.length > expectedCalls) {
    return '';
  } else {
    return _lodashWrap2.default.reduce(_lodashWrap2.default.groupBy(calls, 'args'), function (desc, callsMatchingArgs, args) {
      return desc + ('\n    - called ' + pluralize(callsMatchingArgs.length, 'time') + ' with `(' + (0, _arguments2.default)(callsMatchingArgs[0].args) + ')`.');
    }, '\n\n  ' + pluralize(calls.length, 'call') + ' that satisfied this verification:');
  }
};

var pluralize = function pluralize(x, msg) {
  return x + ' ' + msg + (x === 1 ? '' : 's');
};

var timesMessage = function timesMessage(config) {
  return config.times != null ? ' ' + pluralize(config.times, 'time') : '';
};

var ignoreMessage = function ignoreMessage(config) {
  return config.ignoreExtraArgs != null ? ', ignoring any additional arguments' : '';
};

},{"./args-match":331,"./log":347,"./store":363,"./store/calls":362,"./store/stubbings":364,"./stringify/arguments":366,"./util/lodash-wrap":370}],368:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = '3.2.6';

},{}],369:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodashWrap = require('./util/lodash-wrap');

var _lodashWrap2 = _interopRequireDefault(_lodashWrap);

var _callback = require('./callback');

var _callback2 = _interopRequireDefault(_callback);

var _calls = require('./store/calls');

var _calls2 = _interopRequireDefault(_calls);

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

var _stubbings = require('./store/stubbings');

var _stubbings2 = _interopRequireDefault(_stubbings);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (__userDoesRehearsalInvocationHere__) {
  var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return {
    thenReturn: function thenReturn() {
      for (var _len = arguments.length, stubbedValues = Array(_len), _key = 0; _key < _len; _key++) {
        stubbedValues[_key] = arguments[_key];
      }

      return addStubbing(stubbedValues, config, 'thenReturn');
    },
    thenCallback: function thenCallback() {
      for (var _len2 = arguments.length, stubbedValues = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        stubbedValues[_key2] = arguments[_key2];
      }

      return addStubbing(stubbedValues, config, 'thenCallback');
    },
    thenDo: function thenDo() {
      for (var _len3 = arguments.length, stubbedValues = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        stubbedValues[_key3] = arguments[_key3];
      }

      return addStubbing(stubbedValues, config, 'thenDo');
    },
    thenThrow: function thenThrow() {
      for (var _len4 = arguments.length, stubbedValues = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        stubbedValues[_key4] = arguments[_key4];
      }

      return addStubbing(stubbedValues, config, 'thenThrow');
    },
    thenResolve: function thenResolve() {
      warnIfPromiseless();

      for (var _len5 = arguments.length, stubbedValues = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        stubbedValues[_key5] = arguments[_key5];
      }

      return addStubbing(stubbedValues, config, 'thenResolve');
    },
    thenReject: function thenReject() {
      warnIfPromiseless();

      for (var _len6 = arguments.length, stubbedValues = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        stubbedValues[_key6] = arguments[_key6];
      }

      return addStubbing(stubbedValues, config, 'thenReject');
    }
  };
};

var addStubbing = function addStubbing(stubbedValues, config, plan) {
  var last = _calls2.default.pop();
  ensureRehearsalOccurred(last);
  _lodashWrap2.default.assign(config, { plan: plan });
  _stubbings2.default.add(last.testDouble, concatImpliedCallback(last.args, config), stubbedValues, config);
  return last.testDouble;
};

var ensureRehearsalOccurred = function ensureRehearsalOccurred(last) {
  if (!last) {
    return _log2.default.error('td.when', 'No test double invocation call detected for `when()`.\n\n  Usage:\n    when(myTestDouble(\'foo\')).thenReturn(\'bar\')');
  }
};

var concatImpliedCallback = function concatImpliedCallback(args, config) {
  if (config.plan !== 'thenCallback') {
    return args;
  } else if (!_lodashWrap2.default.some(args, _callback2.default.isCallback)) {
    return args.concat(_callback2.default);
  } else {
    return args;
  }
};

var warnIfPromiseless = function warnIfPromiseless() {
  if ((0, _config2.default)().promiseConstructor == null) {
    _log2.default.warn('td.when', 'no promise constructor is set, so this `thenResolve` or `thenReject` stubbing\nwill fail if it\'s satisfied by an invocation on the test double. You can tell\ntestdouble.js which promise constructor to use with `td.config`, like so:\n\n  td.config({\n    promiseConstructor: require(\'bluebird\')\n  })');
  }
};

},{"./callback":332,"./config":333,"./log":347,"./store/calls":362,"./store/stubbings":364,"./util/lodash-wrap":370}],370:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _capitalize = require('lodash/capitalize');

var _capitalize2 = _interopRequireDefault(_capitalize);

var _clone = require('lodash/clone');

var _clone2 = _interopRequireDefault(_clone);

var _compact = require('lodash/compact');

var _compact2 = _interopRequireDefault(_compact);

var _defer = require('lodash/defer');

var _defer2 = _interopRequireDefault(_defer);

var _delay = require('lodash/delay');

var _delay2 = _interopRequireDefault(_delay);

var _each = require('lodash/each');

var _each2 = _interopRequireDefault(_each);

var _every = require('lodash/every');

var _every2 = _interopRequireDefault(_every);

var _extend = require('lodash/extend');

var _extend2 = _interopRequireDefault(_extend);

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

var _find = require('lodash/find');

var _find2 = _interopRequireDefault(_find);

var _findLast = require('lodash/findLast');

var _findLast2 = _interopRequireDefault(_findLast);

var _get = require('lodash/get');

var _get2 = _interopRequireDefault(_get);

var _groupBy = require('lodash/groupBy');

var _groupBy2 = _interopRequireDefault(_groupBy);

var _includes = require('lodash/includes');

var _includes2 = _interopRequireDefault(_includes);

var _invoke = require('lodash/invoke');

var _invoke2 = _interopRequireDefault(_invoke);

var _isArguments = require('lodash/isArguments');

var _isArguments2 = _interopRequireDefault(_isArguments);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isBoolean = require('lodash/isBoolean');

var _isBoolean2 = _interopRequireDefault(_isBoolean);

var _isEmpty = require('lodash/isEmpty');

var _isEmpty2 = _interopRequireDefault(_isEmpty);

var _isEqual = require('lodash/isEqual');

var _isEqual2 = _interopRequireDefault(_isEqual);

var _isEqualWith = require('lodash/isEqualWith');

var _isEqualWith2 = _interopRequireDefault(_isEqualWith);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _isNumber = require('lodash/isNumber');

var _isNumber2 = _interopRequireDefault(_isNumber);

var _isObject = require('lodash/isObject');

var _isObject2 = _interopRequireDefault(_isObject);

var _isObjectLike = require('lodash/isObjectLike');

var _isObjectLike2 = _interopRequireDefault(_isObjectLike);

var _isRegExp = require('lodash/isRegExp');

var _isRegExp2 = _interopRequireDefault(_isRegExp);

var _isString = require('lodash/isString');

var _isString2 = _interopRequireDefault(_isString);

var _keys = require('lodash/keys');

var _keys2 = _interopRequireDefault(_keys);

var _last = require('lodash/last');

var _last2 = _interopRequireDefault(_last);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _reduce = require('lodash/reduce');

var _reduce2 = _interopRequireDefault(_reduce);

var _reject = require('lodash/reject');

var _reject2 = _interopRequireDefault(_reject);

var _some = require('lodash/some');

var _some2 = _interopRequireDefault(_some);

var _tap = require('lodash/tap');

var _tap2 = _interopRequireDefault(_tap);

var _toArray = require('lodash/toArray');

var _toArray2 = _interopRequireDefault(_toArray);

var _transform = require('lodash/transform');

var _transform2 = _interopRequireDefault(_transform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  assign: _assign2.default,
  capitalize: _capitalize2.default,
  clone: _clone2.default,
  compact: _compact2.default,
  defer: _defer2.default,
  delay: _delay2.default,
  each: _each2.default,
  every: _every2.default,
  extend: _extend2.default,
  filter: _filter2.default,
  find: _find2.default,
  findLast: _findLast2.default,
  get: _get2.default,
  groupBy: _groupBy2.default,
  includes: _includes2.default,
  invoke: _invoke2.default,
  isArguments: _isArguments2.default,
  isArray: _isArray2.default,
  isBoolean: _isBoolean2.default,
  isEmpty: _isEmpty2.default,
  isEqual: _isEqual2.default,
  isEqualWith: _isEqualWith2.default,
  isFunction: _isFunction2.default,
  isNumber: _isNumber2.default,
  isObject: _isObject2.default,
  isObjectLike: _isObjectLike2.default,
  isRegExp: _isRegExp2.default,
  isString: _isString2.default,
  keys: _keys2.default,
  last: _last2.default,
  map: _map2.default,
  reduce: _reduce2.default,
  reject: _reject2.default,
  some: _some2.default,
  tap: _tap2.default,
  toArray: _toArray2.default,
  transform: _transform2.default
};

},{"lodash/assign":231,"lodash/capitalize":233,"lodash/clone":234,"lodash/compact":235,"lodash/defer":237,"lodash/delay":238,"lodash/each":239,"lodash/every":241,"lodash/extend":242,"lodash/filter":243,"lodash/find":244,"lodash/findLast":246,"lodash/get":249,"lodash/groupBy":250,"lodash/includes":253,"lodash/invoke":254,"lodash/isArguments":255,"lodash/isArray":256,"lodash/isBoolean":258,"lodash/isEmpty":260,"lodash/isEqual":261,"lodash/isEqualWith":262,"lodash/isFunction":263,"lodash/isNumber":265,"lodash/isObject":266,"lodash/isObjectLike":267,"lodash/isRegExp":268,"lodash/isString":269,"lodash/keys":272,"lodash/last":274,"lodash/map":275,"lodash/reduce":279,"lodash/reject":280,"lodash/some":281,"lodash/tap":284,"lodash/toArray":285,"lodash/transform":290}]},{},[306]);