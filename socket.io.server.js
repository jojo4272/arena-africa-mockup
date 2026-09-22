const { Server } = require("socket.io");
const { getMarkets, getUserById, getUserPredictions, getUserTransactions } = require("./src/app/actions");

// Initialize Socket.IO server
const PORT = process.env.PORT || 3001;
const io = new Server(PORT, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connected users
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user authentication
  socket.on("authenticate", async (userId) => {
    try {
      const user = await getUserById(userId);
      if (user) {
        connectedUsers.set(socket.id, userId);
        socket.userId = userId;
        console.log(`User ${userId} authenticated with socket ${socket.id}`);

        // Send initial data
        socket.emit("initialData", {
          user: user,
          markets: await getMarkets(),
          predictions: await getUserPredictions(userId),
          transactions: await getUserTransactions(userId)
        });
      } else {
        socket.emit("error", { message: "Invalid user" });
      }
    } catch (error) {
      console.error("Authentication error:", error);
      socket.emit("error", { message: "Authentication failed" });
    }
  });

  // Handle market subscription
  socket.on("subscribeMarket", (marketId) => {
    socket.join(`market-${marketId}`);
    console.log(`Socket ${socket.id} subscribed to market ${marketId}`);
  });

  // Handle market unsubscription
  socket.on("unsubscribeMarket", (marketId) => {
    socket.leave(`market-${marketId}`);
    console.log(`Socket ${socket.id} unsubscribed from market ${marketId}`);
  });

  // Handle disconnection
  socket.on("disconnect", (reason) => {
    console.log("User disconnected:", socket.id, reason);
    connectedUsers.delete(socket.id);
  });
});

// Function to broadcast market updates
async function broadcastMarketUpdate(marketId, updateData) {
  // Fetch updated market data
  const markets = await getMarkets();
  const updatedMarket = markets.find(m => m.id === marketId);

  if (updatedMarket) {
    io.to(`market-${marketId}`).emit("marketUpdate", {
      market: updatedMarket,
      update: updateData,
      timestamp: new Date()
    });
  }
}

// Function to broadcast prediction placed
async function broadcastPredictionPlaced(userId, predictionData) {
  // Notify the user
  const userSocketId = Array.from(connectedUsers.entries())
    .find(([_, uid]) => uid === userId)?.[0];

  if (userSocketId) {
    io.to(userSocketId).emit("predictionPlaced", {
      prediction: predictionData,
      timestamp: new Date()
    });
  }

  // Also notify any market subscribers
  // (In a real app, you'd determine which market this prediction belongs to)
}

// Function to broadcast balance updates
async function broadcastBalanceUpdate(userId, balanceData) {
  const userSocketId = Array.from(connectedUsers.entries())
    .find(([_, uid]) => uid === userId)?.[0];

  if (userSocketId) {
    io.to(userSocketId).emit("balanceUpdate", {
      balance: balanceData,
      timestamp: new Date()
    });
  }
}

// Function to broadcast new notifications
async function broadcastNotification(userId, notificationData) {
  const userSocketId = Array.from(connectedUsers.entries())
    .find(([_, uid]) => uid === userId)?.[0];

  if (userSocketId) {
    io.to(userSocketId).emit("notification", {
      notification: notificationData,
      timestamp: new Date()
    });
  }
}

// Export functions for use in server actions
module.exports = {
  io,
  broadcastMarketUpdate,
  broadcastPredictionPlaced,
  broadcastBalanceUpdate,
  broadcastNotification
};

// Keep server alive
console.log(`Socket.IO server running on port ${PORT}`);