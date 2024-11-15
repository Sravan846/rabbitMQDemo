const rabbitMQ = require("./utils");
const config = require("./config");

async function processTask(message) {
  try {
    console.log("Received task:", message);
    console.log("Task timestamp:", message.timestamp);
    console.log("Processing started at:", new Date().toISOString());

    // Simulate task processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Task processing completed for ID:", message.id);

    // Simulate sending notification
    await rabbitMQ.publishMessage(config.rabbitMQ.queues.notificationQueue, {
      type: "TASK_COMPLETED",
      taskId: message.id,
      processedAt: new Date().toISOString(),
      result: "success",
    });

    console.log("Notification sent for task:", message.id);
  } catch (error) {
    console.error("Error processing task:", error);
    throw error; // This will trigger the nack in the consume method
  }
}

async function start() {
  try {
    await rabbitMQ.connect();

    // Consume tasks
    await rabbitMQ.consume(config.rabbitMQ.queues.taskQueue, processTask);

    console.log("Consumer service is running");
  } catch (error) {
    console.error("Failed to start consumer", error);
    process.exit(1);
  }
}

start();
