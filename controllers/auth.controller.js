const { db } = require("../config/database");
const { User, Role } = db;
const { Op } = require("sequelize");
const authService = require("../services/auth.service");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ENV_VARIABLE } = require("../constants/envVariable.constant");

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, contact_number, password, role_id } = req.body;

    // Validation
    if (!username || !email || !password || !role_id) {
      return res.status(400).json({
        success: false,
        message: "Username, email, password, and role_id are required"
      });
    }

    // Check if username already exists
    const existingUsername = await authService.findUser({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists"
      });
    }

    // Check if email already exists
    const existingEmail = await authService.findUser({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Check if contact number already exists (if provided)
    if (contact_number) {
      const existingContact = await authService.findUser({ where: { contact_number } });
      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: "Contact number already exists"
        });
      }
    }

    // Validate role exists
    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Invalid role_id"
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Prepare user data
    const userData = {
      username,
      email,
      contact_number,
      password: hashedPassword,
      role_id,
      is_verified: false // Default to false, can be verified later
    };

    // Create user
    const newUser = await authService.registerUser(userData);

    // Remove password from response
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      contact_number: newUser.contact_number,
      role_id: newUser.role_id,
      is_verified: newUser.is_verified,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userResponse
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    // Find user by username or email
    const user = await authService.findUser({
      where: {
        [Op.or]: [
          { username: username },
          { email: username }
        ]
      },
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(401).json({
        success: false,
        message: "Account not verified. Please verify your account first."
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role?.role_name
    };

    const token = jwt.sign(
      tokenPayload,
      ENV_VARIABLE.JWT_SECRET,
      { expiresIn: ENV_VARIABLE.JWT_TOKEN_EXPIRATION || '24h' }
    );

    // Remove password from response
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      contact_number: user.contact_number,
      role_id: user.role_id,
      role_name: user.role?.role_name,
      is_verified: user.is_verified
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token: token
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From JWT middleware

    const user = await authService.findUser({
      where: { id: userId },
      include: [{
        model: Role,
        as: 'role'
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Remove password from response
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      contact_number: user.contact_number,
      role_id: user.role_id,
      role_name: user.role?.role_name,
      is_verified: user.is_verified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      data: userResponse
    });

  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Logout (client-side token removal)
const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You can implement token blacklisting here if needed
    res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout
};
