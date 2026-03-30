# ── Site static (High Vibes) — nginx
# Coolify / Docker: setează Build → Dockerfile la rădăcina repo-ului (acest fișier).
# mail-api e separat: vezi mail-api/Dockerfile sau compose.yaml pentru API.
#
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
