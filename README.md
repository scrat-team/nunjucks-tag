# nunjucks-tag - provide nunjucks base tag to make it easy to write custom tag

## Install
```
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
const html = env.renderString('{% custom attr=someVar %}{% endcustom %}', {someVar: "test"});
assert(html, '<div attr="test"></div>');
```

## Properties
  - end: whether as a close tag, default true
  - useCustomParser: whether using custom parser, default true
  - nodeName: the output html element's tag name, default as tagName
  - tagName: the tag name use in template

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
    - only allow string, `"disabled" someVar => disabled someValue`
    - number/array/object/falsely will be ignore, `123, [12,13] {a:'b'} undefined false null => nothing`
  - key-value attrs
    - string/number will output as string, `attr1=123 attr2="test"`
    - object/array will output as String(item), `attr1={} attr2=["a", "b"] => attr1="[object Object] attr2="a,b"`
    - undefined/null will ignore, `attr1=undefined attr2=null => empty string`