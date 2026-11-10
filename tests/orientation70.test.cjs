const test=require('node:test'),assert=require('node:assert/strict');
const {clean,recommend}=require('../js/sanctuary_orientation70.js'),{zones}=require('../js/sanctuary_layout.js');
test('answers are bounded to known interests and voluntary intent, never permissions',()=>{
 assert.deepEqual(clean({interests:['music','music','admin','video','food','sport'],mode:'admin',betaInterest:'true',role:'admin'}),{interests:['music','video','food'],mode:'discover',betaInterest:false});
 assert.deepEqual(clean(null),{interests:[],mode:'discover',betaInterest:false});
});
test('recommendations use real courtyard destinations and explain matching interests',()=>{
 for(const [interest,expected]of [['music','stage'],['video','cinema'],['visual','atelier'],['food','kitchen'],['wisdom','guild'],['dance','stage'],['merchant','guild']]){
  const result=recommend({interests:[interest]},zones)[0];assert.equal(result.id,expected);assert.ok(result.reasons.includes(interest));assert.equal(result.zone.destination,zones.find(z=>z.id===expected).destination);
 }
});
test('empty answers do not invent a personal match and unavailable zones are excluded',()=>{
 assert.deepEqual(recommend({interests:[]},zones),[]);assert.deepEqual(recommend({interests:['music']},zones.filter(z=>z.id!=='stage')),[]);
 const result=recommend({interests:['music','video','food'],mode:'collaborate'},zones);assert.ok(result.length<=3);assert.equal(new Set(result.map(z=>z.id)).size,result.length);
});
test('Beta Initiator wish neither promotes matches nor grants a role',()=>{
 const a=recommend({interests:['music'],mode:'collaborate'},zones),b=recommend({interests:['music'],mode:'collaborate',betaInterest:true},zones);assert.deepEqual(a,b);assert.ok(b.some(z=>z.id==='guild'&&z.reasons.includes('collaborate')));assert.equal(clean({betaInterest:true}).betaInterest,true);
});
