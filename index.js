const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = process.env.PORT || 3000;

// Autoriser toutes les origines (tu peux restreindre à ton domaine si tu préfères)
app.use(cors());

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/drive.file']
});

app.post('/upload', upload.single('video'), async (req, res) => {
  const filePath = req.file.path;

  const drive = google.drive({ version: 'v3', auth: await auth.getClient() });

  const fileMetadata = {
    name: req.file.originalname,
    parents: [process.env.DRIVE_FOLDER_ID]
  };

  const media = {
    mimeType: req.file.mimetype,
    body: fs.createReadStream(filePath)
  };

  try {
    await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id'
    });

    // Supprime le fichier temporaire après upload
    fs.unlinkSync(filePath);
    res.send('OK');
  } catch (err) {
    console.error('Erreur lors de l’upload vers Drive :', err);
    res.status(500).send('Erreur lors de l’upload');
  }
});

app.get('/', (req, res) => {
  res.send('Backend vidéo prêt à recevoir des fichiers ✅');
});

app.listen(port, () => {
  console.log(`Serveur backend démarré sur le port ${port}`);
});
