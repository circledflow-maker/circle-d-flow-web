/* Public discovery metadata only. This registry never awards XP or changes accounts. */
(function (root) {
  'use strict';
  const entries = [
    ['sound', 'Sound · Bantaba', '/pages/bantaba.html', 'Music and gatherings turn strangers into a circle.', 'Find a published gathering, then bring your listening ear.', 'explore', 'explorable', '#c499ef', '♫'],
    ['taste', 'Culinary · Kitchens & chefs', '/pages/taste_world_hub.html', 'Meet the people and stories behind local food.', 'Explore a kitchen and check its current offer with the organiser.', 'explore', 'preview', '#e7a26b', '◉'],
    ['vision', 'Vision · Creative studio', '/pages/vision_studio.html', 'See Lisbon through a new lens and shape a creative story.', 'Explore the studio before choosing whether to share your work.', 'member', 'preview', '#b7a0ff', '◇'],
    ['heart', 'Heart · Kiss Your Heart', '/pages/kyh/index.html', 'Give an idea a path into a real creative project.', 'Explore a project type and describe the experience you want to create.', 'explore', 'explorable', '#ef9eb7', '♡'],
    ['academy', 'Academy · Learning', '/pages/akademie.html', 'Learn, reflect and find your own creative direction.', 'Explore the library; member progress is a separate journey.', 'explore', 'preview', '#c8d48a', '✧'],
    ['atlas', 'Atlas · Explore Lisbon', '/pages/lisbon_world.html', 'A city becomes a world through the places and people you encounter.', 'Explore the map first; location sharing is your choice.', 'explore', 'preview', '#7edbc7', '⌖'],
    ['quests', 'Quest Board · Missions', '/pages/quest_board.html', 'Turn curiosity into a small, meaningful action.', 'Read a mission and its requirements before taking part.', 'member', 'preview', '#f1cc74', '⚑'],
    ['legends', 'Legends · Community', '/pages/hall_of_legends.html', 'Meet the community story behind the rankings.', 'Explore the hall; verified community progress belongs to your member account.', 'explore', 'preview', '#dfbf73', '♜'],
    ['bazaar', 'Bantaba Market · Creator stalls', '/pages/bantaba_market.html', 'Discover creators, guilds and the work they bring to the Circle.', 'Explore a guild and confirm availability before a purchase.', 'explore', 'preview', '#d5a572', '▧'],
    ['archive', 'Archive · Shared stories', '/pages/archive.html', 'Discover the values and memories that hold the Kingdom together.', 'Choose a pillar and reflect on what it means in your own life.', 'explore', 'explorable', '#d3d2f4', '▤'],
    ['sanctuary', 'Sanctuary · Secret Garden LX', '/pages/artist_sanctuary.html?place=secret-garden-lx', 'Begin at Secret Garden LX, the first community Sanctuary, and choose your creative direction.', 'Explore the Sanctuary or use the accessible World Hub.', 'explore', 'explorable', '#d4af37', '✦'],
    ['connection', 'Connection · Cooperation', '/pages/community_connections.html', 'Bring people and ideas together around a shared creative session.', 'Explore how a session works; participant actions may require sign-in.', 'organiser', 'preview', '#92bceb', '∞'],
    ['language', 'Language Café LX', '/index.html#language-cafe', 'A conversation opens another way to belong in Lisbon.', 'Find a public language gathering; café accounts remain separate.', 'explore', 'explorable', '#a9dbb5', '◎'],
    ['knowledge', 'Knowledge · Myth library', '/pages/myth_library.html', 'Explore sourced mythology and cultural stories with respect and curiosity.', 'Read a source, compare perspectives and take a reflection into the city.', 'explore', 'explorable', '#b9aadf', '☷']
  ];
  const worlds = Object.freeze(entries.map(function (entry) {
    const [id, name, route, description, firstStep, access, readiness, accent, icon] = entry;
    return Object.freeze({ id, name, route, description, firstStep, access, readiness, accent, icon });
  }));
  root.CDFWorlds = Object.freeze({ worlds, getWorld: function (id) { return worlds.find(function (world) { return world.id === id; }) || null; } });
})(window);

