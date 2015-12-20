'use strict';

const path = require('path');
const expect = require('expect.js');
const nunjucks = require('nunjucks');
const Tag = require('../');

exports.Tag = Tag;

exports.baseDir = path.join(process.cwd(), './test/fixtures/general');

exports.env = nunjucks.configure(exports.baseDir, {autoescape: true});

exports.locals = {
  attr1: 'some_attr',
  attr2: 'a2',
  attr3: 3,
  content: 'this is content',
  undefinedVar: undefined,
  nullVar: null,
  bool: true,
  deep: {
    foo: 'foo'
  },
  space: 'a b',
  clz: 'test',
  foo: {
    bar: 'bar'
  },
  href: 'http://scrat.io',
  html: '<img src="http://placehold.it/350x150" onload="alert(1);">',
  img: '<img src="\'">',
  jsonStr: JSON.stringify({a: 'b'})
};

exports.mountTag = function(Tags) {
  Tags = Array.prototype.slice.call(arguments);
  Tags.forEach(Tag => {
    let tag = new Tag();
    exports.env.addExtension(tag.tagName, tag);
  });
};

exports.mockContext = function(obj) {
  class Mock extends Tag {
    constructor() {
      super('mock');
    }
    render(context, attrs, body) {
      if (typeof obj === 'function') {
        obj(context);
      } else {
        context.resource = Object.assign({}, context.resource, obj);
        return this.safe(body());
      }
    }
  }
  exports.mountTag(Mock);
  return obj;
};

exports.equal = function(tpl, html, data) {
  // 去掉每行前面的空格
  expect(exports.env.renderString(tpl, data || exports.locals).replace(/^\s*/gm, '')).to.equal(html.replace(/^\s*/gm, ''));
};

exports.restore = function() {

};