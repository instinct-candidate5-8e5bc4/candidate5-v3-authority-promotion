var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e3) {
    throw err = [e3], e3;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e3) {
    throw mod = 0, e3;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// visual-slice/engine/shims/buffer-inject.mjs
var hex, Buffer2;
var init_buffer_inject = __esm({
  "visual-slice/engine/shims/buffer-inject.mjs"() {
    hex = (u2) => [...u2].map((b) => b.toString(16).padStart(2, "0")).join("");
    Buffer2 = { from(s2) {
      const u2 = new TextEncoder().encode(String(s2));
      u2.toString = (enc) => enc === "hex" ? hex(u2) : new TextDecoder().decode(u2);
      return u2;
    } };
  }
});

// visual-slice/engine/shims/path.mjs
var path_exports = {};
__export(path_exports, {
  default: () => path_default,
  dirname: () => dirname,
  join: () => join,
  resolve: () => resolve,
  sep: () => sep
});
function join(...a2) {
  return norm(a2.filter((x) => x !== "" && x !== void 0).join("/"));
}
function dirname(p2) {
  const s2 = norm(String(p2));
  const i2 = s2.lastIndexOf("/");
  return i2 <= 0 ? "/" : s2.slice(0, i2);
}
function resolve(...a2) {
  return join(...a2);
}
var norm, sep, path_default;
var init_path = __esm({
  "visual-slice/engine/shims/path.mjs"() {
    init_buffer_inject();
    norm = (s2) => s2.replace(/\/+/g, "/");
    sep = "/";
    path_default = { join, dirname, resolve, sep };
  }
});

// evidence/verified-architecture-phase2/surface-models/school.json
var school_default;
var init_school = __esm({
  "evidence/verified-architecture-phase2/surface-models/school.json"() {
    school_default = '{\n  "surfaceModelId": "school-surface-v1",\n  "sceneId": "school",\n  "schemaVersion": "2.0.0",\n  "revision": 1,\n  "sourceEvidence": {\n    "source": {\n      "artifact": "index.html",\n      "sha256": "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618",\n      "origin": "RECOVERED canonical production source committed at Recovery Baseline 11c5ba0",\n      "verification": "exact bytes at locked commit 30cb23e"\n    },\n    "panorama": "c85dc927ac565ed863f7f8e0bbaddd0fc66120b542630d3aa57e6163a5684361",\n    "panoramaRole": "PIXEL_DIAGNOSTIC_ONLY",\n    "geometryBindingStatus": "UNKNOWN"\n  },\n  "surfaces": [\n    {\n      "surfaceId": "floor",\n      "type": "FLOOR",\n      "region": {\n        "allowed": [\n          {\n            "regionId": "floor-positive",\n            "minX": -7,\n            "maxX": 7,\n            "minZ": -4,\n            "maxZ": 6\n          }\n        ],\n        "volumes": []\n      },\n      "planeOrDepth": {\n        "kind": "PLANE",\n        "planeY": 0\n      },\n      "contactRules": [\n        {\n          "contactRuleId": "full-footprint-floor",\n          "policy": "FULL_FOOTPRINT"\n        }\n      ],\n      "confidence": "AUTHORED_GEOMETRY_EXACT",\n      "provenance": {\n        "artifact": "index.html",\n        "sha256": "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618",\n        "origin": "RECOVERED canonical production source committed at Recovery Baseline 11c5ba0",\n        "verification": "exact bytes at locked commit 30cb23e"\n      }\n    },\n    {\n      "surfaceId": "back-wall",\n      "type": "WALL",\n      "region": {\n        "allowed": [],\n        "volumes": [\n          {\n            "volumeId": "back-wall-box",\n            "minX": -9,\n            "maxX": 9,\n            "minY": 0,\n            "maxY": 6,\n            "minZ": -4.08,\n            "maxZ": -3.92\n          }\n        ]\n      },\n      "planeOrDepth": {\n        "kind": "BOX_DEPTH",\n        "planeY": 0\n      },\n      "contactRules": [],\n      "confidence": "AUTHORED_GEOMETRY_EXACT",\n      "provenance": {\n        "artifact": "index.html",\n        "sha256": "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618",\n        "origin": "RECOVERED canonical production source committed at Recovery Baseline 11c5ba0",\n        "verification": "exact bytes at locked commit 30cb23e"\n      }\n    },\n    {\n      "surfaceId": "left-wall",\n      "type": "WALL",\n      "region": {\n        "allowed": [],\n        "volumes": [\n          {\n            "volumeId": "left-wall-box",\n            "minX": -7.08,\n            "maxX": -6.92,\n            "minY": 0,\n            "maxY": 6,\n            "minZ": -6,\n            "maxZ": 6\n          }\n        ]\n      },\n      "planeOrDepth": {\n        "kind": "BOX_DEPTH",\n        "planeY": 0\n      },\n      "contactRules": [],\n      "confidence": "AUTHORED_GEOMETRY_EXACT",\n      "provenance": {\n        "artifact": "index.html",\n        "sha256": "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618",\n        "origin": "RECOVERED canonical production source committed at Recovery Baseline 11c5ba0",\n        "verification": "exact bytes at locked commit 30cb23e"\n      }\n    },\n    {\n      "surfaceId": "right-wall",\n      "type": "WALL",\n      "region": {\n        "allowed": [],\n        "volumes": [\n          {\n            "volumeId": "right-wall-box",\n            "minX": 6.92,\n            "maxX": 7.08,\n            "minY": 0,\n            "maxY": 6,\n            "minZ": -6,\n            "maxZ": 6\n          }\n        ]\n      },\n      "planeOrDepth": {\n        "kind": "BOX_DEPTH",\n        "planeY": 0\n      },\n      "contactRules": [],\n      "confidence": "AUTHORED_GEOMETRY_EXACT",\n      "provenance": {\n        "artifact": "index.html",\n        "sha256": "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618",\n        "origin": "RECOVERED canonical production source committed at Recovery Baseline 11c5ba0",\n        "verification": "exact bytes at locked commit 30cb23e"\n      }\n    },\n    {\n      "surfaceId": "door",\n      "type": "DOOR_OR_OPENING",\n      "region": {\n        "allowed": [],\n        "volumes": [\n          {\n            "volumeId": "door-box",\n            "minX": 4.725,\n            "maxX": 6.075,\n            "minY": 0,\n            "maxY": 2.9,\n            "minZ": -3.9,\n            "maxZ": -3.78\n          }\n        ]\n      },\n      "planeOrDepth": {\n        "kind": "BOX_DEPTH",\n        "planeY": 0\n      },\n      "contactRules": [],\n      "confidence": "AUTHORED_GEOMETRY_EXACT",\n      "provenance": {\n        "artifact": "index.html",\n        "sha256": "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618",\n        "origin": "RECOVERED canonical production source committed at Recovery Baseline 11c5ba0",\n        "verification": "exact bytes at locked commit 30cb23e"\n      }\n    },\n    {\n      "surfaceId": "locker-0",\n      "type": "OBSTACLE",\n      "region": {\n        "allowed": [],\n        "volumes": [\n          {\n            "volumeId": "locker-0-box",\n            "minX": -4.5,\n            "maxX": -3.5,\n            "minY": 0,\n            "maxY": 2.4,\n            "minZ": -3.775,\n            "maxZ": -3.225\n          }\n        ]\n      },\n      "planeOrDepth": {\n        "kind": "BOX_DEPTH",\n        "planeY": 0\n      },\n      "contactRules": [],\n      "confidence": "AUTHORED_GEOMETRY_EXACT",\n      "provenance": {\n        "artifact": "index.html",\n        "sha256": "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618",\n        "origin": "RECOVERED canonical production source committed at Recovery Baseline 11c5ba0",\n        "verification": "exact bytes at locked commit 30cb23e"\n      }\n    },\n    {\n      "surfaceId": "locker-1",\n      "type": "OBSTACLE",\n      "region": {\n        "allowed": [],\n        "volumes": [\n          {\n            "volumeId": "locker-1-box",\n            "minX": -2.5,\n            "maxX": -1.5,\n            "minY": 0,\n            "maxY": 2.4,\n            "minZ": -3.775,\n            "maxZ": -3.225\n          }\n        ]\n      },\n      "planeOrDepth": {\n        "kind": "BOX_DEPTH",\n        "planeY": 0\n      },\n      "contactRules": [],\n      "confidence": "AUTHORED_GEOMETRY_EXACT",\n      "provenance": {\n        "artifact": "index.html",\n        "sha256": "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618",\n        "origin": "RECOVERED canonical production source committed at Recovery Baseline 11c5ba0",\n        "verification": "exact bytes at locked commit 30cb23e"\n      }\n    },\n    {\n      "surfaceId": "locker-2",\n      "type": "OBSTACLE",\n      "region": {\n        "allowed": [],\n        "volumes": [\n          {\n            "volumeId": "locker-2-box",\n            "minX": -0.5,\n            "maxX": 0.5,\n            "minY": 0,\n            "maxY": 2.4,\n            "minZ": -3.775,\n            "maxZ": -3.225\n          }\n        ]\n      },\n      "planeOrDepth": {\n        "kind": "BOX_DEPTH",\n        "planeY": 0\n      },\n      "contactRules": [],\n      "confidence": "AUTHORED_GEOMETRY_EXACT",\n      "provenance": {\n        "artifact": "index.html",\n        "sha256": "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618",\n        "origin": "RECOVERED canonical production source committed at Recovery Baseline 11c5ba0",\n        "verification": "exact bytes at locked commit 30cb23e"\n      }\n    },\n    {\n      "surfaceId": "locker-3",\n      "type": "OBSTACLE",\n      "region": {\n        "allowed": [],\n        "volumes": [\n          {\n            "volumeId": "locker-3-box",\n            "minX": 1.5,\n            "maxX": 2.5,\n            "minY": 0,\n            "maxY": 2.4,\n            "minZ": -3.775,\n            "maxZ": -3.225\n          }\n        ]\n      },\n      "planeOrDepth": {\n        "kind": "BOX_DEPTH",\n        "planeY": 0\n      },\n      "contactRules": [],\n      "confidence": "AUTHORED_GEOMETRY_EXACT",\n      "provenance": {\n        "artifact": "index.html",\n        "sha256": "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618",\n        "origin": "RECOVERED canonical production source committed at Recovery Baseline 11c5ba0",\n        "verification": "exact bytes at locked commit 30cb23e"\n      }\n    },\n    {\n      "surfaceId": "locker-4",\n      "type": "OBSTACLE",\n      "region": {\n        "allowed": [],\n        "volumes": [\n          {\n            "volumeId": "locker-4-box",\n            "minX": 3.5,\n            "maxX": 4.5,\n            "minY": 0,\n            "maxY": 2.4,\n            "minZ": -3.775,\n            "maxZ": -3.225\n          }\n        ]\n      },\n      "planeOrDepth": {\n        "kind": "BOX_DEPTH",\n        "planeY": 0\n      },\n      "contactRules": [],\n      "confidence": "AUTHORED_GEOMETRY_EXACT",\n      "provenance": {\n        "artifact": "index.html",\n        "sha256": "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618",\n        "origin": "RECOVERED canonical production source committed at Recovery Baseline 11c5ba0",\n        "verification": "exact bytes at locked commit 30cb23e"\n      }\n    }\n  ]\n}\n';
  }
});

// visual-slice/engine/shims/fs.mjs
var fs_exports = {};
__export(fs_exports, {
  default: () => fs_default,
  readFileSync: () => readFileSync
});
function readFileSync(p2, enc) {
  const s2 = String(p2);
  for (const f2 of FILES) if (s2.endsWith(f2.suffix)) return f2.text;
  throw Error("fs shim: read outside the pinned inline set: " + s2);
}
var FILES, fs_default;
var init_fs = __esm({
  "visual-slice/engine/shims/fs.mjs"() {
    init_buffer_inject();
    init_school();
    FILES = [{ suffix: "evidence/verified-architecture-phase2/surface-models/school.json", text: school_default }];
    fs_default = { readFileSync };
  }
});

// visual-slice/engine/vendor/js-sha256.mjs
function y(t2, h2) {
  h2 ? (a[0] = a[16] = a[1] = a[2] = a[3] = a[4] = a[5] = a[6] = a[7] = a[8] = a[9] = a[10] = a[11] = a[12] = a[13] = a[14] = a[15] = 0, this.blocks = a) : this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], t2 ? (this.h0 = 3238371032, this.h1 = 914150663, this.h2 = 812702999, this.h3 = 4144912697, this.h4 = 4290775857, this.h5 = 1750603025, this.h6 = 1694076839, this.h7 = 3204075428) : (this.h0 = 1779033703, this.h1 = 3144134277, this.h2 = 1013904242, this.h3 = 2773480762, this.h4 = 1359893119, this.h5 = 2600822924, this.h6 = 528734635, this.h7 = 1541459225), this.block = this.start = this.bytes = this.hBytes = 0, this.finalized = this.hashed = false, this.first = true, this.is224 = t2;
}
function l(t2, i2, s2) {
  var r2, e3 = h(t2);
  if (t2 = e3[0], e3[1]) {
    var n2, a2 = [], o2 = t2.length, f2 = 0;
    for (r2 = 0; r2 < o2; ++r2) (n2 = t2.charCodeAt(r2)) < 128 ? a2[f2++] = n2 : n2 < 2048 ? (a2[f2++] = 192 | n2 >>> 6, a2[f2++] = 128 | 63 & n2) : n2 < 55296 || n2 >= 57344 ? (a2[f2++] = 224 | n2 >>> 12, a2[f2++] = 128 | n2 >>> 6 & 63, a2[f2++] = 128 | 63 & n2) : (n2 = 65536 + ((1023 & n2) << 10 | 1023 & t2.charCodeAt(++r2)), a2[f2++] = 240 | n2 >>> 18, a2[f2++] = 128 | n2 >>> 12 & 63, a2[f2++] = 128 | n2 >>> 6 & 63, a2[f2++] = 128 | 63 & n2);
    t2 = a2;
  }
  t2.length > 64 && (t2 = new y(i2, true).update(t2).array());
  var u2 = [], c3 = [];
  for (r2 = 0; r2 < 64; ++r2) {
    var l2 = t2[r2] || 0;
    u2[r2] = 92 ^ l2, c3[r2] = 54 ^ l2;
  }
  y.call(this, i2, s2), this.update(c3), this.oKeyPad = u2, this.inner = true, this.sharedMemory = s2;
}
var t, h, i, s, r, e, n, a, o, f, u, c, p, d;
var init_js_sha256 = __esm({
  "visual-slice/engine/vendor/js-sha256.mjs"() {
    init_buffer_inject();
    t = "undefined" != typeof ArrayBuffer;
    h = function(h2) {
      if ("string" === typeof h2) return [h2, true];
      if (Array.isArray(h2)) return [h2, false];
      if (t && h2) {
        if (h2.constructor === ArrayBuffer) return [new Uint8Array(h2), false];
        if (ArrayBuffer.isView(h2)) return [h2, false];
      }
      throw new Error("input is invalid type");
    };
    i = "0123456789abcdef".split("");
    s = [-2147483648, 8388608, 32768, 128];
    r = [24, 16, 8, 0];
    e = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298];
    n = ["hex", "array", "digest", "arrayBuffer"];
    a = [];
    o = function(t2, h2) {
      return function(i2) {
        return new y(h2, true).update(i2)[t2]();
      };
    };
    f = function(t2) {
      var h2 = o("hex", t2);
      h2.create = function() {
        return new y(t2);
      }, h2.update = function(t3) {
        return h2.create().update(t3);
      };
      for (var i2 = 0; i2 < n.length; ++i2) {
        var s2 = n[i2];
        h2[s2] = o(s2, t2);
      }
      return h2;
    };
    u = function(t2, h2) {
      return function(i2, s2) {
        return new l(i2, h2, true).update(s2)[t2]();
      };
    };
    c = function(t2) {
      var h2 = u("hex", t2);
      h2.create = function(h3) {
        return new l(h3, t2);
      }, h2.update = function(t3, i3) {
        return h2.create(t3).update(i3);
      };
      for (var i2 = 0; i2 < n.length; ++i2) {
        var s2 = n[i2];
        h2[s2] = u(s2, t2);
      }
      return h2;
    };
    y.prototype.update = function(t2) {
      if (this.finalized) throw new Error("finalize already called");
      var i2 = h(t2);
      t2 = i2[0];
      for (var s2, e3, n2 = i2[1], a2 = 0, o2 = t2.length, f2 = this.blocks; a2 < o2; ) {
        if (this.hashed && (this.hashed = false, f2[0] = this.block, this.block = f2[16] = f2[1] = f2[2] = f2[3] = f2[4] = f2[5] = f2[6] = f2[7] = f2[8] = f2[9] = f2[10] = f2[11] = f2[12] = f2[13] = f2[14] = f2[15] = 0), n2) for (e3 = this.start; a2 < o2 && e3 < 64; ++a2) (s2 = t2.charCodeAt(a2)) < 128 ? f2[e3 >>> 2] |= s2 << r[3 & e3++] : s2 < 2048 ? (f2[e3 >>> 2] |= (192 | s2 >>> 6) << r[3 & e3++], f2[e3 >>> 2] |= (128 | 63 & s2) << r[3 & e3++]) : s2 < 55296 || s2 >= 57344 ? (f2[e3 >>> 2] |= (224 | s2 >>> 12) << r[3 & e3++], f2[e3 >>> 2] |= (128 | s2 >>> 6 & 63) << r[3 & e3++], f2[e3 >>> 2] |= (128 | 63 & s2) << r[3 & e3++]) : (s2 = 65536 + ((1023 & s2) << 10 | 1023 & t2.charCodeAt(++a2)), f2[e3 >>> 2] |= (240 | s2 >>> 18) << r[3 & e3++], f2[e3 >>> 2] |= (128 | s2 >>> 12 & 63) << r[3 & e3++], f2[e3 >>> 2] |= (128 | s2 >>> 6 & 63) << r[3 & e3++], f2[e3 >>> 2] |= (128 | 63 & s2) << r[3 & e3++]);
        else for (e3 = this.start; a2 < o2 && e3 < 64; ++a2) f2[e3 >>> 2] |= t2[a2] << r[3 & e3++];
        this.lastByteIndex = e3, this.bytes += e3 - this.start, e3 >= 64 ? (this.block = f2[16], this.start = e3 - 64, this.hash(), this.hashed = true) : this.start = e3;
      }
      return this.bytes > 4294967295 && (this.hBytes += this.bytes / 4294967296 | 0, this.bytes = this.bytes % 4294967296), this;
    }, y.prototype.finalize = function() {
      if (!this.finalized) {
        this.finalized = true;
        var t2 = this.blocks, h2 = this.lastByteIndex;
        t2[16] = this.block, t2[h2 >>> 2] |= s[3 & h2], this.block = t2[16], h2 >= 56 && (this.hashed || this.hash(), t2[0] = this.block, t2[16] = t2[1] = t2[2] = t2[3] = t2[4] = t2[5] = t2[6] = t2[7] = t2[8] = t2[9] = t2[10] = t2[11] = t2[12] = t2[13] = t2[14] = t2[15] = 0), t2[14] = this.hBytes << 3 | this.bytes >>> 29, t2[15] = this.bytes << 3, this.hash();
      }
    }, y.prototype.hash = function() {
      var t2, h2, i2, s2, r2, n2, a2, o2, f2, u2 = this.h0, c3 = this.h1, y2 = this.h2, l2 = this.h3, p2 = this.h4, d3 = this.h5, b = this.h6, v = this.h7, w = this.blocks;
      for (t2 = 16; t2 < 64; ++t2) h2 = ((r2 = w[t2 - 15]) >>> 7 | r2 << 25) ^ (r2 >>> 18 | r2 << 14) ^ r2 >>> 3, i2 = ((r2 = w[t2 - 2]) >>> 17 | r2 << 15) ^ (r2 >>> 19 | r2 << 13) ^ r2 >>> 10, w[t2] = w[t2 - 16] + h2 + w[t2 - 7] + i2 | 0;
      for (f2 = c3 & y2, t2 = 0; t2 < 64; t2 += 4) this.first ? (this.is224 ? (n2 = 300032, v = (r2 = w[0] - 1413257819) - 150054599 | 0, l2 = r2 + 24177077 | 0) : (n2 = 704751109, v = (r2 = w[0] - 210244248) - 1521486534 | 0, l2 = r2 + 143694565 | 0), this.first = false) : (h2 = (u2 >>> 2 | u2 << 30) ^ (u2 >>> 13 | u2 << 19) ^ (u2 >>> 22 | u2 << 10), s2 = (n2 = u2 & c3) ^ u2 & y2 ^ f2, v = l2 + (r2 = v + (i2 = (p2 >>> 6 | p2 << 26) ^ (p2 >>> 11 | p2 << 21) ^ (p2 >>> 25 | p2 << 7)) + (p2 & d3 ^ ~p2 & b) + e[t2] + w[t2]) | 0, l2 = r2 + (h2 + s2) | 0), h2 = (l2 >>> 2 | l2 << 30) ^ (l2 >>> 13 | l2 << 19) ^ (l2 >>> 22 | l2 << 10), s2 = (a2 = l2 & u2) ^ l2 & c3 ^ n2, b = y2 + (r2 = b + (i2 = (v >>> 6 | v << 26) ^ (v >>> 11 | v << 21) ^ (v >>> 25 | v << 7)) + (v & p2 ^ ~v & d3) + e[t2 + 1] + w[t2 + 1]) | 0, h2 = ((y2 = r2 + (h2 + s2) | 0) >>> 2 | y2 << 30) ^ (y2 >>> 13 | y2 << 19) ^ (y2 >>> 22 | y2 << 10), s2 = (o2 = y2 & l2) ^ y2 & u2 ^ a2, d3 = c3 + (r2 = d3 + (i2 = (b >>> 6 | b << 26) ^ (b >>> 11 | b << 21) ^ (b >>> 25 | b << 7)) + (b & v ^ ~b & p2) + e[t2 + 2] + w[t2 + 2]) | 0, h2 = ((c3 = r2 + (h2 + s2) | 0) >>> 2 | c3 << 30) ^ (c3 >>> 13 | c3 << 19) ^ (c3 >>> 22 | c3 << 10), s2 = (f2 = c3 & y2) ^ c3 & l2 ^ o2, p2 = u2 + (r2 = p2 + (i2 = (d3 >>> 6 | d3 << 26) ^ (d3 >>> 11 | d3 << 21) ^ (d3 >>> 25 | d3 << 7)) + (d3 & b ^ ~d3 & v) + e[t2 + 3] + w[t2 + 3]) | 0, u2 = r2 + (h2 + s2) | 0, this.chromeBugWorkAround = true;
      this.h0 = this.h0 + u2 | 0, this.h1 = this.h1 + c3 | 0, this.h2 = this.h2 + y2 | 0, this.h3 = this.h3 + l2 | 0, this.h4 = this.h4 + p2 | 0, this.h5 = this.h5 + d3 | 0, this.h6 = this.h6 + b | 0, this.h7 = this.h7 + v | 0;
    }, y.prototype.hex = function() {
      this.finalize();
      var t2 = this.h0, h2 = this.h1, s2 = this.h2, r2 = this.h3, e3 = this.h4, n2 = this.h5, a2 = this.h6, o2 = this.h7, f2 = i[t2 >>> 28 & 15] + i[t2 >>> 24 & 15] + i[t2 >>> 20 & 15] + i[t2 >>> 16 & 15] + i[t2 >>> 12 & 15] + i[t2 >>> 8 & 15] + i[t2 >>> 4 & 15] + i[15 & t2] + i[h2 >>> 28 & 15] + i[h2 >>> 24 & 15] + i[h2 >>> 20 & 15] + i[h2 >>> 16 & 15] + i[h2 >>> 12 & 15] + i[h2 >>> 8 & 15] + i[h2 >>> 4 & 15] + i[15 & h2] + i[s2 >>> 28 & 15] + i[s2 >>> 24 & 15] + i[s2 >>> 20 & 15] + i[s2 >>> 16 & 15] + i[s2 >>> 12 & 15] + i[s2 >>> 8 & 15] + i[s2 >>> 4 & 15] + i[15 & s2] + i[r2 >>> 28 & 15] + i[r2 >>> 24 & 15] + i[r2 >>> 20 & 15] + i[r2 >>> 16 & 15] + i[r2 >>> 12 & 15] + i[r2 >>> 8 & 15] + i[r2 >>> 4 & 15] + i[15 & r2] + i[e3 >>> 28 & 15] + i[e3 >>> 24 & 15] + i[e3 >>> 20 & 15] + i[e3 >>> 16 & 15] + i[e3 >>> 12 & 15] + i[e3 >>> 8 & 15] + i[e3 >>> 4 & 15] + i[15 & e3] + i[n2 >>> 28 & 15] + i[n2 >>> 24 & 15] + i[n2 >>> 20 & 15] + i[n2 >>> 16 & 15] + i[n2 >>> 12 & 15] + i[n2 >>> 8 & 15] + i[n2 >>> 4 & 15] + i[15 & n2] + i[a2 >>> 28 & 15] + i[a2 >>> 24 & 15] + i[a2 >>> 20 & 15] + i[a2 >>> 16 & 15] + i[a2 >>> 12 & 15] + i[a2 >>> 8 & 15] + i[a2 >>> 4 & 15] + i[15 & a2];
      return this.is224 || (f2 += i[o2 >>> 28 & 15] + i[o2 >>> 24 & 15] + i[o2 >>> 20 & 15] + i[o2 >>> 16 & 15] + i[o2 >>> 12 & 15] + i[o2 >>> 8 & 15] + i[o2 >>> 4 & 15] + i[15 & o2]), f2;
    }, y.prototype.toString = y.prototype.hex, y.prototype.digest = function() {
      this.finalize();
      var t2 = this.h0, h2 = this.h1, i2 = this.h2, s2 = this.h3, r2 = this.h4, e3 = this.h5, n2 = this.h6, a2 = this.h7, o2 = [t2 >>> 24 & 255, t2 >>> 16 & 255, t2 >>> 8 & 255, 255 & t2, h2 >>> 24 & 255, h2 >>> 16 & 255, h2 >>> 8 & 255, 255 & h2, i2 >>> 24 & 255, i2 >>> 16 & 255, i2 >>> 8 & 255, 255 & i2, s2 >>> 24 & 255, s2 >>> 16 & 255, s2 >>> 8 & 255, 255 & s2, r2 >>> 24 & 255, r2 >>> 16 & 255, r2 >>> 8 & 255, 255 & r2, e3 >>> 24 & 255, e3 >>> 16 & 255, e3 >>> 8 & 255, 255 & e3, n2 >>> 24 & 255, n2 >>> 16 & 255, n2 >>> 8 & 255, 255 & n2];
      return this.is224 || o2.push(a2 >>> 24 & 255, a2 >>> 16 & 255, a2 >>> 8 & 255, 255 & a2), o2;
    }, y.prototype.array = y.prototype.digest, y.prototype.arrayBuffer = function() {
      this.finalize();
      var t2 = new ArrayBuffer(this.is224 ? 28 : 32), h2 = new DataView(t2);
      return h2.setUint32(0, this.h0), h2.setUint32(4, this.h1), h2.setUint32(8, this.h2), h2.setUint32(12, this.h3), h2.setUint32(16, this.h4), h2.setUint32(20, this.h5), h2.setUint32(24, this.h6), this.is224 || h2.setUint32(28, this.h7), t2;
    }, l.prototype = new y(), l.prototype.finalize = function() {
      if (y.prototype.finalize.call(this), this.inner) {
        this.inner = false;
        var t2 = this.array();
        y.call(this, this.is224, this.sharedMemory), this.update(this.oKeyPad), this.update(t2), y.prototype.finalize.call(this);
      }
    };
    p = f();
    d = f(true);
    p.sha256 = p, p.sha224 = d, p.hmac = c(), d.hmac = c(true);
  }
});

// visual-slice/engine/shims/crypto.mjs
var crypto_exports = {};
__export(crypto_exports, {
  createHash: () => createHash,
  default: () => crypto_default
});
function createHash(alg) {
  if (alg !== "sha256") throw Error("crypto shim: unsupported algorithm " + alg);
  const parts = [];
  return { update(d3) {
    parts.push(typeof d3 === "string" ? new TextEncoder().encode(d3) : d3);
    return this;
  }, digest(enc) {
    if (enc !== "hex") throw Error("crypto shim: unsupported encoding " + enc);
    const n2 = parts.reduce((a2, p2) => a2 + p2.length, 0), all = new Uint8Array(n2);
    let o2 = 0;
    for (const p2 of parts) {
      all.set(p2, o2);
      o2 += p2.length;
    }
    return p.hex(all);
  } };
}
var crypto_default;
var init_crypto = __esm({
  "visual-slice/engine/shims/crypto.mjs"() {
    init_buffer_inject();
    init_js_sha256();
    crypto_default = { createHash };
  }
});

// src/verified-architecture-phase2/canonical.js
var require_canonical = __commonJS({
  "src/verified-architecture-phase2/canonical.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var crypto = (init_crypto(), __toCommonJS(crypto_exports));
    function sort(v) {
      if (Array.isArray(v)) return v.map(sort);
      if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])]));
      return v;
    }
    function canonical(v) {
      return JSON.stringify(sort(v));
    }
    function digest(v) {
      return crypto.createHash("sha256").update(canonical(v)).digest("hex");
    }
    module.exports = { canonical, digest };
  }
});

// src/verified-architecture-phase2/surface-model.js
var require_surface_model = __commonJS({
  "src/verified-architecture-phase2/surface-model.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { digest } = require_canonical();
    var TYPES = Object.freeze(["FLOOR", "WALL", "DOOR_OR_OPENING", "SUPPORT_SURFACE", "OBSTACLE", "UNKNOWN"]);
    function buildSurfaceModel(input) {
      if (!input || !input.sceneId || !input.revision || !input.sourceEvidence || !Array.isArray(input.surfaces)) throw Error("SURFACE_MODEL_INVALID");
      for (const s2 of input.surfaces) {
        if (!TYPES.includes(s2.type) || !s2.region || !s2.planeOrDepth || !Array.isArray(s2.contactRules) || s2.confidence === void 0 || !s2.provenance) throw Error("SURFACE_MODEL_INVALID");
      }
      const body = structuredClone(input);
      body.surfaceModelDigest = digest(body);
      return Object.freeze(body);
    }
    module.exports = { TYPES, buildSurfaceModel };
  }
});

// src/verified-architecture-phase2/evidence-loader.js
var require_evidence_loader = __commonJS({
  "src/verified-architecture-phase2/evidence-loader.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var fs = (init_fs(), __toCommonJS(fs_exports));
    var { buildSurfaceModel } = require_surface_model();
    function load(path) {
      return buildSurfaceModel(JSON.parse(fs.readFileSync(path, "utf8")));
    }
    module.exports = { load };
  }
});

// src/clean-runtime/contracts/canonical.js
var require_canonical2 = __commonJS({
  "src/clean-runtime/contracts/canonical.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var crypto = (init_crypto(), __toCommonJS(crypto_exports));
    function normalize(v) {
      if (v instanceof Map) return Object.fromEntries([...v.entries()].sort(([a2], [b]) => a2.localeCompare(b)).map(([k, x]) => [k, normalize(x)]));
      if (Array.isArray(v)) return v.map(normalize);
      if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().filter((k) => v[k] !== void 0).map((k) => [k, normalize(v[k])]));
      return v;
    }
    function canonicalBytes(v) {
      return Buffer2.from(JSON.stringify(normalize(v)));
    }
    function digest(v) {
      return crypto.createHash("sha256").update(canonicalBytes(v)).digest("hex");
    }
    module.exports = { normalize, canonicalBytes, digest };
  }
});

// src/clean-runtime/school/school-physical-contract.js
var require_school_physical_contract = __commonJS({
  "src/clean-runtime/school/school-physical-contract.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { digest } = require_canonical();
    var SCHOOL_SCENE = Object.freeze({ sceneId: "school", classification: "RECOVERED", lineageStatus: "RECOVERED", sourceId: "index.html", revision: 1, digest: "e1955f80d07ae2660b48fc2fce6cca68da30e9de4848e691e4fa3fa052191618", sourceRangeId: "school-bag-lockers" });
    var BAG_GEOMETRY = Object.freeze({ minX: -0.275, maxX: 0.275, minY: -0.175, maxY: 0.175, minZ: -0.175, maxZ: 0.175 });
    var SCHOOL_BAG_BODY = Object.freeze({ bodyId: "school-medical-bag-body", revision: 1, geometry: BAG_GEOMETRY, geometryDigest: digest(BAG_GEOMETRY), proofGeometryDigest: digest(BAG_GEOMETRY), classification: "RECOVERED", lineageStatus: "RECOVERED", sourceId: "index.html#school-bag-lockers", sourceDigest: "21ba7567961cbb9c022ab8a1f11359bf07049c506519a7656394cfc48fcc11ea", evidenceRefs: Object.freeze(["source-range:school-bag-lockers", "authored-box-bounds:.55x.35x.35"]) });
    var SCHOOL_SURFACE_MODEL_REF = Object.freeze({ id: "school-surface-v1", revision: 1, digest: "308951f841bd9be7a56d5d14ee1852c0cffe66b30d29d6a34f7a7da6bb0555cf", classification: "RECOVERED", lineageStatus: "RECOVERED", sourceId: "evidence/verified-architecture-phase2/surface-models/school.json" });
    function bagEntity(transform = { positionMicrounits: [-3e6, 175e3, 1e6], orientation: [0, 0, 0, 1], scaleMicrounits: [1e6, 1e6, 1e6] }) {
      return { entityId: "school-medical-bag", entityTypeId: "school/medical-bag", revision: 1, lifecycleState: "ACTIVE", transform, parentEntityId: null, supportRelation: { surfaceId: "floor", surfaceModelRef: SCHOOL_SURFACE_MODEL_REF }, physicalBodyRef: { recordId: SCHOOL_BAG_BODY.bodyId, revision: SCHOOL_BAG_BODY.revision, digest: SCHOOL_BAG_BODY.geometryDigest, proofGeometryDigest: SCHOOL_BAG_BODY.proofGeometryDigest }, geometrySourceRef: { recordId: SCHOOL_BAG_BODY.sourceId, revision: 1, digest: SCHOOL_BAG_BODY.sourceDigest, classification: "RECOVERED", lineageStatus: "RECOVERED" }, participatesIn: ["collision", "support"], postureStateId: "rigid", physicalState: { active: true, surfaceId: "floor", orientationUpDot: 1, supportNormalUpDot: 1 } };
    }
    module.exports = { SCHOOL_SCENE, BAG_GEOMETRY, SCHOOL_BAG_BODY, SCHOOL_SURFACE_MODEL_REF, bagEntity };
  }
});

// src/clean-runtime/authoring/contracts/constants.js
var require_constants = __commonJS({
  "src/clean-runtime/authoring/contracts/constants.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var AUTHORING_STATUSES = Object.freeze(["AUTHORED_NEW_DRAFT", "VALIDATED", "REVIEWED", "VERIFIED_FOR_SLICE", "REJECTED", "SUPERSEDED", "UNKNOWN"]);
    var PROVENANCE_STATUSES = Object.freeze(["RECOVERED", "AUTHORED_NEW", "VERIFIED", "UNKNOWN"]);
    var PRIMITIVES = Object.freeze(["AABB"]);
    var PARTICIPATION_ROLES = Object.freeze(["COLLISION", "CONTACT", "BOTH"]);
    var SUPPORT_SEMANTIC_TYPES = Object.freeze(["FLOOR", "SUPPORT_SURFACE"]);
    var POSTURE_SEMANTIC_TYPES = Object.freeze(["SYNTHETIC_POSTURE", "SUPINE_FLOOR"]);
    var SUBJECT_SEXES = Object.freeze(["MALE", "FEMALE", "UNSPECIFIED"]);
    var V1 = Object.freeze({ handedness: "RIGHT_HANDED", axes: Object.freeze({ x: "ENTITY_RIGHT", y: "UP", z: "ENTITY_FORWARD" }), upAxis: "Y", forwardDirection: "+Z", transformOrder: "SCALE_ROTATE_TRANSLATE", canonicalOrientation: Object.freeze([0, 0, 0, 1e6]), orientationUnit: "MICROUNIT_QUATERNION", linearUnit: "MICROUNIT", microunitsPerAuthoredUnit: 1e6, supportMaterialization: "TRANSLATION_ONLY_IDENTITY_ORIENTATION", supportPlane: "HORIZONTAL_Y", supportRegion: "AXIS_ALIGNED_RECTANGLE", phase2Projection: "CONSERVATIVE_AGGREGATE_AABB" });
    module.exports = { AUTHORING_STATUSES, PROVENANCE_STATUSES, PRIMITIVES, PARTICIPATION_ROLES, SUPPORT_SEMANTIC_TYPES, POSTURE_SEMANTIC_TYPES, SUBJECT_SEXES, V1 };
  }
});

// src/clean-runtime/authoring/contracts/canonical.js
var require_canonical3 = __commonJS({
  "src/clean-runtime/authoring/contracts/canonical.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var crypto = (init_crypto(), __toCommonJS(crypto_exports));
    function normalizeZero(x) {
      return typeof x === "number" && Object.is(x, -0) ? 0 : x;
    }
    function normalize(v) {
      if (Array.isArray(v)) return v.map(normalize);
      if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().filter((k) => v[k] !== void 0).map((k) => [k, normalize(v[k])]));
      return normalizeZero(v);
    }
    function canonicalBytes(v) {
      return Buffer2.from(JSON.stringify(normalize(v)));
    }
    function digest(v, field = "canonicalDigest") {
      const x = structuredClone(v);
      if (x && typeof x === "object") delete x[field];
      return crypto.createHash("sha256").update(canonicalBytes(x)).digest("hex");
    }
    module.exports = { normalize, canonicalBytes, digest };
  }
});

// src/clean-runtime/authoring/contracts/semantics.js
var require_semantics = __commonJS({
  "src/clean-runtime/authoring/contracts/semantics.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { PROVENANCE_STATUSES, SUPPORT_SEMANTIC_TYPES, POSTURE_SEMANTIC_TYPES, SUBJECT_SEXES } = require_constants();
    var { digest } = require_canonical3();
    var MACHINE_ID = /^[a-z0-9][a-z0-9._:/-]*$/;
    function reject(code, path) {
      return { status: "REJECTED", failure: { code, path } };
    }
    function validateSupportCategory(x) {
      if (!x || !MACHINE_ID.test(x.supportCategoryId || "")) return reject("MALFORMED_SUPPORT_CATEGORY", "supportCategoryId");
      if (!SUPPORT_SEMANTIC_TYPES.includes(x.supportSemanticType)) return reject("UNKNOWN_SUPPORT_SEMANTIC", "supportSemanticType");
      if (!PROVENANCE_STATUSES.includes(x.provenanceStatus) || typeof x.fixtureOnly !== "boolean") return reject("SEMANTIC_PROVENANCE_CONFUSION", "provenanceStatus");
      if (x.fixtureOnly && x.provenanceStatus !== "UNKNOWN") return reject("SEMANTIC_PROVENANCE_CONFUSION", "fixtureOnly");
      const y2 = structuredClone(x);
      y2.categoryDigest = digest(y2, "categoryDigest");
      return { status: "VALIDATED", definition: Object.freeze(y2) };
    }
    function validateProfile(x) {
      if (!x || !MACHINE_ID.test(x.profileDefinitionId || "") || !Number.isInteger(x.profileRevision) || x.profileRevision < 1) return reject("MALFORMED_PROFILE", "$");
      if (!SUBJECT_SEXES.includes(x.subjectSex)) return reject("UNKNOWN_SUBJECT_SEX", "subjectSex");
      if (x.status !== "AUTHORED_NEW_DRAFT") return reject("INVALID_STATUS", "status");
      const y2 = structuredClone(x);
      y2.profileDigest = digest(y2, "profileDigest");
      return { status: "VALIDATED", definition: Object.freeze(y2) };
    }
    function postureSemantic(x) {
      return POSTURE_SEMANTIC_TYPES.includes(x);
    }
    module.exports = { MACHINE_ID, validateSupportCategory, validateProfile, postureSemantic };
  }
});

// src/verified-architecture-phase2/fixed-point.js
var require_fixed_point = __commonJS({
  "src/verified-architecture-phase2/fixed-point.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var MICROUNITS_PER_UNIT = 1e6;
    var MAX_INPUT_MAGNITUDE = Math.floor(Number.MAX_SAFE_INTEGER / MICROUNITS_PER_UNIT);
    function toMicrounits(value) {
      if (!Number.isFinite(value)) throw new RangeError("GEOMETRY_COORDINATE_NOT_FINITE");
      if (Math.abs(value) > MAX_INPUT_MAGNITUDE) throw new RangeError("GEOMETRY_COORDINATE_OVERFLOW");
      const scaled = Math.abs(value) * MICROUNITS_PER_UNIT;
      const rounded = Math.floor(scaled + 0.5);
      const result = (value < 0 ? -1 : 1) * rounded;
      if (!Number.isSafeInteger(result)) throw new RangeError("GEOMETRY_COORDINATE_OVERFLOW");
      return Object.is(result, -0) ? 0 : result;
    }
    module.exports = Object.freeze({ MICROUNITS_PER_UNIT, MAX_INPUT_MAGNITUDE, toMicrounits });
  }
});

// src/clean-runtime/authoring/contracts/geometry.js
var require_geometry = __commonJS({
  "src/clean-runtime/authoring/contracts/geometry.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { MAX_INPUT_MAGNITUDE } = require_fixed_point();
    var MAX_MICROUNITS = MAX_INPUT_MAGNITUDE * 1e6;
    function integer(x, path) {
      if (typeof x !== "number" || !Number.isFinite(x)) throw Object.assign(Error("NON_FINITE_VALUE"), { code: "NON_FINITE_VALUE", path });
      if (!Number.isSafeInteger(x) || Math.abs(x) > MAX_MICROUNITS) throw Object.assign(Error("FIXED_POINT_OVERFLOW"), { code: "FIXED_POINT_OVERFLOW", path });
      return Object.is(x, -0) ? 0 : x;
    }
    function vec3(x, path) {
      if (!Array.isArray(x) || x.length !== 3) throw Object.assign(Error("MALFORMED_SCHEMA"), { code: "MALFORMED_SCHEMA", path });
      return x.map((v, i2) => integer(v, path + "[" + i2 + "]"));
    }
    function deriveComponentBounds(c3) {
      const p2 = vec3(c3.localTransform?.translationMicrounits, "components.translation"), s2 = vec3(c3.dimensionsMicrounits, "components.dimensions");
      if (s2.some((x) => x <= 0)) throw Object.assign(Error("INVALID_DIMENSION"), { code: "INVALID_DIMENSION", path: "components.dimensions" });
      if (s2.some((x) => x % 2)) throw Object.assign(Error("UNSUPPORTED_V1_CAPABILITY"), { code: "UNSUPPORTED_V1_CAPABILITY", path: "components.dimensions", detail: "V1_REQUIRES_EVEN_MICROUNIT_DIMENSIONS" });
      return { minX: p2[0] - s2[0] / 2, maxX: p2[0] + s2[0] / 2, minY: p2[1] - s2[1] / 2, maxY: p2[1] + s2[1] / 2, minZ: p2[2] - s2[2] / 2, maxZ: p2[2] + s2[2] / 2 };
    }
    function deriveAggregate(components) {
      const b = components.map(deriveComponentBounds);
      return { minX: Math.min(...b.map((x) => x.minX)), maxX: Math.max(...b.map((x) => x.maxX)), minY: Math.min(...b.map((x) => x.minY)), maxY: Math.max(...b.map((x) => x.maxY)), minZ: Math.min(...b.map((x) => x.minZ)), maxZ: Math.max(...b.map((x) => x.maxZ)) };
    }
    module.exports = { MAX_MICROUNITS, integer, vec3, deriveComponentBounds, deriveAggregate };
  }
});

// src/clean-runtime/authoring/contracts/review.js
var require_review = __commonJS({
  "src/clean-runtime/authoring/contracts/review.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    function reviewRecord() {
      throw Object.assign(Error("DEPRECATED_USE_LIFECYCLE_ENVELOPE"), { code: "DEPRECATED_USE_LIFECYCLE_ENVELOPE" });
    }
    function canVerify() {
      return false;
    }
    module.exports = { reviewRecord, canVerify };
  }
});

// src/clean-runtime/authoring/contracts/lifecycle.js
var require_lifecycle = __commonJS({
  "src/clean-runtime/authoring/contracts/lifecycle.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    function transition() {
      throw Object.assign(Error("DEPRECATED_USE_LIFECYCLE_ENVELOPE"), { code: "DEPRECATED_USE_LIFECYCLE_ENVELOPE" });
    }
    module.exports = { transition };
  }
});

// src/clean-runtime/authoring/contracts/materialize-support.js
var require_materialize_support = __commonJS({
  "src/clean-runtime/authoring/contracts/materialize-support.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { V1 } = require_constants();
    var { digest } = require_canonical3();
    function materializeSupportSurface({ staticModelRef, owner, surface }) {
      if (JSON.stringify(owner.transform.orientation) !== JSON.stringify(V1.canonicalOrientation) || surface.transformBinding !== "OWNER_TRANSLATION_IDENTITY_ORIENTATION") throw Object.assign(Error("UNSUPPORTED_V1_CAPABILITY"), { code: "UNSUPPORTED_V1_CAPABILITY" });
      const [x, y2, z] = owner.transform.translationMicrounits, r2 = surface.localRegion, p2 = surface.localPlane;
      const record = { surfaceId: surface.supportSurfaceId, type: "SUPPORT_SURFACE", region: { allowed: [{ regionId: surface.supportSurfaceId + ":world", minX: (r2.minX + x) / 1e6, maxX: (r2.maxX + x) / 1e6, minZ: (r2.minZ + z) / 1e6, maxZ: (r2.maxZ + z) / 1e6 }], volumes: [] }, planeOrDepth: { kind: "PLANE", planeY: (p2.offsetMicrounits + y2) / 1e6 }, contactRules: [structuredClone(surface.contactRule)], confidence: "AUTHORED_NEW", provenance: { ownerEntityId: owner.entityDefinitionId, ownerRevision: owner.entityRevision, ownerDigest: owner.entityDigest, surfaceRevision: surface.surfaceRevision, surfaceDigest: surface.canonicalDigest, staticModelRef } };
      return Object.freeze({ ...record, materializationDigest: digest(record) });
    }
    module.exports = { materializeSupportSurface };
  }
});

// src/clean-runtime/authoring/validators/physical-body-validator.js
var require_physical_body_validator = __commonJS({
  "src/clean-runtime/authoring/validators/physical-body-validator.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { AUTHORING_STATUSES, PRIMITIVES, PARTICIPATION_ROLES, POSTURE_SEMANTIC_TYPES, V1 } = require_constants();
    var { deriveAggregate, deriveComponentBounds, integer } = require_geometry();
    var { digest, canonicalBytes } = require_canonical3();
    var { validateSupportCategory, MACHINE_ID } = require_semantics();
    var id = (x) => typeof x === "string" && MACHINE_ID.test(x);
    var equal = (a2, b) => JSON.stringify(a2) === JSON.stringify(b);
    function fail(code, path, detail) {
      return Object.freeze({ status: "REJECTED", failure: Object.freeze({ code, path, detail: detail || null }) });
    }
    function validateBody(input, { referencedRevision } = {}) {
      let x;
      try {
        x = structuredClone(input);
      } catch {
        return fail("MALFORMED_SCHEMA", "$");
      }
      ;
      try {
        if (!x || x.schemaVersion !== "1.0.0" || !Array.isArray(x.components) || !Array.isArray(x.contactRegions) || !Array.isArray(x.supportCategories)) return fail("MALFORMED_SCHEMA", "$");
        for (const [k, v] of [["bodyDefinitionId", x.bodyDefinitionId], ["semanticType", x.semanticType], ["profileId", x.profileId], ["postureDefinitionId", x.postureDefinitionId]]) if (!id(v)) return fail("INVALID_ID", k);
        if (!POSTURE_SEMANTIC_TYPES.includes(x.postureSemanticType)) return fail("UNKNOWN_POSTURE_SEMANTIC", "postureSemanticType");
        if (!Number.isInteger(x.bodyRevision) || x.bodyRevision < 1) return fail("INVALID_REVISION", "bodyRevision");
        if (referencedRevision !== void 0 && referencedRevision !== x.bodyRevision) return fail("STALE_BODY_REVISION", "bodyRevision");
        if (x.status !== void 0 && (!AUTHORING_STATUSES.includes(x.status) || x.status !== "AUTHORED_NEW_DRAFT")) return fail("INVALID_STATUS", "status");
        if (x.units?.linear !== V1.linearUnit || x.units?.microunitsPerAuthoredUnit !== V1.microunitsPerAuthoredUnit) return fail("INVALID_UNITS", "units");
        if (!equal(x.coordinateFrame, { handedness: V1.handedness, axes: V1.axes, upAxis: V1.upAxis, forwardDirection: V1.forwardDirection, transformOrder: V1.transformOrder })) return fail("INVALID_COORDINATE_FRAME", "coordinateFrame");
        if (x.localOrigin?.kind !== "AUTHOR_DECLARED_CONTACT_FRAME" || !Array.isArray(x.localOrigin.positionMicrounits) || x.localOrigin.positionMicrounits.some((v) => integer(v, "localOrigin") !== 0)) return fail("INVALID_ORIGIN", "localOrigin");
        if (!equal(x.orientationContract?.canonical, V1.canonicalOrientation) || x.orientationContract?.mode !== "IDENTITY_ONLY") return fail("UNSUPPORTED_V1_CAPABILITY", "orientationContract");
        if (!x.components.length) return fail("MALFORMED_SCHEMA", "components");
        const ids = /* @__PURE__ */ new Set();
        for (const c3 of x.components) {
          if (!id(c3.componentId)) return fail("INVALID_ID", "components.componentId");
          if (ids.has(c3.componentId)) return fail("DUPLICATE_COMPONENT_ID", "components.componentId");
          ids.add(c3.componentId);
          if (!PRIMITIVES.includes(c3.primitiveType)) return fail("UNKNOWN_PRIMITIVE", "components.primitiveType");
          if (!PARTICIPATION_ROLES.includes(c3.participationRole)) return fail("MALFORMED_SCHEMA", "components.participationRole");
          if (!equal(c3.localTransform?.orientation, V1.canonicalOrientation)) return fail("UNSUPPORTED_V1_CAPABILITY", "components.localTransform.orientation");
          deriveComponentBounds(c3);
        }
        const derived = deriveAggregate(x.components);
        if (!equal(x.aggregateBounds, derived)) return fail("AGGREGATE_MISMATCH", "aggregateBounds", { derived });
        if (x.phase2Projection?.kind !== V1.phase2Projection || !equal(x.phase2Projection.bounds, derived)) return fail("AGGREGATE_MISMATCH", "phase2Projection", { derived });
        const fp = x.footprint;
        if (fp?.kind !== "XZ_RECT_UNION" || !Array.isArray(fp.regions) || !fp.regions.length) return fail("INVALID_FOOTPRINT", "footprint");
        for (const r2 of fp.regions) {
          for (const k of ["minX", "maxX", "minZ", "maxZ"]) integer(r2[k], "footprint." + k);
          if (r2.minX >= r2.maxX || r2.minZ >= r2.maxZ || r2.minX < derived.minX || r2.maxX > derived.maxX || r2.minZ < derived.minZ || r2.maxZ > derived.maxZ) return fail("INVALID_FOOTPRINT", "footprint.regions");
        }
        for (const c3 of x.contactRegions) {
          if (!id(c3.contactRegionId) || c3.kind !== "HORIZONTAL_XZ_RECT" || !c3.region) return fail("INVALID_CONTACT_REGION", "contactRegions");
          integer(c3.planeY, "contactRegions.planeY");
          const r2 = c3.region;
          for (const k of ["minX", "maxX", "minZ", "maxZ"]) integer(r2[k], "contactRegions.region." + k);
          if (c3.planeY < derived.minY || c3.planeY > derived.maxY || r2.minX >= r2.maxX || r2.minZ >= r2.maxZ || r2.minX < derived.minX || r2.maxX > derived.maxX || r2.minZ < derived.minZ || r2.maxZ > derived.maxZ) return fail("INVALID_CONTACT_REGION", "contactRegions");
        }
        if (!x.contactRegions.length) return fail("INVALID_CONTACT_REGION", "contactRegions");
        if (!x.supportCategories.length) return fail("MALFORMED_SUPPORT_CATEGORY", "supportCategories");
        for (const s2 of x.supportCategories) {
          const r2 = validateSupportCategory(s2);
          if (r2.status !== "VALIDATED") return fail(r2.failure.code, "supportCategories." + r2.failure.path);
        }
        if (x.bodyRevision > 1 && !x.priorRevisionDigest) return fail("INVALID_REVISION", "priorRevisionDigest");
        if (x.geometrySource?.classification !== "AUTHORED_NEW" || !x.authoringProvenance?.decisionId || !Array.isArray(x.authoringProvenance?.sourceReferenceEvidenceRefs) || x.validationEvidenceRefs !== void 0 && !Array.isArray(x.validationEvidenceRefs) || x.reviewEvidenceRefs !== void 0 && !Array.isArray(x.reviewEvidenceRefs)) return fail("MALFORMED_SCHEMA", "provenance");
        const expected = digest(x);
        if (x.canonicalDigest && x.canonicalDigest !== expected) return fail("DIGEST_MISMATCH", "canonicalDigest", { expected });
        x.aggregateBounds = derived;
        x.phase2Projection = { kind: V1.phase2Projection, bounds: derived, falseRejectionDiagnostic: { classification: "CONSERVATIVE_AGGREGATE_FALSE_REJECTION_CANDIDATE", nativeCompoundEvaluationPerformed: false } };
        x.canonicalDigest = digest(x);
        return Object.freeze({ status: "VALIDATED", definition: Object.freeze(x), canonicalBytes: canonicalBytes(x).toString("hex"), canonicalDigest: x.canonicalDigest });
      } catch (e3) {
        return fail(e3.code || "MALFORMED_SCHEMA", e3.path || "$", e3.detail);
      }
    }
    module.exports = { validateBody };
  }
});

// src/clean-runtime/authoring/validators/posture-validator.js
var require_posture_validator = __commonJS({
  "src/clean-runtime/authoring/validators/posture-validator.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { V1, POSTURE_SEMANTIC_TYPES } = require_constants();
    var { digest } = require_canonical3();
    var { MACHINE_ID, validateSupportCategory } = require_semantics();
    function validatePosture(x, body) {
      if (!x || x.schemaVersion !== "1.0.0" || !MACHINE_ID.test(x.postureDefinitionId || "") || x.postureRevision < 1) return { status: "REJECTED", failure: { code: "MALFORMED_SCHEMA" } };
      if (!POSTURE_SEMANTIC_TYPES.includes(x.postureSemanticType)) return { status: "REJECTED", failure: { code: "UNKNOWN_POSTURE_SEMANTIC" } };
      if (x.postureSemanticType !== body.postureSemanticType || x.postureDefinitionId !== body.postureDefinitionId) return { status: "REJECTED", failure: { code: "POSTURE_SEMANTIC_MISMATCH" } };
      if (x.bodyRef?.id !== body.bodyDefinitionId || x.bodyRef?.revision !== body.bodyRevision || x.bodyRef?.digest !== body.canonicalDigest) return { status: "REJECTED", failure: { code: "STALE_BODY_REVISION" } };
      if (x.orientationConstraints?.mode !== "IDENTITY_ONLY" || JSON.stringify(x.orientationConstraints.canonical) !== JSON.stringify(V1.canonicalOrientation)) return { status: "REJECTED", failure: { code: "UNSUPPORTED_V1_CAPABILITY" } };
      if (!x.supportCategories?.length || !x.supportCategories.every((s2) => validateSupportCategory(s2).status === "VALIDATED")) return { status: "REJECTED", failure: { code: "UNKNOWN_SUPPORT_SEMANTIC" } };
      if (!x.contactExpectations?.every((c3) => body.contactRegions.some((r2) => r2.contactRegionId === c3.contactRegionId))) return { status: "REJECTED", failure: { code: "INVALID_SUPPORT_REFERENCE" } };
      const y2 = structuredClone(x);
      y2.canonicalDigest = digest(y2);
      return { status: "VALIDATED", definition: Object.freeze(y2) };
    }
    module.exports = { validatePosture };
  }
});

// src/clean-runtime/authoring/validators/support-validator.js
var require_support_validator = __commonJS({
  "src/clean-runtime/authoring/validators/support-validator.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { V1 } = require_constants();
    var { integer } = require_geometry();
    var { digest } = require_canonical3();
    function reject(code, path) {
      return { status: "REJECTED", failure: { code, path } };
    }
    function validateSupportSurface(x, owner) {
      if (!x || x.schemaVersion !== "1.0.0" || !x.supportSurfaceId || x.surfaceRevision < 1) return reject("MALFORMED_SCHEMA", "$");
      if (x.ownerDefinitionRef?.id !== owner.entityDefinitionId || x.ownerDefinitionRef?.revision !== owner.entityRevision || x.ownerDefinitionRef?.digest !== owner.entityDigest) return reject("INVALID_SUPPORT_REFERENCE", "ownerDefinitionRef");
      if (x.transformBinding !== "OWNER_TRANSLATION_IDENTITY_ORIENTATION" || JSON.stringify(owner.transform.orientation) !== JSON.stringify(V1.canonicalOrientation)) return reject("UNSUPPORTED_V1_CAPABILITY", "transformBinding");
      if (JSON.stringify(x.localPlane?.normal) !== JSON.stringify([0, 1e6, 0])) return reject("INVALID_SUPPORT_SURFACE", "localPlane");
      try {
        integer(x.localPlane.offsetMicrounits, "localPlane.offset");
        for (const k of ["minX", "maxX", "minZ", "maxZ"]) integer(x.localRegion[k], "localRegion." + k);
      } catch (e3) {
        return reject(e3.code, e3.path);
      }
      if (x.localRegion.minX >= x.localRegion.maxX || x.localRegion.minZ >= x.localRegion.maxZ) return reject("INVALID_SUPPORT_SURFACE", "localRegion");
      if (x.contactRule?.policy !== "FULL_FOOTPRINT") return reject("INVALID_SUPPORT_SURFACE", "contactRule");
      const y2 = structuredClone(x);
      y2.canonicalDigest = digest(y2);
      return { status: "VALIDATED", definition: Object.freeze(y2) };
    }
    function validateSupportEntity(x, body) {
      if (!x || !x.entityDefinitionId || x.entityRevision < 1 || x.physicalBodyRef?.id !== body.bodyDefinitionId || x.physicalBodyRef?.revision !== body.bodyRevision || x.physicalBodyRef?.digest !== body.canonicalDigest) return reject("STALE_BODY_REVISION", "physicalBodyRef");
      if (JSON.stringify(x.transform?.orientation) !== JSON.stringify(V1.canonicalOrientation)) return reject("UNSUPPORTED_V1_CAPABILITY", "transform.orientation");
      try {
        x.transform.translationMicrounits.forEach((v, i2) => integer(v, "transform.translation[" + i2 + "]"));
      } catch (e3) {
        return reject(e3.code, e3.path);
      }
      const y2 = structuredClone(x);
      y2.entityDigest = digest(y2, "entityDigest");
      return { status: "VALIDATED", definition: Object.freeze(y2) };
    }
    module.exports = { validateSupportEntity, validateSupportSurface };
  }
});

// src/clean-runtime/authoring/admission/definition-ref.js
var require_definition_ref = __commonJS({
  "src/clean-runtime/authoring/admission/definition-ref.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { MACHINE_ID } = require_semantics();
    var TYPES = Object.freeze(["PHYSICAL_BODY", "PROFILE", "POSTURE", "SUPPORT_SURFACE"]);
    function definitionRef({ definitionType, definitionId, revision, definitionDigest }) {
      if (!TYPES.includes(definitionType) || !MACHINE_ID.test(definitionId || "") || !Number.isInteger(revision) || revision < 1 || !/^[a-f0-9]{64}$/.test(definitionDigest || "")) throw Object.assign(Error("INVALID_DEFINITION_REF"), { code: "INVALID_DEFINITION_REF" });
      return Object.freeze({ definitionType, definitionId, revision, definitionDigest });
    }
    function refFor(type, definition) {
      if (type === "PHYSICAL_BODY") return definitionRef({ definitionType: type, definitionId: definition.bodyDefinitionId, revision: definition.bodyRevision, definitionDigest: definition.canonicalDigest });
      if (type === "PROFILE") return definitionRef({ definitionType: type, definitionId: definition.profileDefinitionId, revision: definition.profileRevision, definitionDigest: definition.profileDigest });
      if (type === "SUPPORT_SURFACE") return definitionRef({ definitionType: type, definitionId: definition.supportSurfaceId, revision: definition.surfaceRevision, definitionDigest: definition.canonicalDigest });
      if (type === "POSTURE") return definitionRef({ definitionType: type, definitionId: definition.postureDefinitionId, revision: definition.postureRevision, definitionDigest: definition.canonicalDigest });
      throw Object.assign(Error("INVALID_DEFINITION_REF"), { code: "INVALID_DEFINITION_REF" });
    }
    function matches(ref, type, definition) {
      try {
        return JSON.stringify(refFor(type, definition)) === JSON.stringify(ref);
      } catch {
        return false;
      }
    }
    module.exports = { TYPES, definitionRef, refFor, matches };
  }
});

// src/clean-runtime/authoring/admission/envelope.js
var require_envelope = __commonJS({
  "src/clean-runtime/authoring/admission/envelope.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { digest, canonicalBytes } = require_canonical3();
    var { definitionRef } = require_definition_ref();
    var STATES = Object.freeze(["AUTHORED_NEW_DRAFT", "VALIDATED", "REVIEWED", "VERIFIED_FOR_SLICE", "REJECTED", "SUPERSEDED", "UNKNOWN"]);
    var NEXT = Object.freeze({ AUTHORED_NEW_DRAFT: ["VALIDATED", "REJECTED", "UNKNOWN"], VALIDATED: ["REVIEWED", "REJECTED", "SUPERSEDED", "UNKNOWN"], REVIEWED: ["VERIFIED_FOR_SLICE", "REJECTED", "SUPERSEDED", "UNKNOWN"], VERIFIED_FOR_SLICE: ["SUPERSEDED"], REJECTED: [], SUPERSEDED: [], UNKNOWN: ["AUTHORED_NEW_DRAFT"] });
    var fail = (code, path) => Object.freeze({ status: "REJECTED", failure: Object.freeze({ code, path }) });
    function validateEnvelope(input, { expectedRef, requiredScope } = {}) {
      let x;
      try {
        x = structuredClone(input);
      } catch {
        return fail("MALFORMED_ENVELOPE", "$");
      }
      try {
        if (x.envelopeSchemaVersion !== "1.0.0" || !x.envelopeId || !STATES.includes(x.lifecycleState) || !Array.isArray(x.validationEvidenceRefs) || !Array.isArray(x.reviewEvidenceRefs) || !Array.isArray(x.limitations)) return fail("MALFORMED_ENVELOPE", "$");
        x.definitionRef = definitionRef(x.definitionRef);
        if (expectedRef && JSON.stringify(x.definitionRef) !== JSON.stringify(expectedRef)) return fail("DEFINITION_REF_MISMATCH", "definitionRef");
        if (requiredScope && x.reviewScope !== requiredScope) return fail("REVIEW_SCOPE_MISMATCH", "reviewScope");
        if (["VALIDATED", "REVIEWED", "VERIFIED_FOR_SLICE"].includes(x.lifecycleState) && !x.validationEvidenceRefs.length) return fail("VALIDATION_EVIDENCE_REQUIRED", "validationEvidenceRefs");
        if (["REVIEWED", "VERIFIED_FOR_SLICE"].includes(x.lifecycleState)) {
          if (x.reviewDecision !== "APPROVED_FOR_SLICE" || !x.reviewId || !x.reviewEvidenceRefs.length || x.reviewedDefinitionDigest !== x.definitionRef.definitionDigest || x.reviewedDefinitionRevision !== x.definitionRef.revision || !x.reviewScope) return fail("REVIEW_REQUIRED", "review");
        }
        const expected = digest(x, "envelopeDigest");
        if (x.envelopeDigest && x.envelopeDigest !== expected) return fail("ENVELOPE_DIGEST_MISMATCH", "envelopeDigest");
        x.envelopeDigest = expected;
        return Object.freeze({ status: "VALIDATED", envelope: Object.freeze(x), canonicalBytes: canonicalBytes(x).toString("hex") });
      } catch (e3) {
        return fail(e3.code || "MALFORMED_ENVELOPE", "$");
      }
    }
    function createDraft({ envelopeId, definitionRef: ref, limitations = [] }) {
      return validateEnvelope({ envelopeSchemaVersion: "1.0.0", envelopeId, definitionRef: ref, lifecycleState: "AUTHORED_NEW_DRAFT", validationEvidenceRefs: [], reviewEvidenceRefs: [], reviewId: null, reviewDecision: null, reviewedDefinitionDigest: null, reviewedDefinitionRevision: null, reviewScope: null, limitations, supersession: null }).envelope;
    }
    function transitionEnvelope(current, next, patch = {}) {
      const valid = validateEnvelope(current);
      if (valid.status !== "VALIDATED") throw Object.assign(Error(valid.failure.code), { code: valid.failure.code });
      if (!NEXT[current.lifecycleState].includes(next)) throw Object.assign(Error("INVALID_LIFECYCLE_TRANSITION"), { code: "INVALID_LIFECYCLE_TRANSITION" });
      const x = { ...structuredClone(current), ...structuredClone(patch), lifecycleState: next };
      delete x.envelopeDigest;
      const out = validateEnvelope(x, { expectedRef: current.definitionRef, requiredScope: patch.requiredScope });
      if (out.status !== "VALIDATED") throw Object.assign(Error(out.failure.code), { code: out.failure.code });
      return out.envelope;
    }
    module.exports = { STATES, NEXT, validateEnvelope, createDraft, transitionEnvelope };
  }
});

// src/clean-runtime/authoring/admission/registry.js
var require_registry = __commonJS({
  "src/clean-runtime/authoring/admission/registry.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { matches } = require_definition_ref();
    var { validateEnvelope } = require_envelope();
    function admit({ definitionType, definition, envelope, expectedScope }) {
      const v = validateEnvelope(envelope);
      if (v.status !== "VALIDATED") return v;
      if (v.envelope.lifecycleState !== "VERIFIED_FOR_SLICE") return { status: "REJECTED", failure: { code: "NOT_VERIFIED_FOR_SLICE" } };
      if (expectedScope && v.envelope.reviewScope !== expectedScope) return { status: "REJECTED", failure: { code: "REVIEW_SCOPE_MISMATCH" } };
      if (!matches(v.envelope.definitionRef, definitionType, definition)) return { status: "REJECTED", failure: { code: "DEFINITION_REF_MISMATCH" } };
      return Object.freeze({ status: "ADMITTED", definition, envelope: v.envelope });
    }
    function supersede({ activeEnvelope, supersedingEnvelopeId, evidenceRefs = [] }) {
      return require_envelope().transitionEnvelope(activeEnvelope, "SUPERSEDED", { supersession: { supersedingEnvelopeId, evidenceRefs } });
    }
    module.exports = { admit, supersede };
  }
});

// src/clean-runtime/authoring/index.js
var require_authoring = __commonJS({
  "src/clean-runtime/authoring/index.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    module.exports = { ...require_constants(), ...require_semantics(), ...require_canonical3(), ...require_geometry(), ...require_review(), ...require_lifecycle(), ...require_materialize_support(), ...require_physical_body_validator(), ...require_posture_validator(), ...require_support_validator(), ...require_definition_ref(), ...require_envelope(), ...require_registry() };
  }
});

// src/clean-runtime/school/definitions/adult-v1-male-supine-floor.js
var require_adult_v1_male_supine_floor = __commonJS({
  "src/clean-runtime/school/definitions/adult-v1-male-supine-floor.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var A = require_authoring();
    var DECISION_ID = "DA-ADULT-V1-MALE-SUPINE-001";
    var SCHOOL_FLOOR = Object.freeze({ supportCategoryId: "school/floor-v1", supportSemanticType: "FLOOR", provenanceStatus: "RECOVERED", fixtureOnly: false });
    var PROFILE = A.validateProfile({ schemaVersion: "1.0.0", profileDefinitionId: "adult-v1", profileRevision: 1, subjectSex: "MALE", status: "AUTHORED_NEW_DRAFT" }).definition;
    var components = Object.freeze([{ componentId: "head", primitiveType: "AABB", localTransform: { translationMicrounits: [0, 12e4, 647e3], orientation: [0, 0, 0, 1e6] }, dimensionsMicrounits: [24e4, 24e4, 24e4], participationRole: "BOTH" }, { componentId: "left-arm", primitiveType: "AABB", localTransform: { translationMicrounits: [-305e3, 9e4, 227e3], orientation: [0, 0, 0, 1e6] }, dimensionsMicrounits: [5e4, 18e4, 7e5], participationRole: "BOTH" }, { componentId: "legs", primitiveType: "AABB", localTransform: { translationMicrounits: [0, 11e4, -651e3], orientation: [0, 0, 0, 1e6] }, dimensionsMicrounits: [46e4, 22e4, 1056e3], participationRole: "BOTH" }, { componentId: "right-arm", primitiveType: "AABB", localTransform: { translationMicrounits: [305e3, 9e4, 227e3], orientation: [0, 0, 0, 1e6] }, dimensionsMicrounits: [5e4, 18e4, 7e5], participationRole: "BOTH" }, { componentId: "torso", primitiveType: "AABB", localTransform: { translationMicrounits: [0, 151e3, 202e3], orientation: [0, 0, 0, 1e6] }, dimensionsMicrounits: [56e4, 302e3, 65e4], participationRole: "BOTH" }]);
    var aggregateBounds = Object.freeze({ minX: -33e4, maxX: 33e4, minY: 0, maxY: 302e3, minZ: -1179e3, maxZ: 767e3 });
    var regions = components.map((c3) => {
      const b = A.deriveComponentBounds(c3);
      return { regionId: c3.componentId + "-footprint", minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ };
    });
    var contacts = components.map((c3) => {
      const b = A.deriveComponentBounds(c3);
      return { contactRegionId: c3.componentId + "-floor-contact", kind: "HORIZONTAL_XZ_RECT", planeY: 0, region: { minX: b.minX, maxX: b.maxX, minZ: b.minZ, maxZ: b.maxZ } };
    });
    var draft = { schemaVersion: "1.0.0", bodyDefinitionId: "casualty/adult-v1/supine-floor", bodyRevision: 1, semanticType: "casualty-physical-body", profileId: PROFILE.profileDefinitionId, postureDefinitionId: "adult-v1/supine-floor", postureSemanticType: "SUPINE_FLOOR", units: { linear: "MICROUNIT", microunitsPerAuthoredUnit: 1e6 }, coordinateFrame: { handedness: "RIGHT_HANDED", axes: { x: "ENTITY_RIGHT", y: "UP", z: "ENTITY_FORWARD" }, upAxis: "Y", forwardDirection: "+Z", transformOrder: "SCALE_ROTATE_TRANSLATE" }, localOrigin: { kind: "AUTHOR_DECLARED_CONTACT_FRAME", positionMicrounits: [0, 0, 0] }, orientationContract: { mode: "IDENTITY_ONLY", canonical: [0, 0, 0, 1e6] }, components: structuredClone(components), aggregateBounds: structuredClone(aggregateBounds), phase2Projection: { kind: "CONSERVATIVE_AGGREGATE_AABB", bounds: structuredClone(aggregateBounds) }, footprint: { kind: "XZ_RECT_UNION", regions }, contactRegions: contacts, supportCategories: [SCHOOL_FLOOR], geometrySource: { classification: "AUTHORED_NEW", sourceId: DECISION_ID }, authoringProvenance: { decisionId: DECISION_ID, sourceReferenceEvidenceRefs: ["NASA-OCHMO-HB-004-REV-A-TABLE-1:REFERENCE_ONLY", "LEGACY_VISUALS_EXCLUDED"] }, validationEvidenceRefs: [], reviewEvidenceRefs: [], status: "AUTHORED_NEW_DRAFT" };
    var BODY_RESULT = A.validateBody(draft);
    if (BODY_RESULT.status !== "VALIDATED") throw Error(BODY_RESULT.failure.code);
    var BODY = BODY_RESULT.definition;
    var POSTURE_RESULT = A.validatePosture({ schemaVersion: "1.0.0", postureDefinitionId: "adult-v1/supine-floor", postureRevision: 1, profileId: "adult-v1", postureSemanticType: "SUPINE_FLOOR", bodyRef: { id: BODY.bodyDefinitionId, revision: BODY.bodyRevision, digest: BODY.canonicalDigest }, contactExpectations: contacts.map((x) => ({ contactRegionId: x.contactRegionId })), supportCategories: [SCHOOL_FLOOR], orientationConstraints: { mode: "IDENTITY_ONLY", canonical: [0, 0, 0, 1e6] }, status: "AUTHORED_NEW_DRAFT" }, BODY);
    if (POSTURE_RESULT.status !== "VALIDATED") throw Error(POSTURE_RESULT.failure.code);
    var POSTURE = POSTURE_RESULT.definition;
    function casualtyEntity(transform = { positionMicrounits: [0, 0, 1e6], orientation: [0, 0, 0, 1], scaleMicrounits: [1e6, 1e6, 1e6] }) {
      return { entityId: "school-casualty-adult-v1", entityTypeId: "school/casualty", revision: 1, lifecycleState: "ACTIVE", transform, parentEntityId: null, supportRelation: null, physicalBodyRef: { recordId: BODY.bodyDefinitionId, revision: BODY.bodyRevision, digest: BODY.canonicalDigest, proofGeometryDigest: BODY.canonicalDigest }, geometrySourceRef: { recordId: DECISION_ID, revision: 1, digest: BODY.canonicalDigest, classification: "AUTHORED_NEW", lineageStatus: "AUTHORED_NEW" }, participatesIn: ["collision", "support"], postureStateId: POSTURE.postureDefinitionId, physicalState: { active: true, surfaceId: "floor", orientationUpDot: 1, supportNormalUpDot: 1, profileRef: { id: PROFILE.profileDefinitionId, revision: PROFILE.profileRevision, digest: PROFILE.profileDigest, subjectSex: PROFILE.subjectSex }, postureRef: { id: POSTURE.postureDefinitionId, semanticType: POSTURE.postureSemanticType, revision: POSTURE.postureRevision, digest: POSTURE.canonicalDigest }, supportCategory: SCHOOL_FLOOR } };
    }
    module.exports = { DECISION_ID, SCHOOL_FLOOR, PROFILE, BODY, POSTURE, casualtyEntity };
  }
});

// src/clean-runtime/school/definitions/treatment-chair.js
var require_treatment_chair = __commonJS({
  "src/clean-runtime/school/definitions/treatment-chair.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var A = require_authoring();
    var V = A.V1;
    var decisionId = "gate-c-chair-authoring-001";
    var rawBody = { schemaVersion: "1.0.0", bodyDefinitionId: "school/treatment-chair", bodyRevision: 1, semanticType: "treatment-chair", profileId: "school-treatment-chair", postureDefinitionId: "rigid-upright", postureSemanticType: "SYNTHETIC_POSTURE", units: { linear: V.linearUnit, microunitsPerAuthoredUnit: V.microunitsPerAuthoredUnit }, coordinateFrame: { handedness: V.handedness, axes: V.axes, upAxis: V.upAxis, forwardDirection: V.forwardDirection, transformOrder: V.transformOrder }, localOrigin: { kind: "AUTHOR_DECLARED_CONTACT_FRAME", positionMicrounits: [0, 0, 0] }, orientationContract: { mode: "IDENTITY_ONLY", canonical: V.canonicalOrientation }, components: [
      { componentId: "lower-frame", primitiveType: "AABB", participationRole: "BOTH", dimensionsMicrounits: [5e5, 45e4, 5e5], localTransform: { translationMicrounits: [0, 225e3, 0], orientation: V.canonicalOrientation } },
      { componentId: "seat-slab", primitiveType: "AABB", participationRole: "BOTH", dimensionsMicrounits: [5e5, 4e4, 5e5], localTransform: { translationMicrounits: [0, 47e4, 0], orientation: V.canonicalOrientation } },
      { componentId: "backrest", primitiveType: "AABB", participationRole: "COLLISION", dimensionsMicrounits: [5e5, 43e4, 4e4], localTransform: { translationMicrounits: [0, 685e3, -23e4], orientation: V.canonicalOrientation } }
    ], aggregateBounds: { minX: -25e4, maxX: 25e4, minY: 0, maxY: 9e5, minZ: -25e4, maxZ: 25e4 }, phase2Projection: { kind: V.phase2Projection, bounds: { minX: -25e4, maxX: 25e4, minY: 0, maxY: 9e5, minZ: -25e4, maxZ: 25e4 } }, footprint: { kind: "XZ_RECT_UNION", regions: [{ minX: -25e4, maxX: 25e4, minZ: -25e4, maxZ: 25e4 }] }, contactRegions: [{ contactRegionId: "chair-floor-contact", kind: "HORIZONTAL_XZ_RECT", planeY: 0, region: { minX: -25e4, maxX: 25e4, minZ: -25e4, maxZ: 25e4 } }], supportCategories: [{ supportCategoryId: "floor", supportSemanticType: "FLOOR", provenanceStatus: "AUTHORED_NEW", fixtureOnly: false }], geometrySource: { classification: "AUTHORED_NEW", sourceId: decisionId }, authoringProvenance: { decisionId, sourceReferenceEvidenceRefs: ["https://ewiworks.com/wp-content/uploads/2023/03/Updated-Chair-Standards-Overview.pdf"] }, priorRevisionDigest: null };
    var BODY = A.validateBody(rawBody).definition;
    var ENTITY = { entityDefinitionId: "school/treatment-chair-entity", entityRevision: 1, physicalBodyRef: { id: BODY.bodyDefinitionId, revision: BODY.bodyRevision, digest: BODY.canonicalDigest }, transform: { translationMicrounits: [-2e6, 0, 1e6], orientation: V.canonicalOrientation } };
    ENTITY.entityDigest = A.digest(ENTITY, "entityDigest");
    Object.freeze(ENTITY);
    var rawSurface = { schemaVersion: "1.0.0", supportSurfaceId: "school/treatment-chair-seat", surfaceRevision: 1, ownerDefinitionRef: { id: ENTITY.entityDefinitionId, revision: ENTITY.entityRevision, digest: ENTITY.entityDigest }, supportSemanticType: "SUPPORT_SURFACE", transformBinding: "OWNER_TRANSLATION_IDENTITY_ORIENTATION", localPlane: { normal: [0, 1e6, 0], offsetMicrounits: 49e4 }, localRegion: { minX: -24e4, maxX: 24e4, minZ: -24e4, maxZ: 24e4 }, contactRule: { contactRuleId: "full-footprint-chair-seat", policy: "FULL_FOOTPRINT" }, provenance: { classification: "AUTHORED_NEW", decisionId } };
    var SURFACE = A.validateSupportSurface(rawSurface, ENTITY).definition;
    var SURFACE_ENVELOPE = A.transitionEnvelope(A.createDraft({ envelopeId: "gate-c-treatment-chair-seat-v1", definitionRef: A.refFor("SUPPORT_SURFACE", SURFACE), limitations: ["SEAT_ONLY", "IDENTITY_ORIENTATION_TRANSLATION_ONLY", "NOT_REVIEWED_FOR_SLICE"] }), "VALIDATED", { validationEvidenceRefs: ["gate-c-chair-definition-tests"] });
    var BODY_ENVELOPE = A.transitionEnvelope(A.createDraft({ envelopeId: "gate-c-treatment-chair-body-v1", definitionRef: A.refFor("PHYSICAL_BODY", BODY), limitations: ["PHYSICAL_ONLY_NO_VISUAL_BINDING", "IDENTITY_ORIENTATION_TRANSLATION_ONLY", "NOT_REVIEWED_FOR_SLICE"] }), "VALIDATED", { validationEvidenceRefs: ["gate-c-chair-definition-tests"] });
    var REVIEW_SCOPE = "SCHOOL_VERTICAL_SLICE|TREATMENT_CHAIR_R1|SEAT_SUPPORT_SURFACE_R1|PHYSICAL_SUPPORT_AND_DEPENDENCY_VALIDATION";
    var REVIEW = { reviewId: "gate-c-user-review-0c27c92", reviewDecision: "APPROVED_FOR_SLICE", reviewScope: REVIEW_SCOPE, reviewEvidenceRefs: ["authority:USER_GATE_REVIEW", "commit:0c27c92bb10e6af6e7f4e4fcb61a4a9cdc3e6d45", "package-sha256:6efc8f2d860e3b88f307390eab11b14f629a975682365dd8c2aab1d3df2e9e37", "whatsapp:wamid.HBgMOTcyNTMyNDkwMzUxFQIAEhgUM0FDNEJFREQzQzM5NUY2OTRERkIA", "evidence:gate-c-28-of-28", "evidence:ast-pass-geometry-call-sites-1"] };
    function promote(validated) {
      const r2 = { ...REVIEW, reviewedDefinitionDigest: validated.definitionRef.definitionDigest, reviewedDefinitionRevision: validated.definitionRef.revision };
      return A.transitionEnvelope(A.transitionEnvelope(validated, "REVIEWED", r2), "VERIFIED_FOR_SLICE", r2);
    }
    var BODY_VERIFIED_ENVELOPE = promote(BODY_ENVELOPE);
    var SURFACE_VERIFIED_ENVELOPE = promote(SURFACE_ENVELOPE);
    module.exports = { BODY, ENTITY, SURFACE, BODY_ENVELOPE, SURFACE_ENVELOPE, BODY_VERIFIED_ENVELOPE, SURFACE_VERIFIED_ENVELOPE, REVIEW_SCOPE, decisionId };
  }
});

// src/clean-runtime/school/treatment-chair-runtime.js
var require_treatment_chair_runtime = __commonJS({
  "src/clean-runtime/school/treatment-chair-runtime.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { BODY, ENTITY, SURFACE } = require_treatment_chair();
    var { SCHOOL_SURFACE_MODEL_REF } = require_school_physical_contract();
    var transform = (x = -2, y2 = 0, z = 1) => ({ positionMicrounits: [Math.round(x * 1e6), Math.round(y2 * 1e6), Math.round(z * 1e6)], orientation: [0, 0, 0, 1], scaleMicrounits: [1e6, 1e6, 1e6] });
    function chairEntity(t2 = transform()) {
      return { entityId: "school-treatment-chair", entityTypeId: "school/treatment-chair", revision: 1, lifecycleState: "ACTIVE", transform: t2, parentEntityId: null, supportRelation: { surfaceId: "floor", surfaceModelRef: SCHOOL_SURFACE_MODEL_REF }, physicalBodyRef: { recordId: BODY.bodyDefinitionId, revision: BODY.bodyRevision, digest: BODY.canonicalDigest, proofGeometryDigest: BODY.canonicalDigest }, geometrySourceRef: { recordId: BODY.geometrySource.sourceId, revision: 1, digest: BODY.canonicalDigest, classification: "AUTHORED_NEW", lineageStatus: "AUTHORED_NEW" }, participatesIn: ["collision", "support-owner"], postureStateId: "rigid-upright", physicalState: { active: true, surfaceId: "floor", orientationUpDot: 1, supportNormalUpDot: 1, supportSurface: SURFACE } };
    }
    function relation(ownerRevision = 1, boundWorldRevision = 0) {
      return { ownerEntityId: "school-treatment-chair", ownerEntityRevision: ownerRevision, boundWorldRevision, ownerBodyRef: { revision: BODY.bodyRevision, digest: BODY.canonicalDigest }, supportSurfaceRef: { id: SURFACE.supportSurfaceId, revision: SURFACE.surfaceRevision, digest: SURFACE.canonicalDigest } };
    }
    function supportedEntity(t2 = transform(-2, 0.59, 1), ownerRevision = 1) {
      const r2 = relation(ownerRevision);
      return { entityId: "synthetic-supported-fixture", entityTypeId: "synthetic/gate-c-supported-box", revision: 1, lifecycleState: "ACTIVE", transform: t2, parentEntityId: null, supportRelation: r2, physicalBodyRef: { recordId: "synthetic/gate-c-supported-box-body", revision: 1, digest: "c".repeat(64), proofGeometryDigest: "c".repeat(64) }, geometrySourceRef: { recordId: "gate-c-contract-fixture", revision: 1, digest: "d".repeat(64), classification: "AUTHORED_NEW", lineageStatus: "AUTHORED_NEW" }, participatesIn: ["collision", "support-dependent"], postureStateId: "SYNTHETIC_POSTURE", physicalState: { active: true, surfaceId: SURFACE.supportSurfaceId, orientationUpDot: 1, supportNormalUpDot: 1 } };
    }
    module.exports = { transform, chairEntity, supportedEntity, relation };
  }
});

// src/clean-runtime/school/scene-v2/package.js
var require_package = __commonJS({
  "src/clean-runtime/school/scene-v2/package.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var path = (init_path(), __toCommonJS(path_exports));
    var { load } = require_evidence_loader();
    var { digest } = require_canonical2();
    var { SCHOOL_SCENE, SCHOOL_BAG_BODY, SCHOOL_SURFACE_MODEL_REF, bagEntity } = require_school_physical_contract();
    var D = require_adult_v1_male_supine_floor();
    var C = require_treatment_chair();
    var R = require_treatment_chair_runtime();
    var model = load(path.join("/virtual", "../../../../evidence/verified-architecture-phase2/surface-models/school.json"));
    var refs = { surfaceModel: { id: model.surfaceModelId, revision: model.revision, digest: model.surfaceModelDigest, provenance: { classification: "RECOVERED", source: SCHOOL_SURFACE_MODEL_REF.sourceId } }, requiredSurfaces: model.surfaces.map((s2) => ({ id: s2.surfaceId, type: s2.type, provenance: s2.provenance })), bodies: { bag: { id: SCHOOL_BAG_BODY.bodyId, revision: 1, digest: SCHOOL_BAG_BODY.geometryDigest, provenance: "RECOVERED" }, casualty: { id: D.BODY.bodyDefinitionId, revision: 1, digest: D.BODY.canonicalDigest, profile: { id: D.PROFILE.profileDefinitionId, revision: 1, digest: D.PROFILE.profileDigest, subjectSex: "MALE" }, posture: { id: D.POSTURE.postureDefinitionId, revision: 1, digest: D.POSTURE.canonicalDigest, semantic: "SUPINE_FLOOR" }, provenance: "AUTHORED_NEW+VERIFIED_FOR_SLICE" }, chair: { id: C.BODY.bodyDefinitionId, revision: 1, digest: C.BODY.canonicalDigest, provenance: "AUTHORED_NEW+VERIFIED_FOR_SLICE" }, seat: { id: C.SURFACE.supportSurfaceId, revision: 1, digest: C.SURFACE.canonicalDigest, owner: { id: C.ENTITY.entityDefinitionId, revision: 1, digest: C.ENTITY.entityDigest }, provenance: "AUTHORED_NEW+VERIFIED_FOR_SLICE" } } };
    function floorRelation(id, e3, contactRegionId, geometry, digest0) {
      return { relationId: id, supportedEntityId: e3.entityId, supportedBodyRef: { id: e3.physicalBodyRef.recordId, revision: e3.physicalBodyRef.revision, digest: e3.physicalBodyRef.digest }, contactRegionRef: { bodyId: e3.physicalBodyRef.recordId, bodyRevision: e3.physicalBodyRef.revision, bodyDigest: e3.physicalBodyRef.digest, contactRegionId }, contactRegionGeometry: geometry, contactRegionDigest: digest0, contactRole: "FULL_BODY", requirement: "REQUIRED", supportSourceKind: "STATIC_WORLD", boundWorldRevision: 1, surfaceModelRef: { id: model.surfaceModelId, revision: model.revision, digest: model.surfaceModelDigest }, surfaceId: "floor", expectedSurfaceType: "FLOOR", capabilityId: "full-footprint-floor", contactNormal: { x: 0, y: 1, z: 0 }, evidenceRefs: ["school-surface-model", "phase2-v1-full-body-contact"] };
    }
    var casualty = D.casualtyEntity({ positionMicrounits: [0, 0, 1e6], orientation: [0, 0, 0, 1], scaleMicrounits: [1e6, 1e6, 1e6] });
    var chair = R.chairEntity(R.transform(-2, 0, 1));
    var bag = bagEntity();
    delete casualty.supportRelation;
    delete chair.supportRelation;
    delete bag.supportRelation;
    var entities = [casualty, chair, bag];
    var supportRelations = [floorRelation("school:bag:floor", bag, "bag-full-footprint", SCHOOL_BAG_BODY.geometry, SCHOOL_BAG_BODY.geometryDigest), floorRelation("school:casualty:floor", casualty, "torso-floor-contact", D.BODY.contactRegions.find((x) => x.contactRegionId === "torso-floor-contact"), digest(D.BODY.contactRegions.find((x) => x.contactRegionId === "torso-floor-contact"))), floorRelation("school:chair:floor", chair, "chair-floor-contact", C.BODY.contactRegions[0], digest(C.BODY.contactRegions[0]))].sort((a2, b) => a2.relationId.localeCompare(b.relationId));
    var raw = { scenePackageVersion: "2.0.0", scenePackageId: "SCHOOL_TREATMENT_ROOM_PHYSICAL_V2", sceneRef: SCHOOL_SCENE, refs, entities, supportRelations, requiredEntityIds: entities.map((x) => x.entityId).sort(), provenanceLedger: { room: "RECOVERED", surfaceModel: "RECOVERED", bag: "RECOVERED", casualty: "AUTHORED_NEW+VERIFIED_FOR_SLICE", chair: "AUTHORED_NEW+VERIFIED_FOR_SLICE", seat: "AUTHORED_NEW+VERIFIED_FOR_SLICE", panoramaGeometryLineage: "UNKNOWN", visualPhysicalLineage: "UNKNOWN" } };
    raw.scenePackageDigest = digest(raw, "scenePackageDigest");
    var PACKAGE = Object.freeze(raw);
    module.exports = { PACKAGE, model };
  }
});

// src/clean-runtime/contracts/world-state.js
var require_world_state = __commonJS({
  "src/clean-runtime/contracts/world-state.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { digest } = require_canonical2();
    var LIFECYCLES = Object.freeze(["INITIALIZING", "ACTIVE", "PAUSED", "CLOSED"]);
    function deepFreeze(v) {
      if (v && typeof v === "object" && !Object.isFrozen(v)) {
        Object.freeze(v);
        for (const x of Object.values(v)) deepFreeze(x);
      }
      return v;
    }
    function entity(input) {
      if (Object.isFrozen(input)) return input;
      const x = structuredClone(input);
      for (const k of ["entityId", "entityTypeId", "revision", "lifecycleState", "transform", "physicalBodyRef", "geometrySourceRef", "physicalState"]) if (x[k] === void 0) throw TypeError("INVALID_ENTITY_STATE:" + k);
      if (!Number.isInteger(x.revision) || x.revision < 1) throw TypeError("INVALID_ENTITY_REVISION");
      return deepFreeze(x);
    }
    function world(input) {
      const entities = {};
      for (const [id, e3] of Object.entries(input.entities || {})) entities[id] = entity(e3);
      const body = { stateSchemaVersion: input.stateSchemaVersion || "1.0.0", worldId: input.worldId, sceneDefinitionRef: input.sceneDefinitionRef || null, revision: input.revision ?? 0, priorStateDigest: input.priorStateDigest || null, lifecycleState: input.lifecycleState || "INITIALIZING", entities, physicalRelations: structuredClone(input.physicalRelations || []), supportRelations: structuredClone(input.supportRelations || []), surfaces: input.surfaces || null, environmentPhysicalState: input.environmentPhysicalState || null, committedEventSequence: input.committedEventSequence || 0 };
      if (!body.worldId || !LIFECYCLES.includes(body.lifecycleState)) throw TypeError("INVALID_WORLD_STATE");
      body.stateDigest = digest(body);
      return deepFreeze(body);
    }
    module.exports = { LIFECYCLES, entity, world, deepFreeze };
  }
});

// src/clean-runtime/multi-support/relations.js
var require_relations = __commonJS({
  "src/clean-runtime/multi-support/relations.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { digest, canonicalBytes } = require_canonical2();
    var KINDS = /* @__PURE__ */ new Set(["STATIC_WORLD", "ENTITY_OWNED"]);
    var ROLES = /* @__PURE__ */ new Set(["FEET", "PELVIS", "TORSO", "BACK", "LEGS", "HEAD", "KNEES", "HANDS", "FULL_BODY", "GENERIC"]);
    var fail = (code, relationId = null) => ({ status: "REJECTED", code, relationId });
    function sortRelations(a2) {
      return [...a2].map((x) => structuredClone(x)).sort((x, y2) => x.relationId.localeCompare(y2.relationId));
    }
    function validateRelations(relations, state, { targetWorldRevision = state.revision } = {}) {
      if (!Array.isArray(relations)) return fail("MALFORMED_RELATIONS");
      const x = sortRelations(relations), ids = /* @__PURE__ */ new Set(), semantic = /* @__PURE__ */ new Set();
      for (const r2 of x) {
        if (!r2.relationId || ids.has(r2.relationId)) return fail("DUPLICATE_OR_MISSING_RELATION_ID", r2.relationId || null);
        ids.add(r2.relationId);
        if (!r2.supportedEntityId || !KINDS.has(r2.supportSourceKind) || r2.requirement !== "REQUIRED" || !ROLES.has(r2.contactRole) || !r2.contactRegionRef) return fail("MALFORMED_RELATION", r2.relationId);
        const e3 = state.entities[r2.supportedEntityId];
        if (!e3 || e3.lifecycleState === "REMOVED") return fail("MISSING_SUPPORTED_ENTITY", r2.relationId);
        const br = r2.supportedBodyRef, b = e3.physicalBodyRef;
        if (br?.id !== b?.recordId || br?.revision !== b?.revision || br?.digest !== b?.digest) return fail("STALE_SUPPORTED_BODY", r2.relationId);
        if (r2.contactRegionRef.bodyId !== br.id || r2.contactRegionRef.bodyRevision !== br.revision || r2.contactRegionRef.bodyDigest !== br.digest || !r2.contactRegionRef.contactRegionId || !r2.contactRegionGeometry || !r2.contactRegionDigest) return fail("STALE_CONTACT_REGION", r2.relationId);
        if (r2.boundWorldRevision !== targetWorldRevision) return fail("STALE_WORLD_REVISION", r2.relationId);
        const sk = r2.supportedEntityId + "|" + r2.contactRegionRef.contactRegionId + "|" + r2.supportSourceKind + "|" + (r2.surfaceId || r2.supportSurfaceRef?.id);
        if (semantic.has(sk)) return fail("CONFLICTING_RELATION", r2.relationId);
        semantic.add(sk);
        if (r2.supportSourceKind === "STATIC_WORLD") {
          if (r2.ownerEntityRef) return fail("STATIC_WORLD_HAS_OWNER", r2.relationId);
          if (!r2.surfaceModelRef?.id || !r2.surfaceId) return fail("STATIC_SURFACE_MISSING", r2.relationId);
        } else {
          const o2 = state.entities[r2.ownerEntityRef?.id];
          if (!o2 || o2.lifecycleState === "REMOVED") return fail("MISSING_OWNER", r2.relationId);
          if (r2.ownerEntityRef.revision !== o2.revision) return fail("STALE_OWNER_REVISION", r2.relationId);
          if (r2.ownerBodyRef?.revision !== o2.physicalBodyRef?.revision || r2.ownerBodyRef?.digest !== o2.physicalBodyRef?.digest) return fail("STALE_OWNER_BODY", r2.relationId);
          const s2 = o2.physicalState?.supportSurface;
          if (!s2) return fail("MISSING_SUPPORT_SURFACE", r2.relationId);
          if (r2.supportSurfaceRef?.id !== s2.supportSurfaceId || r2.supportSurfaceRef?.revision !== s2.surfaceRevision || r2.supportSurfaceRef?.digest !== s2.canonicalDigest) return fail("STALE_SUPPORT_SURFACE", r2.relationId);
        }
      }
      return Object.freeze({ status: "VALIDATED", relations: Object.freeze(x.map(Object.freeze)), relationsDigest: digest(x) });
    }
    function buildIndex(relations) {
      const byTarget = {};
      for (const r2 of sortRelations(relations)) {
        const key = r2.supportSourceKind === "STATIC_WORLD" ? "static:" + r2.surfaceModelRef.id + ":" + r2.surfaceId : "entity:" + r2.ownerEntityRef.id + ":" + r2.supportSurfaceRef.id;
        byTarget[key] = (byTarget[key] || []).concat([{ relationId: r2.relationId, supportedEntityId: r2.supportedEntityId }]);
      }
      for (const k of Object.keys(byTarget).sort()) {
        byTarget[k].sort((a2, b) => a2.relationId.localeCompare(b.relationId));
        Object.freeze(byTarget[k]);
      }
      return Object.freeze(Object.fromEntries(Object.keys(byTarget).sort().map((k) => [k, byTarget[k]])));
    }
    function verifyIndex(relations, index) {
      return canonicalBytes(buildIndex(relations)).equals(canonicalBytes(index));
    }
    module.exports = { KINDS, ROLES, sortRelations, validateRelations, buildIndex, verifyIndex };
  }
});

// src/clean-runtime/events/event-log.js
var require_event_log = __commonJS({
  "src/clean-runtime/events/event-log.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { digest, canonicalBytes } = require_canonical2();
    var EventLog = class {
      #events = [];
      #fail = false;
      constructor({ failAppend = false } = {}) {
        this.#fail = failAppend;
      }
      append(draft) {
        if (this.#fail) throw Error("EVENT_LOG_FAILURE");
        const event = Object.freeze({ ...structuredClone(draft), sequence: this.#events.length + 1, priorEventDigest: this.#events.at(-1)?.eventDigest || "0".repeat(64) });
        const final = Object.freeze({ ...event, eventDigest: digest(event) });
        this.#events.push(final);
        return final;
      }
      snapshot() {
        return Object.freeze(this.#events.map((x) => Object.freeze(structuredClone(x))));
      }
      bytes() {
        return canonicalBytes(this.#events);
      }
      setFailureForTest(v) {
        this.#fail = !!v;
      }
    };
    module.exports = { EventLog };
  }
});

// src/clean-runtime/multi-support/runtime.js
var require_runtime = __commonJS({
  "src/clean-runtime/multi-support/runtime.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { world } = require_world_state();
    var { digest } = require_canonical2();
    var { validateRelations, sortRelations, buildIndex } = require_relations();
    var { EventLog } = require_event_log();
    function createMultiSupportRuntime({ initialWorld, legalityPort, eventLog = new EventLog() }) {
      let state = world({ ...initialWorld, stateSchemaVersion: "2.0.0", supportRelations: sortRelations(initialWorld.supportRelations || []), physicalRelations: void 0 });
      const seen = /* @__PURE__ */ new Set();
      function reject(id, code, evidence = {}) {
        return Object.freeze({ status: "REJECTED", code, evidence, state });
      }
      function mutate(draft, c3) {
        let rs = [...draft.supportRelations], entities = { ...draft.entities };
        if (c3.type === "SpawnEntity") {
          if (!c3.entity || entities[c3.entity.entityId]) throw Error("ENTITY_EXISTS_OR_MISSING");
          entities[c3.entity.entityId] = structuredClone(c3.entity);
        } else if (c3.type === "AttachSupportRelation") {
          if (!c3.relation || rs.some((x) => x.relationId === c3.relation.relationId)) throw Error("RELATION_EXISTS");
          rs[rs.length] = structuredClone(c3.relation);
        } else if (c3.type === "ReplaceSupportRelation") {
          const i2 = rs.findIndex((x) => x.relationId === c3.relationId);
          if (i2 < 0 || c3.relation?.relationId !== c3.relationId) throw Error("RELATION_NOT_FOUND");
          rs[i2] = structuredClone(c3.relation);
        } else if (c3.type === "DetachSupportRelation") {
          const i2 = rs.findIndex((x) => x.relationId === c3.relationId);
          if (i2 < 0) throw Error("RELATION_NOT_FOUND");
          rs = rs.filter((_, j) => j !== i2);
        } else if (c3.type === "SetTransform") {
          const e3 = entities[c3.entityId];
          if (!e3) throw Error("ENTITY_MISSING");
          entities[c3.entityId] = { ...e3, revision: e3.revision + 1, transform: structuredClone(c3.transform) };
        } else if (c3.type === "RemoveEntity") {
          const e3 = entities[c3.entityId];
          if (!e3) throw Error("ENTITY_MISSING");
          entities[c3.entityId] = { ...e3, revision: e3.revision + 1, lifecycleState: "REMOVED" };
        } else if (c3.type === "ReplacePhysicalBody") {
          const e3 = entities[c3.entityId];
          if (!e3) throw Error("ENTITY_MISSING");
          entities[c3.entityId] = { ...e3, revision: e3.revision + 1, physicalBodyRef: structuredClone(c3.physicalBodyRef) };
        } else if (c3.type === "ChangePosture") {
          const e3 = entities[c3.entityId];
          if (!e3) throw Error("ENTITY_MISSING");
          entities[c3.entityId] = { ...e3, revision: e3.revision + 1, postureStateId: c3.postureStateId };
        } else throw Error("INVALID_COMMAND");
        return { ...draft, entities, supportRelations: sortRelations(rs) };
      }
      function proposeTransaction(tx) {
        const before = state;
        if (!tx || seen.has(tx.transactionId) || tx.expectedWorldRevision !== before.revision || !Array.isArray(tx.commands) || !tx.commands.length) return reject(tx?.transactionId, "INVALID_TRANSACTION");
        let draft = { ...before, entities: { ...before.entities }, supportRelations: [...before.supportRelations] };
        try {
          const cs = [...tx.commands].sort((a2, b) => ((a2.entityId || a2.relationId || a2.relation?.relationId || "") + "|" + a2.type + "|" + a2.commandId).localeCompare((b.entityId || b.relationId || b.relation?.relationId || "") + "|" + b.type + "|" + b.commandId));
          for (const c3 of cs) {
            if (c3.expectedWorldRevision !== tx.expectedWorldRevision) throw Error("STALE_COMMAND");
            draft = mutate(draft, c3);
          }
          const vr = validateRelations(draft.supportRelations, draft, { targetWorldRevision: before.revision + 1 });
          if (vr.status !== "VALIDATED") throw Object.assign(Error(vr.code), { detail: vr });
          draft.supportRelations = vr.relations;
          const affected = /* @__PURE__ */ new Set([...cs.map((c3) => c3.entityId).filter(Boolean), ...draft.supportRelations.map((r2) => r2.supportedEntityId)]);
          for (const id of [...affected].sort()) {
            if (!draft.entities[id] || draft.entities[id].lifecycleState === "REMOVED") continue;
            const r2 = legalityPort.evaluate({ worldState: before, proposedState: draft, command: { commandId: "tx:" + tx.transactionId + ":" + id, entityId: id } });
            if (r2.outcome !== "PASS") throw Object.assign(Error("LEGALITY_" + r2.outcome), { detail: r2 });
          }
          const next = world({ ...draft, stateSchemaVersion: "2.0.0", revision: before.revision + 1, priorStateDigest: before.stateDigest, committedEventSequence: before.committedEventSequence + 1 });
          const event = eventLog.append({ eventType: "MutationCommitted", kind: "multi-support-transaction", id: tx.transactionId, worldId: before.worldId, priorWorldRevision: before.revision, priorStateDigest: before.stateDigest, commandDigest: digest(tx), newWorldRevision: next.revision, newStateDigest: next.stateDigest, stateDelta: { entities: next.entities, supportRelations: next.supportRelations, lifecycleState: next.lifecycleState, surfaces: next.surfaces, environmentPhysicalState: next.environmentPhysicalState } });
          state = next;
          seen.add(tx.transactionId);
          return Object.freeze({ status: "COMMITTED", state, event, index: buildIndex(state.supportRelations) });
        } catch (e3) {
          return reject(tx.transactionId, e3.message, { detail: e3.detail || null });
        }
      }
      return Object.freeze({ proposeTransaction, getWorldState: () => state, getEventLog: () => eventLog.snapshot(), getSupportIndex: () => buildIndex(state.supportRelations) });
    }
    module.exports = { createMultiSupportRuntime };
  }
});

// src/verified-architecture-phase2/reason-codes.js
var require_reason_codes = __commonJS({
  "src/verified-architecture-phase2/reason-codes.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    module.exports = Object.freeze({ PASS: "GEOMETRY_GATE_PASS", PARTIAL_OUTSIDE: "FOOTPRINT_PARTIALLY_OUTSIDE_LEGAL_REGION", FULL_OUTSIDE: "FOOTPRINT_FULLY_OUTSIDE_LEGAL_REGION", WALL: "WALL_PENETRATION", DOOR: "DOOR_OR_OPENING_PENETRATION", OBSTACLE: "OBSTACLE_PENETRATION", FLOATING: "CONTACT_GAP_FLOATING", BELOW: "SUPPORT_PENETRATION", STALE: "SURFACE_PROOF_STALE_OR_MISMATCHED", WRONG_SURFACE: "SURFACE_ID_NOT_FOUND", FORBIDDEN_TYPE: "SURFACE_TYPE_FORBIDDEN_FOR_CONTACT", UNKNOWN: "SURFACE_TYPE_UNKNOWN", MISSING_EVIDENCE: "GEOMETRY_EVIDENCE_MISSING_OR_MISMATCHED", GEOMETRY_CHANGED: "GEOMETRY_CHANGED_AFTER_PROOF", ORIENTATION: "ORIENTATION_OR_SUPPORT_INVALID" });
  }
});

// src/verified-architecture-phase2/geometry-gate.js
var require_geometry_gate = __commonJS({
  "src/verified-architecture-phase2/geometry-gate.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var RC = require_reason_codes();
    var { digest } = require_canonical();
    var { toMicrounits: q } = require_fixed_point();
    var fail = (code, e3) => Object.freeze({ placementReady: false, result: "FAIL", reasonCode: code, evidence: Object.freeze(e3) });
    var inside = (a2, r2) => q(a2.minX) >= q(r2.minX) && q(a2.maxX) <= q(r2.maxX) && q(a2.minZ) >= q(r2.minZ) && q(a2.maxZ) <= q(r2.maxZ);
    var disjoint = (a2, b) => q(a2.maxX) <= q(b.minX) || q(a2.minX) >= q(b.maxX) || q(a2.maxY) <= q(b.minY) || q(a2.minY) >= q(b.maxY) || q(a2.maxZ) <= q(b.minZ) || q(a2.minZ) >= q(b.maxZ);
    function worldBounds(g, t2) {
      return { minX: g.minX + t2.x, maxX: g.maxX + t2.x, minY: g.minY + t2.y, maxY: g.maxY + t2.y, minZ: g.minZ + t2.z, maxZ: g.maxZ + t2.z };
    }
    function evaluate(req, model) {
      const base = { requestId: req?.requestId || null, sceneId: model?.sceneId || null, surfaceId: req?.surfaceId || null, checkedGeometryDigest: req?.geometryDigest || null, surfaceModelDigest: model?.surfaceModelDigest || null, pixelEvidenceUsedAsAuthority: false, autoFixed: false };
      if (!req?.evidenceRefs?.length || !req.geometry || !req.geometryDigest || digest(req.geometry) !== req.geometryDigest) return fail(RC.MISSING_EVIDENCE, base);
      if (req.proofGeometryDigest && req.proofGeometryDigest !== req.geometryDigest) return fail(RC.GEOMETRY_CHANGED, base);
      if (req.surfaceModelRef?.id !== model.surfaceModelId || req.surfaceModelRef?.revision !== model.revision || req.surfaceModelRef?.digest !== model.surfaceModelDigest) return fail(RC.STALE, base);
      const surface = model.surfaces.find((x) => x.surfaceId === req.surfaceId);
      if (!surface) return fail(RC.WRONG_SURFACE, base);
      if (surface.type === "UNKNOWN") return fail(RC.UNKNOWN, { ...base, surfaceType: surface.type });
      if (!["FLOOR", "SUPPORT_SURFACE"].includes(surface.type)) return fail(RC.FORBIDDEN_TYPE, { ...base, surfaceType: surface.type });
      if (req.orientationUpDot !== 1 || req.supportNormalUpDot !== 1) return fail(RC.ORIENTATION, base);
      const b = worldBounds(req.geometry, req.transform);
      const planeY = surface.planeOrDepth.planeY;
      if (q(b.minY) > q(planeY)) return fail(RC.FLOATING, { ...base, bounds: b, contactGap: b.minY - planeY });
      if (q(b.minY) < q(planeY)) return fail(RC.BELOW, { ...base, bounds: b, penetrationDepth: planeY - b.minY });
      for (const x of model.surfaces.filter((x2) => ["WALL", "DOOR_OR_OPENING", "OBSTACLE"].includes(x2.type)).sort((a2, b2) => ["DOOR_OR_OPENING", "OBSTACLE", "WALL"].indexOf(a2.type) - ["DOOR_OR_OPENING", "OBSTACLE", "WALL"].indexOf(b2.type))) for (const box of x.region.volumes || []) if (!disjoint(b, box)) return fail(x.type === "WALL" ? RC.WALL : x.type === "DOOR_OR_OPENING" ? RC.DOOR : RC.OBSTACLE, { ...base, bounds: b, intersectedSurfaceId: x.surfaceId, intersectionVolumeId: box.volumeId });
      const legal = surface.region.allowed.some((r2) => inside(b, r2));
      if (!legal) {
        const overlap = surface.region.allowed.some((r2) => !(q(b.maxX) <= q(r2.minX) || q(b.minX) >= q(r2.maxX) || q(b.maxZ) <= q(r2.minZ) || q(b.minZ) >= q(r2.maxZ)));
        return fail(overlap ? RC.PARTIAL_OUTSIDE : RC.FULL_OUTSIDE, { ...base, bounds: b, allowedRegionIds: surface.region.allowed.map((x) => x.regionId) });
      }
      const evidence = { ...base, bounds: b, allowedRegionIds: surface.region.allowed.map((x) => x.regionId), contactRuleId: surface.contactRules[0].contactRuleId, fullFootprintEvaluated: true, geometryGateBinding: true };
      return Object.freeze({ placementReady: false, result: "PASS", reasonCode: RC.PASS, evidence: Object.freeze(evidence), proofDigest: digest(evidence) });
    }
    module.exports = { evaluate, worldBounds };
  }
});

// src/verified-architecture-phase2/geometry-gate-v2.js
var require_geometry_gate_v2 = __commonJS({
  "src/verified-architecture-phase2/geometry-gate-v2.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { digest, canonical } = require_canonical();
    var { toMicrounits: q } = require_fixed_point();
    var VERSION = "2.0.0";
    var ROLE = /* @__PURE__ */ new Set(["FEET", "PELVIS", "TORSO", "BACK", "LEGS", "HEAD", "KNEES", "HANDS", "FULL_BODY", "GENERIC"]);
    var fail = (code, stage, e3 = {}) => Object.freeze({ placementReady: false, result: "FAIL", reasonCode: code, evidence: Object.freeze({ version: VERSION, stage, ...e3 }) });
    var worldBox = (g, t2) => ({ minX: g.minX + t2.x, maxX: g.maxX + t2.x, minY: g.minY + t2.y, maxY: g.maxY + t2.y, minZ: g.minZ + t2.z, maxZ: g.maxZ + t2.z });
    var disjoint = (a2, b) => q(a2.maxX) <= q(b.minX) || q(a2.minX) >= q(b.maxX) || q(a2.maxY) <= q(b.minY) || q(a2.minY) >= q(b.maxY) || q(a2.maxZ) <= q(b.minZ) || q(a2.minZ) >= q(b.maxZ);
    var insideXZ = (a2, r2) => q(a2.minX) >= q(r2.minX) && q(a2.maxX) <= q(r2.maxX) && q(a2.minZ) >= q(r2.minZ) && q(a2.maxZ) <= q(r2.maxZ);
    var sorted = (a2) => [...a2].sort((x, y2) => x.relationId.localeCompare(y2.relationId));
    function requestDigest(x) {
      const y2 = structuredClone(x);
      delete y2.requestDigest;
      if (Array.isArray(y2.contacts)) y2.contacts = sorted(y2.contacts);
      return digest(y2);
    }
    function evaluateV2(req, model) {
      if (!req || req.version !== VERSION || !req.requestId || !req.body || !Array.isArray(req.contacts) || typeof req.requiresContacts !== "boolean") return fail("V2_SCHEMA_OR_VERSION", "SCHEMA");
      if (req.requestDigest !== requestDigest(req)) return fail("V2_REQUEST_DIGEST_MISMATCH", "IDENTITY");
      const b = req.body;
      if (!b.id || !Number.isInteger(b.revision) || b.revision < 1 || !b.digest || !b.geometry || digest(b.geometry) !== b.geometryDigest || b.proofGeometryDigest !== b.geometryDigest || !Array.isArray(b.contactRegions) || !b.evidenceRefs?.length) return fail("V2_BODY_IDENTITY_OR_EVIDENCE", "IDENTITY");
      if (!model || req.surfaceModelRef?.id !== model.surfaceModelId || req.surfaceModelRef?.revision !== model.revision || req.surfaceModelRef?.digest !== model.surfaceModelDigest) return fail("V2_SURFACE_MODEL_STALE_OR_MISSING", "IDENTITY");
      if (req.requiresContacts && !req.contacts.length) return fail("V2_REQUIRED_CONTACT_MISSING", "SCHEMA");
      const contacts = sorted(req.contacts);
      if (new Set(contacts.map((x) => x.relationId)).size !== contacts.length) return fail("V2_DUPLICATE_RELATION_ID", "CONFLICT");
      const regions = new Map(b.contactRegions.map((x) => [x.contactRegionId, x]));
      if (regions.size !== b.contactRegions.length) return fail("V2_DUPLICATE_CONTACT_REGION", "BODY");
      for (const c3 of contacts) {
        if (!c3.relationId || c3.requirement !== "REQUIRED" || !ROLE.has(c3.contactRole) || c3.supportedBodyRef?.id !== b.id || c3.supportedBodyRef?.revision !== b.revision || c3.supportedBodyRef?.digest !== b.digest) return fail("V2_CONTACT_IDENTITY_INVALID", "IDENTITY", { relationId: c3.relationId || null });
        const r2 = regions.get(c3.contactRegionRef?.contactRegionId);
        if (!r2 || c3.contactRegionRef.bodyId !== b.id || c3.contactRegionRef.bodyRevision !== b.revision || c3.contactRegionRef.bodyDigest !== b.digest) return fail("V2_CONTACT_REGION_MISSING_OR_STALE", "BODY", { relationId: c3.relationId });
        if (c3.contactRegionDigest !== digest(r2) || canonical(c3.contactRegionGeometry) !== canonical(r2.geometry)) return fail("V2_CONTACT_REGION_DIGEST_MISMATCH", "BODY", { relationId: c3.relationId });
        if (c3.surfaceModelRef?.id !== model.surfaceModelId || c3.surfaceModelRef?.revision !== model.revision || c3.surfaceModelRef?.digest !== model.surfaceModelDigest) return fail("V2_CONTACT_SURFACE_MODEL_STALE", "IDENTITY", { relationId: c3.relationId });
        if (!c3.evidenceRefs?.length) return fail("V2_CONTACT_EVIDENCE_MISSING", "IDENTITY", { relationId: c3.relationId });
      }
      const whole = worldBox(b.geometry, req.transform);
      const floor = model.surfaces.find((x) => x.type === "FLOOR" && x.region?.allowed?.some((r2) => insideXZ(whole, r2)));
      if (!floor) return fail("V2_BODY_OUTSIDE_LEGAL_WORLD", "GLOBAL", { bounds: whole });
      for (const s2 of [...model.surfaces].sort((a2, b2) => a2.surfaceId.localeCompare(b2.surfaceId))) if (["WALL", "DOOR_OR_OPENING", "OBSTACLE"].includes(s2.type)) {
        for (const v of s2.region?.volumes || []) if (!disjoint(whole, v)) return fail(s2.type === "WALL" ? "V2_GLOBAL_WALL_PENETRATION" : s2.type === "DOOR_OR_OPENING" ? "V2_GLOBAL_DOOR_PENETRATION" : "V2_GLOBAL_OBSTACLE_PENETRATION", "GLOBAL", { bounds: whole, surfaceId: s2.surfaceId, volumeId: v.volumeId });
      }
      const per = [];
      for (const c3 of contacts) {
        const r2 = regions.get(c3.contactRegionRef.contactRegionId), g = worldBox(r2.geometry, req.transform), s2 = model.surfaces.find((x) => x.surfaceId === c3.surfaceId);
        if (!s2) return fail("V2_CONTACT_SURFACE_MISSING", "SEMANTIC", { relationId: c3.relationId, completed: per });
        if (s2.type !== c3.expectedSurfaceType) return fail("V2_CONTACT_SURFACE_TYPE_MISMATCH", "SEMANTIC", { relationId: c3.relationId, completed: per });
        const cap = (s2.contactCapabilities || []).find((x) => x.capabilityId === c3.capabilityId && x.kind === "SUPPORT_CONTACT");
        if (!cap) return fail("V2_SUPPORT_CAPABILITY_MISSING", "SEMANTIC", { relationId: c3.relationId, completed: per });
        const p2 = s2.contactPlane;
        if (!p2 || !["X", "Y", "Z"].includes(p2.axis) || ![-1, 1].includes(p2.normalSign) || p2.coordinate === void 0) return fail("V2_AXIS_ALIGNED_PLANE_UNSUPPORTED", "SEMANTIC", { relationId: c3.relationId, completed: per });
        const expected = { x: p2.axis === "X" ? p2.normalSign : 0, y: p2.axis === "Y" ? p2.normalSign : 0, z: p2.axis === "Z" ? p2.normalSign : 0 };
        if (c3.contactNormal.x !== expected.x || c3.contactNormal.y !== expected.y || c3.contactNormal.z !== expected.z) return fail("V2_CONTACT_NORMAL_MISMATCH", "SEMANTIC", { relationId: c3.relationId, completed: per });
        const edge = p2.axis === "X" ? p2.normalSign > 0 ? g.minX : g.maxX : p2.axis === "Y" ? p2.normalSign > 0 ? g.minY : g.maxY : p2.normalSign > 0 ? g.minZ : g.maxZ, delta = q(edge) - q(p2.coordinate);
        if (delta !== 0) return fail(delta * p2.normalSign > 0 ? "V2_CONTACT_FLOATING" : "V2_CONTACT_EXCESSIVE_PENETRATION", "CONTACT", { relationId: c3.relationId, deltaMicrounits: delta, completed: per });
        const allowed = (s2.region.allowed || []).some((a2) => p2.axis === "Y" ? insideXZ(g, a2) : p2.axis === "X" ? q(g.minY) >= q(a2.minY) && q(g.maxY) <= q(a2.maxY) && q(g.minZ) >= q(a2.minZ) && q(g.maxZ) <= q(a2.maxZ) : q(g.minX) >= q(a2.minX) && q(g.maxX) <= q(a2.maxX) && q(g.minY) >= q(a2.minY) && q(g.maxY) <= q(a2.maxY));
        if (!allowed) return fail("V2_CONTACT_OUTSIDE_SURFACE_REGION", "CONTACT", { relationId: c3.relationId, completed: per });
        per.push(Object.freeze({ relationId: c3.relationId, result: "PASS", contactRegionRef: c3.contactRegionRef, surfaceRef: { surfaceId: s2.surfaceId, type: s2.type, capabilityId: cap.capabilityId }, plane: p2, worldContactBounds: g, deltaMicrounits: 0 }));
      }
      const ev = { version: VERSION, requestId: req.requestId, requestDigest: req.requestDigest, bodyRef: { id: b.id, revision: b.revision, digest: b.digest }, global: { result: "PASS", bounds: whole, fullBodyCollisionEvaluated: true, legalWorldContainmentEvaluated: true }, contacts: per, canonicalRelationIds: contacts.map((x) => x.relationId) };
      return Object.freeze({ placementReady: false, result: "PASS", reasonCode: "V2_PASS", evidence: Object.freeze(ev), proofDigest: digest(ev) });
    }
    function verifyV2Result(x) {
      return !!x && x.evidence?.version === VERSION && x.proofDigest === digest(x.evidence);
    }
    module.exports = { VERSION, evaluateV2, requestDigest, verifyV2Result };
  }
});

// src/verified-architecture-phase2/index.js
var require_verified_architecture_phase2 = __commonJS({
  "src/verified-architecture-phase2/index.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    module.exports = { ...require_reason_codes(), ...require_fixed_point(), ...require_canonical(), ...require_surface_model(), ...require_geometry_gate(), ...require_geometry_gate_v2(), ...require_evidence_loader() };
  }
});

// src/clean-runtime/mutation/phase2-gateway.js
var require_phase2_gateway = __commonJS({
  "src/clean-runtime/mutation/phase2-gateway.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var V1 = require_geometry_gate();
    var V2 = V1 && require_verified_architecture_phase2().evaluateV2;
    var requestDigest = require_verified_architecture_phase2().requestDigest;
    function evaluate(version, request, model) {
      return version === "2.0.0" ? V2(request, model) : V1.evaluate(request, model);
    }
    module.exports = { evaluate, requestDigest };
  }
});

// src/clean-runtime/school/school-geometry-adapter.js
var require_school_geometry_adapter = __commonJS({
  "src/clean-runtime/school/school-geometry-adapter.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { evaluate: gatewayEvaluate } = require_phase2_gateway();
    var evaluate = (request, model) => gatewayEvaluate("1.0.0", request, model);
    var { canonical, digest } = require_canonical();
    var { MICROUNITS_PER_UNIT } = require_fixed_point();
    var { SCHOOL_SCENE, SCHOOL_BAG_BODY, SCHOOL_SURFACE_MODEL_REF } = require_school_physical_contract();
    var { PROFILE, POSTURE, BODY } = require_adult_v1_male_supine_floor();
    var CHAIR = require_treatment_chair();
    var A = require_authoring();
    function schoolGeometryAdapter({ surfaceModel }) {
      return Object.freeze({ kind: "SCHOOL_PHASE2_GEOMETRY_ADAPTER", evaluate(input) {
        const entityId = input.command.entityId || input.command.entity?.entityId, entity = input.proposedState.entities[entityId];
        if (input.proposedState.sceneDefinitionRef?.sceneId !== SCHOOL_SCENE.sceneId || !entity) return Object.freeze({ outcome: "UNKNOWN", evidence: { adapterReason: "UNSUPPORTED_SCENE_OR_ENTITY", sceneId: input.proposedState.sceneDefinitionRef?.sceneId || null, entityId: entityId || null } });
        const body = entity.physicalBodyRef, position = entity.transform?.positionMicrounits, isBag = body?.recordId === SCHOOL_BAG_BODY.bodyId, isCasualty = body?.recordId === BODY.bodyDefinitionId, isChair = body?.recordId === CHAIR.BODY.bodyDefinitionId, isSynthetic = body?.recordId === "synthetic/gate-c-supported-box-body";
        let dynamicModel = surfaceModel, surface = entity.supportRelation?.surfaceModelRef || ((isCasualty || isChair) && entity.physicalState?.surfaceId || isBag && input.proposedState.supportRelations?.some((r2) => r2.supportedEntityId === entityId) ? SCHOOL_SURFACE_MODEL_REF : null);
        if (isSynthetic) {
          const owner = input.proposedState.entities[entity.supportRelation?.ownerEntityId];
          if (owner) {
            const defOwner = { entityDefinitionId: CHAIR.ENTITY.entityDefinitionId, entityRevision: CHAIR.ENTITY.entityRevision, entityDigest: CHAIR.ENTITY.entityDigest, transform: { translationMicrounits: owner.transform.positionMicrounits, orientation: A.V1.canonicalOrientation } };
            const m = A.materializeSupportSurface({ staticModelRef: SCHOOL_SURFACE_MODEL_REF, owner: defOwner, surface: CHAIR.SURFACE });
            surface = { id: "gate-c-dynamic-surfaces", revision: 1, digest: null };
            dynamicModel = { ...surfaceModel, surfaceModelId: surface.id, revision: 1, surfaces: [...surfaceModel.surfaces, { surfaceId: m.surfaceId, type: m.type, region: m.region, planeOrDepth: m.planeOrDepth, contactRules: m.contactRules, confidence: m.confidence, provenance: m.provenance }] };
            delete dynamicModel.surfaceModelDigest;
            dynamicModel.surfaceModelDigest = digest(dynamicModel);
            surface.digest = dynamicModel.surfaceModelDigest;
          }
        }
        let contract;
        if (isBag) contract = { geometry: SCHOOL_BAG_BODY.geometry, digest: SCHOOL_BAG_BODY.geometryDigest, revision: SCHOOL_BAG_BODY.revision, proof: SCHOOL_BAG_BODY.proofGeometryDigest, evidenceRefs: SCHOOL_BAG_BODY.evidenceRefs, provenance: SCHOOL_BAG_BODY };
        else if (isCasualty) {
          const p2 = entity.physicalState?.profileRef, q = entity.physicalState?.postureRef;
          if (p2?.id !== PROFILE.profileDefinitionId || p2?.revision !== PROFILE.profileRevision || p2?.digest !== PROFILE.profileDigest || p2?.subjectSex !== "MALE") return Object.freeze({ outcome: "UNKNOWN", evidence: { adapterReason: "PROFILE_PROOF_MISMATCH", actual: p2 || null } });
          if (q?.id !== POSTURE.postureDefinitionId || q?.semanticType !== "SUPINE_FLOOR" || q?.revision !== POSTURE.postureRevision || q?.digest !== POSTURE.canonicalDigest) return Object.freeze({ outcome: "UNKNOWN", evidence: { adapterReason: "POSTURE_PROOF_MISMATCH", actual: q || null } });
          contract = { geometry: Object.fromEntries(Object.entries(BODY.aggregateBounds).map(([k, v]) => [k, v / 1e6])), digest: BODY.canonicalDigest, revision: BODY.bodyRevision, proof: BODY.canonicalDigest, evidenceRefs: ["authoring-decision:" + BODY.authoringProvenance.decisionId, "body-digest:" + BODY.canonicalDigest], provenance: { classification: "AUTHORED_NEW", lineageStatus: "AUTHORED_NEW", sourceId: BODY.geometrySource.sourceId } };
        } else if (isChair) contract = { geometry: Object.fromEntries(Object.entries(CHAIR.BODY.aggregateBounds).map(([k, v]) => [k, v / 1e6])), digest: CHAIR.BODY.canonicalDigest, revision: 1, proof: CHAIR.BODY.canonicalDigest, evidenceRefs: ["authoring-decision:" + CHAIR.decisionId], provenance: { classification: "AUTHORED_NEW", lineageStatus: "AUTHORED_NEW", sourceId: CHAIR.decisionId } };
        else if (isSynthetic) contract = { geometry: { minX: -0.1, maxX: 0.1, minY: -0.1, maxY: 0.1, minZ: -0.1, maxZ: 0.1 }, digest: "c".repeat(64), revision: 1, proof: "c".repeat(64), evidenceRefs: ["gate-c-contract-fixture"], provenance: { classification: "AUTHORED_NEW", lineageStatus: "AUTHORED_NEW", sourceId: "gate-c-contract-fixture" } };
        else return Object.freeze({ outcome: "UNKNOWN", evidence: { adapterReason: "BODY_PROOF_STALE_OR_MISMATCHED", actual: body || null } });
        if (body.revision !== contract.revision || body.digest !== contract.digest) return Object.freeze({ outcome: "UNKNOWN", evidence: { adapterReason: "BODY_PROOF_STALE_OR_MISMATCHED", expected: { revision: contract.revision, digest: contract.digest }, actual: body } });
        if (!surface) return Object.freeze({ outcome: "UNKNOWN", evidence: { adapterReason: "SURFACE_PROOF_MISSING" } });
        if (!Array.isArray(position) || position.length !== 3) return Object.freeze({ outcome: "UNKNOWN", evidence: { adapterReason: "TRANSFORM_CONTRACT_MISSING" } });
        const request = { requestId: input.command.commandId, surfaceId: entity.physicalState?.surfaceId || entity.supportRelation?.surfaceId || null, surfaceModelRef: { id: surface.id, revision: surface.revision, digest: surface.digest }, geometry: contract.geometry, geometryDigest: isCasualty || isChair || isSynthetic ? require_canonical().digest(contract.geometry) : body.digest, proofGeometryDigest: isCasualty || isChair || isSynthetic ? body.proofGeometryDigest === contract.proof ? require_canonical().digest(contract.geometry) : body.proofGeometryDigest : body.proofGeometryDigest || contract.proof, transform: { x: position[0] / MICROUNITS_PER_UNIT, y: position[1] / MICROUNITS_PER_UNIT, z: position[2] / MICROUNITS_PER_UNIT }, orientationUpDot: entity.physicalState?.orientationUpDot, supportNormalUpDot: entity.physicalState?.supportNormalUpDot, evidenceRefs: contract.evidenceRefs };
        const requestBytes = canonical(request), result = evaluate(request, dynamicModel);
        return Object.freeze({ outcome: result.result, evidence: { adapterKind: "SCHOOL_PHASE2_GEOMETRY_ADAPTER", request, requestDigest: digest(request), requestBytes, sceneProvenance: SCHOOL_SCENE, bodyProvenance: { classification: contract.provenance.classification, lineageStatus: contract.provenance.lineageStatus, sourceId: contract.provenance.sourceId, revision: contract.revision, digest: contract.digest }, surfaceProvenance: { classification: SCHOOL_SURFACE_MODEL_REF.classification, lineageStatus: SCHOOL_SURFACE_MODEL_REF.lineageStatus, sourceId: SCHOOL_SURFACE_MODEL_REF.sourceId, revision: surfaceModel.revision, digest: surfaceModel.surfaceModelDigest, sourceEvidence: surfaceModel.sourceEvidence, resolvedSurface: (surfaceModel.surfaces.find((x) => x.surfaceId === request.surfaceId) || null)?.provenance || null }, phase2ReasonCode: result.reasonCode, phase2Evidence: result.evidence, phase2ProofDigest: result.proofDigest || null } });
      } });
    }
    module.exports = { schoolGeometryAdapter };
  }
});

// src/clean-runtime/school/scene-v2/validate.js
var require_validate = __commonJS({
  "src/clean-runtime/school/scene-v2/validate.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { digest, canonicalBytes } = require_canonical2();
    var { PACKAGE, model } = require_package();
    var D = require_adult_v1_male_supine_floor();
    var C = require_treatment_chair();
    var { SCHOOL_BAG_BODY } = require_school_physical_contract();
    var { validateRelations, buildIndex } = require_relations();
    var fail = (code) => ({ status: "REJECTED", code });
    function validateScenePackage(p2) {
      if (!p2 || p2.scenePackageVersion !== "2.0.0" || p2.scenePackageId !== "SCHOOL_TREATMENT_ROOM_PHYSICAL_V2") return fail("MALFORMED_OR_WRONG_VERSION");
      if (digest({ ...p2, scenePackageDigest: void 0 }, "scenePackageDigest") !== p2.scenePackageDigest) return fail("PACKAGE_DIGEST_MISMATCH");
      if (p2.refs?.surfaceModel?.id !== model.surfaceModelId || p2.refs.surfaceModel.revision !== model.revision || p2.refs.surfaceModel.digest !== model.surfaceModelDigest) return fail("SURFACE_MODEL_MISMATCH");
      for (const s2 of model.surfaces) if (!p2.refs.requiredSurfaces.some((x) => x.id === s2.surfaceId && x.type === s2.type)) return fail("REQUIRED_SURFACE_MISSING");
      const ids = p2.entities?.map((x) => x.entityId) || [];
      if (ids.length !== 3 || new Set(ids).size !== ids.length || p2.requiredEntityIds?.length !== 3 || p2.requiredEntityIds.some((id) => !ids.includes(id))) return fail("ENTITY_MISSING_OR_DUPLICATE");
      const by = Object.fromEntries(p2.entities.map((x) => [x.entityId, x])), cas = by["school-casualty-adult-v1"], chair = by["school-treatment-chair"], bag = by["school-medical-bag"];
      if (!cas || cas.physicalBodyRef.recordId !== D.BODY.bodyDefinitionId || cas.physicalBodyRef.revision !== D.BODY.bodyRevision || cas.physicalBodyRef.digest !== D.BODY.canonicalDigest || cas.physicalState.profileRef.digest !== D.PROFILE.profileDigest || cas.physicalState.profileRef.subjectSex !== "MALE" || cas.physicalState.postureRef.digest !== D.POSTURE.canonicalDigest || cas.physicalState.postureRef.semanticType !== "SUPINE_FLOOR") return fail("CASUALTY_REF_MISMATCH");
      if (!chair || chair.physicalBodyRef.recordId !== C.BODY.bodyDefinitionId || chair.physicalBodyRef.revision !== C.BODY.bodyRevision || chair.physicalBodyRef.digest !== C.BODY.canonicalDigest || chair.physicalState.supportSurface?.surfaceRevision !== C.SURFACE.surfaceRevision || chair.physicalState.supportSurface?.canonicalDigest !== C.SURFACE.canonicalDigest || p2.refs.bodies.seat.owner.id !== C.ENTITY.entityDefinitionId || p2.refs.bodies.seat.owner.digest !== C.ENTITY.entityDigest) return fail("CHAIR_OR_SEAT_MISMATCH");
      if (!bag || bag.physicalBodyRef.recordId !== SCHOOL_BAG_BODY.bodyId || bag.physicalBodyRef.revision !== SCHOOL_BAG_BODY.revision || bag.physicalBodyRef.digest !== SCHOOL_BAG_BODY.geometryDigest) return fail("BAG_REF_MISMATCH");
      if (p2.supportRelations.some((r3) => digest(r3.contactRegionGeometry) !== r3.contactRegionDigest)) return fail("CONTACT_REGION_DIGEST_MISMATCH");
      if (p2.supportRelations.length !== p2.entities.length || p2.entities.some((e3) => !p2.supportRelations.some((r3) => r3.supportedEntityId === e3.entityId))) return fail("REQUIRED_SUPPORT_RELATION_MISSING");
      const state = { entities: by, supportRelations: p2.supportRelations };
      const r2 = validateRelations(p2.supportRelations, state, { targetWorldRevision: 1 });
      if (r2.status !== "VALIDATED") return fail("SUPPORT_RELATION_INVALID:" + r2.code);
      return Object.freeze({ status: "VALIDATED", canonicalBytes: canonicalBytes(p2).toString("hex"), package: p2, index: buildIndex(p2.supportRelations) });
    }
    module.exports = { validateScenePackage };
  }
});

// src/clean-runtime/contracts/failures.js
var require_failures = __commonJS({
  "src/clean-runtime/contracts/failures.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var FAILURE_CODES = Object.freeze(["INVALID_ENTITY", "INVALID_WORLD_REVISION", "INVALID_SURFACE", "INVALID_PHYSICAL_BODY", "INVALID_COMMAND", "GEOMETRY_PROOF_FAILED", "STALE_GEOMETRY", "STALE_SURFACE_MODEL", "ILLEGAL_REPARENT", "ILLEGAL_SUPPORT_RELATION", "TRANSACTION_REJECTED", "PHYSICAL_BYPASS_ATTEMPT", "VISUAL_SYNC_FAILURE", "EVENT_LOG_FAILURE", "REPLAY_MISMATCH", "PERSISTENCE_INVALID", "UNSUPPORTED_SCENE", "UNKNOWN"]);
    var failure = (code, evidence = {}) => {
      if (!FAILURE_CODES.includes(code)) throw new TypeError("INVALID_FAILURE_CODE");
      return Object.freeze({ code, evidence: Object.freeze(structuredClone(evidence)) });
    };
    module.exports = { FAILURE_CODES, failure };
  }
});

// src/clean-runtime/events/replay.js
var require_replay = __commonJS({
  "src/clean-runtime/events/replay.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { world } = require_world_state();
    var { digest } = require_canonical2();
    var { failure } = require_failures();
    function replay(initial, events) {
      let state = initial, prior = "0".repeat(64);
      for (const e3 of events) {
        if (e3.priorEventDigest !== prior || digest({ ...e3, eventDigest: void 0 }) !== e3.eventDigest) throw failure("REPLAY_MISMATCH", { eventSequence: e3.sequence });
        prior = e3.eventDigest;
        if (e3.eventType === "MutationRejected") continue;
        if (e3.priorStateDigest !== state.stateDigest) throw failure("REPLAY_MISMATCH", { state: true });
        state = world({ stateSchemaVersion: state.stateSchemaVersion, worldId: state.worldId, sceneDefinitionRef: state.sceneDefinitionRef, revision: e3.newWorldRevision, priorStateDigest: e3.priorStateDigest, lifecycleState: e3.stateDelta.lifecycleState, entities: e3.stateDelta.entities, physicalRelations: e3.stateDelta.physicalRelations, supportRelations: e3.stateDelta.supportRelations, surfaces: e3.stateDelta.surfaces, environmentPhysicalState: e3.stateDelta.environmentPhysicalState, committedEventSequence: state.committedEventSequence + 1 });
        if (state.stateDigest !== e3.newStateDigest) throw failure("REPLAY_MISMATCH", { digest: true });
      }
      return state;
    }
    module.exports = { replay };
  }
});

// src/clean-runtime/school/scene-v2/instantiate.js
var require_instantiate = __commonJS({
  "src/clean-runtime/school/scene-v2/instantiate.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { createMultiSupportRuntime } = require_runtime();
    var { schoolGeometryAdapter } = require_school_geometry_adapter();
    var { model } = require_package();
    var { validateScenePackage } = require_validate();
    var { replay } = require_replay();
    var { world } = require_world_state();
    function empty() {
      return { stateSchemaVersion: "2.0.0", worldId: "school-treatment-room-v2", sceneDefinitionRef: { sceneId: "school" }, revision: 0, lifecycleState: "ACTIVE", entities: {}, supportRelations: [], surfaces: { id: model.surfaceModelId, revision: model.revision, digest: model.surfaceModelDigest }, environmentPhysicalState: null, committedEventSequence: 0 };
    }
    function instantiate(p2) {
      const v = validateScenePackage(p2), port = schoolGeometryAdapter({ surfaceModel: model }), api = createMultiSupportRuntime({ initialWorld: empty(), legalityPort: port }), before = api.getWorldState();
      if (v.status !== "VALIDATED") return { status: "REJECTED", code: v.code, before, after: api.getWorldState() };
      const commands = p2.entities.map((e3) => ({ commandId: "spawn:" + e3.entityId, type: "SpawnEntity", expectedWorldRevision: 0, entity: e3 })).concat(p2.supportRelations.map((r2) => ({ commandId: "support:" + r2.relationId, type: "AttachSupportRelation", expectedWorldRevision: 0, relation: r2 })));
      const result = api.proposeTransaction({ transactionId: "instantiate:" + p2.scenePackageDigest, expectedWorldRevision: 0, commands });
      return { ...result, before, after: api.getWorldState(), index: api.getSupportIndex(), events: api.getEventLog(), replay: result.status === "COMMITTED" ? replay(world(empty()), api.getEventLog()) : null };
    }
    module.exports = { empty, instantiate };
  }
});

// src/clean-runtime/school/scene-v2/visual-descriptor.js
var require_visual_descriptor = __commonJS({
  "src/clean-runtime/school/scene-v2/visual-descriptor.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var { PACKAGE, model } = require_package();
    var { instantiate } = require_instantiate();
    var { digest } = require_canonical2();
    var SEMANTIC_SCENE_ID = "scene.school.treatment_room";
    var NUMERIC_CONTRACT_ID = "ED-P2-02";
    var MICROWUNITS_PER_WORLD_UNIT = 1e6;
    var DECLARED_UNKNOWNS = Object.freeze(["panorama-geometry lineage", "visual-physical lineage", "final visual correctness", "rotated contacts", "articulation/deformation", "friction/load/stability", "Constraint/Entrapment/Accessibility", "real posture contact regions", "dynamic hazard/event contracts"]);
    var STATUS_CAVEATS = Object.freeze({
      casualty: Object.freeze({ entityId: "school-casualty-adult-v1", gate: "GATE B", gateResult: "PASS_PENDING_LIFECYCLE_REVIEW", bodyLifecycle: "AUTHORED_NEW_DRAFT/VALIDATED/AWAITING_USER_GATE_REVIEW", verifiedForSlice: false, caveat: "Male casualty body is NOT VERIFIED_FOR_SLICE. Visual use is provisional pending lifecycle review." }),
      chair: Object.freeze({ entityId: "school-treatment-chair", gate: "GATE C", gateResult: "PASS_PENDING_USER_REVIEW_FOR_ADMISSION", verifiedForSlice: false, caveat: "Treatment chair is PASS_PENDING_USER_REVIEW_FOR_ADMISSION. Visual use is provisional pending user review." })
    });
    function deepFreeze(v) {
      if (v && typeof v === "object") {
        for (const k of Object.keys(v)) deepFreeze(v[k]);
        Object.freeze(v);
      }
      return v;
    }
    function entityView(e3) {
      return { entityId: e3.entityId, entityTypeId: e3.entityTypeId, revision: e3.revision, lifecycleState: e3.lifecycleState, transform: structuredClone(e3.transform), physicalBodyRef: structuredClone(e3.physicalBodyRef), geometrySourceRef: structuredClone(e3.geometrySourceRef), postureStateId: e3.postureStateId, participatesIn: structuredClone(e3.participatesIn || []), physicalState: structuredClone(e3.physicalState) };
    }
    function buildVisualSceneDescriptor2() {
      const r2 = instantiate(PACKAGE);
      if (r2.status !== "COMMITTED") return deepFreeze({ descriptorVersion: "1.0.0", kind: "VISUAL_SCENE_DESCRIPTOR", status: "REJECTED", code: r2.code || "INSTANTIATION_NOT_COMMITTED", sourcePackage: { scenePackageId: PACKAGE.scenePackageId, scenePackageDigest: PACKAGE.scenePackageDigest } });
      const s2 = r2.after, entityIds = Object.keys(s2.entities).sort();
      const descriptor = {
        descriptorVersion: "1.0.0",
        kind: "VISUAL_SCENE_DESCRIPTOR",
        status: "COMMITTED",
        semanticRef: { semanticId: SEMANTIC_SCENE_ID, sceneRef: structuredClone(PACKAGE.sceneRef) },
        sourcePackage: { scenePackageId: PACKAGE.scenePackageId, scenePackageVersion: PACKAGE.scenePackageVersion, scenePackageDigest: PACKAGE.scenePackageDigest, certification: "GATE D SCHOOL PHYSICAL SCENE PACKAGE V2 PASS", gateEvidenceRef: "evidence/clean-runtime/gate-d/gate-result.json", packageProvenanceLedger: structuredClone(PACKAGE.provenanceLedger) },
        worldRef: { worldId: s2.worldId, revision: s2.revision, stateDigest: s2.stateDigest, replayMatchesCommittedState: r2.replay ? r2.replay.stateDigest === s2.stateDigest : null },
        numericContract: { contractId: NUMERIC_CONTRACT_ID, linearUnit: "MICROUNIT", microunitsPerWorldUnit: MICROWUNITS_PER_WORLD_UNIT, orientation: "CANONICAL_INTEGER_QUATERNION", rendererConversion: "DOWNSTREAM_ONLY", rendererFloatsFeedAuthoritativeState: false, unitsNotes: ["entities[].transform is integer microunits / canonical integer quaternion per ED-P2-02", "supportRelations[].contactRegionGeometry for school-medical-bag is carried verbatim in AUTHORED METERS from the locked SCHOOL_BAG_BODY geometry (digest f3630d860bbd1900c026aa392632cf73097273c4b7894745d92ac31bf75f2c5a, .55x.35x.35m box) - not converted here; the renderer applies each field's declared units", "casualty contact region geometry is integer microunits from the adult-v1 body definition"] },
        boundary: { kind: "VISUAL_BINDING_PROJECTION", readOnly: true, physicalProof: false, visualsRepresentCertifiedPhysics: false, physicalTruthFromPixels: false, geometryGateBypass: false, rendererDownstreamOfContract: NUMERIC_CONTRACT_ID, rendererMayWriteToAuthoritativeState: false },
        surfaces: { surfaceModelRef: { id: model.surfaceModelId, revision: model.revision, digest: model.surfaceModelDigest, provenance: PACKAGE.refs.surfaceModel.provenance }, requiredSurfaces: structuredClone(PACKAGE.refs.requiredSurfaces) },
        entities: entityIds.map((id) => entityView(s2.entities[id])),
        supportRelations: structuredClone(s2.supportRelations),
        statusCaveats: structuredClone(STATUS_CAVEATS),
        declaredUnknowns: [...DECLARED_UNKNOWNS],
        placementPath: ["WorldMutationAPI", "PhysicalLegalityPort", "SchoolGeometryAdapter", "Phase 2 Geometry Gate (PASS, phase2ByteIdentical)"]
      };
      descriptor.descriptorDigest = digest({ ...descriptor, descriptorDigest: void 0 });
      return deepFreeze(descriptor);
    }
    module.exports = { buildVisualSceneDescriptor: buildVisualSceneDescriptor2, SEMANTIC_SCENE_ID, NUMERIC_CONTRACT_ID, MICROWUNITS_PER_WORLD_UNIT, DECLARED_UNKNOWNS, STATUS_CAVEATS };
  }
});

// src/clean-runtime/school/scene-v2/visual-casualty.js
var require_visual_casualty = __commonJS({
  "src/clean-runtime/school/scene-v2/visual-casualty.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var D = require_adult_v1_male_supine_floor();
    var { buildVisualSceneDescriptor: buildVisualSceneDescriptor2, STATUS_CAVEATS } = require_visual_descriptor();
    var { digest } = require_canonical2();
    var IDENTITY = [0, 0, 0, 1];
    function deepFreeze(v) {
      if (v && typeof v === "object") {
        for (const k of Object.keys(v)) deepFreeze(v[k]);
        Object.freeze(v);
      }
      return v;
    }
    function compAabb(c3) {
      const t2 = c3.localTransform.translationMicrounits, d3 = c3.dimensionsMicrounits;
      return { minX: t2[0] - d3[0] / 2, maxX: t2[0] + d3[0] / 2, minY: t2[1] - d3[1] / 2, maxY: t2[1] + d3[1] / 2, minZ: t2[2] - d3[2] / 2, maxZ: t2[2] + d3[2] / 2 };
    }
    var APPEARANCE = { head: { colorHex: "0xd9b18c", label: "head" }, torso: { colorHex: "0x3e5f8a", label: "torso" }, "left-arm": { colorHex: "0x3e5f8a", label: "left-arm" }, "right-arm": { colorHex: "0x3e5f8a", label: "right-arm" }, legs: { colorHex: "0x2f3b52", label: "legs" } };
    function buildVisualCasualty2(descriptor = buildVisualSceneDescriptor2()) {
      if (descriptor.status !== "COMMITTED") return deepFreeze({ visualVersion: "1.0.0", kind: "VISUAL_CASUALTY", status: "REJECTED", code: "DESCRIPTOR_NOT_COMMITTED" });
      const e3 = descriptor.entities.find((x) => x.entityId === "school-casualty-adult-v1");
      if (!e3) return deepFreeze({ visualVersion: "1.0.0", kind: "VISUAL_CASUALTY", status: "REJECTED", code: "CASUALTY_ENTITY_MISSING" });
      if (e3.physicalBodyRef.digest !== D.BODY.canonicalDigest) return deepFreeze({ visualVersion: "1.0.0", kind: "VISUAL_CASUALTY", status: "REJECTED", code: "BODY_DIGEST_MISMATCH" });
      const o2 = e3.transform.orientation;
      if (!(o2.length === 4 && o2.every((v2, i2) => v2 === IDENTITY[i2]))) return deepFreeze({ visualVersion: "1.0.0", kind: "VISUAL_CASUALTY", status: "REJECTED", code: "NON_IDENTITY_ORIENTATION_UNSUPPORTED", note: "rotated contacts are a Gate D declared unknown" });
      const pos = e3.transform.positionMicrounits, scale = e3.transform.scaleMicrounits;
      if (!scale.every((v2) => v2 === 1e6)) return deepFreeze({ visualVersion: "1.0.0", kind: "VISUAL_CASUALTY", status: "REJECTED", code: "NON_UNIT_SCALE_UNSUPPORTED" });
      const components = D.BODY.components.map((c3) => {
        const local = compAabb(c3), world = { minX: local.minX + pos[0], maxX: local.maxX + pos[0], minY: local.minY + pos[1], maxY: local.maxY + pos[1], minZ: local.minZ + pos[2], maxZ: local.maxZ + pos[2] };
        return { componentId: c3.componentId, kind: "BOX_MESH", dimensionsMicrounits: [...c3.dimensionsMicrounits], localTransform: structuredClone(c3.localTransform), localAabbMicrounits: local, worldAabbMicrounits: world, floorContact: local.minY === 0, participationRole: c3.participationRole, visualOnlyAppearance: { ...APPEARANCE[c3.componentId], materialClaim: "VISUAL_ONLY" } };
      });
      const envelope = D.BODY.aggregateBounds, worldEnvelope = { minX: envelope.minX + pos[0], maxX: envelope.maxX + pos[0], minY: envelope.minY + pos[1], maxY: envelope.maxY + pos[1], minZ: envelope.minZ + pos[2], maxZ: envelope.maxZ + pos[2] };
      const union = components.reduce((a2, c3) => ({ minX: Math.min(a2.minX, c3.localAabbMicrounits.minX), maxX: Math.max(a2.maxX, c3.localAabbMicrounits.maxX), minY: Math.min(a2.minY, c3.localAabbMicrounits.minY), maxY: Math.max(a2.maxY, c3.localAabbMicrounits.maxY), minZ: Math.min(a2.minZ, c3.localAabbMicrounits.minZ), maxZ: Math.max(a2.maxZ, c3.localAabbMicrounits.maxZ) }), components[0].localAabbMicrounits);
      const envelopeExact = Object.keys(union).every((k) => union[k] === envelope[k]);
      const v = {
        visualVersion: "1.0.0",
        kind: "VISUAL_CASUALTY",
        status: envelopeExact ? "DIMENSIONED_TO_CERTIFIED_ENVELOPE" : "ENVELOPE_MISMATCH",
        entityRef: { entityId: e3.entityId, physicalBodyRef: structuredClone(e3.physicalBodyRef), profileRef: structuredClone(e3.physicalState.profileRef), postureRef: structuredClone(e3.physicalState.postureRef) },
        authoritativeTransformMicrounits: structuredClone(e3.transform),
        physicalPosture: { semantic: "SUPINE_FLOOR", source: "CERTIFIED_AUTHORITATIVE_STATE", visualMayAlter: false },
        visualPose: { kind: "STATIC", matchesCertifiedPosture: true, articulation: false, deformation: false, reason: "articulation/deformation and rotated contacts are Gate D declared unknowns" },
        envelopeMicrounits: structuredClone(envelope),
        worldEnvelopeMicrounits: worldEnvelope,
        envelopeCheck: { componentUnionEqualsAggregateBounds: envelopeExact, floorContactY0: envelope.minY === 0, dimensionsMicrounits: [envelope.maxX - envelope.minX, envelope.maxY - envelope.minY, envelope.maxZ - envelope.minZ] },
        components,
        statusCaveat: structuredClone(STATUS_CAVEATS.casualty),
        boundary: { presentationOnly: true, visualPoseFeedsPhysicalPosture: false, physicalProof: false, geometryGateBypass: false, rendererDownstreamOfContract: "ED-P2-02" }
      };
      v.visualDigest = digest({ ...v, visualDigest: void 0 });
      return deepFreeze(v);
    }
    module.exports = { buildVisualCasualty: buildVisualCasualty2 };
  }
});

// src/clean-runtime/school/scene-v2/visual-equipment.js
var require_visual_equipment = __commonJS({
  "src/clean-runtime/school/scene-v2/visual-equipment.js"(exports, module) {
    "use strict";
    init_buffer_inject();
    var C = require_treatment_chair();
    var { SCHOOL_BAG_BODY } = require_school_physical_contract();
    var { buildVisualSceneDescriptor: buildVisualSceneDescriptor2, STATUS_CAVEATS } = require_visual_descriptor();
    var { digest } = require_canonical2();
    var IDENTITY = [0, 0, 0, 1];
    function deepFreeze(v) {
      if (v && typeof v === "object") {
        for (const k of Object.keys(v)) deepFreeze(v[k]);
        Object.freeze(v);
      }
      return v;
    }
    var reject = (code, note) => deepFreeze({ visualVersion: "1.0.0", kind: "VISUAL_EQUIPMENT", status: "REJECTED", code, note });
    function compAabb(c3) {
      const t2 = c3.localTransform.translationMicrounits, d3 = c3.dimensionsMicrounits;
      return { minX: t2[0] - d3[0] / 2, maxX: t2[0] + d3[0] / 2, minY: t2[1] - d3[1] / 2, maxY: t2[1] + d3[1] / 2, minZ: t2[2] - d3[2] / 2, maxZ: t2[2] + d3[2] / 2 };
    }
    function place(e3, pos) {
      return { minX: e3.minX + pos[0], maxX: e3.maxX + pos[0], minY: e3.minY + pos[1], maxY: e3.maxY + pos[1], minZ: e3.minZ + pos[2], maxZ: e3.maxZ + pos[2] };
    }
    function checkEntity(descriptor, entityId, expectedDigest) {
      const e3 = descriptor.entities.find((x) => x.entityId === entityId);
      if (!e3) return { error: "ENTITY_MISSING:" + entityId };
      if (e3.physicalBodyRef.digest !== expectedDigest) return { error: "BODY_DIGEST_MISMATCH:" + entityId };
      const o2 = e3.transform.orientation;
      if (!(o2.length === 4 && o2.every((v, i2) => v === IDENTITY[i2]))) return { error: "NON_IDENTITY_ORIENTATION_UNSUPPORTED:" + entityId };
      if (!e3.transform.scaleMicrounits.every((v) => v === 1e6)) return { error: "NON_UNIT_SCALE_UNSUPPORTED:" + entityId };
      return { e: e3 };
    }
    function buildVisualEquipment2(descriptor = buildVisualSceneDescriptor2()) {
      if (descriptor.status !== "COMMITTED") return reject("DESCRIPTOR_NOT_COMMITTED");
      const ch = checkEntity(descriptor, "school-treatment-chair", C.BODY.canonicalDigest);
      if (ch.error) return reject(ch.error, "rotated contacts are a Gate D declared unknown");
      const bg = checkEntity(descriptor, "school-medical-bag", SCHOOL_BAG_BODY.geometryDigest);
      if (bg.error) return reject(bg.error);
      const cpos = ch.e.transform.positionMicrounits, chairComponents = C.BODY.components.map((c3) => {
        const local = compAabb(c3);
        return { componentId: c3.componentId, kind: "BOX_MESH", dimensionsMicrounits: [...c3.dimensionsMicrounits], localTransform: structuredClone(c3.localTransform), localAabbMicrounits: local, worldAabbMicrounits: place(local, cpos), floorContact: local.minY === 0, participationRole: c3.participationRole, visualOnlyAppearance: { colorHex: "0x6a7f8c", materialClaim: "VISUAL_ONLY" } };
      }), cEnv = C.BODY.aggregateBounds, chair = { entityRef: { entityId: ch.e.entityId, physicalBodyRef: structuredClone(ch.e.physicalBodyRef), supportSurfaceRef: { id: C.SURFACE.supportSurfaceId, revision: C.SURFACE.surfaceRevision, digest: C.SURFACE.canonicalDigest } }, authoritativeTransformMicrounits: structuredClone(ch.e.transform), envelopeMicrounits: structuredClone(cEnv), worldEnvelopeMicrounits: place(cEnv, cpos), envelopeCheck: { dimensionsMicrounits: [cEnv.maxX - cEnv.minX, cEnv.maxY - cEnv.minY, cEnv.maxZ - cEnv.minZ], seatPlaneYMicrounits: C.SURFACE.localPlane.offsetMicrounits, floorContactY0: cEnv.minY === 0 }, components: chairComponents, provenance: { classification: "AUTHORED_NEW", decisionId: C.BODY.authoringProvenance.decisionId }, statusCaveat: structuredClone(STATUS_CAVEATS.chair) };
      const g = SCHOOL_BAG_BODY.geometry, bpos = bg.e.transform.positionMicrounits, M = 1e6, gMicro = { minX: Math.round(g.minX * M), maxX: Math.round(g.maxX * M), minY: Math.round(g.minY * M), maxY: Math.round(g.maxY * M), minZ: Math.round(g.minZ * M), maxZ: Math.round(g.maxZ * M) }, bag = { entityRef: { entityId: bg.e.entityId, physicalBodyRef: structuredClone(bg.e.physicalBodyRef) }, authoritativeTransformMicrounits: structuredClone(bg.e.transform), geometryMicrounits: gMicro, worldAabbMicrounits: place(gMicro, bpos), envelopeCheck: { dimensionsMicrounits: [gMicro.maxX - gMicro.minX, gMicro.maxY - gMicro.minY, gMicro.maxZ - gMicro.minZ], floorContactY0: gMicro.minY + bpos[1] === 0 }, components: [{ componentId: "bag-body", kind: "BOX_MESH", localAabbMicrounits: gMicro, worldAabbMicrounits: place(gMicro, bpos), floorContact: true, visualOnlyAppearance: { colorHex: "0x883d46", materialClaim: "VISUAL_ONLY" } }], provenance: { classification: "RECOVERED", lineageStatus: "RECOVERED", sourceId: SCHOOL_BAG_BODY.sourceId, sourceDigest: SCHOOL_BAG_BODY.sourceDigest, sourceRange: "school-bag-lockers" }, authoredVsAuthoritative: { authoredCenterMicrounits: [-3e6, 18e4, 1e6], authoritativePositionMicrounits: [...bpos], yDifferenceMicrounits: bpos[1] - 18e4, resolution: "AUTHORITATIVE_TRANSFORM_WINS: authored .18m center vs committed .175m exact floor-contact position; dimensions identical" }, statusCaveat: null };
      const v = { visualVersion: "1.0.0", kind: "VISUAL_EQUIPMENT", status: "DIMENSIONED_TO_CERTIFIED_BODIES", chair, bag, equipmentBeyondBagAndChair: { included: [], policy: "REQUIRES_GATE_A_LIFECYCLE", note: "No additional equipment is included. Any further equipment is NEW authoring through the Gate A lifecycle (AUTHORED_NEW); legacy visuals are never borrowed as physical truth." }, boundary: { presentationOnly: true, physicalProof: false, geometryGateBypass: false, rendererDownstreamOfContract: "ED-P2-02", visualNeverFeedsAuthoritativeState: true } };
      v.visualDigest = digest({ ...v, visualDigest: void 0 });
      return deepFreeze(v);
    }
    module.exports = { buildVisualEquipment: buildVisualEquipment2 };
  }
});

// visual-slice/engine/entry.mjs
init_buffer_inject();
var import_visual_descriptor = __toESM(require_visual_descriptor(), 1);
var import_visual_casualty = __toESM(require_visual_casualty(), 1);
var import_visual_equipment = __toESM(require_visual_equipment(), 1);
var buildVisualSceneDescriptor = import_visual_descriptor.default.buildVisualSceneDescriptor;
var buildVisualCasualty = import_visual_casualty.default.buildVisualCasualty;
var buildVisualEquipment = import_visual_equipment.default.buildVisualEquipment;
var EXPECTED = Object.freeze({
  packageDigest: "187cf1a4c0af01ef12087879f44eeb88a355499a860665e29cdb2f5ab0d06aec",
  worldDigest: "fa1bbaa985a63a8bfa30c2bbd7fbaf14b2c4972d985815a093bdd68f7fe954ea",
  nodeDescriptorDigest: "5f6829b7b10bbbc91ff0bd7e66bd5de3c69473091d56af92f8decbc8cbecaa18"
});
export {
  EXPECTED,
  buildVisualCasualty,
  buildVisualEquipment,
  buildVisualSceneDescriptor
};
/**
 * [js-sha256]{@link https://github.com/emn178/js-sha256}
 *
 * @version 1.0.0
 * @author Chen, Yi-Cyuan [emn178@gmail.com]
 * @copyright Chen, Yi-Cyuan 2014-2026
 * @license MIT
 */
