'use strict';

const nunjucks = require('nunjucks');
const expect = require('expect.js');
const Tag = require('../../lib/Tag');
const mm = require('../util');

describe('test/lib/Tag.test.js', function() {
  before(function() {
    const simpleTag = new Tag('test');
    simpleTag.end = false;
    mm.env.addExtension('test', simpleTag);

    const customTag = new Tag('custom');
    mm.env.addExtension('custom', customTag);
  });

  after(mm.restore);

  it('should render custom tag', function() {
    let tpl = '{% custom data-attr1=attr1 "readonly" %}{{ content }}{% endcustom %}';
    mm.equal(tpl, '<custom readonly data-attr1="some_attr">this is content</custom>');

    // without attrs
    tpl = '{% custom %}{{ content }}{% endcustom %}';
    mm.equal(tpl, '<custom>this is content</custom>');

    // without body
    tpl = '{% custom "data-attr1"=attr1, attr2="a2", "attr1"%}{% endcustom %}';
    mm.equal(tpl, '<custom attr1 data-attr1="some_attr" attr2="a2"></custom>');
  });

  it('should support not-end tag', function() {
    let tpl = '{% test "data-attr1"=attr1, attr2="a2" %}{{ content }}';
    mm.equal(tpl, '<test data-attr1="some_attr" attr2="a2">this is content');

    // without attrs
    tpl = '{% test %}{{ content }}';
    mm.equal(tpl, '<test>this is content');
  });

  it('should extend base tag && custom nodeName', function() {
    class SubTag extends Tag {
      constructor() {
        super('sub');
        this.nodeName = 'div';
      }
    }
    mm.mountTag(SubTag);

    const tpl = '{% sub "data-attr1"=attr1, attr2="a2"%}{{ content }}{% endsub %}';
    mm.equal(tpl, '<div data-attr1="some_attr" attr2="a2">this is content</div>');
  });

  it('should extend base tag && override render', function() {
    class SubTag extends Tag {
      constructor() {
        super('sub');
        this.nodeName = 'div';
      }

      render(context, attrs, body) {
        return super.render(context, attrs, body() + '\n<!-- PLACEHOLDER -->');
      }
    }
    mm.mountTag(SubTag);

    const tpl = '{% sub "data-attr1"=attr1, attr2="a2"%}{{ content }}{% endsub %}';
    mm.equal(tpl, '<div data-attr1="some_attr" attr2="a2">this is content\n<!-- PLACEHOLDER --></div>');
  });

  it('should use ext context', function() {
    class Model {
      constructor(str) {
        this.data = str;
      }
      getData() {
        return this.data;
      }
    }

    class ParentTag extends Tag {
      constructor() {
        super('parent');
      }

      render(context, attrs, body, noSafe) {  // eslint-disable-line no-unused-vars
        context.model = new Model('abc');
        const html = super.render.apply(this, arguments);
        delete context.model;
        return html;
      }
    }

    class ChildTag extends Tag {
      constructor() {
        super('child');
      }

      render(context, attrs, fragment) {
        fragment = context.model.getData();
        return super.render(context, attrs, fragment);
      }
    }

    class NextTag extends Tag {
      constructor() {
        super('next');
      }

      render(context, attrs, fragment) {
        fragment = context.model ? context.model.getData() : 'undefined';
        return super.render(context, attrs, fragment);
      }
    }

    mm.mountTag(ParentTag, ChildTag, NextTag);

    const tpl = '{% parent %}{% child %}{% endchild %}{% endparent %}{% next %}{% endnext %}';
    mm.equal(tpl, '<parent><child>abc</child></parent><next>undefined</next>');
  });

  it('should include', function() {
    const env = nunjucks.configure('./test/fixtures/include');
    function TestTag() {
      this.tags = ['test'];
      this.parse = function(parser, nodes) {
        // get the tag token
        let token = parser.nextToken();

        // parse the args and move after the block end. passing true
        // as the second arg is required if there are no parentheses
        let args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(token.value);
        // See above for notes about CallExtension
        return new nodes.CallExtension(this, 'run', args);
      };
      this.run = function(context, args) {
        return new nunjucks.runtime.SafeString(context.env.render(args, context.ctx));
      };
    }

    env.addExtension('test', new TestTag());

    const html = env.render('parent.tpl', {title: 'this is title', deep: {foo: 'foo'}});
    expect(html).to.equal('this is title\nfoo');
  });

  it('should nunjucks build-in parser', function() {
    const buildinTag = new Tag('buildin');
    buildinTag.end = false;
    buildinTag.useCustomParser = false;
    mm.env.addExtension('buildin', buildinTag);

    expect(function() {
      mm.env.renderString('{% buildin attr1=attr1 attr2="attr2 %}', mm.locals);
    }).to.throwError(/parseSignature: expected comma after expression/);
  });
});
