import React from 'react';

export default function TemplateLibrary() {
  const templates = [
    {
      id: 'classic',
      title: 'Standard Classic',
      author: 'GameCraft Team',
      difficulty: 'EASY',
      downloads: '12.5k',
      likes: '1.2k',
      tag: 'Official',
      tagColor: 'bg-secondary-container',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwXpTmZEKVVuS50IUc0PKzE4Mh0E7qzYHu6FORYhNZzLfiI2qJxKoNzp7KKC7D0odFfwpvQwdNKSP8SPKDQ8aD-HrkRAuIfZn83CMDHKVxrrcKiyWiVsjwDpFnNTM8Bc138iRweIxQA6WrSzZR1mg7SCrXO8Fdvkp6LDJw1GAb7R1pOlSo1kzvbtVrK5yYIrxxLxpX0iA8EfQ3woanqBA5l0VjS9DItrjvottVuk7FW-ZrASPYjHn5IfHvmM9pLRzTXMB8ysVfDybU'
    },
    {
      id: 'cyberpunk',
      title: 'Neo-Kyoto 2099',
      author: 'PixelDragon',
      difficulty: 'PRO',
      downloads: '8.1k',
      likes: '3.4k',
      tag: 'Trending',
      tagColor: 'bg-primary-container',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqcWlQ09y7iIHjlkXMYDTgiEvpl-Ns9v_MS4VD6TPRB2LF9AbPww2QvVpIHPlC08JDqrPoDjqrcZJWj7iH1Efxp4K7DFzHROxUT2sULLdj8BlAw8iWLva5ra5N7Dt7Oqaj5m9AfyHTl-6ZP279Z6Gey44ipV9RHEMqZaGij7dVKJLpDjhfEnqHE3hLWLY6oSJn-6fnVC9hC85OtqZqOpxBPEDNFWnnTiKYaoUdbqykuBw7lPodKIlpnY6bqhKVaWC8YhAFmuxpmmni'
    },
    {
      id: 'fantasy',
      title: 'Eldoria Realm',
      author: 'DungeonMaster_X',
      difficulty: 'MEDIUM',
      downloads: '2.4k',
      likes: '890',
      tag: 'New Release',
      tagColor: 'bg-tertiary-container',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9oU5dxmgV59zgoo-4K3pgUXHafHcv0EE5EKVw3knBj8HhOBWx636dluy1ZINCTrCanyoaGrVcqRYZjKqbJr-aqAw91YOGn654sFg8RV3pu72PeNW57S8HTI95-5msStHRLFEk2z_aOdmmjpNNMhU-pn61otLA3ucDpeH3SPJdvFWXuJa0lIrmlg89FShHXBHUmwaadU4EgHmLJFwGBrUKaGKF6G-L6MXnMUu6wxUIAx3HSwkA_3yRVRmDLLIGVF8YIQ0dH28b4-vi'
    },
    {
      id: 'minimalist',
      title: 'Minimalist Grid',
      author: 'DesignFlow',
      difficulty: 'EASY',
      downloads: '5.6k',
      likes: '2.1k',
      tag: 'Modern',
      tagColor: 'bg-surface-container-highest',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAc-x8hrg84ntRhjdd760SQAKyluFKx86w79M8ruK9Uwaa5r5u5pBqKnlvxwvyntI2EVh_Nfnzi9v2UllFp0JPYpfuXns4eWfqHCbtliKyBa_r0RChsRZ2OBFFZmQxKKt7cbzXsyZdCHdaW0FzbyTKnP6wiM0uNYIG3K6MpDzRFMzzGBkKDRL6w8lz7jLxNEm9m6HP3N3jgdPceNnsVfPfjB6sWh1RkMPAVmXBgGtwUPHMBGEPmkVym_AeXogmKBU6QWq5DwYl1pWqG'
    },
    {
      id: 'scifi',
      title: 'Star Odyssey',
      author: 'AstroGamer',
      difficulty: 'PRO',
      downloads: '18.2k',
      likes: '5.8k',
      tag: 'Sci-Fi',
      tagColor: 'bg-primary-container',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApojs-6lk--_VqcLjD7dApDwMlCtWCUSJTr1s9x4DC6a8eXBJJSs8t6lVWxhUUnMTmtulRVsiA9Q856_EvcUTp6JgVtZEhuxYuzUvaqJuQAvoncZ4ivUXzv0aX7nN-UNZb5g2WYZv0g8fjxykfcu0phAblfdCMcjvd5LETKMNQrXiFm2eV7rvRBI7auhwPT8MidFtX4CnV4K6dUA6NX9SjFvrwQDMAchWC_DwECfZXjWXo1H28h5efgSIAZGj_4TOdTSwH0SjfGjL8'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-headline font-bold text-on-surface tracking-tight mb-2">Template Library</h1>
          <p className="text-on-surface-variant font-medium">Explore curated maps or jumpstart your design with official templates.</p>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-primary-container to-primary text-on-primary-container rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-primary-container/40 transition-all active:scale-95 group">
          <span className="material-symbols-outlined transition-transform group-hover:rotate-90">add</span>
          <span className="uppercase tracking-widest text-sm">Create New Map</span>
        </button>
      </header>

      {/* Filters Bar */}
      <div className="glass-panel p-2 rounded-2xl flex flex-wrap items-center gap-3 mb-10 shadow-2xl">
        <div className="relative flex-grow min-w-[240px]">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input className="w-full bg-surface-container-high border-none rounded-xl py-3 pl-12 pr-4 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/50" placeholder="Search community creations..." type="text" />
        </div>
        <div className="flex items-center gap-2">
          {['Theme: All', 'Difficulty', 'Players'].map((filter) => (
            <div key={filter} className="bg-surface-container-high px-4 py-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-surface-bright transition-colors">
              <span className="material-symbols-outlined text-primary text-sm">filter_list</span>
              <span className="text-sm font-bold text-on-surface">{filter}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((template) => (
          <div key={template.id} className="group bg-surface-container rounded-2xl overflow-hidden shadow-soft hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-primary/20 flex flex-col h-full">
            <div className="relative h-56 overflow-hidden">
              <img 
                src={template.image} 
                alt={template.title} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              <div className={`absolute top-4 left-4 ${template.tagColor} backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                {template.tag}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent opacity-60"></div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-headline text-2xl font-bold text-on-surface group-hover:text-primary transition-colors">{template.title}</h3>
                  <p className="text-on-surface-variant text-sm">By {template.author}</p>
                </div>
                <span className="bg-surface-container-high px-2 py-1 rounded text-[10px] font-bold text-tertiary">{template.difficulty}</span>
              </div>
              <div className="mt-auto flex items-center justify-between pt-6 border-t border-outline-variant/10">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span className="text-xs font-bold">{template.downloads}</span>
                  </div>
                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm text-error" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    <span className="text-xs font-bold">{template.likes}</span>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-surface-container bg-blue-500 flex items-center justify-center text-[8px] font-bold">2</div>
                  <div className="w-6 h-6 rounded-full border-2 border-surface-container bg-red-500 flex items-center justify-center text-[8px] font-bold">4</div>
                  <div className="w-6 h-6 rounded-full border-2 border-surface-container bg-surface-container-highest flex items-center justify-center text-[8px] font-bold">+2</div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Empty State */}
        <div className="border-2 border-dashed border-outline-variant/30 rounded-2xl flex flex-col items-center justify-center p-12 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
          <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-4xl text-primary">add_circle</span>
          </div>
          <h3 className="font-headline text-2xl font-bold mb-2">Build from Scratch</h3>
          <p className="text-on-surface-variant text-center text-sm mb-8">Start with a blank canvas and define your own world rules.</p>
          <button className="px-6 py-2 rounded-lg border border-primary text-primary font-bold text-sm uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors">New Board</button>
        </div>
      </div>
    </div>
  );
}
