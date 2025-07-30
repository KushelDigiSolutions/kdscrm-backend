
import twilio from "twilio";
import Integration from "../../models/Interegation.js"

// Validation helper function
import mongoose from "mongoose";

const validateIntegrationData = (data) => {
  const errors = [];

  if (!data.provider) {
    errors.push("Provider is required");
  }

  if (!data.credentials) {
    errors.push("Credentials are required");
  } else {
    if (!data.credentials.fromNumber) {
      errors.push("From number is required in credentials");
    }
  }

  return errors;
};

// ✅ Create Integration
export const createIntegration = async (req, res) => {
  try {
    const { organizationId } = req.user;

    // Extract data properly (handle both formData wrapper and direct body)
    const integrationData = req.body.formData || req.body;
    const { provider, credentials } = integrationData;

    // Validate required fields
    const validationErrors = validateIntegrationData({ provider, credentials });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }

    // Check if integration with same provider already exists for this organization
    const existingIntegration = await Integration.findOne({
      organizationId,
      provider,
      isActive: true
    });

    if (existingIntegration) {
      return res.status(409).json({
        success: false,
        message: `Integration with ${provider} already exists for this organization`
      });
    }

    // Create new integration
    const newIntegration = new Integration({
      provider,
      credentials: {
        ...credentials,
        fromNumber: credentials.fromNumber // Ensure fromNumber is included
      },
      organizationId
    });

    const savedIntegration = await newIntegration.save();

    res.status(201).json({
      success: true,
      message: "Integration created successfully",
      data: savedIntegration
    });
  } catch (error) {
    console.error("Error creating integration:", error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Get All Integrations by Organization
export const getAllIntegrations = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { isActive, provider } = req.query;

    // Build filter object
    const filter = { organizationId };

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (provider) {
      filter.provider = provider;
    }

    const integrations = await Integration.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Integrations retrieved successfully",
      data: integrations,
      count: integrations.length
    });
  } catch (error) {
    console.error("Error fetching integrations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Get Active Integrations Only
export const getActiveIntegrations = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const integrations = await Integration.findActiveByOrganization(organizationId);

    res.status(200).json({
      success: true,
      message: "Active integrations retrieved successfully",
      data: integrations,
      count: integrations.length
    });
  } catch (error) {
    console.error("Error fetching active integrations:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Get Single Integration by ID
export const getIntegrationById = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID format"
      });
    }

    const integration = await Integration.findOne({
      _id: id,
      organizationId
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "Integration not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Integration retrieved successfully",
      data: integration
    });
  } catch (error) {
    console.error("Error fetching integration:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Update Integration
export const updateIntegration = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID format"
      });
    }

    // Extract update data properly
    const updateData = req.body.formData || req.body;
    const { provider, credentials, isActive } = updateData;

    // Build update object
    const updateFields = {};

    if (provider) updateFields.provider = provider;
    if (credentials) updateFields.credentials = credentials;
    if (isActive !== undefined) updateFields.isActive = isActive;

    // Always update the updatedAt field
    updateFields.updatedAt = new Date();

    // If updating credentials, ensure fromNumber is included
    if (credentials && !credentials.fromNumber) {
      return res.status(400).json({
        success: false,
        message: "From number is required in credentials"
      });
    }

    const updatedIntegration = await Integration.findOneAndUpdate(
      { _id: id, organizationId },
      updateFields,
      {
        new: true,
        runValidators: true // Run schema validators on update
      }
    );

    if (!updatedIntegration) {
      return res.status(404).json({
        success: false,
        message: "Integration not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Integration updated successfully",
      data: updatedIntegration
    });
  } catch (error) {
    console.error("Error updating integration:", error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Delete Integration (Soft Delete)
export const deleteIntegration = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;
    const { permanent } = req.query; // Allow permanent deletion via query param

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID format"
      });
    }

    if (permanent === 'true') {
      // Permanent deletion
      const deletedIntegration = await Integration.findOneAndDelete({
        _id: id,
        organizationId
      });

      if (!deletedIntegration) {
        return res.status(404).json({
          success: false,
          message: "Integration not found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Integration permanently deleted successfully"
      });
    } else {
      // Soft delete (deactivate)
      const integration = await Integration.findOne({
        _id: id,
        organizationId
      });

      if (!integration) {
        return res.status(404).json({
          success: false,
          message: "Integration not found"
        });
      }

      await integration.deactivate();

      res.status(200).json({
        success: true,
        message: "Integration deactivated successfully"
      });
    }
  } catch (error) {
    console.error("Error deleting integration:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Restore Deactivated Integration
export const restoreIntegration = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID format"
      });
    }

    const restoredIntegration = await Integration.findOneAndUpdate(
      { _id: id, organizationId },
      {
        isActive: true,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!restoredIntegration) {
      return res.status(404).json({
        success: false,
        message: "Integration not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Integration restored successfully",
      data: restoredIntegration
    });
  } catch (error) {
    console.error("Error restoring integration:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Update Last Used Timestamp
export const updateIntegrationLastUsed = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID format"
      });
    }

    const integration = await Integration.findOne({
      _id: id,
      organizationId
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "Integration not found"
      });
    }

    await integration.updateLastUsed();

    res.status(200).json({
      success: true,
      message: "Integration last used timestamp updated successfully"
    });
  } catch (error) {
    console.error("Error updating last used timestamp:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export const sendMessage = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { num, message, tech } = req.body
    const provider = await Integration.findOne({ provider: tech, organizationId });

    const client = twilio(provider.credentials.sid, provider.credentials.authToken);
    const call = await client.messages.create({
      from: `whatsapp:${provider.credentials.fromNumber}`,
      to: `whatsapp:${num}`,
      body: message || "Hello from HRMS"
    })

    return res.status(201).json({success:true, message:'Message'})
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message })
  }
}