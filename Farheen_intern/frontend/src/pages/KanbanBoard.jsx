import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import api from '../services/api';
import { createSocketClient } from '../services/socket';
import { useAuth } from '../context/AuthContext';

const COLUMNS = [
  { id: 'todo', title: 'To Do', color: 'bg-surface-400', accent: 'border-surface-300' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500', accent: 'border-blue-300' },
  { id: 'review', title: 'Review', color: 'bg-amber-500', accent: 'border-amber-300' },
  { id: 'done', title: 'Done', color: 'bg-emerald-500', accent: 'border-emerald-300' },
];

const PRIORITY_CONFIG = {
  low: { label: 'Low', text: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  medium: { label: 'Medium', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  high: { label: 'High', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  urgent: { label: 'Urgent', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
};

const GRADIENT_SETS = [
  'from-brand-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600',
  'from-cyan-500 to-blue-600',
];

function FilterSelect({ id, label, value, options, onChange }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-surface-600 dark:text-slate-400">
      <span>{label}</span>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="rounded-xl border border-surface-300 bg-surface-50 px-3 py-2 text-sm text-surface-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SearchInput({ id, value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-surface-600 dark:text-slate-400">
      <span>Search</span>
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          id={id}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full min-w-[180px] rounded-xl border border-surface-300 bg-surface-50 pl-9 pr-4 py-2 text-sm placeholder:text-surface-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>
    </label>
  );
}

function TaskModal({ isOpen, onClose, task, workspaceId, members, onSuccess, role, currentUserId, socketRef }) {
  const isEdit = !!task?.id;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState('');
  const [assignee, setAssignee] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentMentions, setCommentMentions] = useState([]);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentTextareaRef = useRef(null);
  const commentsEndRef = useRef(null);

  const mentionCandidates = useMemo(() => {
    const query = mentionQuery.trim().toLowerCase();
    return (members || [])
      .filter((member) => {
        const name = (member.name || '').toLowerCase();
        const email = (member.email || '').toLowerCase();
        return !query || name.includes(query) || email.includes(query);
      })
      .slice(0, 6);
  }, [members, mentionQuery]);

  // Initialize fields on open or task change
  useEffect(() => {
    if (isOpen) {
      setError('');
      setCommentText('');
      setCommentMentions([]);
      setEditingCommentId(null);
      setMentionQuery('');
      if (task) {
        setTitle(task.title || '');
        setDescription(task.description || '');
        setStatus(task.status || 'todo');
        setPriority(task.priority || 'medium');
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 10) : '');
        setLabels(task.labels ? task.labels.join(', ') : '');
        setAssignee(task.assignee?.id || task.assignee?._id || '');
        setAttachments(task.attachments || []);
      } else {
        setTitle('');
        setDescription('');
        setStatus('todo');
        setPriority('medium');
        setDueDate('');
        setLabels('');
        setAssignee('');
        setAttachments([]);
      }
    }
  }, [isOpen, task]);

  useEffect(() => {
    if (!isOpen || !task?.id) {
      setComments([]);
      setCommentsLoading(false);
      return;
    }

    let isMounted = true;
    const loadComments = async () => {
      setCommentsLoading(true);
      setError('');
      try {
        const response = await api.get(`/tasks/${task.id}/comments`);
        if (isMounted) {
          setComments(response.data.data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load comments.');
        }
      } finally {
        if (isMounted) {
          setCommentsLoading(false);
        }
      }
    };

    loadComments();

    const socket = socketRef?.current;
    const handleCommentAdded = (payload) => {
      if (payload?.taskId !== task?.id) return;
      setComments((prevComments) => [payload.comment, ...prevComments]);
    };
    const handleCommentUpdated = (payload) => {
      if (payload?.taskId !== task?.id) return;
      setComments((prevComments) => prevComments.map((comment) => (comment.id === payload.comment.id ? payload.comment : comment)));
    };
    const handleCommentDeleted = (payload) => {
      if (payload?.taskId !== task?.id) return;
      setComments((prevComments) => prevComments.filter((comment) => comment.id !== payload.commentId));
    };

    if (socket) {
      socket.on('comment_added', handleCommentAdded);
      socket.on('comment_updated', handleCommentUpdated);
      socket.on('comment_deleted', handleCommentDeleted);
    }

    return () => {
      isMounted = false;
      if (socket) {
        socket.off('comment_added', handleCommentAdded);
        socket.off('comment_updated', handleCommentUpdated);
        socket.off('comment_deleted', handleCommentDeleted);
      }
    };
  }, [isOpen, task?.id, socketRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError('');
    setSubmitting(true);

    const labelsArray = labels
      ? labels.split(',').map((l) => l.trim()).filter((l) => l !== '')
      : [];

    const payload = {
      title,
      description,
      status,
      priority,
      dueDate: dueDate || null,
      labels: labelsArray,
      assignee: assignee || null,
      workspace: workspaceId,
    };

    try {
      if (isEdit) {
        await api.put(`/tasks/${task.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save task.');
    } finally {
      setSubmitting(false);
    }
  };

  const canManageTask = role === 'owner' || role === 'admin' || (task?.createdBy?.id === currentUserId || task?.createdBy?._id === currentUserId || task?.createdBy === currentUserId);

  const resetCommentComposer = () => {
    setCommentText('');
    setCommentMentions([]);
    setEditingCommentId(null);
    setMentionQuery('');
  };

  const handleCommentInputChange = (event) => {
    const value = event.target.value.slice(0, 1000);
    setCommentText(value);
    const cursor = event.target.selectionStart;
    const beforeCursor = value.slice(0, cursor);
    const match = beforeCursor.match(/@([\w.-]*)$/);
    setMentionQuery(match?.[1] || '');
  };

  const handleCommentKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleCommentSubmit(event);
    }
  };

  const handleMentionSelect = (member) => {
    const label = member.name || member.email || 'member';
    const mentionValue = label.trim().toLowerCase().replace(/\s+/g, '');
    const textarea = commentTextareaRef.current;
    const start = textarea?.selectionStart ?? commentText.length;
    const end = textarea?.selectionEnd ?? commentText.length;
    const before = commentText.slice(0, start);
    const after = commentText.slice(end);
    const match = before.match(/@([\w.-]*)$/);
    const insertText = `@${mentionValue} `;
    const nextBefore = match ? before.slice(0, match.index) + insertText : before + insertText;

    setCommentText(`${nextBefore}${after}`);
    setCommentMentions((prev) => (prev.includes(mentionValue) ? prev : [...prev, mentionValue]));
    setMentionQuery('');
    setShowEmojiPicker(false);

    requestAnimationFrame(() => {
      const newCursor = (nextBefore + insertText).length;
      if (commentTextareaRef.current) {
        commentTextareaRef.current.focus();
        commentTextareaRef.current.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  const insertEmoji = (emoji) => {
    const textarea = commentTextareaRef.current;
    const start = textarea?.selectionStart ?? commentText.length;
    const end = textarea?.selectionEnd ?? commentText.length;
    const nextValue = `${commentText.slice(0, start)}${emoji}${commentText.slice(end)}`;
    setCommentText(nextValue.slice(0, 1000));
    setShowEmojiPicker(false);
    requestAnimationFrame(() => {
      if (commentTextareaRef.current) {
        commentTextareaRef.current.focus();
        const position = start + emoji.length;
        commentTextareaRef.current.setSelectionRange(position, position);
      }
    });
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!task?.id || !commentText.trim()) return;

    setCommentSubmitting(true);
    setError('');

    try {
      if (editingCommentId) {
        const response = await api.put(`/tasks/${task.id}/comments/${editingCommentId}`, {
          text: commentText.trim(),
          mentions: commentMentions,
        });
        const updatedComment = response.data.data;
        setComments((prev) => prev.map((comment) => (comment.id === updatedComment.id ? updatedComment : comment)));
        toast.success('Comment Updated');
      } else {
        const response = await api.post(`/tasks/${task.id}/comments`, {
          text: commentText.trim(),
          mentions: commentMentions,
        });
        setComments((prev) => [response.data.data, ...prev]);
        toast.success('Comment Added');
      }
      resetCommentComposer();
      requestAnimationFrame(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCommentEdit = (comment) => {
    setEditingCommentId(comment.id);
    setCommentText(comment.text || '');
    setCommentMentions(comment.mentions || []);
    setMentionQuery('');
  };

  const handleCommentDelete = async (commentId) => {
    if (!task?.id) return;
    try {
      await api.delete(`/tasks/${task.id}/comments/${commentId}`);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      if (editingCommentId === commentId) {
        resetCommentComposer();
      }
      toast.success('Comment Deleted');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete comment.');
    }
  };

  const handleCopyComment = async (comment) => {
    try {
      await navigator.clipboard.writeText(comment.text || '');
      toast.success('Comment Copied');
    } catch (err) {
      console.error(err);
      toast.error('Unable to copy comment');
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !task?.id) return;

    setUploadingAttachment(true);
    setError('');

    const formData = new FormData();
    formData.append('attachment', file);

    try {
      const response = await api.post(`/tasks/${task.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAttachments(response.data.data.attachments || []);
      toast.success('Attachment uploaded');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload attachment.');
    } finally {
      setUploadingAttachment(false);
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!task?.id) return;
    try {
      await api.delete(`/tasks/${task.id}/attachments/${attachmentId}`);
      setAttachments((prev) => prev.filter((item) => item._id !== attachmentId));
      toast.success('Attachment removed');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete attachment.');
    }
  };

  const formatRelativeTime = (value) => {
    if (!value) return 'Just now';

    const diffMs = Date.now() - new Date(value).getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 60) return 'Just now';

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
  };

  const renderCommentText = (text, mentions = []) => {
    if (!text) return null;

    const parts = text.split(/(@[\w.-]+)/g).filter(Boolean);

    return parts.map((part, index) => {
      const mentionValue = part.startsWith('@') ? part.slice(1).toLowerCase() : null;
      const isMention = mentionValue && mentions.some((entry) => entry.toLowerCase() === mentionValue);

      return (
        <span
          key={`${part}-${index}`}
          className={isMention ? 'rounded bg-brand-50 px-1 font-semibold text-brand-700' : ''}
        >
          {part}
        </span>
      );
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setError('');
    setSubmitting(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete task.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl animate-in fade-in zoom-in max-h-[90vh] overflow-y-auto dark:bg-slate-900 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-surface-900 dark:text-slate-100">
            {isEdit ? 'Task Details' : 'Create Task'}
          </h3>
          {isEdit && canManageTask && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Delete Task
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/70 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label htmlFor="task-title" className="block text-xs font-semibold text-surface-700 dark:text-slate-300">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task summary"
              className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-2.5 text-sm text-surface-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="task-desc" className="block text-xs font-semibold text-surface-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              id="task-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-2.5 text-sm text-surface-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all resize-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
            />
          </div>

          {/* Row 1: Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="task-status" className="block text-xs font-semibold text-surface-700 dark:text-slate-300">
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-surface-300 bg-surface-50 px-3 py-2 text-sm text-surface-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="task-priority" className="block text-xs font-semibold text-surface-700 dark:text-slate-300">
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-surface-300 bg-surface-50 px-3 py-2 text-sm text-surface-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Attachments */}
          {isEdit && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-surface-700 dark:text-slate-300">
                Attachments
              </label>
              <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-surface-300 bg-surface-50 px-3 py-3 text-sm font-medium text-surface-600 transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                <input type="file" className="hidden" onChange={handleUpload} />
                {uploadingAttachment ? 'Uploading...' : 'Upload attachment'}
              </label>
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment._id} className="flex items-center justify-between rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-surface-800">{attachment.originalName || attachment.fileName}</p>
                        <p className="text-xs text-surface-500">{Math.round((attachment.fileSize || 0) / 1024)} KB</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(attachment._id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Row 2: Due Date & Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="task-dueDate" className="block text-xs font-semibold text-surface-700 dark:text-slate-300">
                Due Date
              </label>
              <input
                id="task-dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-surface-300 bg-surface-50 px-3 py-2 text-sm text-surface-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="task-assignee" className="block text-xs font-semibold text-surface-700 dark:text-slate-300">
                Assignee
              </label>
              <select
                id="task-assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full rounded-xl border border-surface-300 bg-surface-50 px-3 py-2 text-sm text-surface-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
              >
                <option value="">Unassigned</option>
                {members.map((member) => {
                  const mId = member.id || member._id;
                  return (
                    <option key={mId} value={mId}>
                      {member.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-1">
            <label htmlFor="task-labels" className="block text-xs font-semibold text-surface-700">
              Labels (comma separated)
            </label>
            <input
              id="task-labels"
              type="text"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="e.g., bug, frontend, api"
              className="w-full rounded-xl border border-surface-300 bg-surface-50 px-4 py-2 text-sm text-surface-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
            />
          </div>

          {/* Comments */}
          {isEdit && (
            <div className="space-y-3 rounded-2xl border border-surface-200 bg-surface-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-surface-800 dark:text-slate-100">Comments</p>
                  <p className="text-[11px] text-surface-500 dark:text-slate-400">Discuss work, mention teammates, and keep context in one place.</p>
                </div>
              </div>

              {commentsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((item) => (
                    <div key={item} className="animate-pulse rounded-xl border border-surface-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                      <div className="h-3 w-24 rounded bg-surface-200 dark:bg-slate-700" />
                      <div className="mt-2 h-3 w-full rounded bg-surface-200 dark:bg-slate-700" />
                      <div className="mt-2 h-3 w-3/4 rounded bg-surface-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {comments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-surface-200 bg-white px-3 py-4 text-center text-sm text-surface-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                      No comments yet. Be the first to start the discussion.
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const isCommentAuthor = comment.author?.id === currentUserId || comment.author?._id === currentUserId || comment.author === currentUserId;
                      const canEditComment = isCommentAuthor || role === 'owner' || role === 'admin';
                      return (
                        <div key={comment.id} className="rounded-xl border border-surface-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-surface-800 dark:text-slate-100">
                                  {comment.author?.name || 'Member'}
                                </span>
                                {comment.edited && (
                                  <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-surface-500 dark:bg-slate-700 dark:text-slate-300">
                                    edited
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 whitespace-pre-wrap text-sm text-surface-700 dark:text-slate-300">
                                {renderCommentText(comment.text, comment.mentions || [])}
                              </div>
                              {comment.mentions?.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {comment.mentions.map((mention) => (
                                    <span key={mention} className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:bg-brand-950/70 dark:text-brand-300">
                                      @{mention}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="mt-2 text-[11px] text-surface-400 dark:text-slate-500">
                                {formatRelativeTime(comment.updatedAt || comment.createdAt)}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopyComment(comment)}
                                className="rounded-md border border-surface-200 px-2 py-1 text-[11px] font-semibold text-surface-600 hover:bg-surface-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                              >
                                Copy
                              </button>
                              {canEditComment && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleCommentEdit(comment)}
                                    className="rounded-md border border-surface-200 px-2 py-1 text-[11px] font-semibold text-surface-600 hover:bg-surface-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCommentDelete(comment.id)}
                                    className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/50"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              <div ref={commentsEndRef} />

              <form onSubmit={handleCommentSubmit} className="space-y-2">
                <textarea
                  ref={commentTextareaRef}
                  rows={3}
                  value={commentText}
                  onChange={handleCommentInputChange}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="Write a comment... Use @ to mention a teammate"
                  className="w-full rounded-xl border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-800 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition-all resize-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <div className="flex items-center justify-between text-[11px] text-surface-500 dark:text-slate-400">
                  <span>{commentText.length}/1000</span>
                  <span>{editingCommentId ? 'Editing comment' : 'Press Enter to send • Shift + Enter for newline'}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['👍', '🎉', '🚀', '✅', '💡'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="rounded-lg border border-surface-200 bg-white px-2 py-1 text-sm hover:bg-surface-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="rounded-lg border border-brand-200 bg-brand-50 px-2 py-1 text-sm font-semibold text-brand-700 dark:border-brand-900 dark:bg-brand-950/70 dark:text-brand-300"
                  >
                    Emoji picker
                  </button>
                </div>

                {showEmojiPicker && (
                  <div className="flex flex-wrap gap-2 rounded-xl border border-surface-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                    {['😀', '😄', '😍', '🤝', '🔥', '💯', '🎉', '🚀', '✅', '⚡'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="rounded-lg border border-surface-200 px-2 py-1 text-lg hover:bg-surface-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {mentionCandidates.length > 0 && (
                  <div className="flex flex-wrap gap-2 rounded-xl border border-surface-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                    {mentionCandidates.map((member) => (
                      <button
                        key={member.id || member._id}
                        type="button"
                        onClick={() => handleMentionSelect(member)}
                        className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 dark:bg-brand-950/70 dark:text-brand-300"
                      >
                        @{member.name || member.email || 'member'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[11px] text-surface-500 dark:text-slate-400">
                    {editingCommentId ? 'Editing comment' : 'Add a comment'}
                  </span>
                  <button
                    type="submit"
                    disabled={commentSubmitting || !commentText.trim()}
                    className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {commentSubmitting ? 'Posting...' : editingCommentId ? 'Save comment' : 'Post comment'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-xl border border-surface-300 px-4 py-2.5 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              id="task-submit-btn"
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TaskCard({ task, onClick, onStatusChange, isUpdating, isDragOverlay, isDragging }) {
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div
      onClick={isDragOverlay ? undefined : onClick}
      role={isDragOverlay ? undefined : 'button'}
      tabIndex={isDragOverlay ? undefined : 0}
      onKeyDown={
        isDragOverlay
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
      }
      className={`group rounded-xl border border-surface-200 bg-white p-4 shadow-sm transition-all ${
        isDragOverlay
          ? 'cursor-grabbing shadow-2xl ring-2 ring-brand-400 rotate-1 scale-[1.02]'
          : isDragging
            ? 'opacity-40 cursor-grabbing'
            : 'cursor-grab hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {task.labels.map((label) => (
                <span key={label} className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Title + description */}
          <div>
            <h4 className="text-sm font-semibold text-surface-800 leading-snug group-hover:text-brand-700 transition-colors">
              {task.title}
            </h4>
            {task.description && (
              <p className="mt-1.5 text-xs text-surface-400 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>
        <div
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <select
            aria-label={`Move ${task.title} to another status`}
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            disabled={isUpdating}
            className="rounded-lg border border-surface-200 bg-surface-50 px-2 py-1.5 text-[11px] font-semibold text-surface-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {COLUMNS.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-surface-100">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${p.text} ${p.bg} border ${p.border}`}>
            {p.label}
          </span>

          {/* Due date */}
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue ? 'text-red-500' : 'text-surface-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white bg-gradient-to-br ${GRADIENT_SETS[task.title.charCodeAt(0) % GRADIENT_SETS.length]}`}
            title={task.assignee.name}
          >
            {task.assignee.name.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableTaskCard({ task, onClick, onStatusChange, isUpdating, disabled }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { type: 'task', task, status: task.status },
    disabled,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : 'transform 200ms cubic-bezier(0.25, 1, 0.5, 1)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="touch-manipulation outline-none"
      {...listeners}
      {...attributes}
    >
      <TaskCard
        task={task}
        onClick={onClick}
        onStatusChange={onStatusChange}
        isUpdating={isUpdating}
        isDragging={isDragging}
      />
    </div>
  );
}

function DroppableColumn({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'column', status: id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 space-y-3 overflow-y-auto px-3 pb-3 min-h-[160px] rounded-xl transition-all duration-200 ${
        isOver ? 'bg-brand-50/90 ring-2 ring-brand-400/60 ring-inset' : ''
      }`}
    >
      {children}
    </div>
  );
}

function resolveDropStatus(over, tasks) {
  if (!over) return null;

  const overData = over.data.current;
  if (overData?.type === 'column') return overData.status;
  if (overData?.type === 'task') return overData.task?.status;

  if (COLUMNS.some((col) => col.id === over.id)) return over.id;

  const overTask = tasks.find((task) => task.id === over.id);
  return overTask?.status ?? null;
}

export default function KanbanBoard() {
  const { workspaceId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('default');
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [activeDragTask, setActiveDragTask] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const socketRef = useRef(null);
  const activeTaskRef = useRef(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [boardRole, setBoardRole] = useState('member');
  const { user } = useAuth();

  const socketUrl = useMemo(() => {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    if (baseUrl && baseUrl !== '/api') {
      return baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '') || window.location.origin;
    }
    return window.location.origin;
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const fetchWorkspaceAndTasks = useCallback(async () => {
    setError('');
    try {
      const workspacesResponse = await api.get('/workspaces');
      const currentWs = workspacesResponse.data.data.find((w) => w.id === workspaceId);
      setWorkspace(currentWs || null);
      setBoardRole(currentWs?.currentUserRole || 'member');

      const tasksResponse = await api.get(`/tasks?workspaceId=${workspaceId}`);
      setTasks(tasksResponse.data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load board details.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    setLoading(true);
    fetchWorkspaceAndTasks();
  }, [fetchWorkspaceAndTasks]);

  useEffect(() => {
    activeTaskRef.current = activeTask;
  }, [activeTask]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!workspaceId || !user || !token) return;

    const socket = createSocketClient(token, socketUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      setSocketError('');
      socket.emit('joinWorkspace', workspaceId);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connect error:', error);
      setSocketConnected(false);
      setSocketError(error?.message || 'Realtime connection failed');
    });

    socket.on('task_created', (payload) => {
      if (payload?.workspaceId !== workspaceId) return;
      setTasks((prevTasks) => {
        if (prevTasks.some((task) => task.id === payload.task.id)) return prevTasks;
        return [payload.task, ...prevTasks];
      });
    });

    socket.on('task_updated', (payload) => {
      if (payload?.workspaceId !== workspaceId) return;
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === payload.task.id ? payload.task : task)));
      if (activeTaskRef.current?.id === payload.task.id) {
        setActiveTask(payload.task);
      }
    });

    socket.on('task_deleted', (payload) => {
      if (payload?.workspaceId !== workspaceId) return;
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== payload.taskId));
      if (activeTaskRef.current?.id === payload.taskId) {
        setActiveTask(null);
        setIsModalOpen(false);
      }
    });

    return () => {
      socket.emit('leaveWorkspace', workspaceId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [workspaceId, user, socketUrl]);

  const canCreateTask = boardRole === 'owner' || boardRole === 'admin' || boardRole === 'member';
  const canInviteMembers = boardRole === 'owner' || boardRole === 'admin';

  const openCreateModal = () => {
    if (!canCreateTask) {
      toast.error('You do not have permission to create tasks in this workspace');
      return;
    }
    setActiveTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    const isOwnerOrAdmin = boardRole === 'owner' || boardRole === 'admin';
    const isTaskOwner = task?.createdBy?.id === user?.id || task?.createdBy?._id === user?.id || task?.createdBy === user?.id;
    if (!isOwnerOrAdmin && !isTaskOwner) {
      toast.error('You do not have permission to edit this task');
      return;
    }
    setActiveTask(task);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (taskId, nextStatus) => {
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) return;

    const isOwnerOrAdmin = boardRole === 'owner' || boardRole === 'admin';
    const isTaskOwner = currentTask?.createdBy?.id === user?.id || currentTask?.createdBy?._id === user?.id || currentTask?.createdBy === user?.id;
    if (!isOwnerOrAdmin && !isTaskOwner) {
      toast.error('You do not have permission to update this task');
      return;
    }

    if (currentTask.status === nextStatus) return;

    setUpdatingTaskId(taskId);
    setError('');

    const previousTasks = tasks;
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task))
    );

    try {
      await api.put(`/tasks/${taskId}`, { status: nextStatus });
      const tasksResponse = await api.get(`/tasks?workspaceId=${workspaceId}`);
      setTasks(tasksResponse.data.data);
    } catch (err) {
      setTasks(previousTasks);
      const message = err.response?.data?.message || 'Failed to update task status.';
      setError(message);
      toast.error(message);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleDragStart = (event) => {
    const task = tasks.find((item) => item.id === event.active.id);
    setActiveDragTask(task ?? null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragTask(null);

    const nextStatus = resolveDropStatus(over, tasks);
    if (!nextStatus) return;

    handleStatusChange(active.id, nextStatus);
  };

  const handleDragCancel = () => {
    setActiveDragTask(null);
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    try {
      const response = await api.post(`/workspaces/${workspaceId}/invite-email`, { email: inviteEmail.trim() });
      toast.success(response.data.message || 'Invitation sent');
      setInviteEmail('');
      setIsInviteModalOpen(false);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send invitation.';
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const visibleTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === 'all' ||
        (task.assignee && (
          task.assignee.id === assigneeFilter ||
          task.assignee._id === assigneeFilter ||
          task.assignee === assigneeFilter
        ));
      const matchesSearch = !normalizedSearch || task.title.toLowerCase().includes(normalizedSearch);

      return matchesPriority && matchesAssignee && matchesSearch;
    });

    const sorted = [...filtered];
    switch (sortOption) {
      case 'dueDateAsc':
        sorted.sort((a, b) => {
          const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
          const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
          return aTime - bTime;
        });
        break;
      case 'dueDateDesc':
        sorted.sort((a, b) => {
          const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.NEGATIVE_INFINITY;
          const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.NEGATIVE_INFINITY;
          return bTime - aTime;
        });
        break;
      case 'createdAtAsc':
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'createdAtDesc':
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    return sorted;
  }, [assigneeFilter, priorityFilter, search, sortOption, tasks]);

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const assigneeOptions = [
    { value: 'all', label: 'All Assignees' },
    ...(workspace?.members || []).map((member) => ({
      value: member.id || member._id,
      label: member.name || member.email || 'Member',
    })),
  ];

  const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'dueDateAsc', label: 'Due Date (Soonest)' },
    { value: 'dueDateDesc', label: 'Due Date (Latest)' },
    { value: 'createdAtAsc', label: 'Created (Oldest)' },
    { value: 'createdAtDesc', label: 'Created (Newest)' },
  ];

  return (
    <div className="flex flex-col h-full -m-6 lg:-m-8">
      {/* ── Board header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 lg:px-8 pt-6 lg:pt-8 pb-5 border-b border-surface-200 bg-white transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-surface-900 dark:text-slate-100">
              {workspace ? `${workspace.name} Board` : 'Kanban Board'}
            </h1>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                socketConnected ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
              title={socketConnected ? 'Realtime collaboration enabled' : socketError || 'Realtime disconnected'}
            >
              {socketConnected ? 'Realtime On' : 'Realtime Off'}
            </span>
          </div>
          {workspace && (
            <p className="mt-1 text-xs text-surface-400 dark:text-slate-400">
              Invite code:{' '}
              <span className="font-mono font-bold bg-surface-100 text-surface-700 px-1.5 py-0.5 rounded">
                {workspace.inviteCode}
              </span>
            </p>
          )}
          {socketError && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-300">{socketError}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap">
          {canInviteMembers && (
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Invite by Email
            </button>
          )}
          <SearchInput
            id="board-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title"
          />
          <FilterSelect
            id="priority-filter"
            label="Priority"
            value={priorityFilter}
            options={priorityOptions}
            onChange={(e) => setPriorityFilter(e.target.value)}
          />
          <FilterSelect
            id="assignee-filter"
            label="Assignee"
            value={assigneeFilter}
            options={assigneeOptions}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          />
          <FilterSelect
            id="sort-filter"
            label="Sort"
            value={sortOption}
            options={sortOptions}
            onChange={(e) => setSortOption(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="m-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Board columns ────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex justify-center items-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid grid-cols-1 gap-5 p-6 lg:p-8 xl:grid-cols-4 md:grid-cols-2">
              {COLUMNS.map((col) => {
                const columnTasks = visibleTasks.filter((t) => t.status === col.id);
                return (
                  <div
                    key={col.id}
                    className={`flex flex-col min-h-[320px] rounded-2xl bg-surface-50 border-t-2 ${col.accent}`}
                  >
                    {/* Column header */}
                    <div className="flex items-center justify-between px-4 py-3.5 shrink-0">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                        <h3 className="text-sm font-bold text-surface-800 dark:text-slate-100">{col.title}</h3>
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-surface-200 px-1.5 text-[11px] font-bold text-surface-600 dark:bg-slate-800 dark:text-slate-300">
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Cards */}
                    <DroppableColumn id={col.id}>
                      {columnTasks.map((task) => (
                        <DraggableTaskCard
                          key={task.id}
                          task={task}
                          onClick={() => openEditModal(task)}
                          onStatusChange={handleStatusChange}
                          isUpdating={updatingTaskId === task.id}
                          disabled={updatingTaskId === task.id}
                        />
                      ))}
                    </DroppableColumn>
                    <div className="px-3 pb-3">
                      <button
                        onClick={openCreateModal}
                        className="w-full rounded-xl border-2 border-dashed border-surface-200 py-3 text-sm font-medium text-surface-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50/50 transition-all dark:border-slate-700 dark:text-slate-300 dark:hover:bg-brand-600/10"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          Add Task
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <DragOverlay
              dropAnimation={{
                duration: 250,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              }}
            >
              {activeDragTask ? (
                <TaskCard task={activeDragTask} isDragOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:border dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Invite by Email</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Send a workspace invitation to a teammate.</p>
              </div>
              <button type="button" onClick={() => setIsInviteModalOpen(false)} className="text-sm font-semibold text-slate-500">Close</button>
            </div>
            <form onSubmit={handleInviteSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="invite-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email address</label>
                <input
                  id="invite-email"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="w-full rounded-xl border border-slate-300 bg-surface-50 px-3 py-2.5 text-sm text-surface-900 placeholder:text-surface-500 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {inviting ? 'Sending invitation...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Creation & Update Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={activeTask}
        workspaceId={workspaceId}
        members={workspace?.members || []}
        onSuccess={fetchWorkspaceAndTasks}
        role={boardRole}
        currentUserId={user?.id}
        socketRef={socketRef}
      />
    </div>
  );
}
