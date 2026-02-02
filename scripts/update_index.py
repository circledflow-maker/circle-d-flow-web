
import os

file_path = '/Users/hope/Desktop/New Website/DBoysAnd Hempy/Index.html'

new_header = """    <!-- Mobile Wave Overlay -->
    <div id="mobile-wave-menu" class="mobile-wave-menu space-y-6">
        <a href="index.html">Home</a>
        <a href="events.html">Events</a>
        <a href="marketplace.html">Marketplace</a>
        <a href="blog.html">Community</a>
        <div class="h-px w-12 bg-white/20 my-2 mx-auto"></div>
        <a href="login.html" id="mobile-auth-link" class="text-xl text-white/70">Enter the Circle</a>
    </div>

    <!-- The Flow Bar (Fixed Navigation) -->
    <header id="flow-bar" class="flow-bar flex items-center justify-between">
        <!-- Logo -->
        <a href="index.html" class="flex items-center gap-2 group">
            <img src="Assets/images/logo.png" alt="Circle D Flow" class="w-8 h-8 object-contain group-hover:rotate-12 transition-transform">
            <span class="text-white font-bold tracking-tight hidden md:block group-hover:text-mystic-gold transition-colors">Circle D Flow</span>
        </a>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-8">
            <!-- Trinity Dropdown -->
            <div class="relative group h-full flex items-center">
                <button class="nav-link flex items-center gap-1 focus:outline-none uppercase tracking-widest text-xs font-bold bg-transparent border-none text-white">
                    The Trinity <span class="material-symbols-outlined text-sm">expand_more</span>
                </button>
                <div class="trinity-dropdown">
                    <a href="kiss-your-heart.html" class="trinity-card text-white hover:text-mystic-gold">
                        <span class="trinity-icon">👁️</span>
                        <span class="font-bold text-sm uppercase tracking-wider">Visuals</span>
                    </a>
                    <a href="live-from-the-underground.html" class="trinity-card text-white hover:text-purple-500">
                        <span class="trinity-icon">🎧</span>
                        <span class="font-bold text-sm uppercase tracking-wider">Sound</span>
                    </a>
                    <a href="african-queen-kitchen.html" class="trinity-card text-white hover:text-amber">
                        <span class="trinity-icon">🥘</span>
                        <span class="font-bold text-sm uppercase tracking-wider">Taste</span>
                    </a>
                </div>
            </div>
            
            <a href="events.html" class="nav-link uppercase tracking-widest text-xs font-bold">Events</a>
            <a href="marketplace.html" class="nav-link uppercase tracking-widest text-xs font-bold">Marketplace</a>
            <a href="blog.html" class="nav-link uppercase tracking-widest text-xs font-bold">Community</a>
        </nav>

        <!-- Auth / Mobile Toggle -->
        <div class="flex items-center gap-4">
            <!-- Desktop Auth -->
            <div id="desktop-auth" class="hidden md:block">
                <!-- Will be populated by JS -->
                <a href="login.html" class="px-6 py-2 bg-white text-midnight font-bold rounded-full text-xs uppercase tracking-widest hover:bg-mystic-gold hover:scale-105 transition-all shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    Enter the Circle
                </a>
            </div>

            <!-- Mobile Hamburger -->
            <button id="hamburger-btn" class="hamburger md:hidden text-white z-50 relative focus:outline-none group">
                <svg class="w-8 h-8 group-hover:text-mystic-gold transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>
        </div>
    </header>
"""

with open(file_path, 'r') as f:
    lines = f.readlines()

# Indent new header
new_lines = new_header.splitlines()
# new_lines = [' ' * 8 + line for line in new_lines] # Adjust indentation if needed, but the original was 0-based in my var

# Replace lines 80-146 (0-indexed: 79-146)
# Original line 80: <!-- Top Navigation Bar -->
# Original line 146: </div> (End of mobile menu)

# Python slicing is [start:end] where end is exclusive
# We want to replace lines 79 to 146 inclusive?
# Let's double check.
# Line 80 is index 79.
# Line 146 is index 145.
# So we slice [79:146] to remove them.

start_idx = 79
end_idx = 146 

# Reconstruct file content
final_content = lines[:start_idx] + [l + '\n' for l in new_lines] + lines[end_idx:]

with open(file_path, 'w') as f:
    f.writelines(final_content)

print("Index.html updated successfully.")
