import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema(
    {
        entityType: {
            type: String,
            enum: ["Client", "Project"], // kis type ka entity
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "entityTypeRef", // dynamic reference
        },
        entityTypeRef: {
            type: String,
            enum: ["Clients", "Projects"], // model references
            required: true,
        },
        action: {
            type: String,
            enum: ["Created", "Updated", "Deleted"],
            required: true,
        },
        description: {
            type: String,
        },
        performedBy: {
            type: String
        },
        organizationId: {
            type: String,
            required: true,
        },
        deletedDataName: {
            type: String,
        }
    },
    { timestamps: true } 
);

const Timeline = mongoose.model("Timeline", timelineSchema);

export default Timeline;
