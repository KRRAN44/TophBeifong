import time

# Variables
NA = '\033[1;95m'
R = '\033[0m'
space = '🪵            '

while True:
# Primeros comandos 
  print(NA + "[ 🔥 ] • Escribe el nombre del comando")
  nombre = input("~ ~ >  " + R)
  print("")
  print(NA + "[ ❄️ ] • Escribe la descripcion del comando")
  descripcion = input("~ ~ ~ > " + R)

  nombre_command = nombre.upper()

  time.sleep(1)
  print("")
  ruta = input(NA + "[ 🔥 ] • Escribe la ruta : "+ R)
  if ruta == "1":
    # Resultado 
    print("")
    print("")  
    print('═════════════════')
    print('*'+space+nombre_command+'*')
    print('> _'+descripcion+'_')
    print('═════════════════')
    print('𔑳ּ᠂࡛ܐׄ𝚻𝚶𝗣𝚮ꫂ𝚩𝚵𝚰𝙁𝛳𝛮𝙂 🌱')
    print("") 
    print("")

  if ruta == "2":
    # Resultado 
    print("")
    print("")
    print('> *_[ 🍤 ] '+descripcion+'_*')
    print("")