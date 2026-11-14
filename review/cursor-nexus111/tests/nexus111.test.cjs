'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../js/nexus111-model.js');
const cover=require('../js/nexus111-cover.js');
const integrate=require('../js/nexus111-integrate.js');

test('cover opens once and a missing adapter is not pretended',()=>{
  let opens=0;
  const missing=cover.bind(null,{},()=>{opens++;});
  assert.equal(missing.source,'missing');
  assert.equal(missing.openOnce(),true);
  assert.equal(missing.openOnce(),false);
  const host={};
  const adapter={mount(target,options){host.options=options;}};
  const bound=cover.bind(adapter,host,()=>{opens++;});
  assert.equal(bound.source,'CDFCover111');
  assert.equal(host.options.once,true);
  assert.equal(host.options.onOpen(),true);
  assert.equal(host.options.onOpen(),false);
  assert.equal(opens,2);
});

test('registers change chapter without opening the cover again',()=>{
  let state=model.reduce(model.initial(),{type:'open'});
  assert.equal(state.opens,1);
  state=model.reduce(state,{type:'chapter',chapter:'chronicle'});
  state=model.reduce(state,{type:'chapter',chapter:'account'});
  assert.equal(state.chapter,'account');
  assert.equal(state.opens,1);
  assert.equal(model.reduce(state,{type:'open'}).opens,1);
});

test('reading returns to the same chapter, focus and scroll',()=>{
  let state=model.reduce(model.initial(),{type:'open'});
  state=model.reduce(state,{type:'chapter',chapter:'collection'});
  state=model.reduce(state,{type:'read',focusId:'action-read',scrollTop:128});
  assert.equal(state.phase,'read');
  state=model.reduce(state,{type:'back'});
  assert.equal(state.phase,'book');
  assert.equal(state.chapter,'collection');
  assert.equal(state.memory.focusId,'action-read');
  assert.equal(state.scroll.collection,128);
});

test('share, journal and account backs do not create a second pass',()=>{
  let state=model.reduce(model.initial(),{type:'open'});
  for(const type of ['share','journal']){
    state=model.reduce(state,{type,focusId:'register-pass',scrollTop:12});
    assert.equal(state.phase,type);
    state=model.reduce(state,{type:'back'});
    assert.equal(state.phase,'book');
    assert.equal(state.chapter,'pass');
  }
  assert.equal(state.opens,1);
});

test('meeting export excludes private fields and invents no progress or events',()=>{
  const demo=model.demoState();
  demo.profile.email='secret@example.test';
  demo.chronicle.memories=[{note:'privates Tagebuch'}];
  assert.equal(model.progress(demo.profile.exp),null);
  assert.equal(demo.events.length,0);
  assert.equal(model.favorites(demo).length,3);
  const extra={...demo,symbols:[...demo.symbols,{id:'cdf-demo-fourth',earnedAt:'2026-11-14',favorite:true}]};
  assert.equal(model.favorites(extra).length,3);
  const out=model.project(demo,['email','notes','memory','settings','balance','name']);
  assert.deepEqual(out.fields,[{key:'name',value:'Demo-Navigator'}]);
  assert.equal(JSON.stringify(out).includes('secret@'),false);
  assert.equal(JSON.stringify(out).includes('Tagebuch'),false);
  assert.equal(model.project(model.emptyState(),model.SHARE_KEYS).fields.length,0);
});

test('scroll and fields do not change chapter by gesture',()=>{
  assert.equal(model.chapterAfterGesture(1,0,80,'scroll'),1);
  assert.equal(model.chapterAfterGesture(1,-80,0,'field'),1);
  assert.equal(model.chapterAfterGesture(1,0,80,'page'),2);
  assert.equal(model.chapterAfterGesture(0,0,-80,'page'),0);
});

test('journal and account hooks stay unavailable without a host',()=>{
  assert.equal(integrate.journal(null),'unavailable');
  assert.equal(integrate.accountStatus(),'unavailable');
});
