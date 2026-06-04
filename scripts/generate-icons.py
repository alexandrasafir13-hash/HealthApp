import cairosvg
import os

GREEN = '#3D6B5E'

PATH = "M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762"

def icon_svg(sw=2.5):
  return f'''<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
<path d="{PATH}" fill="none" stroke="{GREEN}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>'''

def splash_svg():
  return f'''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
<rect width="200" height="200" fill="#F7FAF9"/>
<g transform="translate(50,50) scale(4.1667)">
<path d="{PATH}" fill="none" stroke="{GREEN}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</g></svg>'''

assets = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'assets', 'images')
os.makedirs(assets, exist_ok=True)

for name, size, svg in [
  ('icon.png', 1024, icon_svg(sw=3)),
  ('favicon.png', 48, icon_svg(sw=3)),
  ('splash-icon.png', 200, splash_svg()),
  ('android-icon-foreground.png', 1024, icon_svg(sw=3)),
  ('android-icon-monochrome.png', 1024, icon_svg(sw=3)),
]:
  print(f"Generating {name}...")
  cairosvg.svg2png(
    bytestring=svg.encode('utf-8'),
    write_to=os.path.join(assets, name),
    output_width=size,
    output_height=size,
  )

print("Generating android-icon-background.png...")
cairosvg.svg2png(
  bytestring=f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#F7FAF9"/></svg>'.encode('utf-8'),
  write_to=os.path.join(assets, 'android-icon-background.png'),
  output_width=1024,
  output_height=1024,
)

svg_path = os.path.join(assets, 'heart-handshake-logo.svg')
with open(svg_path, 'w') as f:
  f.write(icon_svg())
print(f"Saved {svg_path}")

print("\nDone!")
