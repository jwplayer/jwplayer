require-less
===========

**Note: This project is not currently actively supported and is seeking a maintainer.**

Optimizable LESS requiring with RequireJS

Based on the ideas from [require-css module](https://github.com/guybedford/require-css), read the documentation there for further usage instructions.

Basic Overview
--------------

Allows the construction of scripts that can require LESS files, using the simple RequireJS syntax:

```javascript
define(['less!styles/main'], function() {
  //code that requires the stylesheet: styles/main.less
});
```

When run the in the browser, less is downloaded, parsed and injected. When running a build with the RequireJS optimizer, less is compiled into the build layers dynamically as css with compression support, or into a separate file with the `separateCSS` build option.

Normalization
---

By default LESS URIs are normalized relative to the base LESS. 

URIs can be made relative to the individual LESS files with the global LESS configuration:

```html
<script>window.less = { relativeUrls: true }</script>
```

Installation and Setup
----------------------

Download the require-less folder manually or use Bower:

```
bower install require-less
```

Then add the following package configuration in RequireJS:

```javascript
map: {
  '*': {
    'less': 'require-less/less' // path to less
  }
}
```

Package configuration can also be used here alternatively.

Builds
------

Before running a build, install the LESS NodeJS module and csso for compression:

```javascript
  npm install less csso
```

NOTE: If you are running the optimizer globally, use `npm install less csso -g`.

The RequireCSS build system is used to build LESS. The exact same options thus apply.

Example build configuration:

```javascript
{
  modules: [
    {
      include: ['mymodule'], // where mymodule is dependent on a less! include
      exclude: ['require-css/normalize'],
    }
  ]
}
```

This inlines all compiled LESS required by `mymodule` into the build layer for dynamic injection.

To build into a separate CSS file:

```javascript
  separateCSS: true,
  modules: [
    {
      include: ['mymodule'], // where mymodule is dependent on a less! include
      exclude: ['require-css/normalize'],
    }
  ]
```

The `separateCSS` build option can then be used to create this CSS layer as a separate file. See the [RequireCSS documentation](https://github.com/guybedford/require-css) for more information.

Compilation Options
---

Compilation options can be set with the `less` configuration option in the RequireJS config:

```javascript
requirejs.config({
  less: {
    // ... custom LESS compiler options ...
    // for example: relativeUrls: true
  }
});
```

License
---

MIT



[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/guybedford/require-less/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

