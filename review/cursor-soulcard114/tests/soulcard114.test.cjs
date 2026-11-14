'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const model=require('../js/soulcard114-model.js');

const secret={
  profile:{name:'Demo-Navigator',email:'secret@example.test',balance:74,exp:860},
  location:{latitude:38.7223,longitude:-9.1393,address:'geheime Adresse'},
  diary:{privateNote:'Privates Tagebuch',community:'noch nicht öffentlich'},
  card:{
    avatar:'DN',role:'Gast',biography:'Eine kurze Vorstellung.',instrument:'Gitarre',
    skills:['Lied','Rhythmus','Hören','Vierter Stil'],phrase:'Ein Satz.',
    collaboration:'Mitspielen, ohne Zusage.',
    contacts:[{kind:'instagram',value:'demo.navigator'},{kind:'email',value:'secret@example.test'},{kind:'note',value:'38.7223, -9.1393'}]
  },
  symbols:[{id:'lantern',label:'Laterne',earned:true},{id:'locked',label:'Gesperrt',earned:false},{id:'hidden',label:'Heimlich',earned:true,private:true}],
  visits:[{title:'Bantaba',latitude:38.7,longitude:-9.1},{title:'38.7223, -9.1393'},{title:'Secret Garden',private:true},{title:'Hof'}]
};

test('nothing is on the card until fields are chosen',()=>{
  const card=model.present(secret,[]);
  assert.deepEqual(card.front,{});
  assert.deepEqual(card.back,{});
});

test('faces keep only selected presentation data and drop secrets',()=>{
  const card=model.present(secret,[...model.FRONT,...model.BACK,'email','diary','balance','location']);
  assert.deepEqual(card.front.skills,['Lied','Rhythmus','Hören']);
  assert.equal(card.front.biography,'Eine kurze Vorstellung.');
  assert.deepEqual(card.back.symbols.map(item=>item.id),['lantern']);
  assert.deepEqual(card.back.visits,['Bantaba','Hof']);
  assert.deepEqual(card.back.contacts,[{kind:'instagram',value:'demo.navigator'}]);
  const raw=JSON.stringify(card);
  for(const hidden of ['secret@example.test','Privates Tagebuch','74','38.7223','geheime Adresse','Heimlich','Gesperrt'])assert.equal(raw.includes(hidden),false,hidden);
});

test('meeting contract stays narrower than the card draft',()=>{
  const out=model.meeting(secret,['name','email','symbols','instagram','balance']);
  assert.equal(out.kind,'cdf-meeting-pass-v1');
  assert.deepEqual(out.fields.map(field=>field.key),['name','symbols']);
  assert.equal(JSON.stringify(out).includes('secret@'),false);
  assert.equal(JSON.stringify(out).includes('860'),false);
});

test('interview, jam and diary do not publish or book',()=>{
  const patch=model.interviewPatch({role:'Gast',instrument:'Gitarre',skills:['Lied','Rhythmus','Hören','Mehr'],phrase:'Ein Satz.',collaboration:'Interesse'});
  assert.equal(patch.skills.length,3);
  const jam=model.jamDraft('Heute mitspielen');
  assert.equal(jam.booked,false);
  assert.equal(jam.status,'draft');
  assert.equal(model.privateNote('nur für mich').saved,false);
  const community=model.communityDraft('für später');
  assert.equal(community.publish,false);
  assert.equal(community.saved,false);
});

test('one opening survives chapter changes and the card returns focus',()=>{
  let state=model.reduce(model.initial(),{type:'open'});
  state=model.reduce(state,{type:'chapter',chapter:'calendar'});
  state=model.reduce(state,{type:'open'});
  assert.equal(state.opens,1);
  assert.equal(state.chapter,'calendar');
  state=model.reduce(state,{type:'meeting',focusId:'action-meeting',scrollTop:40});
  state=model.reduce(state,{type:'flip'});
  assert.equal(state.face,'back');
  state=model.reduce(state,{type:'back'});
  assert.equal(state.phase,'book');
  assert.equal(state.chapter,'calendar');
  assert.equal(state.face,'front');
  assert.equal(state.memory.focusId,'action-meeting');
  assert.equal(state.memory.scrollTop,40);
});

test('scrolling and fields do not change the chapter',()=>{
  assert.equal(model.chapterAfterGesture(1,0,90,'scroll'),1);
  assert.equal(model.chapterAfterGesture(1,-90,0,'field'),1);
  assert.equal(model.chapterAfterGesture(1,0,90,'card'),1);
  assert.equal(model.chapterAfterGesture(1,0,90,'page'),2);
});
