/* One-off release overlay: restores Vercel's complete origin19 source and changes only this fixed public allowlist. */
(async () => {
  const fs = require('node:fs/promises');
  const path = require('node:path');
  const crypto = require('node:crypto');
  const root = path.resolve('public');
  const source = '4d7c0f2ac29fbc03043e45dbe6dd6f88f76e6db8';
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
    "sha256": "a856e45a5261add9dde3b28e0ab96d0160c36005804f0950ebea5dfbac6c1b91"
  },
  {
    "path": "js/creator_hall_architecture.js",
    "sha256": "da999e0d70be4d8b3ac8405baa95fcd5bb47b64bfd6fdd43b01b30c6c6955a41"
  },
  {
    "path": "js/creator_realm_room.js",
    "sha256": "6e9aea134fd89426d664268d33fd372ca9819201e35b1a6c88eee3b9da8eeb66"
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
    "sha256": "f81bfb79e6c6a9e954aa78aeb2223e05a18f56de24ea2c69e37a9c495e976534"
  },
  {
    "path": "js/room_transition.js",
    "sha256": "a1af245b7fbd7a88597de02c876b33d2a49727aa9ea60cf923f58e03da539807"
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
    "sha256": "ca1a8c20cdb3d2ffac19e32fe2f32a8f14facd681d7d1024057e6bc72d8ff6a1"
  },
  {
    "path": "pages/bantaba_market.html",
    "sha256": "d69c6ad7fda93b6fc5f00c5fc117cceb087ce11c83b3e36059c34a844742410c"
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
    "sha256": "60a2a5fedb5066487c77564aba20bf897274eec6a4c9c03b4488968eb5a2dd5a"
  },
  {
    "path": "css/creator_room_polish.css",
    "sha256": "7b927b04d25f3baf90bdcfc6343a6fe4397c8b1033da91c0d2e5079d04b7d626"
  },
  {
    "path": "Assets/kitchens/akwabalx/dish-table-combo.webp",
    "sha256": "7a721a67568d506c9d9605221adc706a1372c1e69ddb56002486aaa528cf3307"
  },
  {
    "path": "Assets/kitchens/akwabalx/menu-board.webp",
    "sha256": "6a5370e5d1ff89f4ff218e47fdf09abfe44fab3539a3aa717e2c2e55f6aaba71"
  },
  {
    "path": "js/creator_room_atmosphere.js",
    "sha256": "fe2f339aa406f0b07404f79a158211ac177cd1d4da915f007c56227635129a47"
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
  const report = {release:'room-atmosphere27',sourceCommit:source,baselineDeployment:'dpl_AmqQ8YRQZiBrGyBDmtsBCxpfivLq',files,unchangedBaseline:before};
  await fs.writeFile(path.join(root,'cdf-release-integrity.json'),JSON.stringify(report,null,2));
  console.log('CDF release overlay verified: '+files.length+' public files; server and configuration unchanged.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
