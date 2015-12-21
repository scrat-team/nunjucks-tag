'use strict';

const expect = require('expect.js');
const Tag = require('../../lib/Tag');
const mm = require('../util');

describe('test/lib/parseAttributes.test.js', function() {
  before(function() {
    const simpleTag = new Tag('test');
    simpleTag.end = false;
    mm.env.addExtension('test', simpleTag);

    const customTag = new Tag('custom');
    mm.env.addExtension('custom', customTag);
  });

  after(mm.restore);

  let testCases = [
    [11, ''],
    ['12', ''],
    ['class="test"', 'class="test"'],
    ['class="test" count=1', 'class="test" count="1"'],
    ['class="test" style="test"', 'class="test" style="test"'],
    ['class=clz', 'class="test"'],
    ['class=foo.bar', 'class="bar"'],
    ['data-attr=clz', 'data-attr="test"'],
    ['"data-attr"=clz', 'data-attr="test"'],
    ['"data-attr-1-a"=clz', 'data-attr-1-a="test"'],
    ['"checked"', 'checked'],
    ['class=["test1", clz]', 'class="[object Array]"'],
    ['class=["test1"], style=clz', 'class="[object Array]" style="test"'],
    ['class=["test1"] style=clz "checked"', 'checked class="[object Array]" style="test"'],
    ['class={}', 'class="[object Object]"'],
    ['class=[clz, "a"]', 'class="[object Array]"'],
    // 转义
    ['class="<script>alert(1)</script>"', 'class="&lt;script&gt;alert(1)&lt;/script&gt;"'],
    ['class="<"', 'class="&lt;"'],
    ['"<"', '&lt;'],
    ['class=">"', 'class="&gt;"'],
    ['class="&"', 'class="&amp;"'],
    ['class="\'"', 'class="&#39;"'],
    ['class=jsonStr', 'class="{&quot;a&quot;:&quot;b&quot;}"'],
    ['class=img', 'class="&lt;img src=&quot;&#39;&quot;&gt;"'],
    ['clz + "_"+foo.bar', 'test_bar']
  ];
  testCases.forEach(item => {
    it('should parse: ' + item[0], function() {
      mm.equal(`{% test ${item[0]} %}`, `<test${item[1] ? ' ' + item[1] : ''}>`);
    });
  });

  it('should output single attrs', function() {
    mm.equal('{% test not-number undefinedVar nullVar 123 0 bool space%}', '<test>');
    mm.equal('{% test attr1 "attr2" %}', '<test some_attr attr2>');
  });

  it('should output key-value attrs', function() {
    mm.equal('{% test attr1=attr1 attr2="attr2" attr3=attr3 %}', '<test attr1="some_attr" attr2="attr2" attr3="3">');
    mm.equal('{% test attr1=bool attr2=undefinedVar attr3=nullVar %}', '<test attr1="true">');
    mm.equal('{% test style=[attr1, "attr2"] %}', '<test style="[object Array]">');
    mm.equal('{% test style=[attr1, "attr2"] %}', '<test style="[object Array]">', {attr1: '"'});
    mm.equal('{% test style=[attr1, "attr2"]|join(" ") %}', '<test style="some_attr attr2">');
    mm.equal('{% test class={attr1: true, attr2: false, attr3: bool } %}', '<test class="[object Object]">');
  });

  it('should escape', function() {
    mm.equal('{% if ("<a"|first|safe == "<") %}a{% endif %}', 'a');
    mm.equal('{% test "<div" %}', '<test &lt;div>');
    mm.equal('{% test "<div"|safe %}', '<test>');
    mm.equal('{% test attr="<div"|safe %}', '<test attr="<div">');
    mm.equal('{% test attr=html href=href json=jsonStr %}', '<test attr="&lt;img src=&quot;http://placehold.it/350x150&quot; onload=&quot;alert(1);&quot;&gt;" href="http://scrat.io" json="{&quot;a&quot;:&quot;b&quot;}">');
    mm.equal('{% test attr="<div"|safe %}', '<test attr="<div">');
  });

  it('throw error', function() {
    expect(function() {
      mm.env.renderString('{% test <script>="as" %}', mm.locals);
    }).to.throwError(/unexpected token/);

    expect(function() {
      mm.env.renderString('{% test data-src-="as" %}', mm.locals);
    }).to.throwError(/unexpected token/);

    expect(function() {
      mm.env.renderString('{% test a-"f"="a" %}', mm.locals);
    }).to.throwError(/invalid key name/);
  });
});
