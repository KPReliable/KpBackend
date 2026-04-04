import mongoose,{ Schema,Document } from "mongoose";

export interface IContactUs extends Document {
    name: string;
    email: string;
    message: string;
    phonenumber: string;
    // ServiceInterestedIn :string;
}

const ContactUsSchema = new Schema<IContactUs>({
    name: {
        type: String,
        required: [true, "Name is required"],   

    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,    
    },
    message: {
        type: String,
        required: [true, "Message is required"],
    },
    phonenumber: {

        type: String,
        required: [true, "Phone number is required"],
    },

    // ServiceInterestedIn: {
    //     type: String,
    //     // required: [true, "Service Interested In is required"], 
    // },
},
{
    timestamps: true,
    collection: "contactus",
});


 const contactSchema=mongoose.model<IContactUs>("ContactUs", ContactUsSchema);
    export default contactSchema;






