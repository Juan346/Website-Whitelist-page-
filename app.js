const express = require('express');
const app = express();
const path = require('path');
const ip = require('ip');
const axios = require('axios');
const { Client } = require('ssh2');


// Configurar el motor de vistas (EJS)
app.set('view engine', 'ejs');

// Servir archivos estáticos (CSS, imágenes, etc.)
app.use(express.static(path.join(__dirname, 'dist')));

const responseTime = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    res.locals.responseTime = duration; // Guardar el tiempo en `res.locals`
  });

  next();
};

function getCidrSuffix(ipAddress) {
  // Puedes definir la máscara de subred aquí o pasarla como parámetro
  const subnetMask = '255.255.255.0'; // Cambia esto según tu red

  // Convertir la máscara de subred a su representación CIDR
  const cidr = ip.fromLong(ip.toLong(subnetMask)).split('.').map(Number).reduce((acc, val) => acc + (val > 0 ? 1 : 0), 0);
  const suffix = 32 - cidr; // Obtener el sufijo CIDR

  return suffix;
}



// Ruta para la página principal
app.get('/autorize/whitelist', (req, res) => {

  // Token de acceso para la API de ipinfo
  const token = '7ead030ba381e5';

  var ipe = req.header('x-forwarded-for') || req.connection.remoteAddress;

  // IP que queremos consultar
  /* const ip = '190.108.77.175';

  // URL para la petición
  const url = `https://ipinfo.io/AS270035/json?token=7ead030ba381e5`;

  axios.get(url)
    .then(response => {
      const data = response.data;

      console.log('IPv4 netblocks:');

      const bloque = [];
      // Filtrar y mostrar solo los valores de 'netblock' en IPv4
      data.prefixes.forEach(prefix => {
        console.log(`netblock: '${prefix.netblock}'`);
        
      });
      


      console.log(bloque)
      console.log('\nIPv6 netblocks:');
      // Filtrar y mostrar solo los valores de 'netblock' en IPv6
      data.prefixes6.forEach(prefix => {
        console.log(`netblock: '${prefix.netblock}'`);
       
       
      });
      
    })
    .catch(error => {
      console.error('Error al obtener los prefijos:', error.message);
    });
    if (ipe === "::1") {
      ipe = "127.0.0.1";
    } */


      res.render('index', { title: 'Whitelist servidor SA:MP', ipe});

 /*  res.render('index', { title: 'Whitelist servidor SA:MP', bloque:data.prefixes }); */
});

app.get('/', async (req, res) => {
  res.render('home', { title: 'Whitelist servidor SA:MP' });
});

app.post('/connecting/server', async (req, res) => {

/*   const {  ip } = req.body; */
  
  const conexionSSH = {
    host: '65.75.209.72',  // Reemplaza con la IP del servidor remoto
    port: 22,                // Puerto por defecto de SSH
    username: 'root',  // Reemplaza con tu nombre de usuario en el servidor remoto
    password: 'nDAJu9zE9THydNGMkZip'  // O usa una clave privada para más seguridad
  };

  // Comando `iptables` para agregar una regla
  const ipAAgregar = '127.0.0.1';  // Reemplaza con la IP que quieres bloquear
  const comando = `apt update`;  // Comando que quieres ejecutar

  // Crear una instancia del cliente SSH
  const conn = new Client();

  conn.on('ready', () => {
    console.log('Conexión SSH establecida.');

    // Ejecutar el comando iptables en el servidor remoto
    conn.exec(comando, (err, stream) => {
      if (err) throw err;

      stream
        .on('close', (code, signal) => {
          console.log('Comando ejecutado. Código de salida:', code);
          conn.end();  // Cerrar la conexión SSH
        })
        .on('data', (data) => {
          console.log('Salida del comando:', data.toString());
        })
        .stderr.on('data', (data) => {
          console.error('Error del comando:', data.toString());
        });
    });
  }).connect(conexionSSH);

  
});

app.get('/connection-lost', async (req, res) => {
  res.render('offline', { title: 'Conexion perdida' });
});


app.use((req, res, next) => {
  res.status(404).render('404'); // Renderiza la vista '404.ejs'
});

// Iniciar el servidor en el puerto 3000
const port = 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});