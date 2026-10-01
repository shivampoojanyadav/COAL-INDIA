import re

with open('static/css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Add flex layout to stat-card
css = css.replace('position: relative; overflow: hidden; transition: 0.2s ease; box-shadow: var(--shadow); }', 'position: relative; overflow: hidden; transition: 0.2s ease; box-shadow: var(--shadow); display: flex; flex-direction: column; }')

# Add margin-top: auto to stat-value
css = css.replace('font-variant-numeric: tabular-nums; }', 'font-variant-numeric: tabular-nums; margin-top: auto; }')

with open('static/css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)
