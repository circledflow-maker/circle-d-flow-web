\<\!DOCTYPE html\>  
\<html lang\="en" class\="scroll-smooth"\>  
\<head\>  
   \<meta charset\="UTF-8"\>  
   \<meta name\="viewport" content\="width=device-width, initial-scale=1.0"\>  
   \<title\>Kiss Your Heart | Flow Photography\</title\>  
   \<meta name\="description" content\="Capturing the true essence of people, places, and communities. Flow-driven photography in Lisbon."\>  
    
   \<\!-- Google Fonts \--\>  
   \<link rel\="preconnect" href\="https://fonts.googleapis.com"\>  
   \<link rel\="preconnect" href\="https://fonts.gstatic.com" crossorigin\>  
   \<link href\="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400\&family=Inter:wght@300;400;500\&display=swap" rel\="stylesheet"\>  
    
   \<\!-- Tailwind CSS \--\>  
   \<script src\="https://cdn.tailwindcss.com"\>\</script\>  
   \<script\>  
       tailwind.config \= {  
           darkMode: 'class',  
           theme: {  
               extend: {  
                   colors: {  
                       midnight: '\#0D0D0F',  
                       violet: '\#5A2A84',  
                       electric: '\#9A4DFF',  
                       amber: '\#FFAE42',  
                       mist: '\#A8A8B3',  
                   },  
                   fontFamily: {  
                       serif: \['"Cormorant Garamond"', 'serif'\],  
                       sans: \['"Inter"', 'sans-serif'\],  
                   },  
                   animation: {  
                       'float': 'float 6s ease-in-out infinite',  
                       'fade-in': 'fadeIn 1s ease-out forwards',  
                   },  
                   keyframes: {  
                       float: {  
                           '0%, 100%': { transform: 'translateY(0)' },  
                           '50%': { transform: 'translateY(-20px)' },  
                       },  
                       fadeIn: {  
                           '0%': { opacity: '0', transform: 'translateY(20px)' },  
                           '100%': { opacity: '1', transform: 'translateY(0)' },  
                       }  
                   }  
               }  
           }  
       }  
   \</script\>  
    
   \<\!-- Custom Styles \--\>  
   \<link rel\="stylesheet" href\="styles.css"\>  
\</head\>  
\<body class\="bg-midnight text-white font-sans antialiased overflow-x-hidden selection:bg-electric selection:text-white"\>  
   \<\!-- Custom Cursor \--\>  
   \<div id\="cursor" class\="fixed w-4 h-4 bg-amber rounded-full pointer-events-none z-50 mix-blend-difference transition-transform duration-100 hidden md:block"\>\</div\>  
   \<div id\="cursor-trail" class\="fixed w-8 h-8 border border-electric rounded-full pointer-events-none z-40 opacity-50 transition-all duration-300 hidden md:block"\>\</div\>  
   \<\!-- Navigation \--\>  
   \<nav id\="navbar" class\="fixed w-full z-40 transition-all duration-300 py-6 px-8 flex justify-between items-center mix-blend-difference"\>  
       \<a href\="\#hero" class\="text-2xl font-serif font-bold tracking-wider hover:text-amber transition-colors"\>KYH\</a\>  
        
       \<div class\="hidden md:flex space-x-8 text-sm uppercase tracking-widest"\>  
           \<a href\="\#about" class\="hover:text-electric transition-colors"\>Philosophy\</a\>  
           \<a href\="\#portfolio" class\="hover:text-electric transition-colors"\>Portfolio\</a\>  
           \<a href\="\#services" class\="hover:text-electric transition-colors"\>Services\</a\>  
           \<a href\="\#community" class\="hover:text-electric transition-colors"\>Community\</a\>  
           \<a href\="\#contact" class\="hover:text-electric transition-colors"\>Contact\</a\>  
       \</div\>  
       \<button id\="menu-btn" class\="md:hidden text-white focus:outline-none"\>  
           \<svg class\="w-8 h-8" fill\="none" stroke\="currentColor" viewBox\="0 0 24 24"\>\<path stroke-linecap\="round" stroke-linejoin\="round" stroke-width\="2" d\="M4 6h16M4 12h16M4 18h16"\>\</path\>\</svg\>  
       \</button\>  
   \</nav\>  
   \<\!-- Mobile Menu \--\>  
   \<div id\="mobile-menu" class\="fixed inset-0 bg-midnight z-30 flex flex-col items-center justify-center space-y-8 text-2xl font-serif transform translate-x-full transition-transform duration-300 md:hidden"\>  
       \<a href\="\#about" class\="mobile-link hover:text-amber"\>Philosophy\</a\>  
       \<a href\="\#portfolio" class\="mobile-link hover:text-amber"\>Portfolio\</a\>  
       \<a href\="\#services" class\="mobile-link hover:text-amber"\>Services\</a\>  
       \<a href\="\#community" class\="mobile-link hover:text-amber"\>Community\</a\>  
       \<a href\="\#contact" class\="mobile-link hover:text-amber"\>Contact\</a\>  
   \</div\>  
   \<\!-- Main Content \--\>  
   \<main\>  
       \<\!-- Hero Section \--\>  
       \<section id\="hero" class\="relative h-screen flex items-center justify-center overflow-hidden"\>  
           \<div class\="absolute inset-0 z-0"\>  
               \<video autoplay loop muted playsinline class\="w-full h-full object-cover opacity-60"\>  
                   \<source src\="assets/video/hero.mp4" type\="video/mp4"\>  
               \</video\>  
               \<div class\="absolute inset-0 bg-gradient-to-b from-midnight/30 via-transparent to-midnight"\>\</div\>  
           \</div\>  
           \<div class\="relative z-10 text-center px-4"\>  
               \<img src\="assets/images/logo.png" alt\="Kiss Your Heart Logo" class\="w-32 md:w-48 mx-auto mb-8 animate-float"\>  
               \<h1 class\="text-5xl md:text-7xl lg:text-9xl font-serif font-bold mb-4 tracking-tighter"\>  
                   Feel your \<span class\="text-electric italic"\>flow\</span\>  
               \</h1\>  
               \<p class\="text-lg md:text-xl text-mist max-w-2xl mx-auto mb-12 font-light"\>  
                   Capturing the moment you become yourself.  
               \</p\>  
               \<a href\="\#contact" class\="inline-block px-8 py-3 border border-white hover:bg-white hover:text-midnight transition-all duration-300 uppercase tracking-widest text-sm"\>  
                   Let's Create  
               \</a\>  
           \</div\>  
       \</section\>  
       \<\!-- Philosophy / About Section \--\>  
       \<section id\="about" class\="py-24 px-8 bg-midnight relative overflow-hidden"\>  
           \<div class\="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center"\>  
               \<div class\="space-y-8"\>  
                   \<h2 class\="text-4xl md:text-6xl font-serif font-bold text-white"\>  
                       The Art of \<span class\="text-amber italic"\>Flow\</span\>  
                   \</h2\>  
                   \<div class\="space-y-6 text-mist font-light leading-relaxed"\>  
                       \<p\>  
                           My foundation is built on service, community, experience, and emotional understanding—skills that now flow into every creative project I touch.  
                       \</p\>  
                       \<p\>  
                           A transformative year in Japan awakened my fascination for intrinsic values, community energy, and flow states. Through \<strong\>Taoism & Wu Wei\</strong\>, I discovered the ancient wisdom of effortless action, where mastery feels like play.  
                       \</p\>  
                       \<p\>  
                           \<strong\>My Mission:\</strong\> Helping people enter their authentic creative flow, from photography to community building.  
                       \</p\>  
                   \</div\>  
                   \<div class\="pt-4"\>  
                       \<h3 class\="text-xl font-serif text-white mb-4"\>Experience & Expertise\</h3\>  
                       \<ul class\="space-y-2 text-sm text-mist"\>  
                           \<li class\="flex items-center"\>\<span class\="w-2 h-2 bg-electric rounded-full mr-3"\>\</span\>Hospitality Trained (Marriott)\</li\>  
                           \<li class\="flex items-center"\>\<span class\="w-2 h-2 bg-electric rounded-full mr-3"\>\</span\>Entertainment Experience (Jazz Hotel Stuttgart)\</li\>  
                           \<li class\="flex items-center"\>\<span class\="w-2 h-2 bg-electric rounded-full mr-3"\>\</span\>Digital Expertise (Google Ads, WIX)\</li\>  
                       \</ul\>  
                   \</div\>  
               \</div\>  
               \<div class\="relative"\>  
                   \<\!-- Placeholder for Portrait \--\>  
                   \<div class\="aspect-\[3/4\] bg-white/5 rounded-lg overflow-hidden relative group"\>  
                       \<div class\="absolute inset-0 bg-gradient-to-t from-midnight via-transparent to-transparent opacity-60"\>\</div\>  
                       \<img src\="https://placehold.co/600x800/1a1a1a/white?text=Portrait+of+Hope" alt\="Hope Bruce" class\="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"\>  
                   \</div\>  
               \</div\>  
           \</div\>  
       \</section\>  
       \<\!-- Portfolio Section (Masonry Grid) \--\>  
       \<section id\="portfolio" class\="py-24 px-4 bg-midnight"\>  
           \<div class\="max-w-7xl mx-auto"\>  
               \<h2 class\="text-4xl md:text-6xl font-serif font-bold text-center mb-16"\>  
                   Captured \<span class\="text-electric"\>Moments\</span\>  
               \</h2\>  
                
               \<div class\="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4"\>  
                   \<\!-- Placeholder Images \--\>  
                   \<div class\="break-inside-avoid relative group overflow-hidden rounded-lg cursor-pointer"\>  
                       \<img src\="https://placehold.co/600x800/2a2a2a/white?text=Portrait+Flow" alt\="Portfolio 1" class\="w-full object-cover transition-transform duration-500 group-hover:scale-110"\>  
                       \<div class\="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"\>  
                           \<span class\="text-white font-serif text-xl italic"\>Portrait Flow\</span\>  
                       \</div\>  
                   \</div\>  
                    
                   \<div class\="break-inside-avoid relative group overflow-hidden rounded-lg cursor-pointer"\>  
                       \<img src\="https://placehold.co/600x400/333/white?text=Event+Energy" alt\="Portfolio 2" class\="w-full object-cover transition-transform duration-500 group-hover:scale-110"\>  
                       \<div class\="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"\>  
                           \<span class\="text-white font-serif text-xl italic"\>Event Energy\</span\>  
                       \</div\>  
                   \</div\>  
                   \<div class\="break-inside-avoid relative group overflow-hidden rounded-lg cursor-pointer"\>  
                       \<img src\="https://placehold.co/600x600/1a1a1a/white?text=Community" alt\="Portfolio 3" class\="w-full object-cover transition-transform duration-500 group-hover:scale-110"\>  
                       \<div class\="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"\>  
                           \<span class\="text-white font-serif text-xl italic"\>Community\</span\>  
                       \</div\>  
                   \</div\>  
                   \<div class\="break-inside-avoid relative group overflow-hidden rounded-lg cursor-pointer"\>  
                       \<img src\="https://placehold.co/600x900/222/white?text=Artistic+Soul" alt\="Portfolio 4" class\="w-full object-cover transition-transform duration-500 group-hover:scale-110"\>  
                       \<div class\="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"\>  
                           \<span class\="text-white font-serif text-xl italic"\>Artistic Soul\</span\>  
                       \</div\>  
                   \</div\>  
                   \<div class\="break-inside-avoid relative group overflow-hidden rounded-lg cursor-pointer"\>  
                       \<img src\="https://placehold.co/600x500/2a2a2a/white?text=Rhythm" alt\="Portfolio 5" class\="w-full object-cover transition-transform duration-500 group-hover:scale-110"\>  
                       \<div class\="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"\>  
                           \<span class\="text-white font-serif text-xl italic"\>Rhythm\</span\>  
                       \</div\>  
                   \</div\>  
                   \<div class\="break-inside-avoid relative group overflow-hidden rounded-lg cursor-pointer"\>  
                       \<img src\="https://placehold.co/600x700/1f1f1f/white?text=Essence" alt\="Portfolio 6" class\="w-full object-cover transition-transform duration-500 group-hover:scale-110"\>  
                       \<div class\="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"\>  
                           \<span class\="text-white font-serif text-xl italic"\>Essence\</span\>  
                       \</div\>  
                   \</div\>  
               \</div\>  
           \</div\>  
       \</section\>  
       \<\!-- Services Section \--\>  
       \<section id\="services" class\="py-24 px-8 bg-midnight/50"\>  
           \<div class\="max-w-6xl mx-auto"\>  
               \<h2 class\="text-4xl md:text-6xl font-serif font-bold text-center mb-16"\>  
                   Services & \<span class\="text-amber"\>Investment\</span\>  
               \</h2\>  
                
               \<div class\="grid md:grid-cols-2 lg:grid-cols-3 gap-8"\>  
                   \<\!-- Card 1 \--\>  
                   \<div class\="p-8 border border-white/10 hover:border-electric transition-colors bg-white/5 rounded-lg group"\>  
                       \<h3 class\="text-2xl font-serif mb-2"\>Standard Shooting\</h3\>  
                       \<p class\="text-3xl font-bold text-electric mb-4"\>40€ \<span class\="text-sm font-normal text-mist"\>/ hour\</span\>\</p\>  
                       \<p class\="text-mist text-sm mb-6"\>Pure shooting session. No edits included. Perfect for raw content.\</p\>  
                       \<a href\="\#contact" class\="text-xs uppercase tracking-widest border-b border-transparent group-hover:border-electric transition-all"\>Book Now\</a\>  
                   \</div\>  
                   \<\!-- Card 2 \--\>  
                   \<div class\="p-8 border border-electric bg-white/5 rounded-lg group relative overflow-hidden"\>  
                       \<div class\="absolute top-0 right-0 bg-electric text-white text-xs px-3 py-1"\>Popular\</div\>  
                       \<h3 class\="text-2xl font-serif mb-2"\>Full Package\</h3\>  
                       \<p class\="text-3xl font-bold text-electric mb-4"\>50€ \<span class\="text-sm font-normal text-mist"\>/ hour\</span\>\</p\>  
                       \<p class\="text-mist text-sm mb-6"\>Includes 20 professionally edited images. The complete experience.\</p\>  
                       \<a href\="\#contact" class\="text-xs uppercase tracking-widest border-b border-transparent group-hover:border-electric transition-all"\>Book Now\</a\>  
                   \</div\>  
                   \<\!-- Card 3 \--\>  
                   \<div class\="p-8 border border-white/10 hover:border-electric transition-colors bg-white/5 rounded-lg group"\>  
                       \<h3 class\="text-2xl font-serif mb-2"\>Studio Sessions\</h3\>  
                       \<p class\="text-3xl font-bold text-electric mb-4"\>Hourly \<span class\="text-sm font-normal text-mist"\>\+ Rental\</span\>\</p\>  
                       \<p class\="text-mist text-sm mb-6"\>Standard hourly rate plus separate studio rental costs.\</p\>  
                       \<a href\="\#contact" class\="text-xs uppercase tracking-widest border-b border-transparent group-hover:border-electric transition-all"\>Book Now\</a\>  
                   \</div\>  
                    
                   \<\!-- Card 4 \--\>  
                   \<div class\="p-8 border border-white/10 hover:border-electric transition-colors bg-white/5 rounded-lg group"\>  
                       \<h3 class\="text-2xl font-serif mb-2"\>Creative Projects\</h3\>  
                       \<p class\="text-3xl font-bold text-electric mb-4"\>Custom\</p\>  
                       \<p class\="text-mist text-sm mb-6"\>Individual artistic collaborations by agreement.\</p\>  
                       \<a href\="\#contact" class\="text-xs uppercase tracking-widest border-b border-transparent group-hover:border-electric transition-all"\>Inquire\</a\>  
                   \</div\>  
                   \<\!-- Card 5 \--\>  
                   \<div class\="p-8 border border-white/10 hover:border-electric transition-colors bg-white/5 rounded-lg group"\>  
                       \<h3 class\="text-2xl font-serif mb-2"\>Special Branding\</h3\>  
                       \<p class\="text-3xl font-bold text-electric mb-4"\>Custom\</p\>  
                       \<p class\="text-mist text-sm mb-6"\>Complete support: Logo design, philosophy, and marketing.\</p\>  
                       \<a href\="\#contact" class\="text-xs uppercase tracking-widest border-b border-transparent group-hover:border-electric transition-all"\>Inquire\</a\>  
                   \</div\>  
                   \<\!-- Card 6 \--\>  
                   \<div class\="p-8 border border-white/10 hover:border-amber transition-colors bg-white/5 rounded-lg group"\>  
                       \<h3 class\="text-2xl font-serif mb-2 text-amber"\>Community Offer\</h3\>  
                       \<p class\="text-3xl font-bold text-white mb-4"\>FREE\</p\>  
                       \<p class\="text-mist text-sm mb-6"\>For Circle D Flow members & test shoots: 1-hour shoot \+ 10 edited images.\</p\>  
                       \<a href\="\#community" class\="text-xs uppercase tracking-widest border-b border-transparent group-hover:border-amber transition-all"\>Join Circle\</a\>  
                   \</div\>  
               \</div\>  
           \</div\>  
       \</section\>  
       \<\!-- Community Section \--\>  
       \<section id\="community" class\="py-24 px-8 bg-midnight relative overflow-hidden"\>  
           \<div class\="absolute inset-0 bg-gradient-to-r from-violet/20 to-transparent pointer-events-none"\>\</div\>  
           \<div class\="max-w-4xl mx-auto text-center space-y-12"\>  
               \<h2 class\="text-4xl md:text-6xl font-serif font-bold"\>  
                   Circle D \<span class\="text-electric"\>Flow\</span\>  
               \</h2\>  
               \<p class\="text-xl text-mist font-light leading-relaxed"\>  
                   A growing collective in Lisbon celebrating creativity, cultural freedom, artistic exchange, and community energy.  
               \</p\>  
                
               \<div class\="grid md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto"\>  
                   \<div class\="space-y-2"\>  
                       \<h4 class\="text-lg font-serif text-white"\>1\. Creativity\</h4\>  
                       \<p class\="text-sm text-mist"\>Unleashing artistic expression.\</p\>  
                   \</div\>  
                   \<div class\="space-y-2"\>  
                       \<h4 class\="text-lg font-serif text-white"\>2\. Authentic Flow\</h4\>  
                       \<p class\="text-sm text-mist"\>Awakening unique purpose.\</p\>  
                   \</div\>  
                   \<div class\="space-y-2"\>  
                       \<h4 class\="text-lg font-serif text-white"\>3\. Cultural Freedom\</h4\>  
                       \<p class\="text-sm text-mist"\>Celebrating diverse voices.\</p\>  
                   \</div\>  
                   \<div class\="space-y-2"\>  
                       \<h4 class\="text-lg font-serif text-white"\>4\. Community Energy\</h4\>  
                       \<p class\="text-sm text-mist"\>Building connections.\</p\>  
                   \</div\>  
               \</div\>  
               \<a href\="\#" class\="inline-block px-12 py-4 bg-electric text-white font-bold uppercase tracking-widest hover:bg-violet transition-colors rounded-full"\>  
                   Join the Circle  
               \</a\>  
           \</div\>  
       \</section\>  
       \<\!-- Contact Section \--\>  
       \<section id\="contact" class\="py-24 px-8 bg-midnight"\>  
           \<div class\="max-w-4xl mx-auto text-center"\>  
               \<h2 class\="text-4xl md:text-6xl font-serif font-bold mb-8"\>  
                   Kiss Your \<span class\="text-amber"\>Heart\</span\>  
               \</h2\>  
               \<p class\="text-xl text-mist mb-12"\>  
                   Let's feel your flow and create something real together.  
               \</p\>  
                
               \<div class\="flex flex-col md:flex-row justify-center items-center gap-8"\>  
                   \<a href\="mailto:contact@kissyourheart.com" class\="px-8 py-3 border border-white hover:bg-white hover:text-midnight transition-all uppercase tracking-widest"\>  
                       Book Your Session  
                   \</a\>  
                   \<a href\="https://instagram.com/KYheart.lx" target\="\_blank" class\="px-8 py-3 border border-white hover:bg-electric hover:border-electric hover:text-white transition-all uppercase tracking-widest"\>  
                       @KYheart.lx  
                   \</a\>  
               \</div\>  
                
               \<footer class\="mt-24 text-mist text-xs uppercase tracking-widest opacity-50"\>  
                   \&copy; 2024 Kiss Your Heart. All rights reserved.  
               \</footer\>  
           \</div\>  
       \</section\>  
   \</main\>  
   \<\!-- Audio Player \--\>  
   \<div class\="fixed bottom-8 right-8 z-50"\>  
       \<button id\="audio-btn" class\="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:border-electric transition-colors bg-midnight/50 backdrop-blur-sm"\>  
           \<svg id\="audio-icon-on" class\="w-5 h-5 hidden" fill\="none" stroke\="currentColor" viewBox\="0 0 24 24"\>\<path stroke-linecap\="round" stroke-linejoin\="round" stroke-width\="2" d\="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"\>\</path\>\</svg\>  
           \<svg id\="audio-icon-off" class\="w-5 h-5" fill\="none" stroke\="currentColor" viewBox\="0 0 24 24"\>\<path stroke-linecap\="round" stroke-linejoin\="round" stroke-width\="2" d\="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"\>\</path\>\<path stroke-linecap\="round" stroke-linejoin\="round" stroke-width\="2" d\="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"\>\</path\>\</svg\>  
       \</button\>  
       \<audio id\="bg-music" loop\>  
           \<source src\="assets/audio/ambient.mp3" type\="audio/mpeg"\>  
       \</audio\>  
   \</div\>  
   \<script src\="script.js"\>\</script\>  
\</body\>  
\</html\>

*   
*   
*   
* 

