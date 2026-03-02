import mongoose, {Document, Schema} from "mongoose";

interface IDocument extends Document {
    name: string
    content: string,
    date: Date,
    lastModified: Date,
    userID: string
    shared: string[]
    viewOnly: boolean,
    userEditing: string
}

const DocumentSchema: Schema = new Schema({
    name: {type: String, required: true},
    content: {type: String},
    date: {type: Date, default: Date.now},
    lastModified: {type: Date, default: Date.now},
    userID: { type: String, required: true },
    shared: [{ type: String}],
    viewOnly: { type: Boolean },
    userEditing: { type: String, default: null}
})

const DocumentModel: mongoose.Model<IDocument> = mongoose.model<IDocument>("Document", DocumentSchema)

export { DocumentModel, IDocument }