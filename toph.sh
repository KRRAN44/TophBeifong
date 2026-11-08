clear
NOCOLOR='\033[0m'
RED='\033[1;91m'
CYAN='\033[1;36m'
echo -e "${RED}
         _________  ________  ________  ___  ___     
        |\___   ___     __  \|\   __  \|\  \|\  \    
        \|___ \  \_\ \  \|\  \ \  \|\  \ \    \  \   
             \ \  \ \ \    \  \ \   ____\ \   __  \  
              \ \  \ \ \    \  \ \  \___|\ \  \ \  \ 
               \ \__\ \ \_______\ \__\    \ \__\ \__|
                \|__|  \|_______|\|__|     \|__|\|__|
                                         
             ╭─────────────────────────────────────────╮
             |  [ 1 ] : Iniciar Instalación del bot    |
             |  [ 2 ] : Iniciar Bot                    |
             |  [ 3 ] : Borrar Carpeta de Sesión       |
             |  [ 4 ] : Inciar PM2                     |
             |  [ 5 ] : Mostrar Sugerencias            |
             |  [ 6 ] : Eliminar Sugerencias           |
             |  [ 7 ] : Salir de la terminal           |
             ╰─────────────────────────────────────────╯${NOCOLOR}"
                                 
1() {
echo -e "${CYAN}[🍀] $ ACTUALIZANDO TERMUX${NOCOLOR}" 
echo                               
pkg update
pkg upgrade -y
echo -e "${CYAN}[🍀] $ INSTALANDO PAQUETES${NOCOLOR}"
echo
pkg install -y git nodejs libvips python make clang
echo -e "${CYAN}[🍀] $ INSTALANDO FFMPEG${NOCOLOR}"
echo
pkg install ffmpeg -y
echo -e "${CYAN}[🍀] $ INSTALANDO NPM${NOCOLOR}"
echo
npm install
npm install sharp @img/sharp-wasm32
echo
}

2() {
echo -e "${CYAN}[🍀] $ INICIANDO BOT....${NOCOLOR}"
node TophBeifong.js
}

3() {
  echo -e "${CYAN}[🍀] $ BORRANDO CARPETA DE SESIÓN....${NOCOLOR}"
  rm -rf info_TophBeifong
}

4() {
  echo -e "${CYAN}[🍀] $ INSTALANDO PM2....${NOCOLOR}"
  npm install pm2 -g
  echo -e "${CYAN}[🍀] $ INICIANDO PM2....${NOCOLOR}"
  pm2 start TophBeifong.js --name "TophBeifong"
  pm2 save
}

5() {
  echo -e "${CYAN}[🍀] $ MOSTRANDO SUGERENCIAS....${NOCOLOR}"
  cat JSON/sugerencias.json
}

6() {
  echo -e "${CYAN}[🍀] $ ELIMINANDO SUGERENCIAS....${NOCOLOR}"
  rm JSON/sugerencias.json
  echo -e "${CYAN}[🍀] $ SUGERENCIAS ELIMINADAS${NOCOLOR}"
}

7() {
  echo -e "${CYAN}[🍀] $ SALIENDO....${NOCOLOR}"
  exit 0
}
