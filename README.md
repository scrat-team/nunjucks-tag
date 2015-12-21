# nunjucks-tag

> provide [nunjucks](http://mozilla.github.io/nunjucks/) base tag to make it easy to write custom tag.

[![NPM Version](https://img.shields.io/npm/v/nunjucks-tag.svg?style=flat)](https://www.npmjs.org/package/nunjucks-tag)
[![Build Status](https://img.shields.io/travis/node-modules/nunjucks-tag.svg?style=flat)](https://travis-ci.org/node-modules/nunjucks-tag)

## Installation
```bash
  npm install nunjucks-tag --save
```

## Usage
```js
const Tag = require('nunjucks-tag');
class CustomTag extends Tag {
  constructor() {
    super('custom');
    this.nodeName = 'div';
  }
  render(context, attrs, body) {
    // provide your custom logic
    return super.render(context, attrs, body());
  }
}

const assert = require('assert');
const nunjucks = require('nunjucks');
const env = nunjucks.configure('/view');
end.addExtension('custom', new CustomTag());
const html = env.renderString('{% custom attr=someVar %}{% endcustom %}', {someVar: "test"});
assert(html, '<div attr="test"></div>');
```

## Properties
  - `end`: whether as a close tag, default true
  - `useCustomParser`: whether using custom parser, default true
  - `nodeName`: the output html element's tag name, default as tagName
  - `tagName`: the tag name use in template

## Methods
  - render(context, attrs, body):String - The actual renderFn, extend it to provide custom logic
  - convertAttrs(attrs):String - Convert attrs to html attribute string

## Custom parser rules
  - Comma between attributes is optional.
  - Attribute keys should only match 1 of the following 2 patterns:
    - String ("data-key"="value" key="value")
    - Symbol with hyphen (data-key="value")
  - Attributes without value must be a simple symbol or an expression

## Attribute convert rules
  - all the attr name && value will be escape
  - single attrs
    - only string will be output & escape, `"disabled" sVar "<" => disabled sVal &lt;`
    - string with space will be ignore, `"a space" => nothing`
    - number/array/object/falsely will be ignore, `123, [12,13] {a:'b'} undefined false null => nothing`
  - key-value attrs
    - string/number will output as escape string, `a1=123 a2="t" a3="<div" => a1="123" a2="t" a3="&lt;div"`
    - SafeString will output as what they are, `attr2="<div"|safe => attr2="<div"`
    - object/array will output as String(item), `a1={} a2=["a", "b"] => a1="[object Object] a2="[object Array]"`
    - undefined/null will ignore, `attr1=undefined attr2=null => nothing`

## More Example
  - https://github.com/scrat-team/nunjucks-pagelet