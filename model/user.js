const { createHmac, randomBytes } = require('crypto');
const { Schema, model } = require('mongoose');
const { createusertoken } = require('../services/authuntication');

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    salt: {
        type: String,
    },
    password: {
        type: String,
        required: true,
    },
    publicProfileUrl: {
        type: String,
        default: "/app/images/default.png",
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    }
}, { timestamps: true });

userSchema.pre("save", function (next) {
    const user = this;

    // Only hash the password if it has been modified (or is new)
    if (!user.isModified("password")) return next();

    // Generate a unique salt for each user
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = createHmac("sha256", salt).update(user.password).digest("hex");

    console.log("Hashed Password during signup:", hashedPassword); // Log during signup
    user.salt = salt;
    user.password = hashedPassword;

    next();
});

userSchema.static("mismatch", async function (email, password) {
    try {
        const user = await this.findOne({ email });
        if (!user) return null;

        const salt = user.salt; // Use the user's salt
        const userHashedPassword = user.password;

        const hashedPassword = createHmac("sha256", salt).update(password).digest("hex");

        console.log("Hashed Password during sign-in:", hashedPassword); // Log during sign-in
        console.log("Stored Hashed Password:", userHashedPassword);

        if (hashedPassword === userHashedPassword) {
            const token = createusertoken(user);
            return token;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error during password comparison:", error);
        throw error; // Rethrow error for further handling
    }
});

const User = model('User', userSchema); 
module.exports = User; // Export the User model
