/* Original optional CDF story. No account state, roles or rewards are derived here. */
(function(root){'use strict';
 const ids=['city_light','flowee_lantern','many_worlds','first_step','return_path','threshold'];
 const environments=['horizon','welcome','story','roots','tides','horizon'];
 const text={
 de:{
  title:['Die Stadt hinter dem Licht','Flowees Laterne','Die vielen Welten','Dein erster eigener Schritt','Ein Weg zum Zurückkehren','Die Schwelle'],
  body:['Eine Stadt besteht aus Straßen. Und aus den Wegen, die Menschen füreinander öffnen. In einem Wassertropfen über den Dächern spiegelt sich ein fremder Sternenhimmel. Eine Lichtspur führt weiter.','Zwischen Wasser und Sternen schwebt ein kleiner Funke. Flowee hält eine Laterne daneben. „Da bist du. Ich bin Flowee. Wenn du möchtest, zeige ich dir den Eingang.“','Ein Ort zum Zuhören, ein kreativer Arbeitstisch, eine offene Lernseite und ein bepflanzter Hof. Was möchtest du heute zuerst ausprobieren?','Die Laterne wartet auf einer niedrigen Mauer. Berühre sie oder nutze den Button. Ihr Licht macht eine Linie im Stein sichtbar — einen Weg zum Sanctuary.','Du kannst das Sanctuary als Gast entdecken. Wenn du später mit deinem CDF-Konto zurückkehren möchtest, lege deinen Zugang an. Mit einer vorhandenen Wako-Kungo-Karte nutzt du dasselbe Konto.','Ein niedriger Bogen aus Stein und Pflanzen. Sterne werden zu Lichtflecken zwischen Blättern. Nicht jeder Weg muss heute beginnen. Einer darf reichen.'],
  guide:['Folge der Lichtspur, wenn du möchtest.','Hier beginnen Wege oft, bevor wir einen Namen für sie haben.','Eine erste Richtung genügt. Du kannst später anders abbiegen.','Ein kleiner Schritt genügt, um eine Richtung sichtbar zu machen.','Erkunden ist ohne Konto möglich. Du entscheidest, ob du einen Zugang anlegst.','Wir öffnen jetzt deinen nächsten Ort.'],
  next:['Der Lichtspur folgen','Mit Flowee weiter','Meine Richtung mitnehmen','Zur Laterne','Zugang anlegen','Im Sanctuary erwachen'],
  note:['Originale CDF-Fantasiewelt. Ton bleibt aus.','Du kannst die Einführung überspringen.','Nur eine veränderbare Sitzungswahl; keine Rolle, Punkte oder Berechtigung.','Lokales Kennenlernen der Bedienung; keine Quest oder bestätigte Teilnahme.','Kostenloser Gastzugang. Eine Kontoanlage braucht ihre echte Bestätigung.','Nur tatsächliches Laden erhält eine Übergangsanimation.'],
  choices:['Orte entdecken','Kunst und Ideen gestalten','Lernen und ausprobieren','Gemeinschaft unterstützen'],
  chapter:'DER VERHÜLLTE FUNKE',back:'Zurück',skip:'Einführung überspringen',open:'Noch offenlassen',guest:'Als Gast weiter',login:'Mit vorhandenem Konto anmelden',picked:'Deine erste Richtung ist gewählt. Alle anderen Wege bleiben offen.',lantern:'Laterne berühren',requested:'Zum gewählten Ziel',explore:'Sanctuary erkunden'
 },
 en:{
  title:['The city behind the light','Flowee’s lantern','Many worlds','Your first step','A way to return','The threshold'],
  body:['A city is made of streets, and of the paths people open for one another. In a drop of water above the rooftops, an unfamiliar sky is reflected. A trail of light leads on.','A small spark floats between water and stars. Flowee brings a lantern alongside it. “There you are. I’m Flowee. If you like, I’ll show you the entrance.”','A place to listen, a creative workbench, an open page and a shared garden. What would you like to try first today?','The lantern rests on a low wall. Touch it or use the button. Its light reveals a line in the stone — a path to Sanctuary.','You can explore Sanctuary as a guest. If you want to return with a CDF account, create your access here. If you already have a Wako Kungo card, use that same account.','A low arch of stone and plants. Stars become patches of light among leaves. Not every path needs to begin today. One is enough.'],
  guide:['Follow the light if you wish.','Some paths begin before we have names for them.','A first direction is enough. You can change course later.','One small step can make a direction visible.','You can explore without an account. Creating access is your choice.','We’re opening your next place.'],
  next:['Follow the light','Continue with Flowee','Take my first direction','Reach the lantern','Create my access','Awaken in Sanctuary'],
  note:['Original CDF fiction. Sound stays off.','You can skip the introduction.','A changeable session choice; no role, points or permissions.','Local practice, not a quest or confirmed attendance.','Free guest access. Creating an account needs its real confirmation.','Transitions follow actual loading only.'],
  choices:['Discover places','Create art and ideas','Learn and try things','Support community'],
  chapter:'THE CLOAKED SPARK',back:'Back',skip:'Skip introduction',open:'Leave it open',guest:'Continue as a guest',login:'Use my existing account',picked:'A first direction is chosen. Every other path stays open.',lantern:'Touch the lantern',requested:'Continue to my destination',explore:'Explore Sanctuary'
 },
 pt:{
  title:['A cidade por trás da luz','A lanterna da Flowee','Muitos mundos','O teu primeiro passo','Um caminho de regresso','O limiar'],
  body:['Uma cidade é feita de ruas e dos caminhos que as pessoas abrem umas às outras. Numa gota de água sobre os telhados reflete-se um céu desconhecido. Um rasto de luz convida a continuar.','Uma pequena faísca flutua entre água e estrelas. A Flowee aproxima uma lanterna. “Aqui estás. Sou a Flowee. Se quiseres, mostro-te a entrada.”','Um lugar para ouvir, uma mesa para criar, uma página aberta e um jardim partilhado. O que gostarias de experimentar primeiro hoje?','A lanterna repousa num muro baixo. Toca-lhe ou usa o botão. A luz revela uma linha na pedra — um caminho para o Sanctuary.','Podes explorar o Sanctuary como visitante. Se quiseres regressar com uma conta CDF, cria o teu acesso aqui. Se já tens um cartão Wako Kungo, usa a mesma conta.','Um arco baixo de pedra e plantas. As estrelas tornam-se manchas de luz entre folhas. Nem todos os caminhos precisam de começar hoje. Um basta.'],
  guide:['Segue a luz, se quiseres.','Alguns caminhos começam antes de terem um nome.','Uma primeira direção basta. Podes mudar depois.','Um pequeno passo pode tornar uma direção visível.','Podes explorar sem conta. Criar acesso é uma escolha tua.','Vamos abrir o teu próximo lugar.'],
  next:['Seguir a luz','Continuar com a Flowee','Levar a primeira direção','Chegar à lanterna','Criar o meu acesso','Despertar no Sanctuary'],
  note:['Ficção original CDF. O som fica desligado.','Podes saltar a introdução.','Escolha de sessão alterável; sem função, pontos ou permissões.','Prática local, não uma missão ou presença confirmada.','Acesso gratuito como visitante. Criar conta requer confirmação real.','As transições acompanham apenas o carregamento real.'],
  choices:['Descobrir lugares','Criar arte e ideias','Aprender e experimentar','Apoiar a comunidade'],
  chapter:'A FAÍSCA ENCOBERTA',back:'Voltar',skip:'Saltar introdução',open:'Deixar em aberto',guest:'Continuar como visitante',login:'Usar a minha conta',picked:'Escolheste uma primeira direção. Os outros caminhos continuam abertos.',lantern:'Tocar na lanterna',requested:'Continuar para o meu destino',explore:'Explorar o Sanctuary'
 }};
 function copy(lang){return text[Object.hasOwn(text,lang)?lang:'en'];}
 function scene(id,lang){const index=ids.indexOf(id);if(index<0)return null;const t=copy(lang);return{id,index,environment:environments[index],title:t.title[index],body:t.body[index],guide:t.guide[index],next:t.next[index],note:t.note[index]};}
 function destination(raw='/sanctuary'){
  if(typeof raw!=='string'||!raw.startsWith('/')||raw.startsWith('//')||/[\\\x00-\x20]/.test(raw))return null;
  try{const url=new URL(raw,'https://cdf.invalid');if(url.origin!=='https://cdf.invalid'||/%2f|%5c/i.test(url.pathname))return null;
   if(['/sanctuary','/pages/artist_sanctuary','/pages/artist_sanctuary.html'].includes(url.pathname))url.searchParams.set('intro','first-light');
   return url.pathname+url.search+url.hash;
  }catch{return null;}
 }
 const api=Object.freeze({ids:Object.freeze(ids),copy,scene,destination});if(typeof module==='object'&&module.exports)module.exports=api;else root.CDFIntroStory=api;
})(typeof window==='object'?window:globalThis);
