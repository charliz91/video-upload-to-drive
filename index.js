const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = process.env.PORT || 3000;

// ✅ EN-TÊTES CORS MANUELS (au lieu de cors())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://www.silver-scooter.fr'); // ← ton domaine ici
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

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

    fs.unlinkSync(filePath);
    res.send('OK');
  } catch (err) {
    console.error('❌ Erreur Google Drive :', err);
    res.status(500).send('Erreur lors de l’upload');
  }
});

app.get('/', (req, res) => {
  res.send('✅ Backend opérationnel');
});

app.listen(port, () => {
  console.log(`🚀 Serveur backend démarré sur le port ${port}`);
});
