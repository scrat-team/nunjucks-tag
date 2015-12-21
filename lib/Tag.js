'use strict';

const assert = require('assert');
const parseAttributes = require('./parseAttributes');

/**
 * The Base Tag to make you write custom nunjucks tag easy.
 *
 * @class Tag
 *
 * @example
 * ```js
 * class CustomTag extends Tag {
 *   constructor() {
 *     super('custom');
 *   }
 *
 *   render(context, attrs, body) {
 *     // provide your custom logic
 *     return super.render(context, attrs, body());
 *   }
 *
 * }
 * ```
 */
class Tag {
  constructor(tagName) {
    assert.notEqual(tagName, undefined, 'tagName is not allow empty');

    this.tagName = tagName;
    this.tags = [tagName];

    /**
     * the output html element's tag name
     * @member Tag#nodeName
     * @type {String}
     */
    this.nodeName = tagName;

    /**
     * whether as an end tag, default true
     * @member Tag#end
     * @type {Boolean}
     */
    this.end = true;

    /**
     * whether using custom parser, default true
     * build-in custom parser add some rules:
     *  - Comma between attributes is optional.
     *  - Attribute keys should only match 1 of the following 2 patterns:
     *    - String ("data-key"="value" key="value")
     *    - Symbol with hyphen (data-key="value")
     *  - Attributes without value must be a simple symbol or an expression
     * @member Tag#useCustomParser
     * @type {Boolean}
     */
    this.useCustomParser = true;
  }

  /**
   * The actual renderFn, extend it to provide custom logic
   * @protected
   * @param {Object} context - context of nunjucks
   * @param {Object} context.ctx - locals
   * @param {Object} context.env - nunjucks environment
   * @param {Array<String|Object>} attrs - parse from attributes, ['checked', 'readonly', ['a', 'b'], {a: 'b'}, {class: ["a"], alt: "bb", __keyword: true}]
   * @param {Function|String} body - child html content, could be string or function
   * @return {String} Return render html
   */
  render(context, attrs, body) {
    const attrStr = this.convertAttrs(attrs);
    const startTag = `<${this.nodeName}${attrStr ? ' ' + attrStr : ''}>`;
    if (this.end) {
      const fragment = (typeof body === 'function' ? body() : body) || '';
      return `${startTag}${fragment}</${this.nodeName}>`;
    } else {
      return startTag;
    }
  }

  // nunjucks compile parse time
  // eslint-disable-line no-unused-vars
  parse(parser, nodes, lexer) {
    // get the tag token
    let token = parser.nextToken();

    let args;
    if (this.useCustomParser) {
      args = parseAttributes(parser, nodes, lexer);
    } else {
      // parse the args and move after the block end. passing true as the second arg is required if there are no parentheses
      args = parser.parseSignature(null, true);
    }
    parser.advanceAfterBlockEnd(token.value);

    let body;
    if (this.end) {
      // parse the body
      body = parser.parseUntilBlocks('end' + token.value);
      parser.advanceAfterBlockEnd();
    }

    // See above for notes about CallExtension
    return new nodes.CallExtension(this, 'run', args, [body]);
  }

  // nunjucks runtime
  run() {
    // nunjucks sends our "body" as the last argument
    const args = Array.prototype.slice.call(arguments);
    const context = args.shift();
    const body = args.pop();

    // provide fn
    this.safe = context.env.filters.safe;
    this.escape = context.env.filters.escape;
    // don't escape safe string
    this.escapeAttr = function(val) {
      if (typeof val === 'string') {
        return this.escape(val);
      } else if (Array.isArray(val)) {
        return '[object Array]';
      } else {
        return val;
      }
    };

    // render
    const html = this.render(context, args, body);
    return this.safe(html);
  }

  /**
   * convert attribute array to html attribute string, some rules:
   *   - all the attr name && value will be escape
   *   - single attrs
   *     - only allow string, `"disabled" someVar => disabled someValue`
   *     - number/array/object/falsely will be ignore, `123, [12,13] {a:'b'} undefined false null => nothing`
   *   - key-value attrs
   *     - string/number will output as string, `attr1=123 attr2="test"`
   *     - object/array will output as String(item), `attr1={} attr2=["a", "b"] => attr1="[object Object] attr2="a,b"`
   *     - undefined/null will ignore, `attr1=undefined attr2=null => empty string`
   * @param {Array} attrs - the attribute array from parser
   * @return {String} html attribute string
   */
  convertAttrs(attrs) {
    assert(Array.isArray(attrs), 'attrs must be array');
    let collect = new Set();
    attrs.forEach(item => {
      if (item) {
        // single only access string && not-space-string
        if (typeof item === 'string' && item.indexOf(' ') === -1) {
          collect.add(this.escapeAttr(item));
        } else if (item['__keywords']) {
          // nunjucks will parse key=value to object, with `__keyword: true`
          Object.keys(item).forEach(key => {
            let subItem = item[key];
            if (subItem && key !== '__keywords') {
              collect.add(`${this.escapeAttr(key)}="${this.escapeAttr(subItem)}"`);
            }
          });
        } else {
          console.warn('unexpected attr type, %j', item);
        }
      }
    });
    return Array.from(collect).join(' ');
  }
}

module.exports = Tag;
