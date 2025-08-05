import amqp from 'amqplib';
import nodemailer from 'nodemailer';
interface Mail {
  from: string;
  to: string;
  subject: string;
  text: string;
}

let connection;
let channel;
let isClosing = false;
let isManualClose = false;

const connectToRabbitMQ = async () => {
  try {
    const queue = 'mailQueue';

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
        sendMail(JSON.parse(msg.content.toString()));
        channel.ack(msg);
      } catch (error) {
        channel.nack(msg);
      }
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error('Connection failed:', err.message);
    } else {
      console.error('Connection failed:', err);
    }
    setTimeout(connectToRabbitMQ, 5000);
  }
};
const sendMail = async (data: Mail) => {
  const {from, to, subject, text} = data;

  const transporter = nodemailer.createTransport({
    host: 'mailhog',
    port: 1025,
    secure: false,
  });

  // await transporter.sendMail({
  //   from: '"Test" <example@example.com>',
  //   to: 'example@example.com',
  //   subject: 'Merhaba',
  //   text: 'Bu bir test mailidir.',
  // });
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
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
