const amqp = require("amqplib");
const config = require("./config");

class RabbitMQClient {
  constructor() {
    this.channel = null;
    this.connection = null;
  }

  async connect() {
    try {
      // Create connection
      this.connection = await amqp.connect(config.rabbitMQ.url);
      console.log("Connected to RabbitMQ");

      // Handle connection errors
      this.connection.on("error", (err) => {
        console.error("RabbitMQ connection error", err);
        this.reconnect();
      });

      this.connection.on("close", () => {
        console.error("RabbitMQ connection closed");
        this.reconnect();
      });

      // Create channel
      this.channel = await this.connection.createChannel();

      // Setup exchanges and queues
      await this.setup();

      return this.channel;
    } catch (error) {
      console.error("RabbitMQ connection failed", error);
      await this.reconnect();
    }
  }

  async setup() {
    try {
      // Assert exchange
      await this.channel.assertExchange(
        config.rabbitMQ.exchangeName,
        "direct",
        { durable: true }
      );

      // Assert queues
      await this.channel.assertQueue(config.rabbitMQ.queues.taskQueue, {
        durable: true,
      });

      await this.channel.assertQueue(config.rabbitMQ.queues.notificationQueue, {
        durable: true,
      });
    } catch (error) {
      console.error("RabbitMQ setup failed", error);
      throw error;
    }
  }

  async reconnect() {
    for (let i = 0; i < config.rabbitMQ.retryAttempts; i++) {
      try {
        await new Promise((resolve) =>
          setTimeout(resolve, config.rabbitMQ.retryDelay)
        );
        await this.connect();
        return;
      } catch (error) {
        console.error(`Reconnection attempt ${i + 1} failed`);
      }
    }
    throw new Error("Failed to reconnect to RabbitMQ");
  }

  async publishMessage(queue, message) {
    try {
      await this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );
      return true;
    } catch (error) {
      console.error("Error publishing message", error);
      throw error;
    }
  }

  async consume(queue, callback) {
    try {
      await this.channel.consume(queue, async (data) => {
        try {
          const message = JSON.parse(data.content);
          await callback(message);
          this.channel.ack(data);
        } catch (error) {
          console.error("Error processing message", error);
          // Reject and requeue if processing fails
          this.channel.nack(data, false, true);
        }
      });
    } catch (error) {
      console.error("Error setting up consumer", error);
      throw error;
    }
  }
}

module.exports = new RabbitMQClient();
