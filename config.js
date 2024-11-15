module.exports = {
  rabbitMQ: {
    url: "amqp://localhost",
    exchangeName: "main_exchange",
    queues: {
      taskQueue: "task_queue",
      notificationQueue: "notification_queue",
    },
    retryAttempts: 5,
    retryDelay: 5000,
  },
};
    