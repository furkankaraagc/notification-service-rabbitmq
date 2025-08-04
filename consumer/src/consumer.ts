import amqp from 'amqplib';
import nodemailer from 'nodemailer';

let connection;
let channel;
let isClosing = false;
let isManualClose = false;

const connectToRabbitMQ = async () => {
  try {
    const queue = 'queueNameTest';

    connection = await amqp.connect('amqp://rabbitmq:5672');

    connection.on('close', () => {
      if (!isManualClose) {
        console.warn(
          'RabbitMQ connection closed unexpectedly. Reconnecting...'
        );
        return setTimeout(connectToRabbitMQ, 5000);
      } else {
        console.log('Connection closed gracefully (no reconnect).');
      }
    });

    channel = await connection.createChannel();
    await channel.assertQueue(queue);
    console.log('connected CONSUMER');

    channel.consume(queue, (msg) => {
      try {
        console.log('Message:', msg.content.toString());
        sendMail();
        channel.ack(msg);
      } catch (error) {
        channel.nack(msg);
      }
    });
  } catch (err) {
    console.error('Connection failed:', err.message);
    setTimeout(connectToRabbitMQ, 5000);
  }
};
const sendMail = async () => {
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    secure: false,
  });

  await transporter.sendMail({
    from: '"Test" <example@example.com>',
    to: 'example@example.com',
    subject: 'Merhaba',
    text: 'Bu bir test mailidir.',
  });
};
process.on('SIGINT', async () => {
  if (isClosing) return;
  isClosing = true;
  isManualClose = true;

  console.log('\nGracefully shutting down...');
  try {
    if (channel) await channel.close();
  } catch (err) {
    console.warn('Channel close error (ignored):', err.message);
  }

  try {
    if (connection) await connection.close();
  } catch (err) {
    console.warn('Connection close error (ignored):', err.message);
  }

  process.exit(0);
});

connectToRabbitMQ();
