import express from 'express';
import dotenv from 'dotenv';
import {initRabbitMQ, publishMessage} from './publisher';

dotenv.config();
const PORT = process.env.EXPRESS_PORT;

const app = express();
app.use(express.json());
app.post('/publish', async (req, res) => {
  const {message} = req.body;

  if (!message || typeof message.description !== 'string') {
    return res.status(400).send('Invalid message format');
  }
  try {
    await publishMessage(message);
    res.status(200).send('Message published successfully');
  } catch (error) {
    console.error('Error publishing message:', error);
    res.status(500).send('Failed to publish message');
  }
});

const startServer = async () => {
  try {
    await initRabbitMQ();
    app.listen(PORT, () => {
      console.log(`server listening on port ${PORT}`);
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error(
        'Failed to start server due to RabbitMQ error:',
        err.message
      );
    } else {
      console.error('Failed to start server due to RabbitMQ error:', err);
    }
    process.exit(1);
  }
};

startServer();
