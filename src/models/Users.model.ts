import mongoose,{Schema} from 'mongoose';
interface IUser {
    name: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
    createdAt?: Date;
}
const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
        trim: true,
        lowercase:true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim:true,
        lowercase:true
    },
    password: {
        type: String,
        required: true,
        trim:true,
        lowercase:true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
},{timestamps:true});
export const User=mongoose.model('User', userSchema);