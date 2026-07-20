import mongoose from 'mongoose';
import { generateInviteCode } from '../utils/generateInviteCode.js';
import { ROLES } from '../utils/rbac.js';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      maxlength: [100, 'Workspace name cannot exceed 100 characters'],
    },
    purpose: {
      type: String,
      required: [true, 'Workspace purpose is required'],
      trim: true,
      maxlength: [500, 'Workspace purpose cannot exceed 500 characters'],
    },
    inviteCode: {
      type: String,
      unique: true,
      uppercase: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    memberRoles: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ROLES,
          default: 'member',
        },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

workspaceSchema.pre('save', async function () {
  if (this.inviteCode) return;

  let code;
  let exists = true;
  const WorkspaceModel = this.constructor;

  while (exists) {
    code = generateInviteCode();
    exists = await WorkspaceModel.exists({ inviteCode: code });
  }

  this.inviteCode = code;
});

const Workspace = mongoose.model('Workspace', workspaceSchema);

export default Workspace;
