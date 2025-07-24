import mongoose from "mongoose";

const emailSchema = new mongoose.Schema({
    organizationId: {
        type: String,
        unique: true,
        required: true,
    },
    host: {
        type: String,
        required: true,
       
    },
    port: {
        type: Number,
        default: 465,
    },
    secure: {
        type: Boolean,
        default: true,
    },
    user: {
        type: String,
        required: true,
    },
    pass: {
        type: String,
        required: true,
    },
    from: {
        type: String,
        required: true,
    },
}, { timestamps: true });

// Moved middleware ABOVE model creation
emailSchema.pre("save", function (next) {
    if (!this.port) {
        switch (this.host) {
            case "smtp.gmail.com":
            case "smtp.mail.yahoo.com":
            case "smtp.zoho.in":
                this.port = 465;
                this.secure = true;
                break;
            case "smtp.office365.com":
            case "smtp.mailgun.org":
                this.port = 587;
                this.secure = false;
                break;
            default:
                this.port = 587;
                this.secure = false;
        }
    }
    next();
});

const EmailModel = mongoose.model("Email", emailSchema);
export default EmailModel;
