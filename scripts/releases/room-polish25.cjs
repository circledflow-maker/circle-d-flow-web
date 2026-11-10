/* One-off release overlay: restores Vercel's complete origin19 source and changes only this fixed public allowlist. */
(async () => {
  const fs = require('node:fs/promises');
  const path = require('node:path');
  const crypto = require('node:crypto');
  const root = path.resolve('public');
  const source = '23a5e08c647a5608f067363d9867e972ffe0b851';
  const files = [
  {
    "path": "assets/room_loading/courtyard-door.svg",
    "sha256": "84d8a339151f6403b92af8d092b1cdfcb5dd44e0568c2b32641c577fb7ed5197"
  },
  {
    "path": "css/creator_realms.css",
    "sha256": "d80ef4dd6af16e87b44bda0157e0f8db5e319428a4df0ac7522f1bf113e746d7"
  },
  {
    "path": "css/creator_room_walk.css",
    "sha256": "b90408bbcf7e507d7bbf3aaa9cfdb08365ace6fc2ed06996a61588626dcdcf1b"
  },
  {
    "path": "css/room_transition.css",
    "sha256": "8296dd42aede802beebb301f3e11d7d22c27208b3eadc695d0a3813b804ee960"
  },
  {
    "path": "css/sanctuary_mobile20.css",
    "sha256": "513e48bfe7f6bd96afca562c66c2eac000df3b03be02a60143eafbca39ac9e89"
  },
  {
    "path": "data/creator_story.json",
    "sha256": "d2ef0663a5c278454e7f0d374e835ddd07fcb743ba711329ba7ced1940636b35"
  },
  {
    "path": "js/creator_brand_styles.js",
    "sha256": "d03a549e3fa4d8b68afc4fce1fc1d8289876bd9a971606ca53d8e9b393246839"
  },
  {
    "path": "js/creator_hall_architecture.js",
    "sha256": "51bbe4e5b57a2c5c7c251ad31ee84aef13585793c4f39766c6bdcfbe0e102519"
  },
  {
    "path": "js/creator_realm_room.js",
    "sha256": "444d6f9d2f6ce75eb617edccce84ae111480b15928928ae9f14b94560014c75f"
  },
  {
    "path": "js/creator_realms.js",
    "sha256": "e9065ccc13abb5eb42078a303a557098f0c0b1519baeb4d41062a1b067317177"
  },
  {
    "path": "js/creator_room_layout.js",
    "sha256": "af24998f843ff332bb71cecc3686eeb8c15928462787d7e25c04b416c1b1d66a"
  },
  {
    "path": "js/data/realm_catalog.js",
    "sha256": "05a1ead6019d848f86ff2be0b3d7a0b6cdd01924829782f0e7b0fa1b7826c06e"
  },
  {
    "path": "js/room_interaction.js",
    "sha256": "c28d3de47bf958f0db2a9f47ddbd0a4d57ad5ac7a022f3ac69e9b4bc0884e16c"
  },
  {
    "path": "js/room_transition.js",
    "sha256": "a89cf9a93f52b44c822da641c9160d9a0859da91adad8a1b9bc5e4e8c9d38fe4"
  },
  {
    "path": "js/sanctuary_characters.js",
    "sha256": "029e48e428f4d701ae8fa8298191bb4587bc7244a92f7a9a4ec598aa5e26e4f0"
  },
  {
    "path": "js/sanctuary_collection.js",
    "sha256": "8a7363d161d43469dd325e496933cdfeb59c20dfad6196759a4a5b7e4796207d"
  },
  {
    "path": "js/sanctuary_culture.js",
    "sha256": "dcaa6a823dc2511836c45031b64c0de6a73c4ae8ee7dec8e067de9d59b9ee855"
  },
  {
    "path": "js/sanctuary_layout.js",
    "sha256": "0657302e03a5e9f38c2119dcf8132cab3a8eb46e47448d56924d0d1207c6b56a"
  },
  {
    "path": "js/sanctuary_scene.js",
    "sha256": "0178a1440077a428eabe5919b27e72c3e7754080d2ed1376c23913090c2264a1"
  },
  {
    "path": "js/world_registry.js",
    "sha256": "9bbea857602024ea053d217e9f1c627f42adc820cdf1a02128be7300db2f73af"
  },
  {
    "path": "pages/artist_sanctuary.html",
    "sha256": "0eca5dbb6a7189756a95749b139797f848456850a16c3d3641915a9fa0cc9424"
  },
  {
    "path": "pages/bantaba_market.html",
    "sha256": "92cdf271cbd992557dee0bf514e1b1fad626b55596967c4908fa8776472f1925"
  },
  {
    "path": "pages/community_connections.html",
    "sha256": "f5c03b2b497ca980349d7372651b5b33711598b1cfe431b39f84892b7459d724"
  },
  {
    "path": "pages/creator_stall.html",
    "sha256": "f329e172b912bb7193b0b464cb37cea64b747348b60a32bc08d857f501de1e0c"
  },
  {
    "path": "pages/taste_world_hub.html",
    "sha256": "b3561eda07f27b94e02236a227d94c33b70041b7cddbe4db2396f5bdcc041c3f"
  },
  {
    "path": "css/creator_room_polish.css",
    "sha256": "d96a0f5d79261694d9df368fd97c361b457f6b337dd24601742521374a2935d5"
  },
  {
    "path": "Assets/kitchens/akwabalx/dish-table-combo.webp",
    "sha256": "7a721a67568d506c9d9605221adc706a1372c1e69ddb56002486aaa528cf3307"
  },
  {
    "path": "Assets/kitchens/akwabalx/menu-board.webp",
    "sha256": "6a5370e5d1ff89f4ff218e47fdf09abfe44fab3539a3aa717e2c2e55f6aaba71"
  }
];
  for (const required of ['public/index.html','public/orbit.html','api/registrations.js','lib/cdf-api/kingdom.js']) {
    await fs.access(required);
  }
  const before = {};
  for (const p of ['api/registrations.js','api/payments.js','lib/cdf-api/kingdom.js','vercel.json']) {
    before[p] = crypto.createHash('sha256').update(await fs.readFile(p)).digest('hex');
  }
  const downloads = [];
  for (const item of files) {
    if (!/^(?:pages|js|css|data|assets|Assets)\//.test(item.path) || item.path.split('/').some(p => p === '..' || !p)) throw Error('Invalid public path');
    const destination = path.resolve(root,item.path);
    if (!destination.startsWith(root + path.sep)) throw Error('Outside public root');
    const url = 'https://raw.githubusercontent.com/circledflow-maker/circle-d-flow-web/' + source + '/' + item.path;
    const response = await fetch(url, {signal: AbortSignal.timeout(30000)});
    if (!response.ok) throw Error(item.path + ': HTTP ' + response.status);
    const data = Buffer.from(await response.arrayBuffer());
    if (crypto.createHash('sha256').update(data).digest('hex') !== item.sha256) throw Error('Hash mismatch: ' + item.path);
    downloads.push({destination,data});
  }
  // Download and verify everything before making any changes.
  for (const item of downloads) {
    await fs.mkdir(path.dirname(item.destination),{recursive:true});
    await fs.writeFile(item.destination,item.data);
  }
  for (const [p,hash] of Object.entries(before)) {
    if (crypto.createHash('sha256').update(await fs.readFile(p)).digest('hex') !== hash) throw Error('Baseline server/config changed: '+p);
  }
  const report = {release:'room-polish25',sourceCommit:source,baselineDeployment:'dpl_AmqQ8YRQZiBrGyBDmtsBCxpfivLq',files,unchangedBaseline:before};
  await fs.writeFile(path.join(root,'cdf-release-integrity.json'),JSON.stringify(report,null,2));
  console.log('CDF release overlay verified: '+files.length+' public files; server and configuration unchanged.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
