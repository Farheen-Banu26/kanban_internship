import mongoose from 'mongoose';

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'];
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: TASK_STATUSES,
        message: 'Invalid task status',
      },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: {
        values: TASK_PRIORITIES,
        message: 'Invalid task priority',
      },
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    labels: {
      type: [String],
      default: [],
      validate: {
        validator: (labels) => labels.length <= 10,
        message: 'Cannot have more than 10 labels',
      },
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace is required'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attachments: {
      type: [
        {
          _id: mongoose.Schema.Types.ObjectId,
          fileName: { type: String, required: true },
          originalName: { type: String, required: true },
          fileType: { type: String, required: true },
          fileSize: { type: Number, required: true },
          fileUrl: { type: String, required: true },
          uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        }
      ],
      default: [],
    },
    comments: {
      type: [
        {
          _id: mongoose.Schema.Types.ObjectId,
          text: {
            type: String,
            required: true,
            trim: true,
            maxlength: [4000, 'Comment cannot exceed 4000 characters'],
          },
          author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
          },
          mentions: {
            type: [String],
            default: [],
          },
          edited: {
            type: Boolean,
            default: false,
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
          updatedAt: {
            type: Date,
            default: Date.now,
          },
        }
      ],
      default: [],
    },
  },
  { timestamps: true }
);

taskSchema.index({ workspace: 1, status: 1 });
taskSchema.index({ workspace: 1, assignee: 1 });

const Task = mongoose.model('Task', taskSchema);

export default Task;
