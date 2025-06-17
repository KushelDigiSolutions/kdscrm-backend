import mongoose from 'mongoose';
const mySchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    offerFormat: {
        type: Array,
        letterName:String,
        default: [
            "offerLetter", "joiningLetter", "experienceLetter"
        ],
    },
    letterSlip:String

});

const OfferLetter = mongoose.model('OfferLetter', mySchema);

export default OfferLetter;
