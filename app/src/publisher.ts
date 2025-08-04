import amqp from 'amqplib';
const message = {
  description: 'test message',
};
const connectToRabbitMQ = async () => {
  try {
    const queue = 'queueNameTest';

    const connection = await amqp.connect('amqp://localhost:5672');
    const channel = await connection.createChannel();
    await channel.assertQueue(queue);

    console.log('connected PUBLISHER');

    // setInterval(() => {
    message.description = new Date().getTime().toString();
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    // }, 1000);
  } catch (error) {
    console.log('error oldu');
  }
};
connectToRabbitMQ();
