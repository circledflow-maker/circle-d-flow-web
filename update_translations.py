import json

file_path = r'D:\circle-d-flow-web\js\translations.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We can append these to the respective language blocks by finding the "}," corresponding to the end of each block.
# Or simpler: regex replace the last `}` in each language block.

new_keys = {
    "en": {
        "about_intro": "We believe that true art is more than aesthetics - it is psychological liberation and spiritual healing. In a loud, fragmented world, we create a radical 'Safe Space'. Our mission is to trigger a wave of consciousness in Lisbon and around the world through genuine expression.",
        "panel1_title": "Mirror of the Soul",
        "panel1_desc": "Photography & Truth: We do not capture the exterior, but the invisible moment when the soul breathes. Photography is our spiritual language to capture the true, vulnerable essence of every artist without fear.",
        "panel2_title": "Ego Dissolution & The Zone",
        "panel2_desc": "Mihaly Csikszentmihalyi: We guide people to enter their 'Flow'. Psychologically, this is the sacred space where the judging ego dies, space and time merge, and pure, fearless presence emerges.",
        "panel3_title": "Collective Healing",
        "panel3_desc": "Wu Wei & Hip Hop: The five pillars of hip-hop culture unite with the Taoist practice of Wu Wei. We break through social isolation by forming a community that flows in the moment and grows without judgment.",
        "panel4_title": "Impact on the World",
        "panel4_desc": "The Will of D & Musashi: With the structure of Musashi's Five Rings, we ignite a wildfire of intrinsic will. We give artists the courage to find their unique frequency, to shape the world as shining role models."
    },
    "de": {
        "about_intro": "Wir glauben, dass echte Kunst mehr ist als Ästhetik – sie ist psychologische Befreiung und spirituelle Heilung. In einer lauten, fragmentierten Welt erschaffen wir einen radikalen 'Safe Space'. Unsere Mission ist es, durch echten Ausdruck eine Welle der Bewusstwerdung in Lissabon und der ganzen Welt auszulösen.",
        "panel1_title": "Spiegel der Seele",
        "panel1_desc": "Fotografie & Wahrhaftigkeit: Wir erfassen nicht das Äußere, sondern den unsichtbaren Moment, in dem die Seele atmet. Fotografie ist unsere spirituelle Sprache, um die echte, verletzliche Essenz eines jeden Künstlers angstfrei einzufangen.",
        "panel2_title": "Ego-Auflösung & The Zone",
        "panel2_desc": "Mihaly Csikszentmihalyi: Wir leiten Menschen an, in ihren 'Flow' zu treten. Psychologisch gesehen ist dies der heilige Raum, in dem das bewertende Ego stirbt, Raum und Zeit verschmelzen und reine, angstfreie Präsenz entsteht.",
        "panel3_title": "Kollektive Heilung",
        "panel3_desc": "Wu Wei & Hip Hop: Die fünf Säulen der Hip-Hop-Kultur vereinen sich mit der taoistischen Praxis des Wu Wei. Wir durchbrechen soziale Isolation, indem wir eine Gemeinschaft formen, die im Moment fließt und urteilsfrei wächst.",
        "panel4_title": "Impact auf die Welt",
        "panel4_desc": "The Will of D & Musashi: Mit der Struktur von Musashis Fünf Ringen entfachen wir ein Lauffeuer des intrinsischen Willens. Wir geben Künstlern den Mut, ihre einzigartige Frequenz zu finden, um als leuchtende Vorbilder die Welt zu formen."
    },
    "fr": {
        "about_intro": "Nous croyons que le véritable art est plus que de l'esthétique – c'est une libération psychologique et une guérison spirituelle. Dans un monde bruyant et fragmenté, nous créons un 'Safe Space' radical. Notre mission est de déclencher une vague de conscience à Lisbonne et dans le monde entier par une expression authentique.",
        "panel1_title": "Miroir de l'Âme",
        "panel1_desc": "Photographie & Vérité : Nous ne capturons pas l'extérieur, mais le moment invisible où l'âme respire. La photographie est notre langage spirituel pour capturer l'essence véritable et vulnérable de chaque artiste sans peur.",
        "panel2_title": "Dissolution de l'Ego & The Zone",
        "panel2_desc": "Mihaly Csikszentmihalyi : Nous guidons les gens à entrer dans leur 'Flow'. Psychologiquement, c'est l'espace sacré où l'ego qui juge meurt, l'espace et le temps fusionnent, et une présence pure et sans peur émerge.",
        "panel3_title": "Guérison Collective",
        "panel3_desc": "Wu Wei & Hip Hop : Les cinq piliers de la culture hip-hop s'unissent à la pratique taoïste du Wu Wei. Nous brisons l'isolement social en formant une communauté qui coule dans l'instant et grandit sans jugement.",
        "panel4_title": "Impact sur le Monde",
        "panel4_desc": "The Will of D & Musashi : Avec la structure des Cinq Anneaux de Musashi, nous allumons un feu de volonté intrinsèque. Nous donnons aux artistes le courage de trouver leur fréquence unique, pour façonner le monde comme des modèles brillants."
    },
    "pt": {
        "about_intro": "Acreditamos que a verdadeira arte é mais do que estética – é libertação psicológica e cura espiritual. Num mundo ruidoso e fragmentado, criamos um 'Safe Space' radical. A nossa missão é desencadear uma onda de consciência em Lisboa e em todo o mundo através da expressão genuína.",
        "panel1_title": "Espelho da Alma",
        "panel1_desc": "Fotografia e Verdade: Não captamos o exterior, mas o momento invisível em que a alma respira. A fotografia é a nossa linguagem espiritual para capturar a essência verdadeira e vulnerável de cada artista sem medo.",
        "panel2_title": "Dissolução do Ego & The Zone",
        "panel2_desc": "Mihaly Csikszentmihalyi: Orientamos as pessoas a entrarem no seu 'Flow'. Psicologicamente, este é o espaço sagrado onde o ego julgador morre, o espaço e o tempo fundem-se, e surge uma presença pura e destemida.",
        "panel3_title": "Cura Coletiva",
        "panel3_desc": "Wu Wei e Hip Hop: Os cinco pilares da cultura hip-hop unem-se à prática taoísta de Wu Wei. Rompemos o isolamento social formando uma comunidade que flui no momento e cresce sem julgamento.",
        "panel4_title": "Impacto no Mundo",
        "panel4_desc": "The Will of D & Musashi: Com a estrutura dos Cinco Anéis de Musashi, acendemos um fogo de vontade intrínseca. Damos aos artistas a coragem de encontrarem a sua frequência única, para moldarem o mundo como modelos brilhantes."
    }
}

# Find the end of each language block
for lang, keys in new_keys.items():
    # Construct string to insert
    insert_str = ""
    for k, v in keys.items():
        # Escape double quotes
        v_esc = v.replace('"', '\\"')
        insert_str += f',\n        "{k}": "{v_esc}"'
    
    # We find where this language ends. For 'en', it ends with 'port_void_cta": "..."\n    },'
    import re
    # We look for the last line of the lang block.
    # It usually looks like `"lang": { ... }`
    # Let's use a regex to find the end of the `lang` dictionary.
    
    # Regex to find the block for a language
    pattern = r'("' + lang + r'":\s*\{)(.*?)(\n\s*\})'
    
    def replacer(match):
        # We append our insert_str right before the closing brace
        return match.group(1) + match.group(2) + insert_str + match.group(3)
        
    content = re.sub(pattern, replacer, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Translations updated successfully.")
