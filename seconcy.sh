RED='\033[1;94m'
NOCOLOR='\033[0m'
CYAN='\033[1;36m'
clear
echo -e "${RED}   
             ╭─────────────────────────────────────────╮ 
             |  [ 1 ] : Iniciar Instalación Seconcy    |
             |  [ 2 ] : Iniciar Seconcy                |
             |  [ 3 ] : Borrar Carpeta de Seconcy      |
             |  [ 4 ] : Iniciar PM2 con seconcy        |
             |  [ 5 ] : Mostrar miembros.json          |
             |  [ 6 ] : Mover miembros.json            |
             ╰─────────────────────────────────────────╯${NOCOLOR}"

1() {
echo -e "${CYAN}[🍀] $ INSTALANDO SECONCY... ${NOCOLOR}" 
cd JSON
git clone https://github.com/KRRAN44/seconcy.git
npm init -y 
npm install @whiskeysockets/baileys pino @hapi/boom
cd ..
}

2() {
echo -e "${CYAN}[🍀] $ INICIANDO SECONCY....${NOCOLOR}"
cd JSON/seconcy
node seconcy.js
}

3() {
  echo -e "${CYAN}[🍀] $ BORRANDO CARPETA DE SECONCY....${NOCOLOR}"
  rm -rf JSON/seconcy
}

4() {
  echo -e "${CYAN}[🍀] $ INSTALANDO PM2....${NOCOLOR}"
  npm install pm2 -g
  echo -e "${CYAN}[🍀] $ INICIANDO PM2....${NOCOLOR}"
  cd JSON 
  cd seconcy
  pm2 start seconcy.js --name "seconcy"
  pm2 save
  cd .. 
  cd ..
}

5() {
  echo -e "${CYAN}[🍀] $ MOSTRANDO miembros.json....${NOCOLOR}"
  cd JSON/seconcy/JSON
  cat miembros.json
  cd ..
  cd ..
  cd ..
}

6() {
  echo -e "${CYAN}[🍀] $ MOVIENDO miembros.json....${NOCOLOR}"
  cd JSON/seconcy/JSON
  mv -f miembros.json ../../
  cd ..
  cd ..
  cd ..
}