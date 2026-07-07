/**
 * Coop Bar — equipment shop (gear pack list)
 */
window.COOP_EQUIPMENT = [
  { id: 'd850', name: 'Nikon D850', category: 'camera', organic: true, social: true, icon: 'photo_camera' },
  { id: 'zoom_h6', name: 'Zoom H6 / Field Recorder', category: 'audio', organic: true, social: true, icon: 'mic' },
  { id: 'rode_mic', name: 'Shotgun / Lav Mic Kit', category: 'audio', organic: true, social: true, icon: 'settings_voice' },
  { id: 'led_panel', name: 'LED Panel Lights', category: 'light', organic: true, social: true, icon: 'light_mode' },
  { id: 'tripod', name: 'Tripod + Fluid Head', category: 'support', organic: true, social: true, icon: 'tripod' },
  { id: 'gimbal', name: 'Gimbal Stabilizer', category: 'support', organic: false, social: true, icon: 'video_stable' },
  { id: 'projector', name: 'Projector + Screen', category: 'visual', organic: true, social: false, icon: 'cast' },
  { id: 'pa_system', name: 'PA / Monitor Speakers', category: 'audio', organic: true, social: true, icon: 'speaker' },
  { id: 'dj_controller', name: 'DJ Controller', category: 'audio', organic: true, social: false, icon: 'album' },
  { id: 'stream_pc', name: 'Stream Laptop + OBS', category: 'stream', organic: false, social: true, icon: 'live_tv' },
  { id: 'power_ext', name: 'Power Extensions (×2)', category: 'logistics', organic: true, social: true, icon: 'electrical_services' },
  { id: 'backdrop', name: 'Backdrop / Azulejo Cloth', category: 'visual', organic: true, social: true, icon: 'texture' },
];

window.COOP_LOCATIONS = [
  { id: 'secret_garden', name: 'Secret Garden LX', zone: 'community', adinkra: 'fihankra' },
  { id: 'akwaba_kitchen', name: 'AkwabaLX Kitchen Bar', zone: 'kitchen', adinkra: 'akoma' },
  { id: 'praca_comercio', name: 'Praça do Comércio', zone: 'historic', adinkra: 'asase_ye_duru' },
  { id: 'ribeira_naus', name: 'Ribeira das Naus', zone: 'flow', adinkra: 'asase_ye_duru' },
  { id: 'lx_factory', name: 'LX Factory', zone: 'creative', adinkra: 'ananse_ntentan' },
  { id: 'mir_graca', name: 'Miradouro da Graça', zone: 'miradouro', adinkra: 'adwo' },
  { id: 'climalabs', name: 'ClimaLabs (Studio)', zone: 'studio', adinkra: 'nkyemu' },
  { id: 'custom', name: 'Custom Location…', zone: 'custom', adinkra: null },
];

window.getEquipmentForProject = function (projectType, scale) {
  const social = projectType === 'social_media';
  const big = scale === 'bigger_event';
  return (window.COOP_EQUIPMENT || []).filter((item) => {
    if (social && !item.social) return false;
    if (!social && !item.organic) return false;
    if (big && item.category === 'logistics') return true;
    return true;
  });
};
