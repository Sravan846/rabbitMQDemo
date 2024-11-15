const express = require("express");
const rabbitMQ = require("./utils.js");
const config = require("./config.js");

const app = express();
app.use(express.json());

// Connect to RabbitMQ when service starts
(async () => {
  await rabbitMQ.connect();
})();

// API endpoint to send task
app.post("/task", async (req, res) => {
  try {
    const task = req.body;

    // Add timestamp and task ID if not present
    const messageToSend = {
      ...task,
      id: task.id || Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    // Log the message being sent
    console.log("Sending task to queue:", messageToSend);

    const result = await rabbitMQ.publishMessage(
      config.rabbitMQ.queues.taskQueue,
      messageToSend
    );

    console.log("Message published successfully:", result);

    res.json({
      success: true,
      message: "Task queued successfully",
      taskId: messageToSend.id,
    });
  } catch (error) {
    console.error("Failed to queue task", error);
    res.status(500).json({
      success: false,
      error: "Failed to queue task",
      details: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Producer service running on port 3000");
});
