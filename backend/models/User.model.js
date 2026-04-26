const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide full name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['admin', 'attorney', 'consultant', 'client'],
        default: 'consultant',
        required: [true, 'Please specify user role']
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    avatar: {
        type: String
    },
    casesAssigned: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case'
    }],
    // For attorney users, links the attorney to their law firm.
    lawFirm: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LawFirm'
    },
    lastLogin: {
        type: Date
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshToken: String
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    // Only hash if password is modified
    if (!this.isModified('password')) {
        return next();
    }

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

module.exports = mongoose.model('User', userSchema);
