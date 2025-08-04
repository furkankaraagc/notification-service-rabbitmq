import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

const PORT = process.env.EXPRESS_PORT;

app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
