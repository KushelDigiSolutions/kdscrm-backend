import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: [true, "Provider is required"],
    enum: {
      values: [
        "Interakt",
        "WATI",
        "Netcore",
        "Pinnacle",
        "Moplet",
        "Twilio",
        "Gupshup",
        "Whatzapi",
        "Fubelight",
        "GreenAdsGlobal"
      ],
      message: "Invalid provider. Please select a valid provider."
    }
  },
  credentials: {
    apiKey: {
      type: String,
      trim: true
    },
    apiSecret: {
      type: String,
      trim: true
    },
    accessToken: {
      type: String,
      trim: true
    },
    refreshToken: {
      type: String,
      trim: true
    },

    phoneNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty values
          return /^\+?[1-9]\d{1,14}$/.test(v);
        },
        message: "Phone number must be in valid international format"
      }
    },
    fromNumber: {
      type: String,
      required: [true, "From number is required for sending messages"],
      trim: true,
      validate: {
        validator: function(v) {
          return /^\+?[1-9]\d{1,14}$/.test(v);
        },
        message: "From number must be in valid international format"
      }
    },
    sid: {
      type: String,
      trim: true
    },
    authToken: {
      type: String,
      trim: true
    },
    clientId: {
      type: String,
      trim: true
    },
    clientSecret: {
      type: String,
      trim: true
    },
    additional: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  organizationId: {
    type: String,
    required: [true, "Organization ID is required"],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Hide sensitive credentials in JSON response
      if (ret.credentials) {
        const sensitiveFields = ['apiSecret', 'accessToken', 'refreshToken', 'authToken', 'clientSecret'];
        sensitiveFields.forEach(field => {
          if (ret.credentials[field]) {
            ret.credentials[field] = '***HIDDEN***';
          }
        });
      }
      return ret;
    }
  }
});

// Index for better query performance
integrationSchema.index({ organizationId: 1, provider: 1 });
integrationSchema.index({ organizationId: 1, isActive: 1 });

// Pre-save middleware to update updatedAt
integrationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find active integrations
integrationSchema.statics.findActiveByOrganization = function(organizationId) {
  return this.find({ organizationId, isActive: true });
};

// Instance method to deactivate integration
integrationSchema.methods.deactivate = function() {
  this.isActive = false;
  this.updatedAt = new Date();
  return this.save();
};

// Instance method to update last used timestamp
integrationSchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  this.updatedAt = new Date();
  return this.save();
};

const Integration = mongoose.model("Integration", integrationSchema);
export default Integration;