import amqp from 'amqplib';

let channel: amqp.Channel | null = null;
const queue = 'mailQueue';
const RABBITMQ_URL = 'amqp://rabbitmq:5672';
let connection: amqp.ChannelModel | null = null;

export const initRabbitMQ = async (retries = 10, delayMs = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err.message);
        connection = null;
        channel = null;
      });

      connection.on('close', () => {
        console.warn('RabbitMQ connection closed');
        connection = null;
        channel = null;
      });

      channel = await connection.createChannel();
      console.log('RabbitMQ connected and channel created');
      return;
    } catch (err) {
      console.warn(`RabbitMQ not ready (attempt ${i + 1}/${retries})`);
      if (i === retries - 1) {
        console.error('Could not connect to RabbitMQ after multiple attempts.');
        throw err;
      }
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
};

export const publishMessage = async (message: {description: string}) => {
  if (!channel) {
    throw new Error('Channel is not defined');
  }
  try {
    // message.description = new Date().getTime().toString();
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    console.log('Message published:', message.description);
  } catch (error) {
    throw new Error('Error publishing message: ' + error);
  }
};
