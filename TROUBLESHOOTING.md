# 🔧 Socket.IO Connection Troubleshooting Guide

## 🚨 Common Issues & Solutions

### **Issue 1: "xhr poll error" Connection Errors**

**Symptoms:**
- Connection errors every 2-5 seconds
- "xhr poll error" messages in console
- Client cannot connect to server

**Causes:**
1. **Port Mismatch**: Client trying to connect to wrong port
2. **Server Not Running**: Socket.IO server not started
3. **CORS Issues**: Browser blocking connection
4. **Firewall/Network**: Network blocking WebSocket connections

**Solutions:**

#### **Step 1: Check Server Status**
```bash
# Make sure your server is running
npm run dev

# Check if it's running on the correct port
# Look for: "Socket.IO server is ready for real-time connections"
```

#### **Step 2: Verify Port Configuration**
- **Server runs on**: Port 5000 (check your .env file)
- **Client connects to**: Port 5000 (updated in test-client.html)
- **Test endpoint**: `http://localhost:5000/socket-test`

#### **Step 3: Test Basic Connection**
1. Open: `http://localhost:5000/connection-test.html`
2. Click "Test Server Status" - should show server info
3. Click "Connect to Socket" - should connect successfully

#### **Step 4: Check Browser Console**
- Open Developer Tools (F12)
- Look for connection errors
- Check Network tab for failed requests

### **Issue 2: Authentication Errors**

**Symptoms:**
- "Authentication failed" errors
- Connection established but immediately fails

**Solutions:**

#### **Step 1: Get Valid JWT Token**
```bash
# Use your login API to get a valid token
POST /api/auth/login
{
  "username": "your_username",
  "password": "your_password"
}
```

#### **Step 2: Check Token Format**
- Token should be a long string starting with "eyJ..."
- Make sure it's not expired
- Copy the entire token, not just part of it

#### **Step 3: Test Token in Test Client**
1. Open: `http://localhost:5000/test/test-client.html`
2. Paste your JWT token
3. Click "Connect to Socket"

### **Issue 3: CORS Errors**

**Symptoms:**
- "CORS policy" errors in console
- Connection blocked by browser

**Solutions:**

#### **Step 1: Check Server CORS Configuration**
```javascript
// In index.js - should look like this:
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  }
});
```

#### **Step 2: Restart Server After Changes**
```bash
# Stop server (Ctrl+C) and restart
npm run dev
```

### **Issue 4: Network/Firewall Issues**

**Symptoms:**
- Connection timeout
- "Connection refused" errors
- Works on localhost but not from other devices

**Solutions:**

#### **Step 1: Check Firewall Settings**
- Windows: Allow Node.js through firewall
- Mac: Check System Preferences > Security & Privacy
- Linux: Check iptables/ufw settings

#### **Step 2: Check Network Configuration**
```javascript
// If connecting from other devices, update client URL:
const socket = io('http://YOUR_SERVER_IP:5000', {
  auth: { token: 'your-token' }
});
```

## 🧪 Testing Steps

### **1. Basic Server Test**
```bash
# Test if server is running
curl http://localhost:5000/socket-test

# Should return:
{
  "status": "Socket.IO server is running",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "connections": 0
}
```

### **2. Connection Test Page**
1. Open: `http://localhost:5000/connection-test.html`
2. Click "Test Server Status" - should show server info
3. Click "Connect to Socket" - should connect
4. Click "Send Ping" - should receive pong response

### **3. Full Test Client**
1. Open: `http://localhost:5000/test/test-client.html`
2. Enter valid JWT token
3. Click "Connect to Socket"
4. Enter room ID and click "Join Room"
5. Test chat and game actions

## 🔍 Debug Information

### **Server Logs**
Look for these messages in your terminal:
```
✅ Socket.IO server is ready for real-time connections
✅ Socket connected: [socket-id] for user: [user-id]
✅ User [user-id] joined room [room-id]
```

### **Client Logs**
Check browser console for:
```
✅ Connected to server
✅ Room joined: [room-data]
✅ Player joined room: [player-data]
```

### **Common Error Messages**
```
❌ "xhr poll error" → Port/network issue
❌ "Authentication failed" → Invalid/expired token
❌ "CORS policy" → CORS configuration issue
❌ "Connection refused" → Server not running
```

## 🚀 Quick Fix Checklist

- [ ] Server running (`npm run dev`)
- [ ] Server shows "Socket.IO server is ready"
- [ ] Client connecting to correct port (5000)
- [ ] Valid JWT token
- [ ] No firewall blocking
- [ ] Browser console shows no errors
- [ ] Connection test page works
- [ ] Full test client works

## 📞 Still Having Issues?

If you're still experiencing problems:

1. **Check server logs** for specific error messages
2. **Test with connection-test.html** first
3. **Verify all configuration** matches the examples above
4. **Try different browser** to rule out browser-specific issues
5. **Check if port 5000 is available** (no other services using it)

## 🔧 Advanced Debugging

### **Enable Socket.IO Debug Mode**
```javascript
// In index.js, add debug: true
const io = new Server(httpServer, {
  cors: { /* ... */ },
  debug: true  // Add this line
});
```

### **Check Socket.IO Version Compatibility**
```bash
# Make sure versions match
npm list socket.io
npm list socket.io-client
```

### **Test with Different Transports**
```javascript
// In client, try forcing specific transport
const socket = io('http://localhost:5000', {
  transports: ['websocket'], // Force WebSocket only
  auth: { token: 'your-token' }
});
```

---

**Remember**: Always start with the connection test page to isolate the issue before testing the full game client! 🎯
