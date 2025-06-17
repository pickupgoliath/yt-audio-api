import express from 'express';
import { promisify } from 'util';
import { exec } from 'child_process';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';
import crypto from 'crypto';

const execPromise = promisify(exec);
const app = express();
app.use(express.json());

const TMP_DIR = process.env.TMP_DIR || '/tmp';
const port = process.env.PORT || 3000;

app.post('/download', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  const filename = crypto.randomBytes(12).toString('hex') + '.mp3';
  const filepath = path.join(TMP_DIR, filename);

  try {
    await execPromise(`yt-dlp --no-progress -f bestaudio --extract-audio --audio-format mp3 -o "${filepath}" "${url.replace(/"/g, '\\"')}"`);

    const form = new FormData();
    form.append('file', fs.createReadStream(filepath));

    const uploadRes = await axios.post('https://file.io', form, {
      headers: form.getHeaders()
    });

    fs.unlinkSync(filepath);
    res.json({ success: true, link: uploadRes.data.link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
