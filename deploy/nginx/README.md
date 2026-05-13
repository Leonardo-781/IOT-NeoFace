Instalação e configuração mínima do nginx

1) Instalar no Debian/Raspbian/Ubuntu:

   sudo apt update
   sudo apt install -y nginx

2) Copiar o arquivo de configuração exemplo para o servidor:

   # Raspberry Pi (exemplo)
   sudo cp deploy/nginx/rasp-nginx.conf /etc/nginx/sites-available/rasp
   sudo ln -s /etc/nginx/sites-available/rasp /etc/nginx/sites-enabled/rasp

   # server-sti (exemplo)
   sudo cp deploy/nginx/server-sti-nginx.conf /etc/nginx/sites-available/server-sti
   sudo ln -s /etc/nginx/sites-available/server-sti /etc/nginx/sites-enabled/server-sti

3) Testar e recarregar o nginx:

   sudo nginx -t
   sudo systemctl reload nginx

4) Firewall (ufw) — permitir HTTP/HTTPS:

   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp

5) (Opcional) HTTPS com certbot:

   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d server-sti.example.com

6) Ajustes finais:

- Substitua `server_name` nos arquivos de configuração pelo IP/hostname/domínio correto.
- No Raspberry Pi garanta que os processos Node.js (`server.js`, `api-server.js`) estejam rodando (systemd/pm2).
